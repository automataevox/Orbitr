import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "container_started",
  "container_stopped",
  "container_error",
  "extension_installed",
  "extension_updated",
  "health_check_failed",
  "system_update",
  "backup_completed",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
