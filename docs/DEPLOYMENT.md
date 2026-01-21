# Deployment Guide

## Overview
This guide covers deploying the HRMS SaaS MVP to production environments.

## Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Build Docker Images
```bash
docker-compose -f docker-compose.prod.yml build
```

#### 2. Configure Environment
Create `.env.production`:
```bash
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hrms_production
DB_USER=hrms_user
DB_PASSWORD=<secure_password>
JWT_SECRET=<secure_random_string>
```

#### 3. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. Run Migrations
```bash
docker-compose exec backend yarn run migrate
```

### Option 2: VPS Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### 2. Database Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE hrms_production;
CREATE USER hrms_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hrms_production TO hrms_user;
\q
```

#### 3. Deploy Backend
```bash
# Clone repository
cd /var/www
git clone <repository-url> hrms-saas
cd hrms-saas/backend

# Install dependencies
yarn install --production

# Build TypeScript
yarn run build

# Configure environment
cp .env.example .env.production
nano .env.production

# Run migrations
yarn run migrate

# Start with PM2
pm2 start dist/server.js --name hrms-backend
pm2 save
pm2 startup
```

#### 4. Deploy Frontend
```bash
cd /var/www/hrms-saas/frontend-web

# Install dependencies
yarn install

# Build for production
yarn run build

# Copy build to Nginx directory
sudo cp -r dist/* /var/www/html/hrms/
```

#### 5. Configure Nginx
```nginx
# /etc/nginx/sites-available/hrms-saas

server {
    listen 80;
    server_name hrms.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hrms.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/hrms.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hrms.yourdomain.com/privkey.pem;

    # Frontend
    root /var/www/html/hrms;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hrms-saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hrms.yourdomain.com
```

### Option 3: Cloud Platform Deployment

#### AWS
- Use Elastic Beanstalk for backend
- Use S3 + CloudFront for frontend
- Use RDS for PostgreSQL

#### Google Cloud Platform
- Use App Engine for backend
- Use Cloud Storage + CDN for frontend
- Use Cloud SQL for PostgreSQL

#### Azure
- Use App Service for backend
- Use Static Web Apps for frontend
- Use Azure Database for PostgreSQL

## Environment Variables

### Backend (.env.production)
```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=hrms_production
DB_USER=hrms_user
DB_PASSWORD=<secure_password>

# JWT
JWT_SECRET=<secure_random_string>
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Email (configure SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=<app_password>
SMTP_FROM=noreply@hrms-saas.com

# File Upload
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=https://hrms.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/hrms/app.log
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://hrms.yourdomain.com/api/v1
VITE_APP_NAME=HRMS SaaS
```

## Database Migrations

Run migrations on deployment:
```bash
cd backend
yarn run migrate
```

## Monitoring & Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs hrms-backend

# Monitor resources
pm2 monit

# View process status
pm2 status
```

### Application Logging
Logs are stored in `/var/log/hrms/app.log`

Configure log rotation:
```bash
# /etc/logrotate.d/hrms

/var/log/hrms/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### Database Backups
```bash
# Automated daily backup
sudo crontab -e

# Add line:
0 2 * * * pg_dump -U hrms_user hrms_production > /backups/hrms_$(date +\%Y\%m\%d).sql
```

### Application Backups
- Code: Git repository
- Uploads: Sync to S3 or similar

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Environment variables secured
- [ ] Database password is strong
- [ ] JWT secret is random and secure
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Performance Optimization

### Backend
- Enable compression
- Use connection pooling
- Implement caching (Redis)
- Enable gzip in Nginx

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading
- Optimize images

### Database
- Create proper indexes
- Enable query optimization
- Regular VACUUM operations

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, AWS ELB)
- Run multiple backend instances
- Use Redis for session storage

### Database Scaling
- Read replicas for reporting
- Connection pooling
- Query optimization

## Troubleshooting

### Check Backend Status
```bash
pm2 status
pm2 logs hrms-backend
```

### Check Database Connection
```bash
sudo -u postgres psql
\c hrms_production
\dt
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
tail -f /var/log/nginx/error.log
```

## Rollback Procedure

1. Stop current version
```bash
pm2 stop hrms-backend
```

2. Switch to previous version
```bash
git checkout <previous-version-tag>
yarn install
yarn run build
```

3. Restart
```bash
pm2 restart hrms-backend
```

## Maintenance Mode

Create maintenance page and configure Nginx:
```nginx
location / {
    return 503;
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www/html/maintenance;
    rewrite ^(.*)$ /index.html break;
}
```

## Support & Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)
- Set up application monitoring (New Relic, DataDog)
- Create alerts for critical errors
