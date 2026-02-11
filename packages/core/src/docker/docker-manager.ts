import Dockerode from "dockerode";
import type {
  ContainerCreateOptions,
  ContainerStats,
  DockerInfo,
  ContainerInspectInfo,
  ImageInfo,
  NetworkInspectInfo,
  VolumeInspectInfo,
} from "./types";
import { logger } from "../logger";

/**
 * DockerManager - Core Docker API wrapper
 * Handles all Docker operations with proper error handling and logging
 */
export class DockerManager {
  private docker: Dockerode;

  constructor(socketPath?: string) {
    this.docker = new Dockerode({
      socketPath: socketPath || "/var/run/docker.sock",
    });
  }

  /**
   * Get Docker system information
   */
  async getInfo(): Promise<DockerInfo> {
    try {
      const info = await this.docker.info();
      return {
        serverVersion: info.ServerVersion,
        apiVersion: info.ApiVersion || "unknown",
        containers: info.Containers,
        containersRunning: info.ContainersRunning,
        containersPaused: info.ContainersPaused,
        containersStopped: info.ContainersStopped,
        images: info.Images,
        memoryTotal: info.MemTotal,
        cpus: info.NCPU,
      };
    } catch (error) {
      logger.error({ error }, "Failed to get Docker info");
      throw new Error("Failed to connect to Docker daemon");
    }
  }

  /**
   * Check if Docker is available
   */
  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Container Operations ====================

  /**
   * List all containers
   */
  async listContainers(all = true): Promise<Dockerode.ContainerInfo[]> {
    try {
      return await this.docker.listContainers({ all });
    } catch (error) {
      logger.error({ error }, "Failed to list containers");
      throw error;
    }
  }

  /**
   * Get container by ID or name
   */
  getContainer(id: string): Dockerode.Container {
    return this.docker.getContainer(id);
  }

  /**
   * Inspect container
   */
  async inspectContainer(id: string): Promise<ContainerInspectInfo> {
    try {
      const container = this.getContainer(id);
      return await container.inspect();
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to inspect container");
      throw error;
    }
  }

  /**
   * Create and start a container
   */
  async createContainer(options: ContainerCreateOptions): Promise<Dockerode.Container> {
    try {
      logger.info({ options }, "Creating container");

      const container = await this.docker.createContainer({
        name: options.name,
        Image: options.image,
        Env: options.env,
        ExposedPorts: options.ports,
        HostConfig: {
          Binds: options.volumes,
          PortBindings: options.ports,
          RestartPolicy: {
            Name: options.restart || "unless-stopped",
          },
          NetworkMode: options.networks?.[0],
        },
        Labels: {
          ...options.labels,
          "orbitr.managed": "true",
        },
        Cmd: options.command,
      });

      logger.info({ containerId: container.id }, "Container created successfully");
      return container;
    } catch (error) {
      logger.error({ error, options }, "Failed to create container");
      throw error;
    }
  }

  /**
   * Start container
   */
  async startContainer(id: string): Promise<void> {
    try {
      const container = this.getContainer(id);
      await container.start();
      logger.info({ containerId: id }, "Container started");
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to start container");
      throw error;
    }
  }

  /**
   * Stop container
   */
  async stopContainer(id: string, timeout = 10): Promise<void> {
    try {
      const container = this.getContainer(id);
      await container.stop({ t: timeout });
      logger.info({ containerId: id }, "Container stopped");
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to stop container");
      throw error;
    }
  }

  /**
   * Restart container
   */
  async restartContainer(id: string): Promise<void> {
    try {
      const container = this.getContainer(id);
      await container.restart();
      logger.info({ containerId: id }, "Container restarted");
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to restart container");
      throw error;
    }
  }

  /**
   * Remove container
   */
  async removeContainer(id: string, force = false): Promise<void> {
    try {
      const container = this.getContainer(id);
      await container.remove({ force });
      logger.info({ containerId: id }, "Container removed");
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to remove container");
      throw error;
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    id: string,
    options: { tail?: number; since?: number } = {}
  ): Promise<string> {
    try {
      const container = this.getContainer(id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        since: options.since || 0,
        timestamps: true,
      });
      return logs.toString("utf-8");
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to get container logs");
      throw error;
    }
  }

