#!/bin/bash

# ============================================================================
# Orbitr Quick Installation Script
# ============================================================================
# This script installs Orbitr on a Linux or macOS system with Docker
# Usage: curl -fsSL https://get.orbitr.io | bash
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORBITR_VERSION="latest"
ORBITR_DIR="${ORBITR_DIR:-$HOME/orbitr}"
ORBITR_PORT="${ORBITR_PORT:-3000}"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

log_info "Starting Orbitr installation..."
echo ""

# Detect OS
OS=$(detect_os)
if [ "$OS" == "unknown" ]; then
    log_error "Unsupported operating system: $OSTYPE"
    log_info "Orbitr supports Linux and macOS. Windows users should use WSL2."
    exit 1
fi

log_info "Detected OS: $OS"

# Check for Docker
if ! command_exists docker; then
    log_error "Docker is not installed."
    log_info "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

log_success "Docker is installed"

# Check Docker version
DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
log_info "Docker version: $DOCKER_VERSION"

# Check for Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose v2 is not available."
    log_info "Please install Docker Compose v2: https://docs.docker.com/compose/install/"
    exit 1
fi

log_success "Docker Compose is installed"

# Check if Docker daemon is running
if ! docker ps >/dev/null 2>&1; then
    log_error "Docker daemon is not running."
    log_info "Please start Docker and try again."
    exit 1
fi

log_success "Docker daemon is running"

# Get Docker group ID
if [ "$OS" == "linux" ]; then
    DOCKER_GID=$(getent group docker | cut -d: -f3)
    if [ -z "$DOCKER_GID" ]; then
        log_warning "Could not determine Docker group ID, using default (999)"
        DOCKER_GID=999
    fi
    log_info "Docker group ID: $DOCKER_GID"
else
    DOCKER_GID=0  # Not needed on macOS
fi

# ============================================================================
# Installation
# ============================================================================

echo ""
log_info "Installing Orbitr to: $ORBITR_DIR"

# Create installation directory
mkdir -p "$ORBITR_DIR"
cd "$ORBITR_DIR"

# Download docker-compose.yml
log_info "Downloading docker-compose.yml..."
curl -fsSL https://raw.githubusercontent.com/orbitr/orbitr/main/docker-compose.yml -o docker-compose.yml

# Create .env file
log_info "Creating .env file..."
cat > .env << EOF
# Orbitr Configuration
ORBITR_PORT=$ORBITR_PORT
DOCKER_GID=$DOCKER_GID
BASE_URL=http://localhost:$ORBITR_PORT
LOG_LEVEL=info

# Proxy Configuration
PROXY_TYPE=traefik
DOMAIN=localhost
AUTO_SSL=false

# Optional: Configure these later
# SSL_EMAIL=
# NEXTAUTH_SECRET=
EOF

# Create data directories
mkdir -p data extensions logs

# Create Docker network
log_info "Creating Docker network..."
docker network create orbitr-network 2>/dev/null || log_warning "Network already exists"

# Pull images
log_info "Pulling Docker images (this may take a few minutes)..."
docker compose pull

# Start Orbitr
log_info "Starting Orbitr..."
docker compose up -d

# Wait for Orbitr to be ready
log_info "Waiting for Orbitr to start..."
for i in {1..30}; do
    if curl -sf http://localhost:$ORBITR_PORT/api/health >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Check if Orbitr is running
if docker compose ps | grep -q "orbitr.*running"; then
    log_success "Orbitr is running!"
else
    log_error "Failed to start Orbitr"
    log_info "Check logs with: docker compose logs"
    exit 1
fi

# ============================================================================
# Post-Installation
# ============================================================================

echo ""
echo "=========================================="
log_success "Orbitr has been installed successfully!"
echo "=========================================="
echo ""
echo "📱 Access Orbitr:"
echo "   http://localhost:$ORBITR_PORT"
echo ""
echo "📂 Installation directory:"
echo "   $ORBITR_DIR"
echo ""
echo "🔧 Useful commands:"
echo "   Start:    docker compose up -d"
echo "   Stop:     docker compose stop"
echo "   Restart:  docker compose restart"
echo "   Logs:     docker compose logs -f orbitr"
echo "   Update:   docker compose pull && docker compose up -d"
echo "   Remove:   docker compose down"
echo ""
echo "📚 Documentation:"
echo "   https://docs.orbitr.io"
echo ""
echo "💬 Community:"
echo "   Discord: https://discord.gg/orbitr"
echo "   GitHub:  https://github.com/orbitr/orbitr"
echo ""
echo "⭐ If you like Orbitr, give us a star on GitHub!"
echo ""

# Open browser (optional)
if command_exists open; then
    log_info "Opening Orbitr in your browser..."
    open "http://localhost:$ORBITR_PORT"
elif command_exists xdg-open; then
    log_info "Opening Orbitr in your browser..."
    xdg-open "http://localhost:$ORBITR_PORT"
fi

exit 0
