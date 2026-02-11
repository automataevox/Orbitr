# Orbitr - Production Architecture Documentation

> **A Docker-native self-hosting orchestration platform that feels like an OS for your infrastructure**

Version: 1.0.0  
Last Updated: February 11, 2026  
Status: Production-Grade Design

---

## 🎯 Executive Summary

**Orbitr** is a next-generation Docker orchestration platform designed for self-hosters who want the simplicity of one-click deployments with the power of full container control. Unlike Portainer (too complex) or CasaOS (too limiting), Orbitr provides an **extension-first architecture** that scales from beginner to enterprise use.

### Core Value Propositions

1. **Extension-First**: Apps are extensions. Tools are extensions. Even core features can be extensions.
2. **Progressive Disclosure**: Simple by default, powerful when needed.
3. **Docker-Native**: No abstractions. Direct Docker API integration.
4. **Self-Hosting OS**: Not just a dashboard—a complete platform.

---

## 🏗️ High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         ORBITR PLATFORM                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Next.js 16 Web Layer                  │  │
│  │                                                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │ Dashboard  │  │ Marketplace│  │  Settings  │        │  │
│  │  │  (Simple)  │  │   Browser  │  │  & Config  │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  │                                                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │   Apps     │  │   Proxy    │  │  Dev Mode  │        │  │
│  │  │ Management │  │   Manager  │  │ (Advanced) │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Server Actions & API Routes               │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │  │
│  │  │   Docker    │  │   Extension  │  │   Registry  │    │  │
│  │  │   Actions   │  │    Actions   │  │   Actions   │    │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   Core Engine Layer                    │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Docker     │  │  Extension   │  │   Reverse    │  │  │
│  │  │   Manager    │  │   Loader     │  │    Proxy     │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Health     │  │    Event     │  │   Security   │  │  │
│  │  │   Monitor    │  │    Bus       │  │   Manager    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Data Persistence Layer                │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │  │
│  │  │   Prisma    │  │   Extension  │  │    Logs     │    │  │
│  │  │   (SQLite)  │  │     Store    │  │   Storage   │    │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Docker Engine      │
                    │   (Host Machine)     │
                    └──────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
         [Container 1]  [Container 2]  [Container N]
```

---

## 🧩 System Architecture Layers

### Layer 1: Web Interface (Next.js 16)

**Location**: `apps/web/`

#### Routing Structure (App Router)

```
/                          → Dashboard (Simple Mode)
/apps                      → App Management
/apps/[id]                 → App Detail View
/marketplace               → Extension Browser
/marketplace/[id]          → Extension Detail
/monitoring                → Health & Logs
/proxy                     → Reverse Proxy Config
/extensions                → Installed Extensions
/settings                  → Platform Configuration
/dev                       → Advanced Mode (Docker Compose Editor)
```

#### Component Architecture

All UI components use **shadcn/ui** with custom Orbitr theming:

```typescript
// Component Hierarchy
<OrbitrLayout>
  <Sidebar />               // Navigation
  <Topbar>                  // Status indicators, search, settings
    <SystemStatus />        // Docker health, CPU, Memory
    <NotificationBell />    // Real-time alerts
    <UserMenu />            // Settings dropdown
  </Topbar>
  <MainContent>
    {children}              // Route-specific content
  </MainContent>
  <WebSocketProvider>       // Real-time updates
    <LogsStream />
    <ContainerEvents />
  </WebSocketProvider>
</OrbitrLayout>
```

**Key shadcn/ui Components Used**:
- `Card`, `Button`, `Badge` → App cards
- `Dialog`, `Sheet` → Modals and drawers
- `Tabs`, `Accordion` → Settings organization
- `Form`, `Input`, `Select` → Configuration forms
- `Table`, `DataTable` → Container lists
- `Command` → Command palette (Cmd+K)
- `Toast`, `Alert` → Notifications
- `ScrollArea`, `Separator` → Layout utilities

#### State Management Strategy

**Global State (Zustand)**:
```typescript
// stores/platform-store.ts
interface PlatformState {
  containers: Container[]
  extensions: Extension[]
  systemHealth: SystemHealth
  activeMode: 'simple' | 'advanced'
  // Methods
  fetchContainers: () => Promise<void>
  installExtension: (id: string) => Promise<void>
  toggleMode: () => void
}
```

**Server State (TanStack Query)**:
- Container lists
- Extension registry
- Health checks
- Logs (with pagination)

**Real-time State (WebSockets)**:
- Live container status
- Log streaming
- Event notifications

---

### Layer 2: API Layer

#### Server Actions (Recommended for mutations)

```typescript
// app/actions/docker.actions.ts
'use server'

export async function startContainer(id: string) {
  // Validate user permissions
  // Call Docker Manager
  // Emit event
  // Return result
}

export async function installApp(extensionId: string, config: unknown) {
  // Validate extension
  // Parse manifest
  // Generate compose
  // Deploy container
  // Update database
  revalidatePath('/apps')
}
```

#### API Route Handlers (For long-running ops, webhooks, WebSockets)

```
GET    /api/containers          → List containers
POST   /api/containers          → Create container
GET    /api/containers/[id]     → Get container details
POST   /api/containers/[id]/start
POST   /api/containers/[id]/stop
DELETE /api/containers/[id]     → Remove container

GET    /api/extensions          → List installed extensions
POST   /api/extensions/install  → Install from registry
GET    /api/extensions/registry → Browse marketplace
PUT    /api/extensions/[id]     → Update extension
DELETE /api/extensions/[id]     → Uninstall

GET    /api/health              → Platform health
GET    /api/logs/[id]           → Container logs (pagination)
GET    /api/events              → SSE/WebSocket for real-time events

POST   /api/proxy/generate      → Generate reverse proxy config
GET    /api/proxy/status        → Get proxy container status

GET    /api/system/info         → System information
POST   /api/system/backup       → Trigger backup
POST   /api/system/restore      → Restore from backup
```

---

### Layer 3: Core Engine Layer

**Location**: `packages/core/`

This is the heart of Orbitr. All core services are modular, testable, and dependency-injected.

#### 3.1 Docker Manager

```typescript
// packages/core/src/docker/manager.ts
import Docker from 'dockerode'

export class DockerManager {
  private docker: Docker
  private eventBus: EventBus
  
  constructor(socketPath = '/var/run/docker.sock') {
    this.docker = new Docker({ socketPath })
  }
  
  // Container Lifecycle
  async createContainer(config: ContainerConfig): Promise<Container>
  async startContainer(id: string): Promise<void>
  async stopContainer(id: string): Promise<void>
  async restartContainer(id: string): Promise<void>
  async removeContainer(id: string): Promise<void>
  async pauseContainer(id: string): Promise<void>
  
