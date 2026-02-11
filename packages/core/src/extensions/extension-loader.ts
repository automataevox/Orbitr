import type { ExtensionManifest, ExtensionStatus } from "@orbitr/types";
import { prisma } from "@orbitr/database";
import { logger } from "../logger";
import { getDockerManager } from "../docker";
import { ExtensionValidator } from "./extension-validator";
import { getExtensionRegistry } from "./extension-registry";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "js-yaml";

export interface InstallOptions {
  environment?: Record<string, string>;
  autoStart?: boolean;
}

export interface InstallProgress {
  phase: "downloading" | "validating" | "configuring" | "deploying" | "health-check" | "complete";
  message: string;
  progress: number;
}

/**
 * ExtensionLoader - Manages extension lifecycle
 * Installation, updates, configuration, and removal
 */
export class ExtensionLoader {
  private dockerManager = getDockerManager();
  private registry = getExtensionRegistry();
  private extensionsDir: string;

  constructor(extensionsDir?: string) {
    this.extensionsDir = extensionsDir || path.join(process.cwd(), "extensions", "installed");
  }

  /**
   * Install extension from registry
   */
  async install(
    extensionId: string,
    options: InstallOptions = {},
    onProgress?: (progress: InstallProgress) => void
  ): Promise<void> {
    try {
      logger.info({ extensionId, options }, "Starting extension installation");

      // Phase 1: Download manifest
      onProgress?.({
        phase: "downloading",
        message: "Downloading extension manifest",
        progress: 10,
      });

      const manifest = await this.registry.downloadManifest(extensionId);

      // Phase 2: Validate manifest
      onProgress?.({
        phase: "validating",
        message: "Validating extension",
        progress: 20,
      });

      const validation = ExtensionValidator.validateManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors?.join(", ")}`);
      }

      // Check if already installed
      const existing = await prisma.extension.findUnique({
        where: { id: extensionId },
      });

      if (existing) {
        throw new Error(`Extension ${extensionId} is already installed`);
      }

      // Validate requirements
      const installedExtensions = await prisma.extension.findMany({
        where: { status: "installed" },
        select: { id: true },
      });

      const requirementsCheck = ExtensionValidator.validateRequirements(
        manifest,
        process.env.ORBITR_VERSION || "0.1.0",
        installedExtensions.map((e) => e.id)
      );

      if (!requirementsCheck.valid) {
        throw new Error(`Requirements not met: ${requirementsCheck.errors.join(", ")}`);
      }

      // Validate environment configuration
      const envValidation = ExtensionValidator.validateEnvironment(
        manifest,
        options.environment || {}
      );

      if (!envValidation.valid) {
        throw new Error(
          `Invalid environment configuration:\n` +
          `Missing: ${envValidation.missing.join(", ")}\n` +
          `Invalid: ${envValidation.invalid.join(", ")}`
        );
      }

      // Phase 3: Create database record
      onProgress?.({
        phase: "configuring",
        message: "Creating extension record",
        progress: 30,
      });

      await prisma.extension.create({
        data: {
          id: manifest.id,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          type: manifest.type,
          status: "installing",
          manifest: manifest as any,
          config: options.environment || {},
        },
      });

      // Phase 4: Download and extract extension files
      onProgress?.({
        phase: "downloading",
        message: "Downloading extension files",
        progress: 40,
      });

      await this.downloadExtension(manifest);

      // Phase 5: Deploy with Docker
      onProgress?.({
        phase: "deploying",
        message: "Deploying containers",
        progress: 60,
      });

      const containerIds = await this.deployExtension(manifest, options.environment || {});

      // Phase 6: Health check
      onProgress?.({
        phase: "health-check",
        message: "Running health checks",
        progress: 80,
      });

      if (manifest.healthCheck) {
        await this.waitForHealthy(containerIds[0], manifest);
      }

      // Phase 7: Complete
      onProgress?.({
        phase: "complete",
        message: "Installation complete",
        progress: 100,
      });

      // Update status
      await prisma.extension.update({
        where: { id: extensionId },
        data: {
          status: options.autoStart !== false ? "running" : "stopped",
          installedAt: new Date(),
        },
      });

      // Create containers in database
      for (const containerId of containerIds) {
        const info = await this.dockerManager.inspectContainer(containerId);
        await prisma.container.create({
          data: {
            dockerId: containerId,
            name: info.Name.replace("/", ""),
            image: info.Config.Image,
            status: info.State.Running ? "running" : "stopped",
            extensionId: manifest.id,
            config: {},
          },
        });
      }

      logger.info({ extensionId, containerIds }, "Extension installed successfully");
    } catch (error) {
      logger.error({ error, extensionId }, "Failed to install extension");

      // Cleanup on failure
      await prisma.extension
        .update({
          where: { id: extensionId },
          data: { status: "failed" },
        })
        .catch(() => {});

      throw error;
    }
  }

  /**
   * Download extension files from repository
   */
  private async downloadExtension(manifest: ExtensionManifest): Promise<void> {
    const extDir = path.join(this.extensionsDir, manifest.id);
    await fs.mkdir(extDir, { recursive: true });

    // Download docker-compose file
    const registry = this.registry.get(manifest.id);
    if (!registry) {
      throw new Error("Extension not found in registry");
    }

    const composeUrl = this.getComposeUrl(registry.repository, manifest.compose);
    const response = await fetch(composeUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download compose file: ${response.statusText}`);
    }

    const composeContent = await response.text();
    await fs.writeFile(path.join(extDir, "docker-compose.yml"), composeContent);

    // Save manifest
    await fs.writeFile(
      path.join(extDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    logger.info({ extensionId: manifest.id }, "Extension files downloaded");
  }

  /**
   * Get compose file URL from repository
   */
  private getComposeUrl(repository: string, composePath: string): string {
    if (repository.includes("github.com")) {
      const repoPath = repository.replace("https://github.com/", "");
      return `https://raw.githubusercontent.com/${repoPath}/main/${composePath}`;
    }
    return `${repository}/${composePath}`;
  }

  /**
   * Deploy extension using Docker Compose
   */
  private async deployExtension(
    manifest: ExtensionManifest,
    environment: Record<string, string>
  ): Promise<string[]> {
    const extDir = path.join(this.extensionsDir, manifest.id);
    const composePath = path.join(extDir, "docker-compose.yml");

    // Read and parse compose file
    const composeContent = await fs.readFile(composePath, "utf-8");
    const composeConfig = yaml.load(composeContent) as any;

    // Inject environment variables
    if (composeConfig.services) {
      for (const service of Object.values(composeConfig.services) as any[]) {
        if (!service.environment) {
          service.environment = [];
        }

        // Add user-provided environment variables
        for (const [key, value] of Object.entries(environment)) {
          if (Array.isArray(service.environment)) {
            service.environment.push(`${key}=${value}`);
          } else {
            service.environment[key] = value;
          }
        }

        // Add Orbitr labels
        service.labels = {
          ...service.labels,
          "orbitr.extension": manifest.id,
          "orbitr.version": manifest.version,
        };
      }
    }

    // Deploy with Docker
    const containerIds = await this.dockerManager.deployCompose(composeConfig, manifest.id);

    logger.info({ extensionId: manifest.id, containerIds }, "Extension deployed");
    return containerIds;
  }

  /**
   * Wait for container to become healthy
   */
  private async waitForHealthy(containerId: string, manifest: ExtensionManifest): Promise<void> {
    const maxRetries = manifest.healthCheck?.retries || 3;
    const interval = manifest.healthCheck?.interval || 30;
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));

      const info = await this.dockerManager.inspectContainer(containerId);
      
      if (info.State.Health) {
        if (info.State.Health.Status === "healthy") {
          logger.info({ containerId }, "Container is healthy");
          return;
        }
      } else if (info.State.Running) {
        // No health check defined, just check if running
        logger.info({ containerId }, "Container is running");
        return;
      }
    }

    throw new Error("Container failed health check");
  }

  /**
   * Uninstall extension
   */
  async uninstall(extensionId: string, removeData = false): Promise<void> {
    try {
      logger.info({ extensionId, removeData }, "Uninstalling extension");

      const extension = await prisma.extension.findUnique({
        where: { id: extensionId },
        include: { containers: true },
      });

      if (!extension) {
        throw new Error(`Extension ${extensionId} not found`);
      }

      // Update status
      await prisma.extension.update({
        where: { id: extensionId },
        data: { status: "uninstalling" },
      });

      // Stop and remove containers
      for (const container of extension.containers) {
        try {
          await this.dockerManager.stopContainer(container.dockerId);
          await this.dockerManager.removeContainer(container.dockerId, true);
          await prisma.container.delete({ where: { id: container.id } });
        } catch (error) {
          logger.warn({ error, containerId: container.id }, "Failed to remove container");
        }
      }

      // Remove volumes if requested
      if (removeData) {
        // TODO: Implement volume cleanup
      }

      // Remove extension files
      const extDir = path.join(this.extensionsDir, extensionId);
      await fs.rm(extDir, { recursive: true, force: true });

      // Remove from database
      await prisma.extension.delete({ where: { id: extensionId } });

      logger.info({ extensionId }, "Extension uninstalled successfully");
    } catch (error) {
      logger.error({ error, extensionId }, "Failed to uninstall extension");
      throw error;
    }
  }

  /**
   * Start extension
   */
  async start(extensionId: string): Promise<void> {
    const extension = await prisma.extension.findUnique({
      where: { id: extensionId },
      include: { containers: true },
    });

    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    for (const container of extension.containers) {
      await this.dockerManager.startContainer(container.dockerId);
    }

    await prisma.extension.update({
      where: { id: extensionId },
      data: { status: "running" },
    });

    logger.info({ extensionId }, "Extension started");
  }

  /**
   * Stop extension
   */
  async stop(extensionId: string): Promise<void> {
    const extension = await prisma.extension.findUnique({
      where: { id: extensionId },
      include: { containers: true },
    });

    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    for (const container of extension.containers) {
      await this.dockerManager.stopContainer(container.dockerId);
    }

    await prisma.extension.update({
      where: { id: extensionId },
      data: { status: "stopped" },
    });

    logger.info({ extensionId }, "Extension stopped");
  }
}

// Singleton instance
let extensionLoader: ExtensionLoader | null = null;

export function getExtensionLoader(extensionsDir?: string): ExtensionLoader {
  if (!extensionLoader) {
    extensionLoader = new ExtensionLoader(extensionsDir);
  }
  return extensionLoader;
}

export default ExtensionLoader;
