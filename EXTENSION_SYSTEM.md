# Orbitr Extension System - Complete Architecture

> **The heart of Orbitr: A secure, declarative, Docker-native extension system**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Extension Manifest Schema](#extension-manifest-schema)
3. [Extension Types](#extension-types)
4. [Installation Flow](#installation-flow)
5. [Update Mechanism](#update-mechanism)
6. [Security & Sandboxing](#security--sandboxing)
7. [Extension Development](#extension-development)
8. [Registry System](#registry-system)
9. [Example Extensions](#example-extensions)

---

## Overview

The Orbitr extension system is **declarative**, **Docker-native**, and **secure by design**. Extensions cannot execute arbitrary code in the Orbitr backend—all extension behavior is defined through a manifest file.

### Core Principles

1. **Declarative Configuration**: Extensions specify WHAT they need, not HOW to do it
2. **Docker-Native**: Extensions are Docker containers or compose stacks
3. **No Code Execution**: Extensions cannot run arbitrary JavaScript/TypeScript in Orbitr
4. **Validation-First**: All manifests are validated before installation
5. **Permission-Based**: Extensions declare required permissions
6. **Dependency-Aware**: Extensions can depend on other extensions

---

## Extension Manifest Schema

### Complete Manifest Structure

```typescript
{
  // ========================================
  // IDENTIFICATION
  // ========================================
  "id": "postgresql",                    // Unique ID (lowercase, hyphens only)
  "name": "PostgreSQL",                  // Display name
  "version": "16.1.0",                   // Semantic version
  "description": "PostgreSQL database server",
  
  // ========================================
  // AUTHOR & METADATA
  // ========================================
  "author": {
    "name": "Orbitr Team",
    "email": "extensions@orbitr.io",
    "url": "https://orbitr.io"
  },
  
  "repository": {
    "type": "git",
    "url": "https://github.com/orbitr/extensions/postgresql"
  },
  
  // ========================================
  // CLASSIFICATION
  // ========================================
  "type": "app",                         // app, tool, integration, theme
  "categories": ["database"],            // For marketplace filtering
  "tags": ["sql", "postgres", "database"],
  
  // ========================================
  // VISUAL ASSETS
  // ========================================
  "icon": "./icon.svg",                  // Relative path or URL
  "screenshots": [
    "./screenshots/1.png",
    "./screenshots/2.png"
  ],
  
  // ========================================
  // DOCKER CONFIGURATION
  // ========================================
  "docker": {
    // Option 1: Reference external compose file
    "compose": "./docker-compose.yml",
    
    // Option 2: Inline compose (for simple apps)
    "composeInline": {
      "version": "3.8",
      "services": {
        "postgres": {
          "image": "postgres:16",
          "environment": {
            "POSTGRES_USER": "${POSTGRES_USER}",
            "POSTGRES_PASSWORD": "${POSTGRES_PASSWORD}",
            "POSTGRES_DB": "${POSTGRES_DB}"
          },
          "volumes": [
            "${VOLUME_DATA}:/var/lib/postgresql/data"
          ],
          "ports": [
            "${PORT}:5432"
          ]
        }
      }
    },
    
    // Required images (for pre-pulling)
    "images": [
      "postgres:16"
    ],
    
    // Network configuration
    "networks": ["orbitr-network"],
    
    // Volume requirements
    "volumes": [
      {
        "name": "data",
        "mountPath": "/var/lib/postgresql/data",
        "type": "named"              // named or bind
      }
    ],
    
    // Port mappings
    "ports": [
      {
        "container": 5432,
        "host": 5432,                // Optional: auto-assign if omitted
        "protocol": "tcp"
      }
    ]
  },
  
  // ========================================
  // ENVIRONMENT VARIABLES
  // ========================================
  "environment": {
    "variables": [
      {
        "key": "POSTGRES_USER",
        "label": "Database User",
        "description": "PostgreSQL superuser name",
        "type": "string",
        "default": "postgres",
        "required": true,
        "validation": {
          "pattern": "^[a-z][a-z0-9_]{0,31}$"
        }
      },
      {
        "key": "POSTGRES_PASSWORD",
        "label": "Database Password",
        "description": "PostgreSQL superuser password",
        "type": "password",
        "required": true,
        "validation": {
          "min": 8
        }
      },
      {
        "key": "POSTGRES_DB",
        "label": "Default Database",
        "description": "Name of the default database to create",
        "type": "string",
        "default": "orbitr",
        "required": false
      },
      {
        "key": "PORT",
        "label": "Host Port",
        "description": "Port to expose on the host",
        "type": "number",
        "default": 5432,
        "validation": {
          "min": 1024,
          "max": 65535
        }
      },
      {
        "key": "ENABLE_SSL",
        "label": "Enable SSL",
        "type": "boolean",
        "default": false
      },
      {
        "key": "LOG_LEVEL",
        "label": "Log Level",
        "type": "select",
        "default": "info",
        "options": ["debug", "info", "warn", "error"]
      }
    ]
  },
  
  // ========================================
  // HEALTH CHECKS
  // ========================================
  "healthCheck": {
    "type": "tcp",                   // http, tcp, or docker
    "interval": 30,                  // Seconds between checks
    "timeout": 5,                    // Timeout in seconds
    "retries": 3,                    // Retries before unhealthy
    "startPeriod": 60,               // Grace period in seconds
    
    "tcp": {
      "port": 5432
    }
    
    // For HTTP checks:
    // "http": {
    //   "path": "/health",
    //   "port": 8080,
    //   "expectedStatus": 200
    // }
  },
  
  // ========================================
  // REVERSE PROXY
  // ========================================
  "proxy": {
    "enabled": false,                // Most databases don't need HTTP proxy
    "subdomain": "db",               // Optional: db.yourdomain.com
    "path": "/db",                   // Optional: yourdomain.com/db
    "port": 5432,                    // Internal port to proxy to
    
    "ssl": {
      "enabled": true,
      "forceHttps": true
    },
    
    "middleware": [
      "auth",                        // Require authentication
      "rate-limit"                   // Rate limiting
    ]
  },
  
  // ========================================
  // DEPENDENCIES
  // ========================================
  "dependencies": [
    {
      "id": "redis",
      "version": "^7.0.0"            // Semver range
    }
  ],
  
  // ========================================
  // PERMISSIONS
  // ========================================
  "permissions": [
    "docker.read",                   // Read Docker info
    "docker.write",                  // Create/modify containers
    "network.create",                // Create networks
    "volume.create"                  // Create volumes
  ],
  
  // ========================================
  // UI EXTENSIONS (Phase 2)
  // ========================================
  "ui": {
    "dashboard": {
      "widget": "./widgets/status.js",
      "size": "medium"
    },
    "settingsPage": "./pages/settings.js"
  },
  
  // ========================================
  // DOCUMENTATION
  // ========================================
  "documentation": {
    "readme": "./README.md",
    "website": "https://www.postgresql.org"
  },
  
  // ========================================
  // LICENSING
  // ========================================
  "license": "MIT",
  
  // ========================================
  // MARKETPLACE (populated by registry)
  // ========================================
  "marketplace": {
    "featured": false,
    "verified": true,
    "downloads": 12543,
    "rating": 4.8
  }
}
```

---

## Extension Types

### 1. App Extensions

**Purpose**: Full applications (databases, media servers, etc.)

**Characteristics**:
- Long-running processes
- Data persistence
- Often need reverse proxy
- Health monitoring

**Examples**: PostgreSQL, Plex, Nextcloud

### 2. Tool Extensions

**Purpose**: Utility tools (backup, monitoring, etc.)

**Characteristics**:
- May run on schedule
- Shorter-lived containers
- Configuration-focused

**Examples**: Database backup tool, Log analyzer

### 3. Integration Extensions

**Purpose**: Connect Orbitr to external services

**Characteristics**:
- Webhook handlers
- API integrations
- Event processors

**Examples**: Discord notifications, GitHub integration

### 4. Theme Extensions (Future)

**Purpose**: Customize Orbitr UI

**Characteristics**:
- CSS/Theme files
- No Docker containers
- Pure frontend modification

---

## Installation Flow

### Phase 1: Validation

```typescript
async function validateExtension(extensionId: string) {
  // 1. Fetch extension from registry or Git
  const extension = await fetchExtension(extensionId)
  
  // 2. Parse and validate manifest
  const manifest = ExtensionManifestSchema.parse(extension.manifest)
  
  // 3. Security validation
  const securityCheck = await validateSecurity(manifest)
  if (!securityCheck.safe) {
    throw new SecurityError(securityCheck.errors)
  }
  
  // 4. Check dependencies
  for (const dep of manifest.dependencies || []) {
    const installed = await db.extension.findFirst({
      where: { extensionId: dep.id }
    })
    if (!installed) {
      throw new DependencyError(`Missing dependency: ${dep.id}`)
    }
    if (!semver.satisfies(installed.version, dep.version)) {
      throw new DependencyError(`Incompatible version: ${dep.id}`)
    }
  }
  
  // 5. Check permissions
  await checkPermissions(manifest.permissions)
  
  return manifest
}
```

### Phase 2: User Configuration

```typescript
async function promptUserConfiguration(manifest: ExtensionManifest) {
  const config = {}
  
  for (const envVar of manifest.environment?.variables || []) {
    // Generate form field based on type
    const value = await promptField({
      key: envVar.key,
      label: envVar.label,
      type: envVar.type,
      default: envVar.default,
      required: envVar.required,
      validation: envVar.validation,
      options: envVar.options,
    })
    
    // Validate user input
    if (envVar.validation) {
      validateInput(value, envVar.validation)
    }
    
    config[envVar.key] = value
  }
  
  return config
}
```

### Phase 3: Docker Setup

```typescript
async function prepareDockerEnvironment(manifest: ExtensionManifest, config: Record<string, any>) {
  const installId = generateInstallId(manifest.id)
  
  // 1. Create installation directory
  const installPath = path.join(EXTENSION_DIR, installId)
  await fs.mkdir(installPath, { recursive: true })
  
  // 2. Copy extension files
  await copyExtensionFiles(manifest, installPath)
  
  // 3. Generate .env file
  const envContent = generateEnvFile(config)
  await fs.writeFile(path.join(installPath, '.env'), envContent)
  
  // 4. Parse Docker Compose
  const composeTemplate = manifest.docker.compose
    ? await loadComposeFile(path.join(installPath, manifest.docker.compose))
    : manifest.docker.composeInline
  
  // 5. Substitute variables
  const finalCompose = substituteVariables(composeTemplate, {
    ...config,
    VOLUME_DATA: `${installId}-data`,
    NETWORK: 'orbitr-network',
  })
  
  // 6. Write final compose file
  await fs.writeFile(
    path.join(installPath, 'docker-compose.yml'),
    yaml.dump(finalCompose)
  )
  
  return { installId, installPath, compose: finalCompose }
}
```

### Phase 4: Installation

```typescript
async function installExtension(manifest: ExtensionManifest, config: Record<string, any>) {
  const { installId, installPath, compose } = await prepareDockerEnvironment(manifest, config)
  
  try {
    // 1. Pull images
    for (const image of manifest.docker.images) {
      await dockerManager.pullImage(image, (progress) => {
        eventBus.emit('extension.install.progress', {
          installId,
          phase: 'pulling',
          image,
          progress,
        })
      })
    }
    
    // 2. Create networks
    for (const network of manifest.docker.networks) {
      await dockerManager.ensureNetwork(network)
    }
    
    // 3. Create volumes
    for (const volume of manifest.docker.volumes) {
      await dockerManager.createVolume(`${installId}-${volume.name}`)
    }
    
    // 4. Deploy containers
    const containers = await dockerManager.composeUp(installPath)
    
    // 5. Configure reverse proxy (if needed)
    if (manifest.proxy?.enabled) {
      await proxyManager.registerApp(installId, {
        name: manifest.name,
        subdomain: manifest.proxy.subdomain,
        port: manifest.proxy.port,
        ssl: manifest.proxy.ssl,
      })
    }
    
    // 6. Set up health checks
    if (manifest.healthCheck) {
      await healthMonitor.registerHealthCheck(
        containers[0].id,
        manifest.healthCheck
      )
      await healthMonitor.startMonitoring(containers[0].id)
    }
    
    // 7. Create database record
    await db.extension.create({
      data: {
        id: installId,
        extensionId: manifest.id,
        name: manifest.name,
        version: manifest.version,
        manifest: manifest as any,
        config: config as any,
        installPath,
        status: 'running',
        source: 'registry',
        installedAt: new Date(),
      }
    })
    
    // 8. Emit success event
    eventBus.emit('extension.installed', {
      id: installId,
      name: manifest.name,
    })
    
    return { installId, containers }
    
  } catch (error) {
    // Rollback on failure
    await rollbackInstallation(installId)
    throw error
  }
}
```

---

## Update Mechanism

### Version Checking

```typescript
async function checkForUpdates(extensionId: string) {
  const installed = await db.extension.findFirst({
    where: { id: extensionId }
  })
  
  const latest = await fetchLatestVersion(installed.extensionId)
  
  if (semver.gt(latest.version, installed.version)) {
    return {
      updateAvailable: true,
      currentVersion: installed.version,
      latestVersion: latest.version,
      changelog: latest.changelog,
    }
  }
  
  return { updateAvailable: false }
}
```

### Update Process

```typescript
async function updateExtension(extensionId: string) {
  const installed = await db.extension.findUnique({ where: { id: extensionId } })
  const latest = await fetchLatestVersion(installed.extensionId)
  
  // 1. Version compatibility check
  if (!isCompatibleUpdate(installed.version, latest.version)) {
    throw new Error('Breaking changes detected. Manual migration required.')
  }
  
  // 2. Create backup
  const backupId = await backupExtension(extensionId)
  
  try {
    // 3. Stop containers
    await stopExtension(extensionId)
    
    // 4. Update files
    await updateExtensionFiles(installed.installPath, latest)
    
    // 5. Run migration (if needed)
    if (latest.migration) {
      await runMigrationScript(latest.migration)
    }
    
    // 6. Update configuration (with new defaults)
    const updatedConfig = mergeConfiguration(
      installed.config,
      latest.manifest.environment
    )
    
    // 7. Restart with new version
    await startExtension(extensionId)
    
    // 8. Update database
    await db.extension.update({
      where: { id: extensionId },
      data: {
        version: latest.version,
        manifest: latest.manifest,
        config: updatedConfig,
        updatedAt: new Date(),
      }
    })
    
    // 9. Clean up backup
    await deleteBackup(backupId)
    
    eventBus.emit('extension.updated', {
      id: extensionId,
      from: installed.version,
      to: latest.version,
    })
    
  } catch (error) {
    // Rollback to backup
    await restoreBackup(backupId)
    throw error
  }
}
```

---

## Security & Sandboxing

### 1. No Code Execution

Extensions **cannot** execute arbitrary JavaScript/TypeScript in Orbitr backend.

**Allowed**:
- Declarative Docker Compose configuration
- Environment variable schemas
- Health check definitions
- Proxy configuration

**Not Allowed**:
- Custom JavaScript modules
- Shell scripts executed by Orbitr
- Dynamic code evaluation
- Direct file system access

### 2. Manifest Validation

```typescript
async function validateSecurityRequirements(manifest: ExtensionManifest) {
  const issues = []
  
  // Check for dangerous Docker flags
  const dangerousFlags = [
    '--privileged',
    'privileged: true',
    '--cap-add=ALL',
    'network_mode: host',
    'ipc: host',
    'pid: host',
  ]
  
  const composeString = JSON.stringify(manifest.docker)
  for (const flag of dangerousFlags) {
    if (composeString.includes(flag)) {
      issues.push({
        severity: 'critical',
        message: `Dangerous flag detected: ${flag}`,
      })
    }
  }
  
  // Check for host volume mounts outside allowed paths
  const allowedPaths = ['/var/lib/orbitr', '/opt/orbitr']
  // Validate volume mounts...
  
  // Check for exposed Docker socket
  if (composeString.includes('/var/run/docker.sock')) {
    issues.push({
      severity: 'critical',
      message: 'Extensions cannot access Docker socket',
    })
  }
  
  return {
    safe: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  }
}
```

### 3. Permission System

```typescript
const AVAILABLE_PERMISSIONS = [
  'docker.read',          // Read container info
  'docker.write',         // Create/modify containers
  'network.create',       // Create Docker networks
  'network.modify',       // Modify networks
  'volume.create',        // Create volumes
  'volume.modify',        // Modify volumes
  'proxy.configure',      // Configure reverse proxy
  'system.read',          // Read system info
  'system.configure',     // Modify system settings
] as const

async function validatePermissions(requested: string[]) {
  for (const permission of requested) {
    if (!AVAILABLE_PERMISSIONS.includes(permission)) {
      throw new Error(`Unknown permission: ${permission}`)
    }
  }
  
  // Log permission grants for audit
  await auditLog({
    action: 'permission.grant',
    permissions: requested,
  })
}
```

### 4. Network Isolation

```typescript
// All extensions run in isolated networks by default
async function createExtensionNetwork(installId: string) {
  const networkName = `${installId}-network`
  
  await dockerManager.createNetwork({
    name: networkName,
    driver: 'bridge',
    internal: false,        // Allow internet access
    attachable: true,
    labels: {
      'orbitr.managed': 'true',
      'orbitr.extension': installId,
    },
  })
  
  // Connect to orbitr-network for inter-extension communication
  // (only if explicitly requested in manifest)
  if (manifest.docker.networks.includes('orbitr-network')) {
    // Connect extension containers to shared network
  }
}
```

---

## Extension Development

### Creating a New Extension

```bash
# Using the SDK
npx @orbitr/sdk create my-app

# Choose template
? Extension type: app
? Extension name: My App
? Description: My awesome app
? Categories: productivity, tools

# Generated structure:
my-app/
├── manifest.json
├── docker-compose.yml
├── icon.svg
├── README.md
└── screenshots/
```

### Development Workflow

```bash
# 1. Develop locally
cd my-app
docker-compose up

# 2. Validate extension
npx @orbitr/sdk validate

# 3. Test installation
npx @orbitr/sdk test --local

# 4. Publish to registry
npx @orbitr/sdk publish
```

### Publishing to Registry

```bash
# Create GitHub repository
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:username/my-app.git
git push -u origin main

# Submit to Orbitr registry
npx @orbitr/sdk submit --repo username/my-app
```

---

## Registry System

### GitHub-Based Registry

```
orbitr-registry/
├── extensions/
│   ├── postgresql/
│   │   └── manifest.json           # Manifest only (no code)
│   ├── nextcloud/
│   │   └── manifest.json
│   └── ...
├── registry.json                   # Master index
└── README.md
```

### registry.json

```json
{
  "version": "1.0.0",
  "updated": "2026-02-11T00:00:00Z",
  "extensions": [
    {
      "id": "postgresql",
      "name": "PostgreSQL",
      "version": "16.1.0",
      "author": {
        "name": "Orbitr Team"
      },
      "type": "app",
      "categories": ["database"],
      "verified": true,
      "featured": true,
      "downloads": 12543,
      "rating": 4.8,
      "manifestUrl": "https://raw.githubusercontent.com/orbitr/registry/main/extensions/postgresql/manifest.json",
      "repositoryUrl": "https://github.com/orbitr/extensions/postgresql"
    }
  ]
}
```

### Fetching Extensions

```typescript
async function fetchRegistry() {
  const response = await fetch('https://registry.orbitr.io/registry.json')
  const registry = await response.json()
  
  // Cache locally
  await cacheRegistry(registry)
  
  // Update database
  for (const ext of registry.extensions) {
    await db.extensionRegistry.upsert({
      where: { extensionId: ext.id },
      update: ext,
      create: ext,
    })
  }
  
  return registry
}
```

---

## Example Extensions

### PostgreSQL

See manifest example above in "Complete Manifest Structure".

### Plex Media Server

```json
{
  "id": "plex",
  "name": "Plex Media Server",
  "version": "1.40.0",
  "type": "app",
  "categories": ["media"],
  
  "docker": {
    "images": ["plexinc/pms-docker:latest"],
    "compose": "./docker-compose.yml",
    "ports": [
      { "container": 32400, "host": 32400 }
    ],
    "volumes": [
      { "name": "config", "mountPath": "/config", "type": "named" },
      { "name": "media", "mountPath": "/media", "type": "bind" }
    ]
  },
  
  "environment": {
    "variables": [
      {
        "key": "TZ",
        "label": "Timezone",
        "type": "string",
        "default": "America/New_York"
      },
      {
        "key": "PLEX_CLAIM",
        "label": "Plex Claim Token",
        "type": "password",
        "required": true
      },
      {
        "key": "MEDIA_PATH",
        "label": "Media Directory",
        "type": "string",
        "required": true
      }
    ]
  },
  
  "healthCheck": {
    "type": "http",
    "http": {
      "path": "/web/index.html",
      "port": 32400,
      "expectedStatus": 200
    },
    "interval": 30
  },
  
  "proxy": {
    "enabled": true,
    "subdomain": "plex",
    "port": 32400,
    "ssl": {
      "enabled": true
    }
  }
}
```

---

## Future Enhancements

### Phase 2: UI Extensions

```json
{
  "ui": {
    "dashboard": {
      "widget": "./widgets/status.js",
      "size": "medium"
    },
    "settingsPage": "./pages/settings.js"
  }
}
```

**Implementation**:
- Sandboxed iframe
- Limited postMessage API
- No direct DOM access
- CSP restrictions

### Phase 3: Extension Marketplace Website

- Web-based marketplace
- User reviews & ratings
- Extension certification program
- Developer analytics
- Extension revenue sharing (optional)

---

**This extension system enables a thriving ecosystem while maintaining security and simplicity.**