  // Container Inspection
  async listContainers(filters?: ContainerFilter): Promise<Container[]>
  async getContainerLogs(id: string, opts: LogOptions): Promise<LogStream>
  async getContainerStats(id: string): Promise<ContainerStats>
  async inspectContainer(id: string): Promise<ContainerInspect>
  
  // Image Management
  async pullImage(image: string, onProgress?: ProgressCallback): Promise<void>
  async listImages(): Promise<Image[]>
  async removeImage(id: string): Promise<void>
  
  // Network Management
  async createNetwork(config: NetworkConfig): Promise<Network>
  async listNetworks(): Promise<Network[]>
  async removeNetwork(id: string): Promise<void>
  async connectContainerToNetwork(containerId: string, networkId: string): Promise<void>
  
  // Volume Management
  async createVolume(name: string): Promise<Volume>
  async listVolumes(): Promise<Volume[]>
  async removeVolume(name: string): Promise<void>
  
  // System Operations
  async getSystemInfo(): Promise<SystemInfo>
  async ping(): Promise<boolean>
  async getVersion(): Promise<DockerVersion>
  
  // Event Streaming
  async streamEvents(callback: EventCallback): Promise<void>
}
```

#### 3.2 Extension Loader

```typescript
// packages/core/src/extensions/loader.ts

export class ExtensionLoader {
  private extensionStore: ExtensionStore
  private validator: ExtensionValidator
  private dockerManager: DockerManager
  
  async loadExtension(source: ExtensionSource): Promise<Extension> {
    // 1. Download/clone extension
    // 2. Validate manifest
    // 3. Check security requirements
    // 4. Parse Docker Compose template
    // 5. Validate environment schema
    // 6. Store in extension directory
    // 7. Register in database
    // 8. Emit extension.installed event
  }
  
  async installExtension(id: string, config: ExtensionConfig): Promise<void> {
    // 1. Load extension manifest
    // 2. Validate user-provided config
    // 3. Generate final Docker Compose
    // 4. Pull required images
    // 5. Create networks/volumes
    // 6. Deploy containers
    // 7. Configure reverse proxy
    // 8. Set up health checks
    // 9. Mark as installed
  }
  
  async updateExtension(id: string): Promise<void> {
    // 1. Fetch latest version
    // 2. Compare manifests
    // 3. Generate migration plan
    // 4. Backup current state
    // 5. Stop containers
    // 6. Update configuration
    // 7. Restart with new version
  }
  
  async uninstallExtension(id: string, removeData = false): Promise<void> {
    // 1. Stop all containers
    // 2. Remove containers
    // 3. Optionally remove volumes
    // 4. Remove network connections
    // 5. Update reverse proxy
    // 6. Clean database entries
  }
  
  async listInstalledExtensions(): Promise<InstalledExtension[]>
  async getExtensionStatus(id: string): Promise<ExtensionStatus>
}
```

#### 3.3 Health Monitor

```typescript
// packages/core/src/health/monitor.ts

export class HealthMonitor {
  private checks: Map<string, HealthCheck>
  private intervals: Map<string, NodeJS.Timer>
  
  // Register health checks for containers
  async registerHealthCheck(containerId: string, check: HealthCheckConfig): Promise<void>
  
  // Built-in check types
  async httpHealthCheck(url: string, expectedStatus = 200): Promise<boolean>
  async tcpHealthCheck(host: string, port: number): Promise<boolean>
  async dockerHealthCheck(containerId: string): Promise<boolean>
  
  // Monitoring
  async startMonitoring(containerId: string): Promise<void>
  async stopMonitoring(containerId: string): Promise<void>
  
  // Event emission on health changes
  private onHealthChange(containerId: string, status: HealthStatus): void {
    this.eventBus.emit('container.health.changed', { containerId, status })
  }
  
  // Automatic restart logic
  async maybeRestartUnhealthyContainer(containerId: string): Promise<void>
}
```

#### 3.4 Reverse Proxy Manager

```typescript
// packages/core/src/proxy/manager.ts

export class ProxyManager {
  private proxyType: 'traefik' | 'caddy'
  private configPath: string
  private dockerManager: DockerManager
  
  async generateConfig(apps: DeployedApp[]): Promise<ProxyConfig> {
    if (this.proxyType === 'traefik') {
      return this.generateTraefikConfig(apps)
    } else {
      return this.generateCaddyConfig(apps)
    }
  }
  
  private generateTraefikConfig(apps: DeployedApp[]): TraefikConfig {
    // Generate dynamic Traefik configuration
    // Support for:
    // - HTTP routers
    // - Middleware (auth, headers, etc.)
    // - TLS certificates (Let's Encrypt)
    // - Path-based routing
    // - Host-based routing
  }
  
  async deployProxyContainer(): Promise<void> {
    // Deploy Traefik/Caddy container with generated config
    // Mount configuration volume
    // Expose ports 80, 443
    // Connect to orbitr network
  }
  
  async reloadProxy(): Promise<void> {
    // Hot-reload proxy configuration without downtime
  }
  
  async registerApp(app: DeployedApp, proxyConfig: AppProxyConfig): Promise<void> {
    // Add app routing rules
    // Configure SSL if needed
    // Set up middleware
    // Reload proxy
  }
  
  async deregisterApp(appId: string): Promise<void>
}
```

#### 3.5 Event Bus

```typescript
// packages/core/src/events/bus.ts

export class EventBus extends EventEmitter {
  // System events
  'system.started'
  'system.stopping'
  'system.error'
  
  // Container events
  'container.created'
  'container.started'
  'container.stopped'
  'container.removed'
  'container.health.changed'
  
  // Extension events
  'extension.installed'
  'extension.updated'
  'extension.uninstalled'
  'extension.error'
  
  // Proxy events
  'proxy.configured'
  'proxy.reloaded'
  
  // Monitoring events
  'health.check.failed'
  'health.check.recovered'
  
  async emit(event: SystemEvent, payload: unknown): Promise<void> {
    // Emit to internal listeners
    // Emit to WebSocket clients
    // Log to audit trail
    // Trigger webhooks if configured
  }
}
```

#### 3.6 Security Manager

```typescript
// packages/core/src/security/manager.ts

export class SecurityManager {
  // Docker socket access control
  async validateDockerAccess(): Promise<boolean>
  
  // Extension validation
  async validateExtension(manifest: ExtensionManifest): Promise<ValidationResult> {
    // Check manifest signature
    // Validate schema
    // Check for dangerous permissions
    // Scan for known vulnerabilities
  }
  
  // Environment variable encryption
  async encryptEnvVar(key: string, value: string): Promise<string>
  async decryptEnvVar(key: string, encrypted: string): Promise<string>
  
  // Audit logging
  async logAuditEvent(event: AuditEvent): Promise<void>
  
