# AuroraHR Production Deployment Guide

## 🚀 CI/CD Pipeline Overview

A smooth CI/CD pipeline has been established for deploying the HRMS application to production at **aurorahr.in**.

### Infrastructure

- **Domain**: aurorahr.in (GoDaddy)
- **Hosting**: DigitalOcean Droplet (64.227.191.51)
- **Database**: DigitalOcean Managed PostgreSQL
- **SSL**: Let's Encrypt with auto-renewal
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)

## 📁 Deployment Files

### 1. GitHub Actions Workflow

**File**: `.github/workflows/deploy-aurorahr.yml`

Automated CI/CD pipeline that triggers on every push to `main`/`master` branch:

- ✅ Builds backend and frontend
- ✅ Runs tests (when configured)
- ✅ Creates deployment archives
- ✅ Deploys to production server via SSH
- ✅ Performs health checks
- ✅ Auto-rollback on failure

**Required GitHub Secrets**:
- `PRODUCTION_SSH_KEY` - SSH private key for server access
- `PRODUCTION_SERVER_IP` - 64.227.191.51

### 2. Manual Deployment Scripts

Located in `scripts/` directory:

#### Deploy to Production
```bash
./scripts/deploy-production.sh
```
- Builds backend and frontend
- Creates deployment archives
- Deploys to production server
- Restarts services
- Verifies deployment

#### Configure Environment
```bash
./scripts/configure-production-env.sh
```
- Sets up production environment variables
- Configures backend `.env`
- Configures frontend `.env.production`

#### Sync Database Schema
```bash
./scripts/sync-database-to-production.sh
```
- Dumps local schema
- Backs up production schema
- Applies changes to production
- **Warning**: Use with caution in production

#### Seed Production Data
```bash
./scripts/seed-production-data.sh
```
- Creates demo tenant
- Creates admin user
- Seeds departments and designations

## 🔧 Production Configuration

### Backend Environment Variables

Location: `/var/www/hrms-app/backend/.env`

```env
NODE_ENV=production
PORT=3000

# Database (DigitalOcean Managed PostgreSQL)
DB_HOST=aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE
DB_SSL=true

# JWT
JWT_SECRET=aurorahr-prod-jwt-secret-2025-strong-random-key-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://aurorahr.in,http://localhost:5173

# App
APP_NAME=AuroraHR
APP_URL=https://aurorahr.in
API_URL=https://api.aurorahr.in
```

### Frontend Environment Variables

Location: `/var/www/hrms-app/frontend-web/.env.production`

```env
VITE_API_URL=https://aurorahr.in/api/v1
VITE_SOCKET_URL=https://aurorahr.in
VITE_APP_NAME=AuroraHR
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
```

**Note:** API is served from the same domain (`https://aurorahr.in/api/*`) to avoid corporate firewall/security software blocking issues.

## 📦 Deployment Process

### Automatic (GitHub Actions)

1. Push code to `main`/`master` branch
2. GitHub Actions automatically:
   - Builds the application
   - Runs tests
   - Deploys to production
   - Verifies health
3. Access at https://aurorahr.in

### Manual Deployment

1. **Build locally**:
   ```bash
   cd backend && yarn build
   cd ../frontend-web && yarn build
   ```

2. **Deploy**:
   ```bash
   ./scripts/deploy-production.sh
   ```

3. **Verify**:
   ```bash
   curl https://api.aurorahr.in/api/v1/health
   curl https://aurorahr.in/
   ```

## 🔍 Monitoring & Health Checks

### Backend Health Check
```bash
curl https://api.aurorahr.in/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-24T08:42:33.513Z",
    "environment": "production"
  }
}
```

### PM2 Process Status
```bash
ssh root@64.227.191.51
pm2 status
pm2 logs aurorahr-backend
pm2 logs aurorahr-frontend
```

### Nginx Status
```bash
ssh root@64.227.191.51
systemctl status nginx
nginx -t
```

## 🔄 Rollback Procedure

### Automatic Rollback
GitHub Actions will automatically rollback if:
- Deployment fails
- Health checks fail
- Services don't start

### Manual Rollback
```bash
ssh root@64.227.191.51
cd /var/www/hrms-app

# Find latest backup
ls -lt backend.backup.* | head -1

# Restore backend
rm -rf backend
cp -r backend.backup.YYYYMMDD_HHMMSS backend
cd backend
yarn install --production
pm2 restart aurorahr-backend

# Restore frontend
ls -lt frontend-web/dist.backup.* | head -1
rm -rf frontend-web/dist
cp -r frontend-web/dist.backup.YYYYMMDD_HHMMSS frontend-web/dist
```

## 🛠 Troubleshooting

### Backend Not Starting
1. Check logs: `pm2 logs aurorahr-backend`
2. Verify database connection
3. Check environment variables
4. Ensure reflect-metadata is imported in server.ts

### Frontend 404 Errors
1. Check if dist folder exists
2. Verify nginx configuration
3. Check file permissions

### Database Connection Issues
1. Verify DB_SSL=true is set
2. Check database credentials
3. Ensure server IP is whitelisted in DigitalOcean

### CORS Errors
1. Verify CORS_ORIGIN includes your domain
2. Check nginx doesn't add duplicate CORS headers
3. Backend should handle CORS, not nginx

## 📝 Important Notes

1. **Database Backups**: Automatic backups are enabled in DigitalOcean
2. **SSL Certificates**: Auto-renewal configured via certbot
3. **Firewall**: UFW enabled with ports 22, 80, 443 open
4. **Process Manager**: PM2 auto-restarts on crashes
5. **Backup Retention**: Keeps last 3 backups of backend/frontend

## 🔐 Security Checklist

- [x] SSH key-based authentication
- [x] Firewall configured (UFW)
- [x] SSL certificates installed
- [x] Database uses SSL
- [x] Environment variables secured (chmod 600)
- [ ] JWT_SECRET changed to strong random string
- [ ] Database password rotated regularly
- [ ] Monitoring/alerting configured

## 🚦 Production URLs

- **Frontend**: https://aurorahr.in
- **Backend API**: https://aurorahr.in/api/v1
- **Health Check**: https://aurorahr.in/health
- **API Docs**: https://aurorahr.in/api/docs (if enabled)

**Note:** Both frontend and backend are served from the same domain to bypass corporate firewall restrictions.

## 📊 Production Data Status

**Current Data in Production**:
- ✅ 60 Employees
- ✅ 6 Departments
- ✅ 31 Users
- ✅ 5 Candidates (Onboarding)
- ✅ 5 Onboarding Cases
- ✅ 4 Exit Cases

**Login Credentials**:
- Email: `admin.user@acme.com`
- Password: `password123` (demo credentials)

## 📞 Support

For deployment issues, check:
1. PM2 logs: `pm2 logs`
2. Nginx logs: `/var/log/nginx/error.log`
3. System logs: `journalctl -u nginx -f`

---

**Last Updated**: March 24, 2026
**Version**: 1.0.0
