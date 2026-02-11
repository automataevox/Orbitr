# Orbitr - Complete Repository Structure

This document provides a detailed breakdown of the Orbitr monorepo structure with file-by-file descriptions.

---

## 📁 Directory Tree

```
orbitr/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                      # Continuous integration
│   │   ├── release.yml                 # Automated releases
│   │   ├── docker-publish.yml          # Docker Hub publishing
│   │   └── extension-validate.yml      # Validate PRs to extensions/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── extension_submission.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   ├── CONTRIBUTING.md
│   └── FUNDING.yml
│
├── apps/
│   └── web/                            # Main Next.js application
│       ├── app/
│       │   ├── (auth)/                 # Auth group routes
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   ├── register/
│       │   │   │   └── page.tsx
│       │   │   └── layout.tsx          # Auth layout wrapper
│       │   ├── (dashboard)/            # Dashboard group routes
│       │   │   ├── layout.tsx          # Main dashboard layout (sidebar + topbar)
│       │   │   ├── page.tsx            # Overview / Home
│       │   │   ├── apps/
│       │   │   │   ├── page.tsx        # Apps list view
│       │   │   │   ├── [id]/
│       │   │   │   │   ├── page.tsx    # App detail view
│       │   │   │   │   ├── logs/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── settings/
│       │   │   │   │       └── page.tsx
│       │   │   │   └── loading.tsx
│       │   │   ├── marketplace/
│       │   │   │   ├── page.tsx        # Extension browser
│       │   │   │   ├── [id]/
│       │   │   │   │   └── page.tsx    # Extension detail & install
│       │   │   │   └── categories/
│       │   │   │       └── [slug]/
│       │   │   │           └── page.tsx
│       │   │   ├── monitoring/
│       │   │   │   ├── page.tsx        # Health dashboard
│       │   │   │   └── [containerId]/
│       │   │   │       └── page.tsx    # Container-specific monitoring
│       │   │   ├── proxy/
│       │   │   │   ├── page.tsx        # Reverse proxy management
│       │   │   │   └── routes/
│       │   │   │       └── page.tsx    # Route configuration
│       │   │   ├── extensions/
│       │   │   │   ├── page.tsx        # Installed extensions
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx    # Extension detail
│       │   │   │       └── settings/
│       │   │   │           └── page.tsx
│       │   │   ├── settings/
│       │   │   │   ├── page.tsx        # General settings
│       │   │   │   ├── docker/
│       │   │   │   │   └── page.tsx    # Docker configuration
│       │   │   │   ├── proxy/
│       │   │   │   │   └── page.tsx    # Proxy settings
│       │   │   │   ├── notifications/
│       │   │   │   │   └── page.tsx    # Webhook settings
│       │   │   │   ├── backup/
│       │   │   │   │   └── page.tsx    # Backup & restore
│       │   │   │   └── advanced/
│       │   │   │       └── page.tsx    # Advanced settings
│       │   │   └── dev/
│       │   │       ├── page.tsx        # Advanced mode (Docker Compose editor)
│       │   │       ├── containers/
│       │   │       │   └── page.tsx    # Raw container management
│       │   │       ├── networks/
│       │   │       │   └── page.tsx    # Network management
│       │   │       └── volumes/
│       │   │           └── page.tsx    # Volume management
│       │   ├── api/                    # API Route Handlers
│       │   │   ├── auth/
│       │   │   │   └── [...nextauth]/
│       │   │   │       └── route.ts    # NextAuth config
│       │   │   ├── containers/
│       │   │   │   ├── route.ts        # GET, POST /api/containers
│       │   │   │   └── [id]/
│       │   │   │       ├── route.ts    # GET, DELETE /api/containers/:id
│       │   │   │       ├── start/
│       │   │   │       │   └── route.ts
│       │   │   │       ├── stop/
│       │   │   │       │   └── route.ts
│       │   │   │       ├── restart/
│       │   │   │       │   └── route.ts
│       │   │   │       ├── logs/
│       │   │   │       │   └── route.ts # Stream logs
│       │   │   │       └── stats/
│       │   │   │           └── route.ts
│       │   │   ├── extensions/
│       │   │   │   ├── route.ts        # GET /api/extensions
│       │   │   │   ├── install/
│       │   │   │   │   └── route.ts    # POST install extension
│       │   │   │   ├── registry/
│       │   │   │   │   └── route.ts    # GET marketplace registry
│       │   │   │   └── [id]/
│       │   │   │       ├── route.ts    # GET, PUT, DELETE extension
│       │   │   │       ├── update/
│       │   │   │       │   └── route.ts
│       │   │   │       └── uninstall/
│       │   │   │           └── route.ts
│       │   │   ├── health/
│       │   │   │   ├── route.ts        # GET system health
│       │   │   │   └── [containerId]/
│       │   │   │       └── route.ts    # GET container health
│       │   │   ├── logs/
│       │   │   │   └── [containerId]/
│       │   │   │       └── route.ts    # GET logs with pagination
│       │   │   ├── proxy/
│       │   │   │   ├── route.ts        # GET proxy config
│       │   │   │   ├── generate/
│       │   │   │   │   └── route.ts    # POST generate config
│       │   │   │   ├── reload/
│       │   │   │   │   └── route.ts    # POST reload proxy
│       │   │   │   └── routes/
│       │   │   │       └── route.ts    # GET, POST, PUT, DELETE routes
│       │   │   ├── system/
│       │   │   │   ├── info/
│       │   │   │   │   └── route.ts    # GET system info
│       │   │   │   ├── backup/
│       │   │   │   │   └── route.ts    # POST create backup
│       │   │   │   └── restore/
│       │   │   │       └── route.ts    # POST restore backup
│       │   │   ├── events/
│       │   │   │   └── route.ts        # WebSocket/SSE endpoint
│       │   │   └── webhooks/
│       │   │       └── [service]/
│       │   │           └── route.ts    # Webhook handlers
│       │   ├── actions/                # Server Actions
│       │   │   ├── docker.actions.ts   # Container actions
│       │   │   ├── extension.actions.ts # Extension actions
│       │   │   ├── proxy.actions.ts    # Proxy actions
│       │   │   ├── health.actions.ts   # Health check actions
│       │   │   └── system.actions.ts   # System actions
│       │   ├── layout.tsx              # Root layout
│       │   ├── loading.tsx             # Root loading state
│       │   ├── error.tsx               # Root error boundary
│       │   ├── not-found.tsx           # 404 page
│       │   └── globals.css             # Global styles
│       ├── components/
│       │   ├── ui/                     # shadcn/ui components
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── form.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── table.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── alert.tsx
│       │   │   ├── toast.tsx
│       │   │   ├── command.tsx         # Command palette
│       │   │   ├── sheet.tsx
│       │   │   ├── accordion.tsx
│       │   │   └── ...                 # Other shadcn components
│       │   ├── layout/
│       │   │   ├── sidebar.tsx         # Main sidebar navigation
│       │   │   ├── topbar.tsx          # Top navigation bar
│       │   │   ├── page-header.tsx     # Page title & actions
│       │   │   └── footer.tsx          # Optional footer
│       │   ├── dashboard/
│       │   │   ├── overview-stats.tsx  # System stats cards
│       │   │   ├── app-grid.tsx        # Running apps grid
│       │   │   ├── app-card.tsx        # Individual app card
│       │   │   ├── activity-feed.tsx   # Recent activity
│       │   │   └── quick-actions.tsx   # Quick action buttons
│       │   ├── apps/
│       │   │   ├── app-list.tsx        # App list view
│       │   │   ├── app-detail.tsx      # App detail view
│       │   │   ├── install-dialog.tsx  # App installation dialog
│       │   │   ├── config-form.tsx     # App configuration form
│       │   │   ├── logs-viewer.tsx     # Log viewer component
│       │   │   └── stats-chart.tsx     # Resource usage charts
│       │   ├── marketplace/
│       │   │   ├── extension-browser.tsx
│       │   │   ├── extension-card.tsx
│       │   │   ├── extension-detail.tsx
│       │   │   ├── category-filter.tsx
│       │   │   ├── search-bar.tsx
│       │   │   └── install-wizard.tsx
│       │   ├── monitoring/
│       │   │   ├── health-dashboard.tsx
│       │   │   ├── health-status.tsx
│       │   │   ├── container-monitor.tsx
│       │   │   ├── metrics-chart.tsx
│       │   │   └── alert-list.tsx
│       │   ├── proxy/
│       │   │   ├── route-list.tsx
│       │   │   ├── route-form.tsx
│       │   │   ├── ssl-settings.tsx
│       │   │   └── proxy-status.tsx
│       │   ├── settings/
│       │   │   ├── settings-form.tsx
│       │   │   ├── docker-config.tsx
│       │   │   ├── notification-settings.tsx
│       │   │   └── backup-manager.tsx
│       │   ├── dev/
│       │   │   ├── compose-editor.tsx   # Docker Compose editor
│       │   │   ├── container-inspector.tsx
│       │   │   ├── network-manager.tsx
│       │   │   ├── volume-manager.tsx
│       │   │   └── terminal.tsx         # Container terminal
│       │   └── shared/
│       │       ├── system-status.tsx    # Global system status
│       │       ├── notification-bell.tsx
│       │       ├── user-menu.tsx
│       │       ├── command-palette.tsx  # Cmd+K interface
│       │       ├── theme-toggle.tsx
│       │       ├── loading-spinner.tsx
│       │       ├── empty-state.tsx
│       │       └── error-boundary.tsx
│       ├── lib/
│       │   ├── api.ts                   # API client wrapper
│       │   ├── utils.ts                 # Utility functions
│       │   ├── validations.ts           # Zod schemas
│       │   ├── constants.ts             # App constants
│       │   ├── websocket.ts             # WebSocket client
│       │   ├── auth.ts                  # NextAuth config
│       │   └── hooks/
│       │       ├── use-containers.ts    # Container data hook
│       │       ├── use-extensions.ts    # Extension data hook
│       │       ├── use-health.ts        # Health data hook
│       │       ├── use-websocket.ts     # WebSocket hook
│       │       └── use-command-palette.ts
│       ├── stores/
│       │   ├── platform-store.ts        # Main platform state
│       │   ├── ui-store.ts              # UI state (sidebar, modals)
│       │   └── realtime-store.ts        # Real-time event state
│       ├── styles/
│       │   └── globals.css              # Tailwind + custom styles
│       ├── public/
│       │   ├── logo.svg
│       │   ├── favicon.ico
│       │   └── images/
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── postcss.config.js
│       ├── components.json              # shadcn config
│       └── package.json
│
├── packages/
│   ├── core/                           # Core engine (backend logic)
│   │   ├── src/
│   │   │   ├── docker/
│   │   │   │   ├── manager.ts          # Main Docker manager
│   │   │   │   ├── compose-parser.ts   # Parse docker-compose files
│   │   │   │   ├── compose-generator.ts # Generate compose from manifest
│   │   │   │   ├── image.ts            # Image operations
│   │   │   │   ├── network.ts          # Network operations
│   │   │   │   ├── volume.ts           # Volume operations
│   │   │   │   ├── events.ts           # Docker event streaming
│   │   │   │   └── types.ts
│   │   │   ├── extensions/
│   │   │   │   ├── loader.ts           # Extension loader
│   │   │   │   ├── installer.ts        # Installation logic
│   │   │   │   ├── updater.ts          # Update logic
│   │   │   │   ├── validator.ts        # Manifest validation
│   │   │   │   ├── schema.ts           # Zod schemas
│   │   │   │   ├── registry.ts         # Registry client
│   │   │   │   ├── store.ts            # Extension storage
│   │   │   │   └── types.ts
│   │   │   ├── health/
│   │   │   │   ├── monitor.ts          # Health monitor
│   │   │   │   ├── checks.ts           # Health check implementations
│   │   │   │   ├── http-check.ts
│   │   │   │   ├── tcp-check.ts
│   │   │   │   ├── docker-check.ts
│   │   │   │   └── types.ts
│   │   │   ├── proxy/
│   │   │   │   ├── manager.ts          # Proxy manager
│   │   │   │   ├── traefik.ts          # Traefik config generator
│   │   │   │   ├── caddy.ts            # Caddy config generator
│   │   │   │   ├── deployer.ts         # Deploy proxy container
│   │   │   │   └── types.ts
│   │   │   ├── events/
│   │   │   │   ├── bus.ts              # Event bus
│   │   │   │   ├── emitter.ts          # Event emitter
│   │   │   │   └── types.ts
│   │   │   ├── security/
│   │   │   │   ├── manager.ts          # Security manager
│   │   │   │   ├── encryption.ts       # Env var encryption
│   │   │   │   ├── validator.ts        # Security validation
│   │   │   │   ├── audit.ts            # Audit logging
│   │   │   │   └── types.ts
│   │   │   ├── backup/
│   │   │   │   ├── manager.ts          # Backup/restore manager
│   │   │   │   ├── backup.ts
│   │   │   │   └── restore.ts
│   │   │   ├── system/
│   │   │   │   ├── info.ts             # System information
│   │   │   │   ├── resources.ts        # Resource monitoring
│   │   │   │   └── types.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts           # Logging utility
│   │   │   │   ├── fs.ts               # File system utilities
│   │   │   │   ├── network.ts          # Network utilities
│   │   │   │   └── validation.ts
│   │   │   └── index.ts                # Public API exports
│   │   ├── tests/
│   │   │   ├── docker/
│   │   │   ├── extensions/
│   │   │   ├── health/
│   │   │   └── proxy/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── database/                       # Prisma database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Database schema
│   │   │   ├── migrations/             # Auto-generated migrations
│   │   │   │   └── ...
│   │   │   └── seed.ts                 # Database seed script
│   │   ├── src/
│   │   │   ├── client.ts               # Prisma client singleton
│   │   │   ├── queries/                # Reusable queries
│   │   │   │   ├── containers.ts
│   │   │   │   ├── extensions.ts
│   │   │   │   ├── health.ts
│   │   │   │   └── system.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── sdk/                            # Extension SDK
│   │   ├── src/
│   │   │   ├── manifest/
│   │   │   │   ├── builder.ts          # Manifest builder API
│   │   │   │   ├── validator.ts        # Manifest validation
│   │   │   │   └── types.ts
│   │   │   ├── cli/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create.ts       # Create new extension
│   │   │   │   │   ├── validate.ts     # Validate extension
│   │   │   │   │   ├── publish.ts      # Publish to registry
│   │   │   │   │   └── test.ts         # Test extension locally
│   │   │   │   ├── index.ts
│   │   │   │   └── utils.ts
│   │   │   ├── testing/
│   │   │   │   ├── test-runner.ts      # Extension test runner
│   │   │   │   └── mocks.ts
│   │   │   └── index.ts
│   │   ├── templates/                  # Extension templates
│   │   │   ├── app/
│   │   │   │   ├── manifest.json
│   │   │   │   ├── docker-compose.yml
│   │   │   │   └── README.md
│   │   │   ├── tool/
│   │   │   │   └── ...
│   │   │   └── integration/
│   │   │       └── ...
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── cli/                            # Orbitr CLI
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── install.ts          # Install Orbitr
│   │   │   │   ├── start.ts            # Start platform
│   │   │   │   ├── stop.ts             # Stop platform
│   │   │   │   ├── update.ts           # Update platform
│   │   │   │   ├── backup.ts           # Create backup
│   │   │   │   ├── restore.ts          # Restore backup
│   │   │   │   ├── ext/
│   │   │   │   │   ├── install.ts      # Install extension
│   │   │   │   │   ├── list.ts         # List extensions
│   │   │   │   │   ├── update.ts       # Update extension
│   │   │   │   │   └── remove.ts       # Remove extension
│   │   │   │   └── logs.ts             # View logs
│   │   │   ├── api/
│   │   │   │   └── client.ts           # API client
│   │   │   ├── utils/
│   │   │   │   ├── config.ts
│   │   │   │   └── output.ts
│   │   │   └── index.ts
│   │   ├── bin/
│   │   │   └── orbitr.js               # CLI entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── types/                          # Shared TypeScript types
│       ├── src/
│       │   ├── container.ts
│       │   ├── extension.ts
│       │   ├── health.ts
│       │   ├── proxy.ts
│       │   ├── system.ts
│       │   ├── events.ts
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
│   │   │       ├── 1.png
│   │   │       └── 2.png
│   │   ├── nextcloud/
│   │   │   └── ...
│   │   ├── plex/
│   │   │   └── ...
│   │   ├── jellyfin/
│   │   │   └── ...
│   │   ├── vaultwarden/
│   │   │   └── ...
│   │   ├── home-assistant/
│   │   │   └── ...
│   │   ├── adguard/
│   │   │   └── ...
│   │   ├── nginx-proxy-manager/
│   │   │   └── ...
│   │   ├── portainer/
│   │   │   └── ...
│   │   ├── uptime-kuma/
│   │   │   └── ...
│   │   └── ...
│   ├── registry.json                   # Master registry index
│   └── README.md
│
├── docs/                               # Documentation
│   ├── getting-started.md
│   ├── installation.md
│   ├── configuration.md
│   ├── architecture.md
│   ├── extension-development/
│   │   ├── overview.md
│   │   ├── manifest.md
│   │   ├── docker-compose.md
│   │   ├── environment-variables.md
│   │   ├── health-checks.md
│   │   ├── reverse-proxy.md
│   │   └── publishing.md
│   ├── api-reference/
│   │   ├── containers.md
│   │   ├── extensions.md
│   │   ├── health.md
│   │   └── system.md
│   ├── deployment/
│   │   ├── docker.md
│   │   ├── docker-compose.md
│   │   ├── reverse-proxy.md
│   │   └── security.md
│   ├── guides/
│   │   ├── first-app.md
│   │   ├── custom-domains.md
│   │   ├── ssl-setup.md
│   │   ├── backups.md
│   │   └── monitoring.md
│   ├── troubleshooting.md
│   └── contributing.md
│
├── scripts/
│   ├── dev.sh                          # Start development environment
│   ├── build.sh                        # Build all packages
│   ├── test.sh                         # Run tests
│   ├── install.sh                      # Quick install script
│   ├── db-migrate.sh                   # Database migrations
│   └── release.sh                      # Release automation
│
├── .github/
├── .husky/                             # Git hooks
│   ├── pre-commit
│   └── commit-msg
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── .dockerignore
├── .nvmrc
├── docker-compose.yml                  # Production deployment
├── docker-compose.dev.yml              # Development
├── Dockerfile
├── .env.example
├── turbo.json                          # Turborepo config
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json                       # Root tsconfig
├── README.md
├── LICENSE
├── ARCHITECTURE.md
├── CHANGELOG.md
└── SECURITY.md
```

