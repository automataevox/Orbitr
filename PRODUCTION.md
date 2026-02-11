# 🏭 Production Ready Checklist

This document ensures Orbitr is properly configured for production deployment.

## ✅ What's Been Done

Orbitr is now production-ready with the following improvements:

### 1. Docker Configuration

- ✅ **Multi-stage Dockerfile** - Optimized build with 3 stages (deps, builder, runner)
- ✅ **Standalone output** - Next.js configured for standalone deployment
- ✅ **Non-root user** - Container runs as `orbitr` user (UID 1001)
- ✅ **Health checks** - Built-in Docker healthcheck endpoint
- ✅ **.dockerignore** - Optimized build context excludes unnecessary files
- ✅ **Alpine Linux** - Minimal image size using node:20-alpine

### 2. Security

- ✅ **Read-only Docker socket** - Mounted as `:ro` for security
- ✅ **Non-root execution** - Runs as unprivileged user
- ✅ **Environment isolation** - Production environment template provided
- ✅ **Secret management** - NEXTAUTH_SECRET configuration
- ✅ **Directory permissions** - Proper ownership for data/extensions/logs

### 3. Performance

- ✅ **Build optimization** - pnpm with frozen lockfile
- ✅ **Prisma generation** - Client generated during build
- ✅ **Static asset caching** - Next.js static files properly copied
- ✅ **Webpack externals** - Native modules not bundled
- ✅ **Production mode** - NODE_ENV=production

### 4. Monitoring & Health

- ✅ **Health endpoint** - `/api/health/simple` for Docker healthcheck
- ✅ **Logging** - Structured logging with pino
- ✅ **Telemetry disabled** - NEXT_TELEMETRY_DISABLED=1
- ✅ **Container health monitoring** - 30s interval, 3 retries

### 5. Development Experience

- ✅ **Production scripts** - npm scripts for build/deploy/docker operations
- ✅ **Environment templates** - `.env.production.example` provided
- ✅ **Docker Compose** - Production-ready compose configuration
- ✅ **Documentation** - Complete deployment guides

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

### Configuration

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Set `BASE_URL` to your domain
- [ ] Set `DOMAIN` for SSL certificates
- [ ] Configure `SSL_EMAIL` for Let's Encrypt
- [ ] Generate `NEXTAUTH_SECRET` (32+ random bytes)
- [ ] Set `DOCKER_GID` from your server
- [ ] Review all environment variables

### Security

- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] SSL/TLS enabled (`AUTO_SSL=true`)
- [ ] Firewall configured (ports 80, 443)
- [ ] Docker socket mounted read-only
- [ ] Server OS and packages updated
- [ ] Backup strategy implemented

### Testing

- [ ] Health check responding: `curl http://localhost:3000/api/health/simple`
- [ ] Docker info API working
- [ ] Container management functional
- [ ] Website loads correctly
- [ ] All pages accessible

### Infrastructure

- [ ] Domain DNS configured correctly
- [ ] Ports 80 and 443 accessible
- [ ] Sufficient disk space (20GB+)
- [ ] Sufficient memory (2GB+)
- [ ] Docker daemon running
- [ ] Docker Compose installed

## 🚀 Deployment Commands

### Build Production Image

```bash
# Using npm script
pnpm docker:build

# Or manually
docker build -t orbitr/orbitr:latest .
```

### Deploy with Docker Compose

```bash
# Start in production mode
pnpm deploy:prod

# Or manually
docker compose up -d
```

### Verify Deployment

```bash
# Check container status
docker ps | grep orbitr

# Check health
curl http://localhost:3000/api/health/simple

# Should return:
# {"status":"ok","timestamp":"2026-02-11T..."}

# View logs
docker compose logs -f orbitr
```

## 📊 Resource Requirements

### Minimum

- **CPU**: 2 cores
- **RAM**: 2GB
- **Disk**: 20GB
- **Network**: 10 Mbps

### Recommended

- **CPU**: 4+ cores
- **RAM**: 4-8GB
- **Disk**: 50GB SSD
- **Network**: 100 Mbps

### Expected Usage

- **Idle**: ~200MB RAM, 1% CPU
- **Active**: ~500MB RAM, 10-30% CPU
- **Heavy Load**: ~1GB RAM, 50-80% CPU

