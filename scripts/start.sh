#!/bin/bash

# Orbitr Quick Start Script
# Quickly start Orbitr for development

set -e

echo "🚀 Starting Orbitr (Development)..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔨 Generating Prisma client..."
    pnpm db:generate
fi

# Push database schema
echo "📊 Setting up database..."
pnpm db:push

# Create data directories
mkdir -p data/backups data/config data/traefik data/caddy extensions

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo "============================================"
echo ""
echo "Starting Orbitr..."
echo ""
echo "📍 Web UI: http://localhost:3000"
echo "📍 WebSocket: ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start development servers
cd apps/web && pnpm dev:all