---

## 📄 Key File Descriptions

### Root Configuration Files

#### `turbo.json`
```json
{
  "$schema": "https://turborepo.org/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {}
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `package.json` (Root)
```json
{
  "name": "orbitr",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "pnpm --filter database prisma migrate dev",
    "db:studio": "pnpm --filter database prisma studio",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "turbo": "^1.11.0",
    "typescript": "^5.3.3"
  }
}
```

---

### Next.js Application (`apps/web/`)

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['raw.githubusercontent.com'], // For extension icons
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
```

#### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // shadcn/ui color tokens
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

#### `components.json` (shadcn config)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

### Core Package (`packages/core/`)

#### `package.json`
```json
{
  "name": "@orbitr/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "dockerode": "^4.0.0",
    "zod": "^3.22.4",
    "@orbitr/types": "workspace:*",
    "@orbitr/database": "workspace:*"
  },
  "devDependencies": {
    "@types/dockerode": "^3.3.23",
    "vitest": "^1.0.4",
    "typescript": "^5.3.3"
  }
}
```

---

### Database Package (`packages/database/`)

#### `package.json`
```json
{
  "name": "@orbitr/database",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1"
  },
  "devDependencies": {
    "prisma": "^5.7.1",
    "typescript": "^5.3.3"
  }
}
```