  // CSRF protection (integrated with Next.js)
  async generateCsrfToken(): Promise<string>
  async validateCsrfToken(token: string): Promise<boolean>
}
```

---

### Layer 4: Extension System (CRITICAL)

**This is the most important architectural component.**

#### Extension Manifest Schema

```typescript
// packages/core/src/extensions/schema.ts

export const ExtensionManifestSchema = z.object({
  // Metadata
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),
  
  // Repository info
  repository: z.object({
    type: z.enum(['git', 'github']),
    url: z.string().url(),
  }).optional(),
  
  // Extension type
  type: z.enum(['app', 'tool', 'integration', 'theme']),
  
  // Categories for marketplace
  categories: z.array(z.enum([
    'media', 'productivity', 'development', 'networking',
    'monitoring', 'automation', 'database', 'ai', 'other'
  ])),
  
  // Icon and screenshots
  icon: z.string().url().or(z.string()), // URL or relative path
  screenshots: z.array(z.string()).optional(),
  
  // Docker configuration
  docker: z.object({
    // Option 1: Docker Compose template
    compose: z.string().optional(), // Path to docker-compose.yml
    
    // Option 2: Inline compose (for simple apps)
    composeInline: z.record(z.unknown()).optional(),
    
    // Required images (for pre-pulling)
    images: z.array(z.string()),
    
    // Network requirements
    networks: z.array(z.string()).default(['orbitr-network']),
    
    // Volume requirements
    volumes: z.array(z.object({
      name: z.string(),
      mountPath: z.string(),
      type: z.enum(['named', 'bind']),
    })).optional(),
    
    // Port mappings
    ports: z.array(z.object({
      container: z.number(),
      host: z.number().optional(), // Auto-assign if not specified
      protocol: z.enum(['tcp', 'udp']).default('tcp'),
    })),
  }),
  
  // Environment variable schema
  environment: z.object({
    variables: z.array(z.object({
      key: z.string(),
      label: z.string(),
      description: z.string().optional(),
      type: z.enum(['string', 'number', 'boolean', 'password', 'select']),
      default: z.union([z.string(), z.number(), z.boolean()]).optional(),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(), // For 'select' type
      validation: z.object({
        pattern: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
    })),
  }).optional(),
  
  // Health check configuration
  healthCheck: z.object({
    type: z.enum(['http', 'tcp', 'docker']),
    interval: z.number().default(30), // seconds
    timeout: z.number().default(5),
    retries: z.number().default(3),
    startPeriod: z.number().default(60),
    
    // HTTP-specific
    http: z.object({
      path: z.string(),
      port: z.number(),
      expectedStatus: z.number().default(200),
    }).optional(),
    
    // TCP-specific
    tcp: z.object({
      port: z.number(),
    }).optional(),
  }).optional(),
  
  // Reverse proxy configuration
  proxy: z.object({
    enabled: z.boolean().default(false),
    subdomain: z.string().optional(), // e.g., "app" -> app.domain.com
    path: z.string().optional(), // e.g., "/app" -> domain.com/app
    port: z.number(), // Internal container port
    
    // SSL configuration
    ssl: z.object({
      enabled: z.boolean().default(true),
      forceHttps: z.boolean().default(true),
    }).optional(),
    
    // Middleware
    middleware: z.array(z.enum([
      'auth', 'cors', 'rate-limit', 'compression'
    ])).optional(),
  }).optional(),
  
  // Dependencies on other extensions
  dependencies: z.array(z.object({
    id: z.string(),
    version: z.string(), // Semver range
  })).optional(),
  
  // Permissions required
  permissions: z.array(z.enum([
    'docker.read',
    'docker.write',
    'network.create',
    'volume.create',
    'proxy.configure',
    'system.read',
  ])).optional(),
  
  // UI extensions (future feature)
  ui: z.object({
    dashboard: z.object({
      widget: z.string(), // Path to widget component
      size: z.enum(['small', 'medium', 'large']),
    }).optional(),
    settingsPage: z.string().optional(), // Path to settings component
  }).optional(),
  
  // Documentation
  documentation: z.object({
    readme: z.string().default('README.md'),
    website: z.string().url().optional(),
  }).optional(),
  
  // Licensing
  license: z.string().default('MIT'),
  
  // Marketplace metadata
  marketplace: z.object({
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    downloads: z.number().default(0),
    rating: z.number().min(0).max(5).optional(),
  }).optional(),
})

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>
```

#### Extension Folder Structure

```
extensions/
├── registry/                    # Official extension registry
│   ├── postgresql/
│   │   ├── manifest.json
│   │   ├── docker-compose.yml
│   │   ├── icon.svg
│   │   ├── README.md
│   │   └── screenshots/
│   ├── nextcloud/
│   ├── plex/
│   └── ...
│
├── community/                   # Community extensions (via Git)
│   └── .gitkeep
│
└── installed/                   # User-installed extensions
    ├── postgresql-instance-1/
    │   ├── manifest.json
    │   ├── .env.generated
    │   ├── docker-compose.yml
    │   └── data/
    └── ...
```

#### Extension Installation Flow

```typescript
// Detailed installation process

async function installExtension(extensionId: string, userConfig: unknown) {
  // PHASE 1: VALIDATION
  const extension = await fetchExtension(extensionId)
  const manifest = ExtensionManifestSchema.parse(extension.manifest)
  
  // Validate user configuration against environment schema
  const validatedConfig = validateUserConfig(manifest.environment, userConfig)
  
  // Check dependencies
  await validateDependencies(manifest.dependencies)
  
  // Check permissions
  await validatePermissions(manifest.permissions)
  
  // PHASE 2: PREPARATION
  const installId = generateInstallId(extensionId)
  const installPath = path.join(EXTENSION_DIR, installId)
  
  // Copy extension files
  await copyExtensionFiles(extension, installPath)
  
  // Generate environment file
  const envFile = generateEnvFile(validatedConfig)
  await fs.writeFile(path.join(installPath, '.env'), envFile)
  
  // PHASE 3: DOCKER SETUP
  // Parse compose template
  const composeTemplate = await loadComposeTemplate(installPath)
  
  // Substitute variables
  const finalCompose = substituteEnvVars(composeTemplate, validatedConfig)
  
  // Pull images
  for (const image of manifest.docker.images) {
    await dockerManager.pullImage(image, onProgress)
  }
  
  // Create networks
  for (const network of manifest.docker.networks) {
    await ensureNetwork(network)
  }
  
  // Create volumes
  for (const volume of manifest.docker.volumes) {
    await dockerManager.createVolume(`${installId}-${volume.name}`)
  }
  
  // PHASE 4: DEPLOYMENT
  // Deploy containers
  const containers = await dockerManager.createFromCompose(finalCompose)
  
  // PHASE 5: POST-INSTALL
  // Configure reverse proxy
  if (manifest.proxy?.enabled) {
    await proxyManager.registerApp(installId, manifest.proxy)
  }
  
  // Set up health checks
  if (manifest.healthCheck) {
    await healthMonitor.registerHealthCheck(containers[0].id, manifest.healthCheck)
    await healthMonitor.startMonitoring(containers[0].id)
  }
  
  // PHASE 6: DATABASE RECORD
  await db.extension.create({
    data: {
      id: installId,
      extensionId: manifest.id,
      version: manifest.version,
      config: validatedConfig,
      status: 'running',
      installedAt: new Date(),
    }
  })
  
  // PHASE 7: EVENTS
  eventBus.emit('extension.installed', {
    id: installId,
    name: manifest.name,
  })
  
  return { installId, containers }
}
```

#### Extension Sandboxing Strategy

**Security Boundaries**:

1. **No Backend Code Execution**: Extensions cannot execute arbitrary Node.js code in Orbitr backend.
2. **Declarative Configuration Only**: All extension behavior is defined in manifest.json.
3. **Docker Isolation**: Extensions run in separate Docker containers.
4. **Permission System**: Extensions must declare required permissions.
5. **Network Isolation**: Extensions run in isolated Docker networks by default.
6. **Environment Encryption**: Sensitive environment variables can be encrypted at rest.

**Future UI Extensions** (Phase 2):
- Sandboxed iframe with limited postMessage API
- CSP-restricted inline components
- No direct DOM access to Orbitr UI

#### Extension Update Mechanism

```typescript
async function updateExtension(installId: string) {
  const installed = await db.extension.findUnique({ where: { id: installId } })
  const latest = await fetchExtension(installed.extensionId)
  
  // Version comparison
  if (semver.lte(latest.version, installed.version)) {
    throw new Error('Already up to date')
  }
  
  // Create backup
  await backupExtension(installId)
  
  // Generate migration plan
  const migration = generateMigrationPlan(installed, latest)
  
  // Stop containers
  await stopExtension(installId)
  
  // Update files
  await updateExtensionFiles(installId, latest)
  
  // Run migration scripts
  if (migration.requiresDataMigration) {
    await runMigrationScript(migration.script)
  }
  
  // Restart with new version
  await startExtension(installId)
  
  // Update database
  await db.extension.update({
    where: { id: installId },
    data: {
      version: latest.version,
      updatedAt: new Date(),
    }
  })
  
  eventBus.emit('extension.updated', { id: installId })
}
```

---

### Layer 5: Marketplace System

#### Registry Architecture

**Option A: GitHub-Based Registry (Recommended)**

```
orbitr-registry/
├── extensions/
│   ├── postgresql/
│   │   └── manifest.json
│   ├── nextcloud/
│   │   └── manifest.json
│   └── ...
├── registry.json              # Master index
└── README.md
```

**registry.json**:
```json
{
  "version": "1.0.0",
  "extensions": [
    {
      "id": "postgresql",
      "name": "PostgreSQL",
      "version": "16.1.0",
      "author": "Orbitr Team",
      "categories": ["database"],
      "verified": true,
      "manifestUrl": "https://raw.githubusercontent.com/orbitr/registry/main/extensions/postgresql/manifest.json",
      "repositoryUrl": "https://github.com/orbitr/extensions/postgresql"
    }
  ]
}
```

**Fetching Process**:
```typescript
async function fetchRegistry() {
  const response = await fetch('https://registry.orbitr.io/registry.json')
  const registry = await response.json()
  
  // Cache locally
  await cacheRegistry(registry)
  
  return registry
}

async function fetchExtension(id: string) {
  const registry = await fetchRegistry()
  const entry = registry.extensions.find(e => e.id === id)
  
  const manifest = await fetch(entry.manifestUrl).then(r => r.json())
  
  return {
    manifest,
    source: entry.repositoryUrl
  }
}
```

#### Community Extension Support

Users can install extensions from any Git repository:

```typescript
async function installFromGit(repoUrl: string, ref = 'main') {
  // Clone repository
  const tempDir = await cloneRepository(repoUrl, ref)
  
  // Load and validate manifest
  const manifest = await loadManifest(path.join(tempDir, 'manifest.json'))
  await validateManifest(manifest)
  
  // Security check for community extensions
  await performSecurityScan(tempDir)
  
  // Warn user if not verified
  if (!manifest.marketplace?.verified) {
    await promptUserConfirmation('This is a community extension...')
  }
  
  // Continue with installation
  return installExtension(manifest, config)
}
```

#### Extension Signing & Verification (Future)

**Phase 2 Implementation**:
- GPG signature verification
- Manifest integrity checks
- Official extension badges
- Community reputation system

---

### Layer 6: Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE MODELS
// ============================================================================

model Container {
  id              String   @id @default(cuid())
  dockerId        String   @unique // Docker container ID
  name            String
  image           String
  status          String   // running, stopped, paused, exited
  state           Json?    // Full Docker inspect state
  
  // Relationships
  extensionId     String?
  extension       Extension? @relation(fields: [extensionId], references: [id], onDelete: Cascade)
  
  // Metadata
  labels          Json?
  environment     Json?
  ports           Json?    // Port mappings
  volumes         Json?    // Volume mounts
  networks        Json?    // Network connections
  
  // Health
  healthStatus    String?  // healthy, unhealthy, starting
  lastHealthCheck DateTime?
  restartCount    Int      @default(0)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  logs            Log[]
  healthChecks    HealthCheck[]
  
  @@index([dockerId])
  @@index([extensionId])
  @@index([status])
}

model Extension {
  id              String   @id @default(cuid())
  
  // Extension metadata
  extensionId     String   // e.g., "postgresql"
  name            String
  version         String
  description     String?
  author          Json
  icon            String?
  
  // Installation
  installPath     String   // Path to extension files
  manifest        Json     // Full manifest
  config          Json     // User-provided configuration
  
  // Status
  status          String   // installing, running, stopped, failed, updating
  enabled         Boolean  @default(true)
  
  // Source
  source          String?  // git, registry, local
  sourceUrl       String?
  
  // Proxy configuration
  proxyEnabled    Boolean  @default(false)
  proxyConfig     Json?
  subdomain       String?  @unique
  domain          String?
  
  // Timestamps
  installedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastStartedAt   DateTime?
  lastStoppedAt   DateTime?
  
  // Relations
  containers      Container[]
  settings        ExtensionSetting[]
  
  @@unique([extensionId, version])
  @@index([status])
  @@index([enabled])
}

model ExtensionSetting {
  id          String    @id @default(cuid())
  extensionId String
  extension   Extension @relation(fields: [extensionId], references: [id], onDelete: Cascade)
  
  key         String
  value       String
  encrypted   Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([extensionId, key])
}

// ============================================================================
// MONITORING & HEALTH
// ============================================================================

model HealthCheck {
  id            String    @id @default(cuid())
  containerId   String
  container     Container @relation(fields: [containerId], references: [id], onDelete: Cascade)
  
  type          String    // http, tcp, docker
  config        Json      // Check-specific configuration
  
  status        String    // healthy, unhealthy, unknown
  lastCheck     DateTime?
  lastSuccess   DateTime?
  lastFailure   DateTime?
  
  consecutiveFailures Int @default(0)
  totalChecks        Int @default(0)
  totalFailures      Int @default(0)
  
  enabled       Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([containerId])
  @@index([status])
}

model Log {
  id          String    @id @default(cuid())
  containerId String
  container   Container @relation(fields: [containerId], references: [id], onDelete: Cascade)
  
  timestamp   DateTime  @default(now())
  stream      String    // stdout, stderr
  message     String
  
  @@index([containerId, timestamp])
}

// ============================================================================
// PROXY
// ============================================================================

model ProxyRoute {
  id          String   @id @default(cuid())
  
  // Route configuration
  name        String   @unique
  domain      String?
  subdomain   String?
  path        String?
  
  // Target
  targetHost  String   // Container name or IP
  targetPort  Int
  
  // SSL
  sslEnabled  Boolean  @default(true)
  forceHttps  Boolean  @default(true)
  certPath    String?
  
  // Middleware
  middleware  Json?
  
  // Status
  enabled     Boolean  @default(true)
  
  // Metadata
  extensionId String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([domain, subdomain])
}

// ============================================================================
// SYSTEM
// ============================================================================

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  encrypted Boolean  @default(false)
  
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  
  // Event details
  event     String   // container.started, extension.installed, etc.
  action    String   // create, update, delete, start, stop
  resource  String   // container, extension, system
  resourceId String?
  
  // Actor (future: user integration)
  userId    String?
  ipAddress String?
  userAgent String?
  
  // Data
  metadata  Json?
  success   Boolean  @default(true)
  error     String?
  
  timestamp DateTime @default(now())
  
  @@index([event])
  @@index([timestamp])
  @@index([resourceId])
}

model Notification {
  id          String   @id @default(cuid())
  
  type        String   // info, warning, error, success
  title       String
  message     String
  
  // Related resource
  resourceType String? // container, extension, system
  resourceId   String?
  
  // Status
  read        Boolean  @default(false)
  dismissed   Boolean  @default(false)
  
  // Actions
  actionUrl   String?
  actionLabel String?
  
  createdAt   DateTime @default(now())
  
  @@index([read, dismissed])
  @@index([createdAt])
}

// ============================================================================
// MARKETPLACE
// ============================================================================

model ExtensionRegistry {
  id            String   @id @default(cuid())
  
  // Extension info (from registry)
  extensionId   String   @unique
  name          String
  description   String
  author        Json
  version       String   // Latest version
  
  // Marketplace metadata
  categories    Json
  tags          Json?
  icon          String?
  screenshots   Json?
  
  // Stats
  downloads     Int      @default(0)
  rating        Float?
  verified      Boolean  @default(false)
  featured      Boolean  @default(false)
  
  // Source
  manifestUrl   String
  repositoryUrl String?
  
  // Cache
  lastFetched   DateTime @default(now())
  
  @@index([featured, verified])
}

// ============================================================================
// BACKUP & RESTORE
// ============================================================================

model Backup {
  id          String   @id @default(cuid())
  
  // Backup metadata
  name        String
  description String?
  
  // Contents
  includesExtensions Boolean @default(true)
  includesData       Boolean @default(true)
  includesSettings   Boolean @default(true)
  
  // Storage
  filePath    String
  size        BigInt   // Bytes
  
  // Status
  status      String   // creating, completed, failed
  
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([createdAt])
}
```

---

## 🔐 Security Model

### 1. Docker Socket Access

**Challenge**: Docker socket access grants root-equivalent privileges.

**Strategy**:
```typescript
// Run Orbitr as non-root user
// Mount docker.sock with proper group permissions

// Dockerfile
FROM node:20-alpine
RUN addgroup -g 1000 docker && \
    adduser -D -u 1000 -G docker orbitr
USER orbitr

// docker-compose.yml
services:
  orbitr:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro  # Read-only
    group_add:
      - docker  # Add user to docker group
```

**Validation Layer**:
```typescript
// Every Docker operation goes through validation
class DockerOperationValidator {
  async validateOperation(operation: DockerOperation): Promise<boolean> {
    // Check if operation is allowed
    // Log to audit trail
    // Apply rate limiting
    // Check resource limits
  }
}
```

### 2. Extension Validation

**Manifest Validation**:
```typescript
async function validateExtensionSecurity(manifest: ExtensionManifest) {
  // Check for dangerous Docker configurations
  const dangerousFlags = [
    '--privileged',
    '--cap-add=ALL',
    'network_mode: host',
    '/dev:/dev',
  ]
  
  // Check for host network access (flag as warning)
  // Check for privileged containers (reject)
  // Check for host volume mounts outside allowed paths
  // Validate image sources (warn on non-official images)
  
  return {
    safe: true,
    warnings: [],
    errors: []
  }
}
```

### 3. Environment Variable Encryption

**Implementation**:
```typescript
// Use native crypto for encryption
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

class EnvEncryption {
  private algorithm = 'aes-256-gcm'
  private key: Buffer // Stored in system settings, generated on first run
  
  encrypt(value: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }
  
  decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv(this.algorithm, this.key, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

### 4. CSRF Protection

**Using Next.js built-in protection**:
```typescript
// Server Actions have built-in CSRF protection
// API routes require token validation

// middleware.ts
export async function middleware(request: NextRequest) {
  // Validate CSRF token for non-GET requests
  if (request.method !== 'GET') {
    const token = request.headers.get('x-csrf-token')
    if (!token || !await validateCsrfToken(token)) {
      return new Response('Invalid CSRF token', { status: 403 })
    }
  }
}
```

### 5. Rate Limiting

**Prevent abuse**:
```typescript
// Simple in-memory rate limiter (use Redis for production cluster)
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: kv, // Upstash KV or Redis
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }
  
  // Continue with request
}
```

### 6. Audit Logging

**Every significant action is logged**:
```typescript
async function logAuditEvent(event: AuditEvent) {
  await db.auditLog.create({
    data: {
      event: event.type,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      metadata: event.metadata,
      timestamp: new Date(),
      // Future: userId, ipAddress
    }
  })
  
  // Also emit to event bus for real-time monitoring
  eventBus.emit('audit.log', event)
}
```

---

## 🚀 Deployment Strategy

### Production Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# Prune dev dependencies
RUN pnpm install --prod --frozen-lockfile

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 docker && \
    adduser -D -u 1000 -G docker orbitr && \
    mkdir -p /app/data /app/extensions && \
    chown -R orbitr:docker /app

# Copy built application
COPY --from=builder --chown=orbitr:docker /app/.next/standalone ./
COPY --from=builder --chown=orbitr:docker /app/.next/static ./.next/static
COPY --from=builder --chown=orbitr:docker /app/public ./public
COPY --from=builder --chown=orbitr:docker /app/prisma ./prisma
COPY --from=builder --chown=orbitr:docker /app/node_modules/.prisma ./node_modules/.prisma

# Install only runtime dependencies
RUN apk add --no-cache \
    docker-cli \
    git \
    curl

USER orbitr

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/orbitr.db
ENV PORT=3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  orbitr:
    image: orbitr/orbitr:latest
    container_name: orbitr
    restart: unless-stopped
    
    ports:
      - "3000:3000"
    
    volumes:
      # Data persistence
      - orbitr-data:/app/data
      
      # Extension storage
      - orbitr-extensions:/app/extensions
      
      # Docker socket (read-only for security)
      - /var/run/docker.sock:/var/run/docker.sock:ro
    
    environment:
      # Database
      - DATABASE_URL=file:/app/data/orbitr.db
      
      # App configuration
      - NODE_ENV=production
      - LOG_LEVEL=info
      
      # Optional: Authentication
      # - NEXTAUTH_URL=http://localhost:3000
      # - NEXTAUTH_SECRET=your-secret-here
      
      # Optional: Reverse proxy configuration
      # - PROXY_TYPE=traefik
      # - DOMAIN=example.com
      # - SSL_EMAIL=admin@example.com
    
    # Add to docker group for socket access
    group_add:
      - ${DOCKER_GID:-999}  # Docker group ID
    
    networks:
      - orbitr-network
    
    labels:
      - "orbitr.managed=false"  # Don't manage Orbitr itself
      - "com.centurylinklabs.watchtower.enable=true"

  # Optional: Traefik reverse proxy
  traefik:
    image: traefik:v2.10
    container_name: orbitr-traefik
    restart: unless-stopped
    
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=${SSL_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-acme:/acme
    
    networks:
      - orbitr-network

networks:
  orbitr-network:
    name: orbitr-network
    driver: bridge

volumes:
  orbitr-data:
    name: orbitr-data
  orbitr-extensions:
    name: orbitr-extensions
  traefik-acme:
    name: traefik-acme
```

