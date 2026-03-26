# HRMS SaaS MVP - Step-by-Step Deployment Guide

This is a complete, step-by-step guide to deploy your HRMS application to production.

## Prerequisites

Before you start, ensure you have:

- [ ] A domain name (e.g., hrms-app.com)
- [ ] A DigitalOcean account (or alternative VPS provider)
- [ ] Access to GitHub repository
- [ ] Basic terminal/SSH knowledge
- [ ] Email service credentials (SendGrid, Mailgun, etc.)
- [ ] 2-3 hours for initial setup

---

## Part 1: Set Up DigitalOcean Infrastructure (30 minutes)

### Step 1.1: Create Droplet

1. Log in to DigitalOcean
2. Click **Create** → **Droplets**
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU options**: Regular (2 vCPUs, 4GB RAM, 80GB SSD) - $24/month
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or Password
4. Create droplet

### Step 1.2: Create Managed PostgreSQL Database

1. Click **Create** → **Databases**
2. Choose:
   - **Database engine**: PostgreSQL 15
   - **Plan**: Basic (1GB RAM, 10GB storage) - $15/month
   - **Datacenter**: Same as droplet
3. Create database
4. Note down connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password

### Step 1.3: Create Spaces (S3-compatible storage)

1. Click **Create** → **Spaces**
2. Choose:
   - **Datacenter**: Same as droplet
   - **Name**: `hrms-app-uploads`
   - **File Listing**: Restricted
3. Create Space
4. Generate API keys:
   - Settings → Applications & API → Spaces Keys
   - Generate New Key
   - Note down Access Key and Secret Key

### Step 1.4: Configure DNS

1. Go to **Networking** → **Domains**
2. Add your domain: `hrms-app.com`
3. Create A records:
   ```
   @ → Your Droplet IP
   www → Your Droplet IP
   api → Your Droplet IP
   ```
4. Wait for DNS propagation (5-30 minutes)

---

## Part 2: Set Up Production Server (45 minutes)

### Step 2.1: Connect to Server

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2.2: Run Setup Script

```bash
# Download setup script
curl -o setup-production-server.sh https://raw.githubusercontent.com/YOUR_USERNAME/HRMS-SaaS-MVP/main/scripts/setup-production-server.sh

# Make it executable
chmod +x setup-production-server.sh

# Run setup
sudo ./setup-production-server.sh
```

This script will:
- Update system packages
- Install Docker & Docker Compose
- Install Nginx
- Install Certbot for SSL
- Configure firewall
- Set up fail2ban
- Create application directory
- Configure logging

### Step 2.3: Clone Repository

```bash
cd /var/www/hrms-app
git clone https://github.com/YOUR_USERNAME/HRMS-SaaS-MVP.git .
```

### Step 2.4: Create Production Environment File

```bash
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

Fill in all values (see detailed configuration below).

---

## Part 3: Configure Environment Variables (20 minutes)

### Backend Environment Variables

Edit `/var/www/hrms-app/backend/.env.production`:

```bash
# Server
NODE_ENV=production
PORT=3000
BACKEND_URL=https://api.hrms-app.com
FRONTEND_URL=https://hrms-app.com

# Database (from DigitalOcean Managed Database)
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=hrms_saas_prod
DB_USER=doadmin
DB_PASSWORD=your_database_password_here
DB_SSL=true

# JWT Secrets (generate new ones!)
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=PASTE_64_CHAR_RANDOM_STRING_HERE
JWT_REFRESH_SECRET=PASTE_ANOTHER_64_CHAR_RANDOM_STRING_HERE

# Email (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM=noreply@hrms-app.com

# DigitalOcean Spaces
STORAGE_TYPE=s3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_BUCKET=hrms-app-uploads
S3_ACCESS_KEY_ID=YOUR_SPACES_ACCESS_KEY
S3_SECRET_ACCESS_KEY=YOUR_SPACES_SECRET_KEY

# CORS
CORS_ORIGIN=https://hrms-app.com,https://www.hrms-app.com

# Security
HELMET_ENABLED=true
TRUST_PROXY=true
```

### Frontend Environment Variables

Create `/var/www/hrms-app/frontend-web/.env.production`:

```bash
VITE_API_URL=https://api.hrms-app.com/api
VITE_SOCKET_URL=https://api.hrms-app.com
VITE_APP_ENV=production
```

---

## Part 4: Set Up SSL Certificates (15 minutes)

### Step 4.1: Stop Nginx (if running)

```bash
systemctl stop nginx
```

### Step 4.2: Obtain SSL Certificate

```bash
certbot certonly --standalone \
  -d hrms-app.com \
  -d www.hrms-app.com \
  -d api.hrms-app.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email
```

### Step 4.3: Configure Nginx

```bash
cp docker/nginx/nginx.conf /etc/nginx/sites-available/hrms-app
ln -s /etc/nginx/sites-available/hrms-app /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default config

# Test configuration
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

---

## Part 5: Deploy Application (30 minutes)

### Step 5.1: Build Docker Images

```bash
cd /var/www/hrms-app

# Build backend
docker build -f docker/backend/Dockerfile -t hrms-backend:latest ./backend

# Build frontend
docker build -f docker/frontend/Dockerfile -t hrms-frontend:latest ./frontend-web
```

