import { prisma } from "@orbitr/database";
import { getDockerManager } from "../docker";
import { logger } from "../logger";
import * as fs from "fs/promises";
import * as path from "path";
import { createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { createGzip, createGunzip } from "zlib";
import { BackupConfig, BackupMetadata, RestoreOptions } from "./types";

/**
 * BackupManager - Handles backup and restore operations
 */
export class BackupManager {
  private backupDir: string;
  private dockerManager = getDockerManager();

  constructor(backupDir?: string) {
    this.backupDir = backupDir || path.join(process.cwd(), "data", "backups");
  }

  /**
   * Create a full system backup
   */
  async createBackup(config: BackupConfig): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}`;
    const backupPath = path.join(this.backupDir, backupId);

    try {
      logger.info({ backupId, config }, "Starting backup");

      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size: 0,
        containers: [],
        volumes: [],
        extensions: [],
        config,
      };

      // Backup database
      if (config.includeDatabase) {
        await this.backupDatabase(backupPath);
      }

      // Backup container configurations
      const containers = await this.dockerManager.listContainers({ all: true });
      for (const container of containers) {
        const containerConfig = await this.backupContainer(backupPath, container.Id);
        metadata.containers.push(container.Id);
      }

      // Backup volumes
      if (config.includeVolumes) {
        const volumes = await this.dockerManager.listVolumes();
        for (const volume of volumes.Volumes) {
          await this.backupVolume(backupPath, volume.Name);
          metadata.volumes.push(volume.Name);
        }
      }

      // Backup extension configurations
      const extensions = await prisma.extension.findMany();
      await fs.writeFile(
        path.join(backupPath, "extensions.json"),
        JSON.stringify(extensions, null, 2)
      );
      metadata.extensions = extensions.map((e) => e.id);

      // Backup system configuration
      if (config.includeConfig) {
        await this.backupConfiguration(backupPath);
      }

      // Create metadata file
      await fs.writeFile(
        path.join(backupPath, "metadata.json"),
        JSON.stringify(metadata, null, 2)
      );

      // Compress if requested
      if (config.compression !== "none") {
        await this.compressBackup(backupPath, config.compression);
      }

      // Calculate total size
      const stats = await this.getDirectorySize(backupPath);
      metadata.size = stats;

      // Create database record
      await prisma.backup.create({
        data: {
          path: backupPath,
          size: metadata.size,
          status: "completed",
          metadata: metadata as any,
        },
      });

      logger.info({ backupId, size: metadata.size }, "Backup completed");
      return metadata;
    } catch (error: any) {
      logger.error({ error, backupId }, "Backup failed");
      
      // Update database record as failed
      await prisma.backup.create({
        data: {
          path: backupPath,
          size: 0,
          status: "failed",
          metadata: { error: error.message } as any,
        },
      });

      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const backupPath = path.join(this.backupDir, options.backupId);

    try {
      logger.info({ backupId: options.backupId }, "Starting restore");

      // Load metadata
      const metadataContent = await fs.readFile(
        path.join(backupPath, "metadata.json"),
        "utf-8"
      );
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      // Restore database
      if (options.restoreDatabase && metadata.config.includeDatabase) {
        await this.restoreDatabase(backupPath);
      }

      // Restore volumes
      if (options.restoreVolumes && metadata.config.includeVolumes) {
        for (const volumeName of metadata.volumes) {
          await this.restoreVolume(backupPath, volumeName);
        }
      }

      // Restore containers
      for (const containerId of metadata.containers) {
        await this.restoreContainer(backupPath, containerId, options.containerMapping);
      }

      // Restore configuration
      if (options.restoreConfig && metadata.config.includeConfig) {
        await this.restoreConfiguration(backupPath);
      }

      logger.info({ backupId: options.backupId }, "Restore completed");
    } catch (error: any) {
      logger.error({ error, backupId: options.backupId }, "Restore failed");
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups = await prisma.backup.findMany({
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
      });

      const metadataList: BackupMetadata[] = [];

      for (const backup of backups) {
        try {
          const metadataPath = path.join(backup.path, "metadata.json");
          const content = await fs.readFile(metadataPath, "utf-8");
          metadataList.push(JSON.parse(content));
        } catch (error) {
          logger.warn({ backupId: backup.id }, "Failed to load backup metadata");
        }
      }

      return metadataList;
    } catch (error: any) {
      logger.error({ error }, "Failed to list backups");
      throw error;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, backupId);

    try {
      await fs.rm(backupPath, { recursive: true, force: true });

      await prisma.backup.deleteMany({
        where: { path: backupPath },
      });

      logger.info({ backupId }, "Backup deleted");
    } catch (error: any) {
      logger.error({ error, backupId }, "Failed to delete backup");
      throw error;
    }
  }

  /**
   * Backup database
   */
  private async backupDatabase(backupPath: string): Promise<void> {
    const dbPath = path.join(process.cwd(), "data", "orbitr.db");
    const backupDbPath = path.join(backupPath, "database.db");

    try {
      await fs.copyFile(dbPath, backupDbPath);
      logger.debug("Database backed up");
    } catch (error) {
      logger.error({ error }, "Failed to backup database");
      throw error;
    }
  }

  /**
   * Restore database
   */
  private async restoreDatabase(backupPath: string): Promise<void> {
    const backupDbPath = path.join(backupPath, "database.db");
    const dbPath = path.join(process.cwd(), "data", "orbitr.db");

    try {
      await fs.copyFile(backupDbPath, dbPath);
      logger.debug("Database restored");
    } catch (error) {
      logger.error({ error }, "Failed to restore database");
      throw error;
    }
  }

  /**
   * Backup a container's configuration
   */
  private async backupContainer(backupPath: string, containerId: string): Promise<void> {
    try {
      const container = await this.dockerManager.inspectContainer(containerId);
      
      const containerBackup = {
        id: container.Id,
        name: container.Name,
        image: container.Config.Image,
        config: container.Config,
        hostConfig: container.HostConfig,
        networkSettings: container.NetworkSettings,
      };

      await fs.writeFile(
        path.join(backupPath, `container-${containerId.substring(0, 12)}.json`),
        JSON.stringify(containerBackup, null, 2)
      );
    } catch (error) {
      logger.error({ error, containerId }, "Failed to backup container");
      throw error;
    }
  }

  /**
   * Restore a container
   */
  private async restoreContainer(
    backupPath: string,
    containerId: string,
    mapping?: Record<string, string>
  ): Promise<void> {
    try {
      const configPath = path.join(backupPath, `container-${containerId.substring(0, 12)}.json`);
      const content = await fs.readFile(configPath, "utf-8");
      const containerBackup = JSON.parse(content);

      // Check if container should be mapped to a different name
      const newName = mapping?.[containerBackup.name] || containerBackup.name;

      // Create container with backed up configuration
      await this.dockerManager.createContainer({
        name: newName,
        Image: containerBackup.image,
        Env: containerBackup.config.Env,
        Cmd: containerBackup.config.Cmd,
        ExposedPorts: containerBackup.config.ExposedPorts,
        HostConfig: {
          Binds: containerBackup.hostConfig.Binds,
          PortBindings: containerBackup.hostConfig.PortBindings,
          RestartPolicy: containerBackup.hostConfig.RestartPolicy,
        },
      });

      logger.debug({ containerId, newName }, "Container restored");
    } catch (error) {
      logger.error({ error, containerId }, "Failed to restore container");
      // Don't throw - continue with other containers
    }
  }

  /**
   * Backup a volume
   */
  private async backupVolume(backupPath: string, volumeName: string): Promise<void> {
    try {
      const volumeBackupPath = path.join(backupPath, "volumes", volumeName);
      await fs.mkdir(volumeBackupPath, { recursive: true });

      // Create a temporary container to access the volume
      const container = await this.dockerManager.createContainer({
        Image: "alpine:latest",
        Cmd: ["tar", "-czf", "/backup/volume.tar.gz", "-C", "/volume", "."],
        HostConfig: {
          Binds: [
            `${volumeName}:/volume:ro`,
            `${volumeBackupPath}:/backup`,
          ],
          AutoRemove: true,
        },
      });

      await this.dockerManager.startContainer(container.id);
      
      // Wait for container to finish
      await new Promise((resolve) => setTimeout(resolve, 5000));

      logger.debug({ volumeName }, "Volume backed up");
    } catch (error) {
      logger.error({ error, volumeName }, "Failed to backup volume");
      // Don't throw - continue with other volumes
    }
  }

  /**
   * Restore a volume
   */
  private async restoreVolume(backupPath: string, volumeName: string): Promise<void> {
    try {
      const volumeBackupPath = path.join(backupPath, "volumes", volumeName);

      // Create volume if it doesn't exist
      try {
        await this.dockerManager.createVolume(volumeName);
      } catch (error) {
        // Volume might already exist
      }

      // Create a temporary container to restore the volume
      const container = await this.dockerManager.createContainer({
        Image: "alpine:latest",
        Cmd: ["tar", "-xzf", "/backup/volume.tar.gz", "-C", "/volume"],
        HostConfig: {
          Binds: [
            `${volumeName}:/volume`,
            `${volumeBackupPath}:/backup:ro`,
          ],
          AutoRemove: true,
        },
      });

      await this.dockerManager.startContainer(container.id);
      
      // Wait for container to finish
      await new Promise((resolve) => setTimeout(resolve, 5000));

      logger.debug({ volumeName }, "Volume restored");
    } catch (error) {
      logger.error({ error, volumeName }, "Failed to restore volume");
      // Don't throw - continue with other volumes
    }
  }

  /**
   * Backup system configuration
   */
  private async backupConfiguration(backupPath: string): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), "data", "config");
      const backupConfigPath = path.join(backupPath, "config");

      await fs.mkdir(backupConfigPath, { recursive: true });

      // Copy configuration files
      try {
        const files = await fs.readdir(configPath);
        for (const file of files) {
          await fs.copyFile(
            path.join(configPath, file),
            path.join(backupConfigPath, file)
          );
        }
      } catch (error) {
        // Config directory might not exist yet
      }

      logger.debug("Configuration backed up");
    } catch (error) {
      logger.error({ error }, "Failed to backup configuration");
      throw error;
    }
  }

  /**
   * Restore system configuration
   */
  private async restoreConfiguration(backupPath: string): Promise<void> {
    try {
      const backupConfigPath = path.join(backupPath, "config");
      const configPath = path.join(process.cwd(), "data", "config");

      await fs.mkdir(configPath, { recursive: true });

      const files = await fs.readdir(backupConfigPath);
      for (const file of files) {
        await fs.copyFile(
          path.join(backupConfigPath, file),
          path.join(configPath, file)
        );
      }

      logger.debug("Configuration restored");
    } catch (error) {
      logger.error({ error }, "Failed to restore configuration");
      throw error;
    }
  }

  /**
   * Compress backup directory
   */
  private async compressBackup(backupPath: string, compression: "gzip" | "bzip2"): Promise<void> {
    // Simplified - in production, use tar + compression
    logger.debug({ compression }, "Compression requested but not implemented yet");
  }

  /**
   * Get directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          size += stats.size;
        }
      }
    } catch (error) {
      logger.error({ error, dirPath }, "Failed to calculate directory size");
    }

    return size;
  }
}

// Singleton instance
let backupManager: BackupManager | null = null;

export function getBackupManager(backupDir?: string): BackupManager {
  if (!backupManager) {
    backupManager = new BackupManager(backupDir);
  }
  return backupManager;
}

export default BackupManager;
