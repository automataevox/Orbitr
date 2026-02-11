import { z } from "zod";

export const ProxyProtocolSchema = z.enum(["http", "https", "tcp", "udp"]);
export type ProxyProtocol = z.infer<typeof ProxyProtocolSchema>;

export const ProxyStatusSchema = z.enum(["active", "inactive", "error"]);
export type ProxyStatus = z.infer<typeof ProxyStatusSchema>;

export interface ProxyRoute {
  id: string;
  containerId: string;
  subdomain: string;
  domain: string | null;
  targetPort: number;
  protocol: ProxyProtocol;
  status: ProxyStatus;
  sslEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export const ProxyConfigSchema = z.object({
  provider: z.enum(["traefik", "caddy"]).default("traefik"),
  domain: z.string().optional(),
  ssl: z.object({
    enabled: z.boolean().default(true),
    email: z.string().email().optional(),
    production: z.boolean().default(false),
  }).optional(),
});

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;
