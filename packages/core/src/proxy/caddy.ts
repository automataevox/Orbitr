import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../logger";

export class CaddyGenerator {
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), "data", "caddy", "Caddyfile");
  }

  async generate(routes: any[]): Promise<void> {
    try {
      const lines: string[] = [];

      for (const route of routes) {
        const domain = route.domain || "orbitr.local";
        const fullDomain = `${route.subdomain}.${domain}`;

        lines.push(`${fullDomain} {`);
        lines.push(`  reverse_proxy ${route.container.name}:${route.targetPort}`);
        
        if (route.sslEnabled) {
          lines.push(`  tls internal`);
        }

        lines.push(`}`);
        lines.push("");
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });

      // Write configuration
      await fs.writeFile(this.configPath, lines.join("\n"));

      logger.info({ path: this.configPath }, "Caddy configuration generated");
    } catch (error) {
      logger.error({ error }, "Failed to generate Caddy configuration");
      throw error;
    }
  }
}
