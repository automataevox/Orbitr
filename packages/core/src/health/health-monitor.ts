import { prisma } from "@orbitr/database";
import { getDockerManager } from "../docker";
import { logger } from "../logger";
import type { HealthCheckResult, HealthCheckConfig } from "./types";

/**
 * HealthMonitor - Monitors container health with various check types
 */
export class HealthMonitor {
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private dockerManager = getDockerManager();

  /**
   * Start monitoring a container
   */
  async startMonitoring(containerId: string, config: HealthCheckConfig): Promise<void> {
    try {
      logger.info({ containerId, config }, "Starting health monitoring");

      // Stop existing monitoring if any
      this.stopMonitoring(containerId);

      // Create health check record
      await prisma.healthCheck.upsert({
        where: { containerId },
        create: {
          containerId,
          type: config.type,
          status: "unknown",
          config: config as any,
          lastCheck: new Date(),
          nextCheck: new Date(Date.now() + config.interval * 1000),
        },
        update: {
          type: config.type,
          config: config as any,
          nextCheck: new Date(Date.now() + config.interval * 1000),
        },
      });

      // Perform initial check immediately
      await this.performHealthCheck(containerId, config);

      // Schedule periodic checks
      const interval = setInterval(async () => {
        await this.performHealthCheck(containerId, config);
      }, config.interval * 1000);

      this.checkIntervals.set(containerId, interval);

      logger.info({ containerId }, "Health monitoring started");
    } catch (error) {
      logger.error({ error, containerId }, "Failed to start health monitoring");
      throw error;
    }
  }

  /**
   * Stop monitoring a container
   */
  stopMonitoring(containerId: string): void {
    const interval = this.checkIntervals.get(containerId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(containerId);
      logger.info({ containerId }, "Health monitoring stopped");
    }
  }

