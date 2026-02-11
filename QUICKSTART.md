# 🚀 Orbitr - Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20 or higher)
- **pnpm** (v8 or higher)
- **Docker** (v24 or higher)
- **Docker Compose** (v2 or higher)

```bash
# Check versions
node --version    # Should be v20+
pnpm --version    # Should be 8+
docker --version  # Should be 24+
```

---

## 🎯 Step 1: Install Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@8.15.0

# Navigate to project directory
cd /Users/devi/Development/JavaScript/Orbitr

# Install all dependencies
pnpm install
```

This will install dependencies for all packages and applications in the monorepo.

---

## 🗄️ Step 2: Set Up Database

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates SQLite database)
pnpm db:push

# (Optional) Open Prisma Studio to view database
pnpm db:studio
```

The SQLite database will be created at: `packages/database/prisma/dev.db`

---

## 🔧 Step 3: Environment Configuration

Create environment variables file:

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` and configure:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./packages/database/prisma/dev.db"

# Docker
DOCKER_SOCKET=/var/run/docker.sock

# Orbitr
ORBITR_VERSION=0.1.0
ORBITR_DATA_DIR=./data
ORBITR_EXTENSIONS_DIR=./extensions/installed

# Logging
LOG_LEVEL=info

# Registry
ORBITR_REGISTRY_URL=https://raw.githubusercontent.com/orbitr/registry/main/registry.json
```

---

## 🏃 Step 4: Start Development Server

Start the Next.js development server:

```bash
# Start all services in development mode
pnpm dev
```

This will start:
- **Next.js** on `http://localhost:3000`
- **Turborepo** watch mode for all packages
- **Hot reload** for immediate feedback

---

## 🌐 Step 5: Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

You'll be redirected to:

```
http://localhost:3000/dashboard
```

**Dashboard Features:**
- 📊 System overview with Docker stats
- 🐳 Container management
- 🧩 Extension marketplace
- 📦 Image management
- 🔌 Network & volume management
- ⚙️ System settings

---

## 🧪 Step 6: Test Basic Functionality

### Test Docker Connection

1. Go to **Dashboard** - You should see Docker system information
2. Check that the following are displayed:
   - Docker version
   - Number of containers
   - CPU cores
   - Memory

### Test Container Management

1. Go to **Containers** page
2. You should see a list of all Docker containers on your system
3. Try container actions:
   - **Start** a stopped container
   - **Stop** a running container
   - **Restart** a container
   - View **logs** (coming soon)

### Test Extension System

1. Go to **Extensions** page
2. Browse available extensions
3. Try installing an extension (PostgreSQL is ready)
4. Search and filter extensions

---

## 📦 Step 7: Install Your First Extension

### Option 1: Using the UI

1. Navigate to `/dashboard/extensions`
2. Find the **PostgreSQL** extension
3. Click **Install**
4. Configure environment variables (if prompted)
5. Wait for installation to complete

### Option 2: Manual Installation

The PostgreSQL example extension is already in your registry:

```bash
# Extension files are located at:
ls -la extensions/registry/postgresql/
# - manifest.json
# - docker-compose.yml
# - README.md
```

---

## 🐳 Step 8: Production Deployment (Docker)

### Build Production Image

```bash
# Build the Docker image
docker build -t orbitr:latest .

# Or use docker-compose
docker-compose up -d
```

### Docker Compose Deployment

```bash
# Start Orbitr + Traefik
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f orbitr

# Stop services
docker-compose down
```

Access production build at: `http://localhost:3000`

---

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm start            # Start production server

# Code Quality
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:migrate       # Run migrations

# Cleaning
pnpm clean            # Clean all build artifacts
```

---

## 📂 Project Structure

```
orbitr/
├── apps/
│   └── web/              # Next.js dashboard
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/ # UI components
│       │   └── lib/      # Utilities
│       └── package.json
├── packages/
│   ├── core/             # Core engine (Docker, Extensions)
│   ├── database/         # Prisma ORM
│   ├── types/            # Shared types
│   ├── sdk/              # Extension SDK (coming soon)
│   └── cli/              # CLI tool (coming soon)
├── extensions/
│   ├── registry/         # Official extensions
│   └── installed/        # Installed extensions
├── prisma/               # (Will be moved to packages/database)
└── package.json          # Root monorepo config
```

---

## 🔍 Troubleshooting

### Issue: Docker connection failed

**Solution:**
```bash
# Check Docker is running
docker ps

# Verify Docker socket
ls -la /var/run/docker.sock

# On macOS, ensure Docker Desktop is running
open -a Docker
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue: Prisma Client not generated

**Solution:**
```bash
# Generate Prisma Client
pnpm db:generate

# If that fails, try:
cd packages/database
pnpm prisma generate
```

### Issue: pnpm command not found

**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm@8.15.0

# Verify installation
pnpm --version
```

### Issue: Extensions not loading

**Solution:**
```bash
# Check registry file exists
ls -la extensions/registry.json

# Verify extension format
cat extensions/registry.json | jq '.'

# Check logs
tail -f .next/trace
```

---

## 🧩 Creating Your First Extension

### Extension Structure

```
my-extension/
├── manifest.json         # Extension metadata
├── docker-compose.yml    # Container configuration
└── README.md            # Documentation
```

### Example manifest.json

```json
{
  "id": "my-app",
  "name": "My Application",
  "version": "1.0.0",
  "description": "My custom application",
  "author": {
    "name": "Your Name"
  },
  "type": "app",
  "compose": "docker-compose.yml",
  "environment": [
    {
      "name": "APP_PORT",
      "label": "Application Port",
      "type": "number",
      "default": 8080,
      "required": true
    }
  ],
  "ports": [
    {
      "containerPort": 8080,
      "hostPort": 8080,
      "protocol": "tcp"
    }
  ]
}
```

See [EXTENSION_SYSTEM.md](EXTENSION_SYSTEM.md) for complete documentation.

---

## 📚 Additional Resources

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture
- **[EXTENSION_SYSTEM.md](EXTENSION_SYSTEM.md)** - Extension development guide
- **[ROADMAP.md](ROADMAP.md)** - Implementation roadmap
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Current progress
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the logs: `.next/trace` or Docker logs
3. Open an issue on GitHub
4. Join our Discord community (coming soon)

---

## 🎉 Success!

You're now running Orbitr! 

**Next Steps:**
- Explore the dashboard
- Install some extensions
- Deploy your services
- Create custom extensions

**Happy orchestrating! 🚀**
