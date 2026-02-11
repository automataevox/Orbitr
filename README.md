# Orbitr

<div align="center">

<img src="./docs/assets/logo.svg" alt="Orbitr Logo" width="200"/>

**A Docker-native self-hosting orchestration platform**

> ⚠️ **Status**: Active Development | Production-ready Docker deployment available | Core features working | Extensions system in progress

[![GitHub Stars](https://img.shields.io/github/stars/orbitr/orbitr?style=for-the-badge)](https://github.com/orbitr/orbitr/stargazers)
[![License](https://img.shields.io/github/license/orbitr/orbitr?style=for-the-badge)](./LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/orbitr/orbitr?style=for-the-badge)](https://hub.docker.com/r/orbitr/orbitr)
[![Discord](https://img.shields.io/discord/0000000000?style=for-the-badge)](https://discord.gg/orbitr)

[**Quick Start**](#-quick-start) • [**Production Setup**](./PRODUCTION.md) • [**Documentation**](#-documentation) • [**Roadmap**](#-roadmap)

</div>

---

## 🚀 What is Orbitr?

Orbitr is a **production-ready self-hosting platform** that makes running Docker applications as easy as installing apps on your phone. It combines the simplicity of one-click deployments with the power of full Docker control.

### Why Orbitr?

- **🎯 Extension-First**: Apps, tools, and integrations are all extensions with a unified installation flow
- **🔄 Progressive Disclosure**: Simple by default, powerful when you need it
- **🐳 Docker-Native**: Direct Docker API integration—no abstractions, no vendor lock-in
- **🛡️ Secure by Design**: Non-root containers, read-only Docker socket, permission system
- **🌐 Reverse Proxy Automation**: Automatic SSL, custom domains, path-based routing
- **📊 Health Monitoring**: Built-in health checks, auto-restart, real-time alerts
- **🎨 Beautiful UI**: Modern, responsive interface built with Next.js 15 and shadcn/ui
- **🏭 Production Ready**: Multi-stage Docker builds, health checks, monitoring, and deployment guides

---

## ✨ Features

### Current Features (Working)

#### Docker Management
- **Container Management**: View, start, stop, restart, remove containers
- **Image Management**: View, pull, remove Docker images
- **Network Management**: View and manage Docker networks
- **Volume Management**: View, create, remove Docker volumes
- **Real-time Status**: Auto-refreshing container states and resource usage

#### System Dashboard
- **Docker Info**: Server version, architecture, CPU, memory
- **Container Statistics**: Running/stopped container counts
- **Resource Overview**: System resource usage at a glance
- **Health Status**: System health monitoring

#### User Interface
- **Modern Design**: Built with Next.js 15 and shadcn/ui
- **Dark/Light Mode**: Theme toggle with persistence
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Updates**: TanStack Query for data fetching and caching

### Coming Soon

- **Extension Marketplace**: Browse and install official extensions
- **One-Click Installs**: Simple installation wizards
- **Health Monitoring**: Advanced container health checks
- **Backup & Restore**: Automated backup system with S3 support
- **Notifications**: Real-time alerts for system events
- **WebSocket Logs**: Real-time log streaming
- **Authentication**: User management and API keys

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite with Prisma ORM 5.22
- **Docker**: dockerode 4.0 for Docker API integration
- **State**: TanStack Query (React Query)
- **Real-time**: WebSockets for logs and events (planned)
- **Proxy**: Traefik or Caddy
- **Logging**: Pino with structured logging
- **Package Manager**: pnpm 8.15 with monorepo (Turborepo)

---

## 🎯 Quick Start

### Prerequisites

- **Docker**: 20.10+ (Docker Desktop on macOS/Windows)
- **Node.js**: 20+ (for local development)
- **pnpm**: 8+ (for local development)
- **OS**: Linux, macOS (Apple Silicon & Intel), Windows via WSL2

### Production Deployment

```bash
# Clone repository
git clone https://github.com/orbitr/orbitr.git
cd orbitr

# Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your settings

# Build and deploy
pnpm docker:build
pnpm deploy:prod

# Open http://localhost:3000
```

📖 **See [PRODUCTION.md](./PRODUCTION.md) for complete production deployment guide**

### Local Development

```bash
# Clone repository
git clone https://github.com/orbitr/orbitr.git
cd orbitr

# Install dependencies
pnpm install

# Set up environment
cp .env .env.local
cd apps/web && cp ../../.env .env.local

# Set up database
pnpm db:generate
pnpm db:push

# Workaround: Copy Prisma client to pnpm location
rm -rf node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
cp -r node_modules/.prisma/client node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client

# Start development server
pnpm dev

# Open http://localhost:3000
```

### First Steps

1. **Open Orbitr** in your browser at `http://localhost:3000`
2. **View Dashboard** to see Docker system information
3. **Manage Containers** - view, start, stop your Docker containers
4. **Browse Images, Networks, Volumes** - full Docker resource management

### Common Issues

**Hydration errors**: If you see React hydration mismatches, they've been fixed in the latest version. Pull and restart.

**Containers tab empty**: Verify the API is working:
```bash
curl http://localhost:3000/api/containers
```

**Prisma client errors** (development): After running `pnpm db:generate`, copy the client to pnpm:
```bash
rm -rf node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
cp -r node_modules/.prisma/client node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
```

---

## 📦 Extension Ecosystem (Coming Soon)

Orbitr is designed with an extensible architecture to support **official and community extensions**:

### Planned Extension Categories

**Databases**: PostgreSQL, MySQL, MariaDB, MongoDB, Redis, Memcached

**Media**: Plex, Jellyfin, Emby, Sonarr, Radarr, Lidarr

**Productivity**: Nextcloud, BookStack, Wiki.js, Paperless-ngx

**Automation**: n8n, Home Assistant

**Security**: Vaultwarden, Authelia, WireGuard

**Networking**: AdGuard Home, Pi-hole, Nginx Proxy Manager

**Monitoring**: Uptime Kuma, Grafana, Prometheus, Portainer

The extension system foundation is in place with a registry structure and API ready for implementation.

[**Learn More About Extensions →**](./EXTENSION_SYSTEM.md)

---

## 🏗️ Architecture

Orbitr is built with a modular, extensible architecture:

```
┌─────────────────────────────────────┐
│     Next.js Web Interface           │
│  (Dashboard, Containers, Settings)  │
│   shadcn/ui + TanStack Query        │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│   API Routes (Next.js 15)           │
│  • /api/docker/info                 │
│  • /api/containers                  │
│  • /api/images                      │
│  • /api/networks                    │
│  • /api/volumes                     │
│  • /api/health/simple               │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      Core Engine (@orbitr/core)     │
│  • Docker Manager (dockerode)       │
│  • Extension Loader (planned)       │
│  • Health Monitor (planned)         │
│  • Logger (pino)                    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  Database (@orbitr/database)        │
│    Prisma ORM + SQLite              │
│  • Container metadata               │
│  • Extension registry (planned)     │
│  • Health checks (planned)          │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      Docker Engine                  │
│   /var/run/docker.sock              │
└─────────────────────────────────────┘
```

**Current Implementation Status:**
- ✅ Next.js frontend with shadcn/ui
- ✅ Docker API integration (containers, images, networks, volumes)
- ✅ Prisma database with SQLite
- ✅ Health check endpoints
- ⏳ Extension system (architecture ready)
- ⏳ WebSocket server (planned)
- ⏳ Reverse proxy automation (planned)

[**Read Full Architecture →**](./ARCHITECTURE.md)

---

## 🔧 Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/orbitr/orbitr.git
cd orbitr

# Install dependencies
pnpm install

# Set up database
cp .env .env.local
cd apps/web && cp ../../.env .env.local && cd ../..
pnpm db:generate
pnpm db:push

# Workaround for pnpm isolated modules
rm -rf node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client
cp -r node_modules/.prisma/client node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Development Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript type checking
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
pnpm docker:build     # Build production Docker image
pnpm deploy:prod      # Deploy with Docker Compose
```

### Project Structure

```
orbitr/
├── apps/web/              # Next.js application
├── packages/
│   ├── core/              # Core engine logic
│   ├── database/          # Prisma schema
│   ├── sdk/               # Extension SDK
│   └── types/             # Shared types
├── extensions/            # Official extensions
└── docs/                  # Documentation
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

---

## 📖 Documentation

- [**Production Deployment**](./PRODUCTION.md) - Complete production deployment guide with checklist
- [**Deployment Guide**](./DEPLOYMENT.md) - Detailed deployment instructions and configuration
- [**Architecture**](./ARCHITECTURE.md) - System architecture and design decisions
- [**Extension Development**](./EXTENSION_SYSTEM.md) - Building extensions for Orbitr
- [**Repository Structure**](./REPOSITORY_STRUCTURE.md) - Codebase organization and structure

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Mostly Complete)
- ✅ Core Docker integration (containers, images, networks, volumes)
- ✅ Modern UI/UX with shadcn/ui
- ✅ Container, Image, Network, Volume management pages
- ⏳ Extension system architecture (implementation in progress)
- ⏳ Extension marketplace (registry structure ready)

### ⏳ Phase 2: Advanced Features (In Progress)
- ✅ Basic Docker information display
- ✅ Resource management pages
- ✅ Settings page with Docker info
- ⏳ Health monitoring system (API ready, checks pending)
- ⏳ Reverse proxy automation (Traefik/Caddy planned)
- ⏳ Real-time WebSocket log streaming (planned)

### ✅ Phase 3: Production Ready (In Progress)
- ✅ Production Docker configuration (multi-stage builds)
- ✅ Health monitoring endpoints
- ✅ Non-root container execution
- ✅ Standalone Next.js output
- ✅ Production environment templates
- ✅ Docker Compose production setup
- ✅ Deployment documentation
- ⏳ Backup & Restore system (planned)
- ⏳ Notification center (API ready, UI pending)
- ⏳ Authentication system (NextAuth foundation)
- ⏳ WebSocket server (implementation pending)
- ⏳ Extension marketplace (registry structure ready)

### 📋 Phase 4: Enterprise & Scale (Planned)
- [ ] OAuth2/OIDC integration
- [ ] Role-based access control (RBAC)
- [ ] Multi-tenant workspaces
- [ ] Advanced analytics & insights
- [ ] Extension approval workflow
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Database clustering support

[**View Full Roadmap →**](./ROADMAP.md)

---

## ⚠️ Known Limitations

As Orbitr is under active development, please note:

- **SQLite Json Types**: All JSON fields stored as strings (SQLite compatibility)
- **Prisma + pnpm**: Requires manual client copy after generation (see dev setup)
- **Extension System**: Architecture ready, implementation in progress
- **WebSocket Server**: Not yet implemented for real-time logs
- **Authentication**: Foundation in place, full implementation pending
- **Backup API**: Endpoint exists but implementation incomplete
- **Health Monitoring**: API ready, advanced checks not yet implemented

These are being actively addressed. See [roadmap](#-roadmap) for upcoming features.

---

## 📄 License

Orbitr is open source software licensed under the [MIT License](./LICENSE).

---

## 💖 Supporters

Orbitr is made possible by our amazing community and sponsors:

<a href="https://github.com/sponsors/orbitr">
  <img src="https://img.shields.io/github/sponsors/orbitr?style=for-the-badge" alt="GitHub Sponsors" />
</a>

---

## 🙏 Acknowledgments

Special thanks to:
- [dockerode](https://github.com/apocas/dockerode) for Docker API integration
- [Next.js](https://nextjs.org/) for the amazing framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://www.prisma.io/) for the fantastic ORM
- The entire open-source community

---

<div align="center">

**Built with ❤️ for the self-hosting community**

[⭐ Star us on GitHub](https://github.com/orbitr/orbitr) • [🚀 Get Started](#-quick-start) • [📚 Read the Docs](./docs)

</div>
