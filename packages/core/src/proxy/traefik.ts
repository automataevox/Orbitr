import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../logger";

export class TraefikGenerator {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), "data", "traefik", "dynamic.yml");
  }

  async generate(routes: any[]): Promise<void> {
    try {
      const config = {
        http: {
          routers: {} as Record<string, any>,
          services: {} as Record<string, any>,
        },
      };

      for (const route of routes) {
        const routerName = `${route.container.name}-${route.subdomain}`;
        const domain = route.domain || "orbitr.local";
        const fullDomain = `${route.subdomain}.${domain}`;

        // Router configuration
        config.http.routers[routerName] = {
          rule: `Host(\`${fullDomain}\`)`,
          service: routerName,
          entryPoints: [route.protocol === "https" ? "websecure" : "web"],
        };

        if (route.sslEnabled) {
          config.http.routers[routerName].tls = {
            certResolver: "letsencrypt",
          };
        }

        // Service configuration
        config.http.services[routerName] = {
          loadBalancer: {
            servers: [
              {
                url: `http://${route.container.name}:${route.targetPort}`,
              },
            ],
          },
        };
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });

      // Write configuration
      const yaml = require("js-yaml");
      await fs.writeFile(this.configPath, yaml.dump(config));

      logger.info({ path: this.configPath }, "Traefik configuration generated");
    } catch (error) {
      logger.error({ error }, "Failed to generate Traefik configuration");
      throw error;
    }
  }
}
