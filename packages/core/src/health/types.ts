export interface HealthCheckResult {
  containerId: string;
  status: "healthy" | "unhealthy" | "unknown";
  message: string | null;
  timestamp: Date;
  responseTime?: number;
}

export interface HealthCheckConfig {
  type: "http" | "tcp" | "docker" | "command";
  endpoint?: string;
  port?: number;
  interval: number;
  timeout: number;
  retries: number;
  command?: string;
  expectedStatus?: number;
}
