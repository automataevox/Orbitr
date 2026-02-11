#!/bin/bash

# Orbitr Production Deployment Script
# This script sets up Orbitr for production use

set -e

echo "🚀 Orbitr Production Deployment"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    
    # Generate random session secret
    SESSION_SECRET=$(openssl rand -hex 32)
    sed -i "s/change-this-to-a-random-secret-in-production/$SESSION_SECRET/g" .env
    
    echo "✅ Environment file created"
    echo "⚠️  Please review and update .env with your configuration"
    echo ""
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/backups data/config data/traefik data/caddy
chmod 755 data

echo "✅ Directories created"
echo ""

# Pull latest images
echo "📦 Pulling Docker images..."
docker-compose pull

echo "✅ Images pulled"
echo ""

# Build application
echo "🔨 Building Orbitr..."
docker-compose build

echo "✅ Build complete"
echo ""

# Start services
echo "🚀 Starting Orbitr services..."
docker-compose up -d

echo "✅ Services started"
echo ""

# Wait for application to be ready
echo "⏳ Waiting for Orbitr to be ready..."
sleep 10

# Check if Orbitr is running
if curl -s http://localhost:3000/api/docker/info > /dev/null 2>&1; then
    echo "✅ Orbitr is running!"
else
    echo "⚠️  Orbitr may not be ready yet. Check logs with: docker-compose logs -f"
fi

echo ""
echo "============================================"
echo "🎉 Deployment Complete!"
echo "============================================"
echo ""
echo "📍 Access Orbitr at: http://localhost:3000"
echo "📍 WebSocket server: ws://localhost:3001"
echo ""
echo "📚 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop: docker-compose stop"
echo "  - Restart: docker-compose restart"
echo "  - Update: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️  Important: Review and secure your .env file"
echo ""
