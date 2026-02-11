# 🚀 Deployment Guide

Complete guide for deploying Orbitr in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)
- [Updates & Maintenance](#updates--maintenance)

## Prerequisites

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Docker 20.10+
- Docker Compose 2.0+

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Ubuntu 22.04 LTS or similar

### Network Requirements

- Public IP address or domain name
- Ports 80 and 443 open for web traffic
- Firewall configured to allow Docker networks

## Docker Compose Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/orbitr/orbitr.git
cd orbitr
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Critical settings to update:**
```bash
NODE_ENV=production
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
DEFAULT_DOMAIN=orbitr.example.com
SSL_ENABLED=true
SSL_EMAIL=admin@example.com
```

### 3. Deploy with Script

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Or manually:

```bash
docker-compose pull
docker-compose build
docker-compose up -d
```

### 4. Verify Deployment

```bash
docker-compose ps
docker-compose logs -f orbitr
```

Access the dashboard at `http://your-server-ip:3000`

## Reverse Proxy Setup

### Option 1: Traefik (Recommended)

Traefik is included in `docker-compose.yml` and configured by default.

**Enable Traefik:**
```bash
# .env
PROXY_PROVIDER=traefik
DEFAULT_DOMAIN=orbitr.example.com
```

**Configure DNS:**
```
A Record: *.orbitr.example.com → Your Server IP
A Record: orbitr.example.com → Your Server IP
```

**Start Traefik:**
```bash
docker-compose up -d traefik
```

Extensions will automatically be available at:
- `https://orbitr.example.com` (Main dashboard)
- `https://service.orbitr.example.com` (Extensions with proxy enabled)

### Option 2: Caddy

Create `Caddyfile`:

```caddy
orbitr.example.com {
    reverse_proxy orbitr:3000
}

*.orbitr.example.com {
    reverse_proxy orbitr:3000
}
```

Add to `docker-compose.yml`:

```yaml
caddy:
  image: caddy:2-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
  restart: unless-stopped
```

### Option 3: Nginx

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name orbitr.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /api/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## SSL/TLS Configuration

### Automatic SSL with Let's Encrypt (Traefik)

Traefik automatically provisions SSL certificates:

```bash
# .env
SSL_ENABLED=true
SSL_EMAIL=admin@example.com
```

Certificates are stored in `data/traefik/acme.json`

### Automatic SSL with Caddy

Caddy automatically provisions certificates - no configuration needed!

### Manual SSL with Nginx

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d orbitr.example.com
```

## Environment Variables

### Essential Variables

```bash
# Application
NODE_ENV=production
PORT=3000
WS_PORT=3001

# Security
SESSION_SECRET=<random-32-byte-hex>
RATE_LIMIT_MAX=100

# Docker
DOCKER_SOCKET=/var/run/docker.sock

# Database
DATABASE_URL=file:/app/data/orbitr.db

# Reverse Proxy
PROXY_PROVIDER=traefik
DEFAULT_DOMAIN=orbitr.example.com
SSL_ENABLED=true
SSL_EMAIL=admin@example.com
```

### Optional Variables

```bash
# Backup
BACKUP_DIR=/app/data/backups
BACKUP_RETENTION_DAYS=30

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Webhook Notifications
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Performance Optimization

### Resource Limits

In `docker-compose.yml`:

```yaml
services:
  orbitr:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Database Optimization

For high-traffic deployments, consider PostgreSQL instead of SQLite:

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/orbitr
```

### Caching

Enable Redis for session storage:

```bash
# Install Redis extension in Orbitr
# Then update .env
REDIS_URL=redis://localhost:6379
```

### CDN Integration

Configure CDN for static assets:

```bash
# .env
CDN_URL=https://cdn.example.com
```

## Monitoring & Logging

### Application Logs

```bash
# View live logs
docker-compose logs -f orbitr

# Save logs to file
docker-compose logs orbitr > orbitr.log
```

### Centralized Logging

**Install Grafana Loki:**

```yaml
# docker-compose.yml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  command: -config.file=/etc/loki/local-config.yaml
```

### Health Monitoring

**Built-in health endpoint:**
```bash
curl http://localhost:3000/api/docker/info
```

**Install Uptime Kuma extension in Orbitr for monitoring**

### Metrics Collection

**Prometheus integration:**

```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"
```

## Backup Strategy

### Automated Backups

**Create backup script (`backup-cron.sh`):**

```bash
#!/bin/bash
cd /path/to/orbitr
docker-compose exec orbitr node -e "
  const { getBackupManager } = require('@orbitr/core');
  getBackupManager().createBackup({
    includeVolumes: true,
    includeDatabase: true,
    includeConfig: true
  }).then(() => console.log('Backup completed'));
"
```

**Add to crontab:**

```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-cron.sh
```

### Backup Retention

Configure in `.env`:

```bash
BACKUP_RETENTION_DAYS=30
```

### Off-site Backups

**Sync to S3:**

```bash
#!/bin/bash
aws s3 sync /app/data/backups s3://your-bucket/orbitr-backups/
```

## Updates & Maintenance

### Updating Orbitr

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose pull
docker-compose build
docker-compose up -d
```

### Rolling Back

```bash
# Use specific version
git checkout v1.0.0
docker-compose up -d
```

### Database Migrations

```bash
# Before updating, backup database
docker-compose exec orbitr pnpm db:push
```

### Zero-Downtime Updates

```bash
# Pull new images first
docker-compose pull

# Rolling update
docker-compose up -d --no-deps orbitr
```

## Security Best Practices

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### Docker Socket Security

**Use Docker socket proxy:**

```yaml
docker-socket-proxy:
  image: tecnativa/docker-socket-proxy
  environment:
    CONTAINERS: 1
    IMAGES: 1
    NETWORKS: 1
    VOLUMES: 1
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

### Regular Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs orbitr

# Restart service
docker-compose restart orbitr

# Full rebuild
docker-compose down
docker-compose up -d --build
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

### Database Corruption

```bash
# Restore from backup
docker-compose exec orbitr node -e "
  const { getBackupManager } = require('@orbitr/core');
  getBackupManager().restoreBackup({
    backupId: 'backup-id',
    restoreDatabase: true
  });
"
```

## Support

- 📖 **Documentation:** [docs.orbitr.io](https://docs.orbitr.io)
- 💬 **Discord:** [discord.gg/orbitr](https://discord.gg/orbitr)
- 🐛 **Issues:** [github.com/orbitr/orbitr/issues](https://github.com/orbitr/orbitr/issues)

---

**Happy deploying! 🚀**
