# 🔐 Security Guide

Comprehensive security guidelines for deploying and maintaining Orbitr.

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Network Security](#network-security)
- [Docker Security](#docker-security)
- [Database Security](#database-security)
- [Backup Security](#backup-security)
- [Monitoring & Auditing](#monitoring--auditing)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

## Security Overview

Orbitr follows security best practices to protect your infrastructure:

- 🔒 **Authentication** - User authentication with password hashing
- 🔑 **API Keys** - Secure API key generation for automation
- 🛡️ **Rate Limiting** - Protection against brute force attacks
- 🔐 **SSL/TLS** - Encrypted communication with Let's Encrypt
- 🚫 **Input Validation** - Sanitization of user inputs
- 📝 **Audit Logs** - Track all administrative actions

## Authentication & Authorization

### Password Security

Orbitr uses **PBKDF2** with salting for password hashing:

```typescript
// Configuration
const iterations = 1000;
const hashLength = 64;
const algorithm = 'sha512';
```

**Password requirements:**
- Minimum 8 characters
- Recommended: 12+ characters with mixed case, numbers, and symbols

### API Key Security

API keys follow the format: `orbitr_{64-character-hex}`

**Best practices:**
- Rotate API keys every 90 days
- Store keys in environment variables, never in code
- Use different keys for different services
- Revoke unused keys immediately

```bash
# Generate API key via CLI
pnpm orbitr auth generate-api-key
```

### Role-Based Access Control (RBAC)

**Roles:**
- **Admin** - Full system access
- **User** - Limited to viewing and managing own resources

**Recommendation:** First user should be admin, create additional users as needed.

### Session Management

- Sessions expire after 7 days
- Session tokens stored securely
- HTTPS-only cookies in production

```bash
# .env
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
SESSION_TIMEOUT=604800000  # 7 days in ms
```

### OAuth2/OIDC (Production Recommendation)

For production deployments, integrate OAuth2/OIDC providers:

**Supported providers:**
- Google OAuth
- GitHub OAuth
- Auth0
- Keycloak
- Custom OIDC providers

## Network Security

### Firewall Configuration

**Required ports:**
- `22` - SSH (restrict to specific IPs)
- `80` - HTTP (redirect to HTTPS)
- `443` - HTTPS

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp from YOUR_IP
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Block direct access to app
sudo ufw enable
```

### SSL/TLS Configuration

**Minimum TLS version:** TLS 1.2

**Recommended ciphers:**
```
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-RSA-CHACHA20-POLY1305
```

**Security headers:**
```nginx
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting

Built-in rate limiting protects against abuse:

```bash
# .env
RATE_LIMIT_MAX=100          # Max requests per window
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
```

**Per-endpoint limits:**
- Login: 5 attempts per 15 minutes
- API calls: 100 requests per 15 minutes
- Extension installation: 10 per hour

### Network Isolation

**Docker networks:**
```yaml
networks:
  orbitr:
    driver: bridge
    internal: true  # No external access
  
  proxy:
    driver: bridge  # External access for proxy only
```

**Restrict container communication:**
```yaml
services:
  orbitr:
    networks:
      - orbitr
      - proxy
    labels:
      - "com.orbitr.managed=false"
```

## Docker Security

### Docker Socket Security

**Risk:** Direct access to Docker socket = root access

**Solutions:**

#### Option 1: Docker Socket Proxy (Recommended)

```yaml
docker-socket-proxy:
  image: tecnativa/docker-socket-proxy
  environment:
    CONTAINERS: 1
    IMAGES: 1
    NETWORKS: 1
    VOLUMES: 1
    INFO: 1
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  networks:
    - orbitr

orbitr:
  environment:
    DOCKER_HOST: tcp://docker-socket-proxy:2375
```

#### Option 2: Rootless Docker

```bash
# Install rootless Docker
dockerd-rootless-setuptool.sh install

# Configure Orbitr
# .env
DOCKER_HOST=unix:///run/user/1000/docker.sock
```

### Container Security

**Best practices:**

1. **Run as non-root user:**
```dockerfile
USER node
```

2. **Read-only root filesystem:**
```yaml
services:
  orbitr:
    read_only: true
    tmpfs:
      - /tmp
```

3. **Drop capabilities:**
```yaml
services:
  orbitr:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

4. **Security scanning:**
```bash
# Scan images for vulnerabilities
docker scan orbitr:latest
```

### Image Security

- Use official images from Docker Hub
- Pin specific versions (avoid `latest`)
- Regularly update images
- Verify image signatures

```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1
```

## Database Security

### SQLite Security

**File permissions:**
```bash
chmod 600 data/orbitr.db
chown orbitr:orbitr data/orbitr.db
```

**Backup encryption:**
```bash
# Encrypt backups
gpg --encrypt --recipient admin@example.com orbitr.db
```

### PostgreSQL Security (Production)

**For production deployments:**

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/orbitr?sslmode=require
```

**Security checklist:**
- Use SSL connections (`sslmode=require`)
- Rotate database passwords every 90 days
- Restrict database access to localhost only
- Enable PostgreSQL audit logging

```postgresql
-- Create dedicated user
CREATE USER orbitr_app WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE orbitr TO orbitr_app;

-- Restrict to localhost
-- /etc/postgresql/14/main/pg_hba.conf
host    orbitr    orbitr_app    127.0.0.1/32    scram-sha-256
```

## Backup Security

### Encrypted Backups

```bash
# Create encrypted backup
tar -czf - data/ | gpg --encrypt --recipient backup@example.com > backup.tar.gz.gpg

# Restore encrypted backup
gpg --decrypt backup.tar.gz.gpg | tar -xzf -
```

### Off-site Backups

**S3 with encryption:**
```bash
# Install AWS CLI
pip install awscli

# Configure with IAM role
aws configure

# Sync with server-side encryption
aws s3 sync data/backups/ s3://your-bucket/backups/ \
  --sse AES256 \
  --exclude "*.tmp"
```

### Backup Access Control

```bash
# Restrict backup directory
chmod 700 data/backups
chown orbitr:orbitr data/backups

# Rotate backup encryption keys annually
gpg --gen-key
```

## Monitoring & Auditing

### Audit Logging

Enable comprehensive audit logs:

```bash
# .env
ENABLE_AUDIT_LOGS=true
AUDIT_LOG_RETENTION_DAYS=90
```

**Logged events:**
- User login/logout
- Container start/stop
- Extension install/uninstall
- Configuration changes
- Backup creation/restoration
- Failed authentication attempts

### Security Monitoring

**Monitor for suspicious activity:**

```bash
# Failed login attempts
docker-compose logs orbitr | grep "Failed login"

# Unauthorized API access
docker-compose logs orbitr | grep "401\|403"

# Container changes
docker events --filter 'event=start' --filter 'event=stop'
```

### Intrusion Detection

**Install fail2ban:**

```bash
sudo apt install fail2ban

# Configure for Orbitr
# /etc/fail2ban/jail.local
[orbitr]
enabled = true
port = 80,443
filter = orbitr
logpath = /var/log/orbitr/access.log
maxretry = 5
bantime = 3600
```

### Log Aggregation

**Use Loki + Grafana:**

```yaml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"

promtail:
  image: grafana/promtail:latest
  volumes:
    - /var/log:/var/log
    - ./promtail-config.yml:/etc/promtail/config.yml
```

## Incident Response

### Security Incident Procedure

1. **Detect** - Monitor alerts and logs
2. **Contain** - Isolate affected systems
3. **Investigate** - Analyze logs and identify root cause
4. **Remediate** - Apply fixes and patches
5. **Recover** - Restore from clean backups
6. **Document** - Record incident details

### Compromised System Response

```bash
# 1. Stop Orbitr immediately
docker-compose stop

# 2. Preserve logs
docker-compose logs > incident-logs.txt

# 3. Disconnect from network
sudo iptables -A INPUT -j DROP
sudo iptables -A OUTPUT -j DROP

# 4. Create forensic image
dd if=/dev/sda of=/mnt/backup/forensic.img bs=4M

# 5. Contact security team
```

### Password Reset (Compromised)

```bash
# Reset all user passwords
docker-compose exec orbitr node -e "
  const { getAuthManager } = require('@orbitr/core');
  const authManager = getAuthManager();
  // Force password reset on next login
"

# Revoke all API keys
docker-compose exec orbitr node -e "
  const { prisma } = require('@orbitr/database');
  prisma.authToken.deleteMany({});
"
```

## Security Checklist

### Pre-Deployment

- [ ] Generate strong `SESSION_SECRET`
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable Docker socket proxy
- [ ] Configure rate limiting
- [ ] Set up backup encryption
- [ ] Review security headers
- [ ] Restrict database access

### Post-Deployment

- [ ] Change default passwords
- [ ] Create admin user
- [ ] Enable audit logging
- [ ] Set up monitoring alerts
- [ ] Test backup restoration
- [ ] Configure fail2ban
- [ ] Review container permissions
- [ ] Document security procedures

### Ongoing Maintenance

- [ ] Weekly security log review
- [ ] Monthly password rotation
- [ ] Quarterly API key rotation
- [ ] Quarterly security updates
- [ ] Bi-annual penetration testing
- [ ] Annual access review
- [ ] Annual disaster recovery drill

## Security Contacts

**Report vulnerabilities:**
- Email: security@orbitr.io
- PGP Key: [Download](https://orbitr.io/security.asc)

**Response time:**
- Critical: 24 hours
- High: 72 hours
- Medium: 7 days

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

**Security is everyone's responsibility. Stay vigilant! 🔐**
