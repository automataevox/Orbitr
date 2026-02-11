import { prisma } from "@orbitr/database";
import { logger } from "../logger";
import { TraefikGenerator } from "./traefik";
import { CaddyGenerator } from "./caddy";

export type ProxyProvider = "traefik" | "caddy";

export interface ProxyRouteConfig {
  containerId: string;
  subdomain: string;
  domain?: string;
  targetPort: number;
  protocol: "http" | "https" | "tcp" | "udp";
  sslEnabled: boolean;
  customConfig?: Record<string, unknown>;
}

/**
 * ProxyManager - Manages reverse proxy configuration
 */
export class ProxyManager {
  private provider: ProxyProvider;
  private traefikGenerator: TraefikGenerator;
  private caddyGenerator: CaddyGenerator;

  constructor(provider: ProxyProvider = "traefik") {
    this.provider = provider;
    this.traefikGenerator = new TraefikGenerator();
    this.caddyGenerator = new CaddyGenerator();
  }

  /**
   * Create proxy route for container
   */
  async createRoute(config: ProxyRouteConfig): Promise<void> {
    try {
      logger.info({ config }, "Creating proxy route");

      // Create database record
      const domain = config.domain || "orbitr.local";
      const fullDomain = `${config.subdomain}.${domain}`;

      const route = await prisma.proxyRoute.create({
        data: {
          containerId: config.containerId,
          subdomain: config.subdomain,
          domain: config.domain,
          targetPort: config.targetPort,
          protocol: config.protocol,
          status: "active",
          sslEnabled: config.sslEnabled,
          config: config.customConfig || {},
        },
      });

      // Generate configuration
      await this.generateConfiguration();

      logger.info({ routeId: route.id, domain: fullDomain }, "Proxy route created");
    } catch (error) {
      logger.error({ error, config }, "Failed to create proxy route");
      throw error;
    }
  }

  /**
   * Remove proxy route
   */
  async removeRoute(routeId: string): Promise<void> {
    try {
      await prisma.proxyRoute.delete({ where: { id: routeId } });
      await this.generateConfiguration();
      logger.info({ routeId }, "Proxy route removed");
    } catch (error) {
      logger.error({ error, routeId }, "Failed to remove proxy route");
      throw error;
    }
  }

  /**
   * Generate proxy configuration
   */
  async generateConfiguration(): Promise<void> {
    try {
      const routes = await prisma.proxyRoute.findMany({
        where: { status: "active" },
        include: { container: true },
      });

      if (this.provider === "traefik") {
        await this.traefikGenerator.generate(routes as any);
      } else {
        await this.caddyGenerator.generate(routes as any);
      }

      logger.info({ provider: this.provider, routeCount: routes.length }, "Proxy configuration generated");
    } catch (error) {
      logger.error({ error }, "Failed to generate proxy configuration");
      throw error;
    }
  }

  /**
   * Get all routes
   */
  async getRoutes(): Promise<any[]> {
    return prisma.proxyRoute.findMany({
      include: { container: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get routes for container
   */
  async getRoutesForContainer(containerId: string): Promise<any[]> {
    return prisma.proxyRoute.findMany({
      where: { containerId },
      include: { container: true },
    });
  }
}

// Singleton instance
let proxyManager: ProxyManager | null = null;

export function getProxyManager(provider?: ProxyProvider): ProxyManager {
  if (!proxyManager) {
    proxyManager = new ProxyManager(provider);
  }
  return proxyManager;
}

export default ProxyManager;