## 🔧 Production Configuration

### Docker Compose (Recommended)

The `docker-compose.yml` includes:

- Automatic restarts (`restart: unless-stopped`)
- Volume persistence (data, extensions, logs)
- Read-only Docker socket
- Health checks
- Environment variable management
- Network isolation
- Resource limits (optional)

### Environment Variables

Key production settings in `.env.production`:

```bash
NODE_ENV=production
DATABASE_URL=file:/app/data/orbitr.db
BASE_URL=https://your-domain.com
LOG_LEVEL=info
AUTO_SSL=true
NEXT_TELEMETRY_DISABLED=1
```

## 🛡️ Security Best Practices

### 1. Secrets Management

```bash
# Generate strong secret
openssl rand -base64 32

# Add to .env.production
NEXTAUTH_SECRET="<generated-secret>"
```

### 2. Firewall Configuration

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Docker Socket Security

The Docker socket is mounted read-only (`:ro`) in docker-compose.yml:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

### 4. Regular Updates

```bash
# Update Orbitr
git pull
docker compose down
docker compose build
docker compose up -d

# Update server
sudo apt update && sudo apt upgrade -y
```

## 📈 Monitoring

### Health Checks

```bash
# Simple health check (used by Docker)
curl http://localhost:3000/api/health/simple

# Detailed health (includes container statuses)
curl http://localhost:3000/api/health
```

### Container Statistics

```bash
# Real-time stats
docker stats orbitr

# Resource usage
docker exec orbitr df -h    # Disk usage
docker exec orbitr free -m  # Memory usage
```

### Logs

```bash
# Follow logs
docker compose logs -f orbitr

# Last 100 lines
docker compose logs --tail=100 orbitr

# Specific time range
docker compose logs --since 1h orbitr
```

## 💾 Backup Strategy

### Automated Backups (Recommended)

Configure in `.env.production`:

```bash
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"        # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=orbitr-backups
BACKUP_S3_ACCESS_KEY=your_key
BACKUP_S3_SECRET_KEY=your_secret
```

### Manual Backup

```bash
# Backup data volume
docker run --rm \
  -v orbitr-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/orbitr-$(date +%Y%m%d).tar.gz /data

# Or copy database directly
docker cp orbitr:/app/data/orbitr.db ./backups/orbitr-$(date +%Y%m%d).db
```

## 🔄 Update Procedure

### Zero-Downtime Updates

```bash
# 1. Pull latest code
git pull

# 2. Build new image
docker build -t orbitr/orbitr:latest .

# 3. Test new image (optional)
docker run --rm orbitr/orbitr:latest node -v

# 4. Restart with new image
docker compose up -d
```

### Rollback Procedure

```bash
# 1. Stop current version
docker compose down

# 2. Revert to previous commit
git log --oneline -5  # Find previous version
git checkout <previous-commit>

# 3. Rebuild and start
docker compose build
docker compose up -d
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check database file
docker exec orbitr ls -la /app/data/

# Regenerate Prisma client
docker exec orbitr sh -c "cd packages/database && pnpm prisma generate"

# Copy to pnpm location (workaround)
docker exec orbitr sh -c "cp -r node_modules/.prisma/client node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/"
```

### Docker Socket Permission Denied

```bash
# Get Docker group ID
getent group docker | cut -d: -f3

# Update .env.production
DOCKER_GID=999

# Restart
docker compose restart
```

### Out of Memory

```bash
# Check current usage
docker stats orbitr

# Add memory limit to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

## 📞 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- **Issues**: https://github.com/orbitr/orbitr/issues
- **Community**: Join our Discord for help

## ✨ What's Next?

After successful production deployment:

1. **Configure backups** - Set up automated S3 backups
2. **Enable monitoring** - Integrate with your monitoring solution
3. **Set up notifications** - Configure Discord/Slack webhooks  
4. **Review logs** - Monitor for any warnings or errors
5. **Performance tuning** - Adjust resources based on usage
6. **Documentation** - Document your specific setup
7. **Disaster recovery** - Test backup restoration

---

**Status**: ✅ Orbitr is production-ready!

Last Updated: February 11, 2026