### Quick Start Script

```bash
#!/bin/bash
# install.sh

set -e

echo "🚀 Installing Orbitr..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Get Docker group ID
DOCKER_GID=$(getent group docker | cut -d: -f3)

# Create .env file
cat > .env << EOF
DOCKER_GID=${DOCKER_GID}
SSL_EMAIL=admin@example.com
EOF

# Download docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/orbitr/orbitr/main/docker-compose.yml -o docker-compose.yml

# Start Orbitr
docker compose up -d

echo "✅ Orbitr is running!"
echo "📱 Open http://localhost:3000 in your browser"
echo ""
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f orbitr"
```

---

## 📁 Repository Structure

```
orbitr/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Test & build
│   │   ├── release.yml                 # Automated releases
│   │   └── docker-publish.yml          # Push to Docker Hub
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── FUNDING.yml
│
├── apps/
│   └── web/                            # Main Next.js application
│       ├── app/                        # App Router
│       │   ├── (auth)/                 # Auth routes (optional)
│       │   ├── (dashboard)/            # Main dashboard routes
│       │   │   ├── layout.tsx          # Sidebar + Topbar
│       │   │   ├── page.tsx            # Overview
│       │   │   ├── apps/
│       │   │   │   ├── page.tsx        # Apps list
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx    # App details
│       │   │   ├── marketplace/
│       │   │   │   ├── page.tsx        # Extension browser
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx    # Extension details
│       │   │   ├── monitoring/
│       │   │   │   └── page.tsx        # Health & logs
│       │   │   ├── proxy/
│       │   │   │   └── page.tsx        # Reverse proxy config
│       │   │   ├── extensions/
│       │   │   │   └── page.tsx        # Installed extensions
│       │   │   ├── settings/
│       │   │   │   └── page.tsx        # Platform settings
│       │   │   └── dev/
│       │   │       └── page.tsx        # Advanced mode
│       │   ├── api/                    # API routes
│       │   │   ├── containers/
│       │   │   ├── extensions/
│       │   │   ├── health/
│       │   │   ├── logs/
│       │   │   ├── proxy/
│       │   │   └── system/
│       │   ├── actions/                # Server Actions
│       │   │   ├── docker.actions.ts
│       │   │   ├── extension.actions.ts
│       │   │   └── system.actions.ts
│       │   └── layout.tsx              # Root layout
│       ├── components/
│       │   ├── ui/                     # shadcn/ui components
│       │   ├── dashboard/              # Dashboard-specific
│       │   ├── apps/                   # App management
│       │   ├── marketplace/            # Marketplace browser
│       │   └── shared/                 # Shared components
│       ├── lib/
│       │   ├── api.ts                  # API client
│       │   ├── utils.ts                # Utilities
│       │   └── validations.ts          # Zod schemas
│       ├── stores/
│       │   ├── platform-store.ts       # Main app state
│       │   └── ui-store.ts             # UI state
│       ├── styles/
│       │   └── globals.css             # Tailwind styles
│       ├── public/
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── core/                           # Core engine (backend logic)
│   │   ├── src/
│   │   │   ├── docker/
│   │   │   │   ├── manager.ts
│   │   │   │   ├── compose-parser.ts
│   │   │   │   └── types.ts
│   │   │   ├── extensions/
│   │   │   │   ├── loader.ts
│   │   │   │   ├── validator.ts
│   │   │   │   ├── installer.ts
│   │   │   │   └── schema.ts
│   │   │   ├── health/
│   │   │   │   ├── monitor.ts
│   │   │   │   ├── checks.ts
│   │   │   │   └── types.ts
│   │   │   ├── proxy/
│   │   │   │   ├── manager.ts
│   │   │   │   ├── traefik.ts
│   │   │   │   ├── caddy.ts
│   │   │   │   └── types.ts
│   │   │   ├── events/
│   │   │   │   ├── bus.ts
│   │   │   │   └── types.ts
│   │   │   ├── security/
│   │   │   │   ├── manager.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   └── validator.ts
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                       # Prisma database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── client.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdk/                            # Extension SDK (for developers)
│   │   ├── src/
│   │   │   ├── manifest.ts             # Manifest builder
│   │   │   ├── validator.ts            # Validation utilities
│   │   │   ├── cli.ts                  # CLI tools
│   │   │   └── types.ts
│   │   ├── templates/                  # Extension templates
│   │   │   ├── app/
│   │   │   ├── tool/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── cli/                            # Orbitr CLI (optional)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── install.ts
│   │   │   │   ├── start.ts
│   │   │   │   ├── stop.ts
│   │   │   │   └── ext.ts              # Extension management
│   │   │   ├── index.ts
│   │   │   └── utils.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── types/                          # Shared TypeScript types
│       ├── src/
│       │   ├── container.ts
│       │   ├── extension.ts
│       │   ├── health.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── extensions/                         # Official extensions
│   ├── registry/
│   │   ├── postgresql/
│   │   │   ├── manifest.json
│   │   │   ├── docker-compose.yml
│   │   │   ├── icon.svg
│   │   │   ├── README.md
│   │   │   └── screenshots/
│   │   ├── nextcloud/
│   │   ├── plex/
│   │   ├── jellyfin/
│   │   ├── vaultwarden/
│   │   ├── home-assistant/
│   │   └── ...
│   └── README.md
│
├── docs/                               # Documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── extension-development.md
│   ├── api-reference.md
│   ├── deployment.md
│   └── contributing.md
│
├── scripts/
│   ├── dev.sh                          # Development setup
│   ├── build.sh                        # Build script
│   └── install.sh                      # Quick install script
│
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── docker-compose.yml                  # Production deployment
├── docker-compose.dev.yml              # Development
├── Dockerfile
├── turbo.json                          # Turborepo config
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── LICENSE
└── ARCHITECTURE.md                     # This document
```

