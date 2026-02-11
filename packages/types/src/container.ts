import { z } from "zod";

// Container Types
export const ContainerStatusSchema = z.enum([
  "created",
  "running",
  "paused",
  "restarting",
  "removing",
  "exited",
  "dead",
]);

export type ContainerStatus = z.infer<typeof ContainerStatusSchema>;

export const ContainerCreateSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  extensionId: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  environment: z.record(z.string()).optional(),
  ports: z.array(
    z.object({
      containerPort: z.number(),
      hostPort: z.number().optional(),
      protocol: z.enum(["tcp", "udp"]).default("tcp"),
    })
  ).optional(),
  volumes: z.array(
    z.object({
      hostPath: z.string(),
      containerPath: z.string(),
      readOnly: z.boolean().default(false),
    })
  ).optional(),
  networks: z.array(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  restartPolicy: z.enum(["no", "always", "on-failure", "unless-stopped"]).default("unless-stopped"),
});

export type ContainerCreate = z.infer<typeof ContainerCreateSchema>;

export interface Container {
  id: string;
  dockerId: string;
  name: string;
  image: string;
  status: ContainerStatus;
  extensionId: string | null;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