  /**
   * Get container stats
   */
  async getContainerStats(id: string): Promise<ContainerStats> {
    try {
      const container = this.getContainer(id);
      const stats = await container.stats({ stream: false });
      
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

      const memoryUsage = stats.memory_stats.usage;
      const memoryLimit = stats.memory_stats.limit;

      let networkRx = 0;
      let networkTx = 0;
      if (stats.networks) {
        Object.values(stats.networks).forEach((network: any) => {
          networkRx += network.rx_bytes;
          networkTx += network.tx_bytes;
        });
      }

      return {
        id,
        name: stats.name,
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage,
        memoryLimit,
        networkRx,
        networkTx,
      };
    } catch (error) {
      logger.error({ error, containerId: id }, "Failed to get container stats");
      throw error;
    }
  }

  /**
   * Execute command in container
   */
  async execInContainer(id: string, cmd: string[]): Promise<string> {
    try {
      const container = this.getContainer(id);
      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ Detach: false });
      
      return new Promise((resolve, reject) => {
        let output = "";
        stream.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.on("end", () => resolve(output));
        stream.on("error", reject);
      });
    } catch (error) {
      logger.error({ error, containerId: id, cmd }, "Failed to execute command in container");
      throw error;
    }
  }

  // ==================== Image Operations ====================

  /**
   * List images
   */
  async listImages(): Promise<ImageInfo[]> {
    try {
      return await this.docker.listImages();
    } catch (error) {
      logger.error({ error }, "Failed to list images");
      throw error;
    }
  }

  /**
   * Pull image
   */
  async pullImage(
    image: string,
    onProgress?: (progress: { status: string; progress?: string }) => void
  ): Promise<void> {
    try {
      logger.info({ image }, "Pulling image");
      
      const stream = await this.docker.pull(image);
      
      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err: Error | null) => {
            if (err) {
              logger.error({ error: err, image }, "Failed to pull image");
              reject(err);
            } else {
              logger.info({ image }, "Image pulled successfully");
              resolve();
            }
          },
          (event: { status: string; progress?: string }) => {
            if (onProgress) {
              onProgress(event);
            }
          }
        );
      });
    } catch (error) {
      logger.error({ error, image }, "Failed to pull image");
      throw error;
    }
  }

  /**
   * Remove image
   */
  async removeImage(id: string, force = false): Promise<void> {
    try {
      const image = this.docker.getImage(id);
      await image.remove({ force });
      logger.info({ imageId: id }, "Image removed");
    } catch (error) {
      logger.error({ error, imageId: id }, "Failed to remove image");
      throw error;
    }
  }

  // ==================== Network Operations ====================

  /**
   * List networks
   */
  async listNetworks(): Promise<NetworkInspectInfo[]> {
    try {
      return await this.docker.listNetworks();
    } catch (error) {
      logger.error({ error }, "Failed to list networks");
      throw error;
    }
  }

  /**
   * Create network
   */
  async createNetwork(name: string, driver = "bridge"): Promise<Dockerode.Network> {
    try {
      const network = await this.docker.createNetwork({
        Name: name,
        Driver: driver,
        Labels: {
          "orbitr.managed": "true",
        },
      });
      logger.info({ networkId: network.id, name }, "Network created");
      return network;
    } catch (error) {
      logger.error({ error, name }, "Failed to create network");
      throw error;
    }
  }

  /**
   * Remove network
   */
  async removeNetwork(id: string): Promise<void> {
    try {
      const network = this.docker.getNetwork(id);
      await network.remove();
      logger.info({ networkId: id }, "Network removed");
    } catch (error) {
      logger.error({ error, networkId: id }, "Failed to remove network");
      throw error;
    }
  }

  // ==================== Volume Operations ====================

  /**
   * List volumes
   */
  async listVolumes(): Promise<VolumeInspectInfo[]> {
    try {
      const result = await this.docker.listVolumes();
      return result.Volumes;
    } catch (error) {
      logger.error({ error }, "Failed to list volumes");
      throw error;
    }
  }

  /**
   * Create volume
   */
  async createVolume(name: string, driver = "local"): Promise<Dockerode.Volume> {
    try {
      const volume = await this.docker.createVolume({
        Name: name,
        Driver: driver,
        Labels: {
          "orbitr.managed": "true",
        },
      });
      logger.info({ volumeName: name }, "Volume created");
      return volume;
    } catch (error) {
      logger.error({ error, name }, "Failed to create volume");
      throw error;
    }
  }

  /**
   * Remove volume
   */
  async removeVolume(name: string, force = false): Promise<void> {
    try {
      const volume = this.docker.getVolume(name);
      await volume.remove({ force });
      logger.info({ volumeName: name }, "Volume removed");
    } catch (error) {
      logger.error({ error, volumeName: name }, "Failed to remove volume");
      throw error;
    }
  }

  // ==================== Docker Compose Operations ====================

  /**
   * Parse and deploy a docker-compose configuration
   * This is a simplified implementation - in production, use docker-compose CLI
   */
  async deployCompose(composeConfig: any, projectName: string): Promise<string[]> {
    try {
      logger.info({ projectName }, "Deploying compose configuration");
      const containerIds: string[] = [];

      // Create networks if defined
      if (composeConfig.networks) {
        for (const [networkName, networkConfig] of Object.entries(composeConfig.networks)) {
          const fullNetworkName = `${projectName}_${networkName}`;
          try {
            await this.createNetwork(fullNetworkName, (networkConfig as any).driver || "bridge");
          } catch (error: any) {
            if (!error.message.includes("already exists")) {
              throw error;
            }
          }
        }
      }

      // Create volumes if defined
      if (composeConfig.volumes) {
        for (const volumeName of Object.keys(composeConfig.volumes)) {
          const fullVolumeName = `${projectName}_${volumeName}`;
          try {
            await this.createVolume(fullVolumeName);
          } catch (error: any) {
            if (!error.message.includes("already exists")) {
              throw error;
            }
          }
        }
      }

      // Create and start services
      if (composeConfig.services) {
        for (const [serviceName, serviceConfig] of Object.entries(composeConfig.services)) {
          const config = serviceConfig as any;
          const containerName = `${projectName}_${serviceName}_1`;

          // Pull image first
          if (config.image) {
            await this.pullImage(config.image);
          }

          // Create container
          const container = await this.createContainer({
            name: containerName,
            image: config.image,
            env: config.environment,
            ports: this.parseComposePorts(config.ports),
            volumes: this.parseComposeVolumes(config.volumes, projectName),
            networks: config.networks ? Object.keys(config.networks) : undefined,
            labels: {
              ...config.labels,
              "orbitr.project": projectName,
              "orbitr.service": serviceName,
            },
            restart: config.restart,
            command: config.command,
          });

          // Start container
          await this.startContainer(container.id);
          containerIds.push(container.id);
        }
      }

      logger.info({ projectName, containerIds }, "Compose configuration deployed successfully");
      return containerIds;
    } catch (error) {
      logger.error({ error, projectName }, "Failed to deploy compose configuration");
      throw error;
    }
  }

  /**
   * Parse compose port definitions
   */
  private parseComposePorts(ports?: string[]): Record<string, unknown> | undefined {
    if (!ports) return undefined;

    const exposedPorts: Record<string, unknown> = {};
    const portBindings: Record<string, unknown> = {};

    ports.forEach((port) => {
      const parts = port.split(":");
      if (parts.length === 2) {
        const [hostPort, containerPort] = parts;
        const containerPortKey = `${containerPort}/tcp`;
        exposedPorts[containerPortKey] = {};
        portBindings[containerPortKey] = [{ HostPort: hostPort }];
      }
    });

    return portBindings;
  }

  /**
   * Parse compose volume definitions
   */
  private parseComposeVolumes(volumes?: string[], projectName?: string): string[] | undefined {
    if (!volumes) return undefined;

    return volumes.map((volume) => {
      const parts = volume.split(":");
      if (parts.length === 2) {
        let [source, target] = parts;
        // If source doesn't start with / or ., it's a named volume
        if (!source.startsWith("/") && !source.startsWith(".")) {
          source = `${projectName}_${source}`;
        }
        return `${source}:${target}`;
      }
      return volume;
    });
  }
}

// Singleton instance
let dockerManager: DockerManager | null = null;

export function getDockerManager(socketPath?: string): DockerManager {
  if (!dockerManager) {
    dockerManager = new DockerManager(socketPath);
  }
  return dockerManager;
}

export default DockerManager;