---

## 🎨 UI/UX Design Patterns

### Simple Mode UI

**Dashboard (Overview)**:
```
┌────────────────────────────────────────────────────────────┐
│ [☰] Orbitr                     [🔍] [🔔] [⚙️] [@]          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ System Status                                         │   │
│ │ ● Docker: Healthy  │  CPU: 45%  │  Memory: 2.1/8GB  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Running Apps (4)                          [+ Add App]       │
│                                                              │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│ │  📦      │  │  🎬      │  │  🔒      │  │  🏠      │   │
│ │ Postgres │  │  Plex    │  │Vaultwrdn │  │  Home    │   │
│ │          │  │          │  │          │  │ Assist   │   │
│ │ ● Running│  │ ● Running│  │ ● Running│  │ ● Running│   │
│ │ [Stop]   │  │ [Open]   │  │ [Open]   │  │ [Open]   │   │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│ Recent Activity                                             │
│ • Plex started successfully                     2 min ago   │
│ • Vaultwarden health check passed              5 min ago   │
│ • PostgreSQL backup completed                 15 min ago   │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**Marketplace**:
```
┌────────────────────────────────────────────────────────────┐
│ Extension Marketplace                                       │
│ [Search extensions...]              [Filter ▼] [Sort ▼]   │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Featured                                                    │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Icon] Nextcloud - Your own cloud storage             │   │
│ │        File hosting, calendar, contacts...            │   │
│ │        ⭐ 4.8  │  📥 12.5K  │  ✓ Verified            │   │
│ │        [Install]                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Popular Apps                                                │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│ │ Plex     │  │ Jellyfin │  │ AdGuard  │  │ Portainer│   │
│ │ ⭐ 4.9   │  │ ⭐ 4.7   │  │ ⭐ 4.6   │  │ ⭐ 4.5   │   │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│ Categories                                                  │
│ [Media] [Productivity] [Networking] [Monitoring] ...       │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Advanced Mode UI