  /**
   * Perform a single health check
   */
  async performHealthCheck(containerId: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      let result: HealthCheckResult;

      switch (config.type) {
        case "http":
          result = await this.httpHealthCheck(containerId, config);
          break;
        case "tcp":
          result = await this.tcpHealthCheck(containerId, config);
          break;
        case "docker":
          result = await this.dockerHealthCheck(containerId);
          break;
        case "command":
          result = await this.commandHealthCheck(containerId, config);
          break;
        default:
          throw new Error(`Unknown health check type: ${config.type}`);
      }

      result.responseTime = Date.now() - startTime;

      // Update database
      await prisma.healthCheck.update({
        where: { containerId },
        data: {
          status: result.status,
          message: result.message,
          lastCheck: result.timestamp,
          nextCheck: new Date(result.timestamp.getTime() + config.interval * 1000),
        },
      });

      // Create notification if status changed to unhealthy
      if (result.status === "unhealthy") {
        await this.createHealthAlert(containerId, result.message || "Container health check failed");
      }

      logger.debug({ containerId, result }, "Health check completed");
      return result;
    } catch (error: any) {
      logger.error({ error, containerId }, "Health check failed");

      const result: HealthCheckResult = {
        containerId,
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };

      await prisma.healthCheck.update({
        where: { containerId },
        data: {
          status: "unhealthy",
          message: error.message,
          lastCheck: new Date(),
          nextCheck: new Date(Date.now() + config.interval * 1000),
        },
      });

      return result;
    }
  }

  /**
   * HTTP health check
   */
  private async httpHealthCheck(containerId: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    if (!config.endpoint) {
      throw new Error("HTTP health check requires endpoint");
    }

    try {
      // Get container info to build URL
      const containerInfo = await this.dockerManager.inspectContainer(containerId);
      
      // Find the first exposed port
      const ports = containerInfo.NetworkSettings.Ports;
      const portKey = Object.keys(ports)[0];
      const hostPort = ports[portKey]?.[0]?.HostPort;

      if (!hostPort) {
        throw new Error("No exposed ports found");
      }

      const url = `http://localhost:${hostPort}${config.endpoint}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout * 1000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Orbitr-HealthMonitor/1.0" },
      });

      clearTimeout(timeoutId);

      const expectedStatus = config.expectedStatus || 200;
      const isHealthy = response.status === expectedStatus;

      return {
        containerId,
        status: isHealthy ? "healthy" : "unhealthy",
        message: isHealthy ? null : `HTTP ${response.status} (expected ${expectedStatus})`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        containerId,
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * TCP health check
   */
  private async tcpHealthCheck(containerId: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    if (!config.port) {
      throw new Error("TCP health check requires port");
    }

    try {
      const containerInfo = await this.dockerManager.inspectContainer(containerId);
      
      // Find the mapped host port
      const ports = containerInfo.NetworkSettings.Ports;
      const portKey = `${config.port}/tcp`;
      const hostPort = ports[portKey]?.[0]?.HostPort;

      if (!hostPort) {
        throw new Error(`Port ${config.port} not exposed`);
      }

      // Simple TCP connection test
      const net = require("net");
      const socket = new net.Socket();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({
            containerId,
            status: "unhealthy",
            message: "Connection timeout",
            timestamp: new Date(),
          });
        }, config.timeout * 1000);

        socket.connect(parseInt(hostPort), "localhost", () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({
            containerId,
            status: "healthy",
            message: null,
            timestamp: new Date(),
          });
        });

        socket.on("error", (error: any) => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({
            containerId,
            status: "unhealthy",
            message: error.message,
            timestamp: new Date(),
          });
        });
      });
    } catch (error: any) {
      return {
        containerId,
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Docker native health check
   */
  private async dockerHealthCheck(containerId: string): Promise<HealthCheckResult> {
    try {
      const containerInfo = await this.dockerManager.inspectContainer(containerId);

      if (!containerInfo.State.Health) {
        // No health check defined, just check if running
        const isRunning = containerInfo.State.Running;
        return {
          containerId,
          status: isRunning ? "healthy" : "unhealthy",
          message: isRunning ? null : "Container not running",
          timestamp: new Date(),
        };
      }

      const healthStatus = containerInfo.State.Health.Status;
      
      let status: "healthy" | "unhealthy" | "unknown";
      if (healthStatus === "healthy") {
        status = "healthy";
      } else if (healthStatus === "unhealthy") {
        status = "unhealthy";
      } else {
        status = "unknown";
      }

      const lastLog = containerInfo.State.Health.Log?.[0];
      const message = lastLog?.Output || null;

      return {
        containerId,
        status,
        message,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        containerId,
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Command-based health check
   */
  private async commandHealthCheck(containerId: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    if (!config.command) {
      throw new Error("Command health check requires command");
    }

    try {
      const cmd = config.command.split(" ");
      const output = await this.dockerManager.execInContainer(containerId, cmd);

      // Command succeeded if no error thrown
      return {
        containerId,
        status: "healthy",
        message: null,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        containerId,
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Create health alert notification
   */
  private async createHealthAlert(containerId: string, message: string): Promise<void> {
    try {
      const container = await prisma.container.findUnique({
        where: { dockerId: containerId },
        include: { extension: true },
      });

      if (!container) return;

      await prisma.notification.create({
        data: {
          type: "health_check_failed",
          title: "Health Check Failed",
          message: `Container ${container.name} health check failed: ${message}`,
          read: false,
          metadata: {
            containerId: container.id,
            dockerId: containerId,
            extensionId: container.extensionId,
          },
        },
      });
    } catch (error) {
      logger.error({ error, containerId }, "Failed to create health alert");
    }
  }

  /**
   * Get health status for all monitored containers
   */
  async getAllHealthStatus(): Promise<HealthCheckResult[]> {
    const checks = await prisma.healthCheck.findMany({
      include: { container: true },
    });

    return checks.map((check) => ({
      containerId: check.containerId,
      status: check.status as "healthy" | "unhealthy" | "unknown",
      message: check.message,
      timestamp: check.lastCheck,
    }));
  }

  /**
   * Get health status for a specific container
   */
  async getHealthStatus(containerId: string): Promise<HealthCheckResult | null> {
    const check = await prisma.healthCheck.findUnique({
      where: { containerId },
    });

    if (!check) return null;

    return {
      containerId: check.containerId,
      status: check.status as "healthy" | "unhealthy" | "unknown",
      message: check.message,
      timestamp: check.lastCheck,
    };
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    for (const containerId of this.checkIntervals.keys()) {
      this.stopMonitoring(containerId);
    }
  }
}

// Singleton instance
let healthMonitor: HealthMonitor | null = null;

export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new HealthMonitor();
  }
  return healthMonitor;
}

export default HealthMonitor;
