# 🎨 Creating Custom Extensions

Learn how to create custom extensions for Orbitr and extend its functionality.

## Table of Contents

- [Extension Basics](#extension-basics)
- [Manifest File](#manifest-file)
- [Docker Compose Configuration](#docker-compose-configuration)
- [Extension Types](#extension-types)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Proxy Configuration](#proxy-configuration)
- [Publishing Extensions](#publishing-extensions)
- [Best Practices](#best-practices)

## Extension Basics

An Orbitr extension is a package that contains:

1. **manifest.yaml** - Extension metadata and configuration
2. **docker-compose.yml** (optional) - Container definition
3. **README.md** - Usage documentation
4. **icon.svg/png** - Extension icon

### Extension Structure

```
my-extension/
├── manifest.yaml
├── docker-compose.yml
├── README.md
├── icon.svg
└── scripts/
    ├── install.sh
    └── uninstall.sh
```

## Manifest File

The `manifest.yaml` file defines your extension:

### Basic Example

```yaml
id: my-app
name: My Application
author: Your Name
description: A brief description of your application
type: app
version: 1.0.0
icon: https://example.com/icon.svg
repository: https://github.com/username/my-extension
tags:
  - webapp
  - nodejs
  - database

environment:
  - name: APP_PORT
    label: Application Port
    description: Port for the application to listen on
    type: number
    required: true
    default: 3000

  - name: DATABASE_URL
    label: Database URL
    description: PostgreSQL connection string
    type: string
    required: true
    secret: true

volumes:
  - container: /app/data
    description: Application data directory

ports:
  - container: 3000
    host: 3000
    protocol: tcp
    description: Web interface

healthCheck:
  type: http
  endpoint: /health
  port: 3000
  interval: 30
  timeout: 10
  retries: 3

requirements:
  minMemory: 512
  minCpu: 0.5

compose:
  version: "3.8"
  services:
    myapp:
      image: username/myapp:latest
      environment:
        APP_PORT: ${APP_PORT}
        DATABASE_URL: ${DATABASE_URL}
      volumes:
        - myapp_data:/app/data
      ports:
        - "${APP_PORT}:3000"
      restart: unless-stopped
      healthcheck:
        test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
        interval: 30s
        timeout: 10s
        retries: 3
  volumes:
    myapp_data:
```

### Manifest Schema

#### Required Fields

```yaml
id: string              # Unique identifier (lowercase, hyphens)
name: string            # Display name
author: string          # Author name
description: string     # Short description (max 200 chars)
type: string            # Extension type (see Extension Types)
version: string         # Semantic version (e.g., 1.0.0)
```

#### Optional Fields

```yaml
icon: string            # URL to icon image
repository: string      # Git repository URL
tags: string[]          # Search tags
license: string         # License identifier (MIT, GPL, etc.)
homepage: string        # Project homepage
documentation: string   # Documentation URL
```

## Docker Compose Configuration

### Single Service Example

```yaml
compose:
  version: "3.8"
  services:
    app:
      image: myapp:latest
      environment:
        CONFIG_VAR: ${CONFIG_VAR}
      volumes:
        - app_data:/data
      ports:
        - "8080:8080"
      restart: unless-stopped
  volumes:
    app_data:
```

### Multi-Service Example

```yaml
compose:
  version: "3.8"
  services:
    web:
      image: nginx:alpine
      depends_on:
        - app
      ports:
        - "80:80"
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf:ro
    
    app:
      image: myapp:latest
      environment:
        DATABASE_URL: postgresql://db:5432/myapp
      depends_on:
        - db
    
    db:
      image: postgres:16
      environment:
        POSTGRES_PASSWORD: ${DB_PASSWORD}
      volumes:
        - db_data:/var/lib/postgresql/data

  volumes:
    db_data:
  
  networks:
    default:
      name: myapp_network
```

## Extension Types

### Application (`app`)

General-purpose applications:
```yaml
type: app
categories: ["productivity", "collaboration"]
```

### Database (`database`)

Database services:
```yaml
type: app
categories: ["database"]
tags: ["sql", "postgres"]
```

### Tool (`tool`)

Development and management tools:
```yaml
type: tool
categories: ["development", "monitoring"]
```

### Available Categories

- `database` - Database systems
- `productivity` - Productivity tools
- `media` - Media servers
- `automation` - Automation platforms
- `monitoring` - Monitoring tools
- `security` - Security applications
- `networking` - Network tools
- `development` - Development tools

## Environment Variables

### Variable Types

```yaml
environment:
  # String input
  - name: API_KEY
    label: API Key
    type: string
    required: true
    secret: true
    
  # Number input
  - name: PORT
    label: Port Number
    type: number
    required: true
    default: 8080
    min: 1024
    max: 65535
    
  # Boolean toggle
  - name: ENABLE_HTTPS
    label: Enable HTTPS
    type: boolean
    required: false
    default: true
    
  # Select dropdown
  - name: LOG_LEVEL
    label: Log Level
    type: select
    required: false
    default: info
    options:
      - debug
      - info
      - warn
      - error
```

### Validation

```yaml
environment:
  - name: EMAIL
    label: Email Address
    type: string
    required: true
    validation:
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      message: "Please enter a valid email address"
      
  - name: USERNAME
    label: Username
    type: string
    required: true
    validation:
      minLength: 3
      maxLength: 20
      pattern: "^[a-zA-Z0-9_]+$"
      message: "Username must be 3-20 alphanumeric characters"
```

## Health Checks

### HTTP Health Check

```yaml
healthCheck:
  type: http
  endpoint: /health
  port: 8080
  interval: 30
  timeout: 10
  retries: 3
```

### Command Health Check

```yaml
healthCheck:
  type: command
  command: pg_isready -U postgres
  interval: 30
  timeout: 10
  retries: 3
```

### TCP Health Check

```yaml
healthCheck:
  type: tcp
  port: 6379
  interval: 30
  timeout: 10
  retries: 3
```

## Proxy Configuration

Enable automatic reverse proxy with subdomain:

```yaml
proxyPresets:
  - subdomain: myapp
    targetPort: 3000
    sslEnabled: true
    
  # Multiple subdomains
  - subdomain: admin
    targetPort: 3001
    sslEnabled: true
    basicAuth:
      enabled: true
      username: ${ADMIN_USER}
      password: ${ADMIN_PASSWORD}
```

Your app will be available at: `https://myapp.orbitr.example.com`

## Publishing Extensions

### 1. Create Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/my-extension.git
git push -u origin main
```

### 2. Test Locally

```bash
# Copy extension to Orbitr
cp -r my-extension /path/to/orbitr/extensions/

# Install via UI
# Extensions → Browse → Install Local Extension
```

### 3. Submit to Registry

Create a pull request to [orbitr/registry](https://github.com/orbitr/registry):

```json
{
  "id": "my-app",
  "name": "My Application",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "type": "app",
  "categories": ["productivity"],
  "tags": ["webapp", "nodejs"],
  "verified": false,
  "featured": false,
  "downloads": 0,
  "rating": 0,
  "ratingCount": 0,
  "description": "A brief description of your application",
  "icon": "https://raw.githubusercontent.com/username/my-extension/main/icon.svg",
  "manifestUrl": "https://raw.githubusercontent.com/username/my-extension/main/manifest.yaml",
  "repositoryUrl": "https://github.com/username/my-extension"
}
```

### 4. Verification Process

1. Submit extension to registry
2. Orbitr team reviews code
3. Security scan performed
4. Extension published
5. Verified badge granted (after review)

## Best Practices

### Security

✅ **Do:**
- Use secrets for sensitive data
- Implement health checks
- Follow least privilege principle
- Pin specific image versions
- Validate all user inputs

❌ **Don't:**
- Hardcode credentials
- Use `:latest` tags in production
- Run containers as root
- Expose unnecessary ports

### Performance

✅ **Do:**
- Set resource limits
- Use multi-stage builds
- Optimize image size
- Implement caching
- Use health checks

❌ **Don't:**
- Create large images
- Use heavyweight base images
- Skip health checks

### User Experience

✅ **Do:**
- Provide clear descriptions
- Use sensible defaults
- Include documentation
- Add helpful validation messages
- Test installation flow

❌ **Don't:**
- Require manual configuration
- Use confusing variable names
- Skip documentation

### Documentation

Include a comprehensive README.md:

```markdown
# My Application

Brief description of what your application does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Configuration

### Environment Variables

- `API_KEY` - Your API key (required)
- `PORT` - Port to listen on (default: 3000)

## Usage

1. Install the extension
2. Configure environment variables
3. Start the service
4. Access at http://localhost:3000

## Troubleshooting

Common issues and solutions...

## Support

- GitHub Issues: https://github.com/username/my-extension/issues
- Documentation: https://docs.example.com
```

## Example Extensions

### Simple Web Server

```yaml
id: static-site
name: Static Site Server
author: Orbitr Team
description: Serve static HTML sites with Nginx
type: app
version: 1.0.0

environment:
  - name: SITE_CONTENT
    label: Site Content URL
    description: URL to download site content from
    type: string
    required: false

volumes:
  - container: /usr/share/nginx/html
    description: Static site content

ports:
  - container: 80
    host: 8080
    protocol: tcp
    description: HTTP port

healthCheck:
  type: http
  endpoint: /
  port: 80
  interval: 30
  timeout: 10
  retries: 3

compose:
  version: "3.8"
  services:
    nginx:
      image: nginx:alpine
      volumes:
        - site_content:/usr/share/nginx/html
      ports:
        - "8080:80"
      restart: unless-stopped
  volumes:
    site_content:
```

### Database with Admin UI

```yaml
id: postgres-with-admin
name: PostgreSQL with pgAdmin
author: Orbitr Team
description: PostgreSQL database with web-based admin interface
type: app
version: 1.0.0

environment:
  - name: POSTGRES_PASSWORD
    label: Database Password
    type: string
    required: true
    secret: true
  
  - name: PGADMIN_EMAIL
    label: Admin Email
    type: string
    required: true
  
  - name: PGADMIN_PASSWORD
    label: Admin Password
    type: string
    required: true
    secret: true

volumes:
  - container: /var/lib/postgresql/data
    description: Database files
  - container: /var/lib/pgadmin
    description: pgAdmin configuration

ports:
  - container: 5432
    host: 5432
    protocol: tcp
    description: PostgreSQL port
  - container: 80
    host: 5050
    protocol: tcp
    description: pgAdmin web interface

compose:
  version: "3.8"
  services:
    postgres:
      image: postgres:16
      environment:
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      volumes:
        - postgres_data:/var/lib/postgresql/data
      ports:
        - "5432:5432"
      restart: unless-stopped
      healthcheck:
        test: ["CMD", "pg_isready", "-U", "postgres"]
        interval: 30s
        timeout: 10s
        retries: 3
    
    pgadmin:
      image: dpage/pgadmin4:latest
      environment:
        PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
        PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
      volumes:
        - pgadmin_data:/var/lib/pgadmin
      ports:
        - "5050:80"
      depends_on:
        - postgres
      restart: unless-stopped

  volumes:
    postgres_data:
    pgadmin_data:
```

## Support

- 📖 **Documentation:** [docs.orbitr.io/extensions](https://docs.orbitr.io/extensions)
- 💬 **Discord:** [discord.gg/orbitr](https://discord.gg/orbitr)
- 🐛 **Issues:** [github.com/orbitr/orbitr/issues](https://github.com/orbitr/orbitr/issues)
- 📝 **Registry:** [github.com/orbitr/registry](https://github.com/orbitr/registry)

---

**Happy extension building! 🎨**
