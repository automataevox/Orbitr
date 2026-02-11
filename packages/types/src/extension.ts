import { z } from "zod";

// Extension Types
export const ExtensionTypeSchema = z.enum(["app", "tool", "integration", "theme"]);
export type ExtensionType = z.infer<typeof ExtensionTypeSchema>;

export const ExtensionStatusSchema = z.enum([
  "available",
  "downloading",
  "installing",
  "installed",
  "running",
  "stopped",
  "failed",
  "updating",
  "uninstalling",
]);
export type ExtensionStatus = z.infer<typeof ExtensionStatusSchema>;

// Environment Variable Schema
export const EnvVarSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "password", "select", "multiline"]).default("string"),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean().default(false),
  options: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ).optional(),
  validation: z.object({
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

export type EnvVar = z.infer<typeof EnvVarSchema>;

// Volume Schema
export const VolumeSchema = z.object({
  name: z.string().min(1),
  hostPath: z.string().optional(),
  containerPath: z.string().min(1),
  readOnly: z.boolean().default(false),
  description: z.string().optional(),
});

export type Volume = z.infer<typeof VolumeSchema>;

// Port Schema
export const PortSchema = z.object({
  containerPort: z.number().min(1).max(65535),
  hostPort: z.number().min(1).max(65535).optional(),
  protocol: z.enum(["tcp", "udp"]).default("tcp"),
  description: z.string().optional(),
});

export type Port = z.infer<typeof PortSchema>;

// Health Check Schema
export const HealthCheckConfigSchema = z.object({
  type: z.enum(["http", "tcp", "docker", "command"]),
  endpoint: z.string().optional(),
  port: z.number().optional(),
  interval: z.number().default(30),
  timeout: z.number().default(10),
  retries: z.number().default(3),
  command: z.string().optional(),
  expectedStatus: z.number().optional(),
});

export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

// Reverse Proxy Preset Schema
export const ProxyPresetSchema = z.object({
  subdomain: z.string().optional(),
  port: z.number(),
  path: z.string().default("/"),
  stripPrefix: z.boolean().default(false),
  websockets: z.boolean().default(false),
  headers: z.record(z.string()).optional(),
});

export type ProxyPreset = z.infer<typeof ProxyPresetSchema>;

// Extension Manifest Schema (Complete)
export const ExtensionManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  author: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  type: ExtensionTypeSchema,
  icon: z.string().url().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().default("MIT"),
  tags: z.array(z.string()).default([]),
  
  // Docker Configuration
  compose: z.string(), // Path to docker-compose.yml
  
  // Environment Variables
  environment: z.array(EnvVarSchema).default([]),
  
  // Volumes
  volumes: z.array(VolumeSchema).default([]),
  
  // Ports
  ports: z.array(PortSchema).default([]),
  
  // Health Checks
  healthCheck: HealthCheckConfigSchema.optional(),
  
  // Reverse Proxy
  proxy: ProxyPresetSchema.optional(),
  
  // Requirements
  requirements: z.object({
    minOrbitrVersion: z.string().optional(),
    features: z.array(z.string()).default([]),
    extensions: z.array(z.string()).default([]),
  }).optional(),
  
  // Metadata
  metadata: z.object({
    category: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    estimatedSetupTime: z.number().optional(), // in minutes
    resources: z.object({
      cpu: z.string().optional(),
      memory: z.string().optional(),
      storage: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  type: ExtensionType;
  status: ExtensionStatus;
  manifest: ExtensionManifest;
  config: Record<string, unknown>;
  installedAt: Date | null;
  updatedAt: Date;
}