**Docker Compose Editor**:
```
┌────────────────────────────────────────────────────────────┐
│ Dev Mode - Direct Docker Control                           │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────┐ ┌──────────────────────────────┐  │
│ │ Containers          │ │ Docker Compose               │  │
│ │                     │ │                              │  │
│ │ ○ orbitr           │ │ version: '3.8'              │  │
│ │ ○ plex             │ │ services:                   │  │
│ │ ○ postgres         │ │   plex:                     │  │
│ │                     │ │     image: plexinc/...     │  │
│ │ [+ Add Container]   │ │     ports:                  │  │
│ │                     │ │       - "32400:32400"      │  │
│ └─────────────────────┘ │     volumes:                │  │
│                         │       - plex-config:...     │  │
│ ┌─────────────────────┐ │     environment:            │  │
│ │ Networks            │ │       TZ: America/NY       │  │
│ │ • orbitr-network   │ │                              │  │
│ │ • plex-network     │ │ [Validate] [Deploy]          │  │
│ │                     │ └──────────────────────────────┘  │
│ │ [+ Create Network]  │                                   │
│ └─────────────────────┘                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Real-time Logs                              [Clear]  │  │
│ │ [plex] Starting Plex Media Server...                 │  │
│ │ [plex] Server started on port 32400                  │  │
│ │ [postgres] database system is ready to accept...    │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🔮 Future Roadmap

### Phase 1: Core Platform (Months 1-3)
- ✅ Complete architecture design
- ⬜ Implement Docker Manager
- ⬜ Implement Extension Loader
- ⬜ Basic web UI (Next.js + shadcn/ui)
- ⬜ SQLite database + Prisma
- ⬜ Extension marketplace (GitHub-based)
- ⬜ Simple mode UI
- ⬜ Health monitoring
- ⬜ Basic reverse proxy (Traefik)
- ⬜ Docker deployment ready
- ⬜ 10 official extensions

### Phase 2: Advanced Features (Months 4-6)
- ⬜ Advanced mode / Dev mode
- ⬜ WebSocket real-time updates
- ⬜ Extension update system
- ⬜ Backup & restore
- ⬜ Multi-container extension support
- ⬜ Extension dependencies
- ⬜ Custom domain management
- ⬜ SSL automation (Let's Encrypt)
- ⬜ Resource limits & quotas
- ⬜ Extension signing & verification

### Phase 3: Authentication & Multi-User (Months 7-9)
- ⬜ NextAuth integration
- ⬜ User management
- ⬜ RBAC system
- ⬜ Per-user app instances
- ⬜ Team workspaces
- ⬜ Audit logging UI
- ⬜ Activity feed
- ⬜ User preferences

### Phase 4: Enterprise Features (Months 10-12)
- ⬜ Multi-node support
- ⬜ Docker Swarm integration
- ⬜ Kubernetes support (optional)
- ⬜ High availability
- ⬜ Prometheus metrics
- ⬜ Grafana dashboard
- ⬜ Alert manager integration
- ⬜ S3 backup support
- ⬜ LDAP/SAML authentication

### Phase 5: Ecosystem Growth (Ongoing)
- ⬜ Extension SDK v2 (UI extensions)
- ⬜ Official extension registry website
- ⬜ Extension certification program
- ⬜ CLI tool (`orbitr-cli`)
- ⬜ Mobile app (monitoring)
- ⬜ API documentation
- ⬜ Developer portal
- ⬜ Community forum
- ⬜ Extension workshop events
- ⬜ 100+ official extensions

---

## 🆚 Competitive Analysis & Differentiation

### vs. Portainer
**Portainer**: Full Docker management, complex UI, targeted at DevOps.
**Orbitr**: Self-host focused, extension-first, simple by default.

**Orbitr Advantages**:
- One-click app deployment (not just Docker management)
- Extension marketplace
- Beginner-friendly UI
- Automatic reverse proxy
- Health monitoring built-in

### vs. CasaOS
**CasaOS**: Beautiful UI, limited extensibility, closed ecosystem.
**Orbitr**: Open extension system, power user features, production-grade.

**Orbitr Advantages**:
- Open extension format (Docker Compose)
- Advanced mode for power users
- Better Docker integration
- Production-ready architecture
- Active community extensions

### vs. Yacht
**Yacht**: Docker UI, template-based deployment.
**Orbitr**: Full platform, marketplace, health monitoring.

**Orbitr Advantages**:
- Integrated reverse proxy
- Extension update system
- Health check engine
- Better UI/UX
- Active development

### vs. Umbrel
**Umbrel**: Bitcoin/Web3 focused, closed ecosystem.
**Orbitr**: General-purpose, Docker-native, extensible.

**Orbitr Advantages**:
- Technology-agnostic
- Open extension format
- Better Docker integration
- Not locked to specific use cases

---

## ⚖️ Architectural Tradeoffs & Justifications

### 1. SQLite vs. PostgreSQL

**Decision**: SQLite (default), PostgreSQL (optional, future)

**Justification**:
- **Pro**: Zero configuration, single file, perfect for self-hosted
- **Pro**: Excellent for single-node deployments (99% of users)
- **Pro**: Integrated backups (just copy the file)
- **Con**: Not suitable for multi-node (future requirement)

**Solution**: Design database layer to be swappable. Use Prisma for abstraction.

### 2. Monorepo vs. Multi-Repo

**Decision**: Monorepo (Turborepo)

**Justification**:
- **Pro**: Shared code, single version, atomic changes
- **Pro**: Easier local development
- **Pro**: Better CI/CD
- **Con**: Larger repo size

**Acceptable**: FOSS projects benefit from cohesion.

### 3. Extension Isolation: VMs vs. Containers vs. In-Process

**Decision**: Docker Containers

**Justification**:
- **Pro**: Native to platform (Docker-first)
- **Pro**: Good isolation without overhead of VMs
- **Pro**: Matches user mental model
- **Con**: Requires Docker socket access (security concern)

**Mitigation**: Read-only socket, permission validation, audit logging.

### 4. State Management: Redux vs. Zustand vs. TanStack Store

**Decision**: Zustand (primary) + TanStack Query (server state)

**Justification**:
- **Pro**: Zustand is lightweight, minimal boilerplate
- **Pro**: TanStack Query handles caching, refetching automatically
- **Pro**: Clear separation: Zustand for UI state, TanStack for server state
- **Con**: Learning two libraries

**Acceptable**: Each library excels at its domain.

### 5. Reverse Proxy: Traefik vs. Caddy vs. Nginx

**Decision**: Traefik (primary), Caddy (secondary)

**Justification**:
- **Pro Traefik**: Docker-native, dynamic config, Let's Encrypt built-in
- **Pro Traefik**: Labels-based configuration (perfect for Docker)
- **Pro Caddy**: Simpler config, great for basic setups
- **Con Nginx**: Requires config reloads, less Docker-native

**Solution**: Support both, let users choose. Default to Traefik.

### 6. Extension Registry: Centralized vs. Distributed

**Decision**: Hybrid (GitHub-based with optional centralized index)

**Justification**:
- **Pro**: No single point of failure
- **Pro**: Users can install from any Git repo
- **Pro**: Official registry provides curation
- **Con**: Discovery is harder without central index

**Solution**: 
- Official registry on GitHub (curated)
- `registry.json` for fast discovery
- Support for community extensions via direct Git URLs

### 7. Authentication: Built-in vs. Optional vs. None

**Decision**: Optional (feature-flagged with NextAuth)

**Justification**:
- **Pro**: Most self-hosters run on local networks (auth not critical)
- **Pro**: Reduces initial complexity
- **Pro**: Can be enabled later for multi-user setups
- **Con**: No auth by default might concern some users

**Solution**: 
- Provide clear setup instructions for secure deployment
- Make NextAuth integration trivial (environment variable)
- Document reverse proxy auth alternatives (Authelia, etc.)

---

## 🎯 Success Metrics

### GitHub Traction
- **Stars**: Target 10,000+ in first year
- **Contributors**: 50+ active contributors
- **Forks**: 500+
- **Issues/PRs**: Active, responsive community

### Extension Ecosystem
- **Official Extensions**: 100+ in first year
- **Community Extensions**: 500+
- **Weekly Installs**: 10,000+

### Production Adoption
- **Active Installations**: 50,000+ in year 1
- **Docker Hub Pulls**: 1M+
- **Uptime**: 99.9%+

### Community Health
- **Discord Members**: 5,000+
- **Documentation Traffic**: 100K+ monthly views
- **YouTube Tutorial Views**: 500K+
- **Blog Posts** (community): 100+

---

## 📚 Technology Stack Summary

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Real-time**: WebSockets

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js Server Actions + API Routes
- **Database**: SQLite (Prisma ORM)
- **Docker**: dockerode
- **Authentication**: NextAuth (optional)
- **Validation**: Zod

### Infrastructure
- **Deployment**: Docker + Docker Compose
- **Reverse Proxy**: Traefik / Caddy
- **Monitoring**: Built-in health checks
- **Logging**: Winston / Pino
- **Testing**: Vitest + Playwright

### Development
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **CI/CD**: GitHub Actions

---

## 🤝 Contributing & Community

### Extension Development
```bash
# Create new extension using SDK
npx @orbitr/sdk create my-app

# Template structure
my-app/
├── manifest.json
├── docker-compose.yml
├── icon.svg
└── README.md

# Validate extension
npx @orbitr/sdk validate

# Publish to marketplace
npx @orbitr/sdk publish
```

### Development Setup
```bash
# Clone repository
git clone https://github.com/orbitr/orbitr
cd orbitr

# Install dependencies
pnpm install

# Start database
pnpm db:migrate

# Start development server
pnpm dev

# Access at http://localhost:3000
```

---

## 🎉 Conclusion

**Orbitr** is architected to be the **definitive self-hosting platform** that combines:

✅ **Simplicity**: One-click deployments, beautiful UI  
✅ **Power**: Full Docker control, advanced features  
✅ **Extensibility**: Open extension system, marketplace  
✅ **Production-Ready**: Security, monitoring, backups  
✅ **Community-First**: Open source, contributor-friendly

This architecture provides a solid foundation for building a **GitHub-exploding FOSS project** that serves both beginners and power users, while maintaining the flexibility to scale to enterprise use cases.

**The goal**: Make self-hosting accessible to everyone, without compromising on power or flexibility.

---

**Built with ❤️ for the self-hosting community**

