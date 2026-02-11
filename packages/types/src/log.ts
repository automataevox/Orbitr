import { z } from "zod";

export const LogLevelSchema = z.enum(["info", "warn", "error", "debug"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export interface Log {
  id: string;
  containerId: string | null;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