### Step 5.2: Start Services

```bash
# Create necessary directories
mkdir -p logs uploads certbot/conf certbot/www

# Start services with docker-compose
docker-compose -f docker-compose.production.yml up -d
```

### Step 5.3: Run Database Migrations

```bash
docker-compose -f docker-compose.production.yml exec backend yarn run migrate
```

### Step 5.4: Seed Initial Data (optional)

```bash
docker-compose -f docker-compose.production.yml exec backend yarn run seed
```

---

## Part 6: Verify Deployment (15 minutes)

### Step 6.1: Health Checks

```bash
# Check backend
curl https://api.hrms-app.com/api/health

# Check frontend
curl https://hrms-app.com/

# Check database
curl https://api.hrms-app.com/api/health/db
```

### Step 6.2: Check Logs

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# Nginx logs
docker-compose logs nginx
```

### Step 6.3: Test in Browser

1. Open `https://hrms-app.com`
2. Try to login with test credentials
3. Check console for any errors
4. Test file upload
5. Test real-time chat/websockets

---

## Part 7: Set Up Automated Backups (15 minutes)

### Step 7.1: Test Manual Backup

```bash
cd /var/www/hrms-app
./scripts/backup-database.sh
```

### Step 7.2: Set Up Automated Backups

```bash
./scripts/setup-automated-backups.sh
```

Choose schedule (recommend daily at 2 AM).

### Step 7.3: Verify Cron Job

```bash
crontab -l
```

---

## Part 8: Set Up CI/CD with GitHub Actions (20 minutes)

### Step 8.1: Generate SSH Key for Deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@YOUR_DROPLET_IP
```

### Step 8.2: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

```
DROPLET_IP=YOUR_DROPLET_IP
DROPLET_USER=root
SSH_PRIVATE_KEY=<contents of github_deploy_key private key>

DB_HOST=your-db-host.db.ondigitalocean.com
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret
SMTP_PASSWORD=your_smtp_password

S3_ACCESS_KEY_ID=your_spaces_key
S3_SECRET_ACCESS_KEY=your_spaces_secret

PRODUCTION_API_URL=https://api.hrms-app.com/api
PRODUCTION_SOCKET_URL=https://api.hrms-app.com

SLACK_WEBHOOK_URL=your_slack_webhook (optional)
```

### Step 8.3: Test Deployment

```bash
# On your local machine
git checkout -b staging
git push origin staging

# This will trigger staging deployment
# Check GitHub Actions tab for progress
```

---

## Part 9: Monitoring & Maintenance (Ongoing)

### Set Up Monitoring

1. **UptimeRobot** (Free):
   - Add monitor for `https://hrms-app.com`
   - Add monitor for `https://api.hrms-app.com/api/health`
   - Set up email/SMS alerts

2. **Sentry** (Error Tracking):
   - Create account at sentry.io
   - Add SENTRY_DSN to environment variables
   - Restart application

3. **DigitalOcean Monitoring**:
   - Enable in Droplet settings
   - Set up CPU/Memory/Disk alerts

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check automated backup success

**Weekly:**
- Review application performance
- Check disk space
- Review security logs

**Monthly:**
- Update system packages
- Review and rotate logs
- Test backup restoration
- Review SSL certificate expiry

---

## Part 10: Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :80

# Restart services
docker-compose down
docker-compose up -d
```

### Database connection issues

```bash
# Test database connection
docker-compose exec backend node -e "require('./dist/database/data-source').AppDataSource.initialize().then(() => console.log('Connected')).catch(e => console.error(e))"

# Check database is running
docker-compose ps
```

### SSL certificate issues

```bash
# Renew certificate
certbot renew

# Check certificate expiry
certbot certificates
```

### High memory usage

```bash
# Check Docker memory
docker stats

# Restart containers
docker-compose restart
```

---

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (UFW)
- [ ] Fail2ban enabled
- [ ] SSH key authentication only (disable password)
- [ ] Strong database password (20+ characters)
- [ ] JWT secrets are random (64+ characters)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Automated backups running
- [ ] Monitoring and alerts set up
- [ ] Environment files secured (not in git)
- [ ] Database backups tested

---

## Next Steps After Deployment

1. **Create your first tenant/organization**
2. **Set up users and roles**
3. **Configure company settings**
4. **Import employee data**
5. **Train your team**
6. **Monitor for issues**
7. **Plan for scaling**

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Deployment Guide**: This file
- **Architecture Guide**: `PRODUCTION-DEPLOYMENT-GUIDE.md`
- **Issues**: GitHub Issues
- **Community**: Discord/Slack (if available)

---

## Rollback Procedure

If something goes wrong:

```bash
# Stop current containers
docker-compose down

# Restore from backup
./scripts/restore-database.sh

# Rollback to previous Docker images
docker tag hrms-backend:previous hrms-backend:latest
docker tag hrms-frontend:previous hrms-frontend:latest

# Restart
docker-compose up -d
```

---

**Congratulations! Your HRMS application is now live in production! 🎉**

For ongoing support and updates, refer to the main README.md and documentation.

**Last Updated**: 2026-03-23
**Version**: 1.0
