import { z } from "zod";

export const HealthStatusSchema = z.enum(["healthy", "unhealthy", "unknown"]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const HealthCheckTypeSchema = z.enum(["http", "tcp", "docker", "command"]);
export type HealthCheckType = z.infer<typeof HealthCheckTypeSchema>;

export interface HealthCheck {
  id: string;
  containerId: string;
  type: HealthCheckType;
  status: HealthStatus;
  lastCheck: Date;
  nextCheck: Date;
  config: Record<string, unknown>;
  message: string | null;
}