---

### Extension SDK (`packages/sdk/`)

#### `package.json`
```json
{
  "name": "@orbitr/sdk",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "orbitr-sdk": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.4",
    "commander": "^11.1.0",
    "inquirer": "^9.2.12",
    "@orbitr/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

---

### CLI Package (`packages/cli/`)

#### `package.json`
```json
{
  "name": "orbitr-cli",
  "version": "0.1.0",
  "bin": {
    "orbitr": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "commander": "^11.1.0",
    "axios": "^1.6.2",
    "ora": "^7.0.1",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

---

## 🔧 Development Workflow

### Initial Setup
```bash
# Clone repository
git clone https://github.com/orbitr/orbitr.git
cd orbitr

# Install dependencies
pnpm install

# Set up database
cp .env.example .env
pnpm db:migrate

# Start development
pnpm dev
```

### Working with Packages
```bash
# Build specific package
pnpm --filter @orbitr/core build

# Run tests
pnpm --filter @orbitr/core test

# Add dependency to package
pnpm --filter @orbitr/core add zod
```

### Adding New Extension
```bash
# Using SDK
cd extensions/registry
npx @orbitr/sdk create my-extension

# Manual creation
mkdir -p extensions/registry/my-extension
cd extensions/registry/my-extension
# Create manifest.json, docker-compose.yml, etc.
```

---

## 📦 Build Artifacts

### Production Build
```
dist/
├── apps/
│   └── web/
│       ├── .next/
│       │   └── standalone/        # Self-contained Next.js app
│       └── public/
├── packages/
│   ├── core/
│   │   └── dist/                  # Compiled TypeScript
│   ├── database/
│   │   ├── dist/
│   │   └── node_modules/.prisma/  # Generated Prisma client
│   └── ...
```

### Docker Image Structure
```
/app/
├── .next/standalone/              # Next.js standalone output
├── public/                        # Static assets
├── prisma/                        # Prisma schema & migrations
├── data/                          # SQLite database (volume)
├── extensions/                    # Installed extensions (volume)
└── node_modules/
```

---

## 🎯 Package Dependencies

```
@orbitr/web
  ├── @orbitr/core
  │   ├── @orbitr/types
  │   └── @orbitr/database
  │       └── @prisma/client
  ├── @orbitr/types
  └── @orbitr/database

@orbitr/sdk
  └── @orbitr/types

@orbitr/cli
  └── (no internal dependencies)
```

---

This structure supports:
- ✅ Monorepo development with Turborepo
- ✅ Shared types across packages
- ✅ Independent package versioning
- ✅ Clean separation of concerns
- ✅ Easy testing and CI/CD
- ✅ Scalable extension ecosystem
