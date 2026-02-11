import { z } from "zod";

export const BackupStatusSchema = z.enum(["pending", "in_progress", "completed", "failed"]);
export type BackupStatus = z.infer<typeof BackupStatusSchema>;

export interface Backup {
  id: string;
  name: string;
  status: BackupStatus;
  size: number;
  path: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  completedAt: Date | null;
}
