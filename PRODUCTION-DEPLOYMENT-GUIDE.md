# HRMS SaaS MVP - Production Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Hosting Recommendations](#hosting-recommendations)
3. [Infrastructure Setup](#infrastructure-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Security Best Practices](#security-best-practices)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Cost Estimates](#cost-estimates)

---

## Architecture Overview

### Current Stack
- **Backend**: Node.js 18+ with Express.js + TypeScript + TypeORM
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL 15
- **Real-time**: Socket.IO for chat and WebRTC signaling
- **File Storage**: Local file system (needs migration to cloud storage)

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (Optional)               │
│                   SSL/TLS Termination (Let's Encrypt)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                     │
│         - Static file serving (React build)                 │
│         - API routing to backend                            │
│         - WebSocket proxy for Socket.IO                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    Backend API (Node.js)  │  │   PostgreSQL Database     │
│    - Express + Socket.IO  │  │   - Multi-tenant          │
│    - REST API             │  │   - Automated backups     │
│    - WebSocket Server     │  │   - Connection pooling    │
└───────────────────────────┘  └───────────────────────────┘
                │
                ▼
┌───────────────────────────┐
│   Cloud Object Storage    │
│   - File uploads          │
│   - Document attachments  │
│   - Profile images        │
└───────────────────────────┘
```

---

## Hosting Recommendations

### Option 1: DigitalOcean (Recommended for MVP)
**Best for**: Cost-effective, easy to scale, great for startups

**Services Needed:**
1. **Droplet (VPS)**: $24/month
   - 2 vCPUs, 4GB RAM, 80GB SSD
   - Ubuntu 22.04 LTS
   - Managed Database for PostgreSQL: $15/month (1GB RAM, 10GB storage)

2. **DigitalOcean Spaces (S3-compatible)**: $5/month
   - 250GB storage, 1TB outbound transfer
   - For file uploads and static assets

3. **Load Balancer** (optional, for scaling): $12/month

**Total Monthly Cost**: $39-51/month
**Setup Difficulty**: Medium
**Scalability**: Easy (add more droplets)

**Pros:**
- Simple, predictable pricing
- Excellent documentation
- Built-in monitoring and alerts
- Easy database backups
- App Platform for easier deployments

**Cons:**
- Less powerful than AWS/GCP
- Fewer advanced services

### Option 2: Railway.app (Easiest Deployment)
**Best for**: Quick deployment, minimal DevOps

**Services:**
- Backend deployment: ~$10-20/month
- PostgreSQL database: ~$5-10/month
- Automatic SSL, CI/CD built-in

**Total Monthly Cost**: $15-30/month
**Setup Difficulty**: Very Easy
**Scalability**: Medium

**Pros:**
- Zero configuration deployment
- Automatic HTTPS
- GitHub integration out of the box
- Environment variable management
- Usage-based pricing

**Cons:**
- More expensive at scale
- Less control over infrastructure

### Option 3: AWS (Most Scalable)
**Best for**: Enterprise-grade, maximum scalability

**Services:**
1. **EC2 Instance**: t3.medium (~$30/month)
2. **RDS PostgreSQL**: db.t3.micro (~$15/month)
3. **S3 Storage**: ~$5/month
4. **CloudFront CDN**: ~$5/month
5. **Application Load Balancer**: ~$16/month

**Total Monthly Cost**: $71+/month
**Setup Difficulty**: Hard
**Scalability**: Excellent

**Pros:**
- Most powerful and flexible
- Best for scaling
- Advanced features (auto-scaling, CDN, etc.)

**Cons:**
- Complex setup
- Higher costs
- Steeper learning curve

### Option 4: Render.com (Balance of Ease & Features)
**Best for**: Modern deployment with good developer experience

**Services:**
- Web Service (Backend): $7-25/month
- PostgreSQL: $7/month
- Static Site (Frontend): Free

**Total Monthly Cost**: $14-32/month
**Setup Difficulty**: Easy
**Scalability**: Good

**Pros:**
- Auto-deploy from GitHub
- Free SSL
- Easy environment management
- Good documentation

**Cons:**
- Can be slow on free tier
- Less mature than AWS/GCP

---

## Recommended Choice: DigitalOcean

For your HRMS MVP, I recommend **DigitalOcean** because:
1. **Cost-effective** at ~$40/month for production-ready infrastructure
2. **Easy to learn** with excellent documentation
3. **Scalable** - can easily add more droplets as you grow
4. **Professional features** - managed databases, backups, monitoring
5. **Docker-friendly** - perfect for your containerized setup

---

## Infrastructure Setup

### Prerequisites
1. DigitalOcean account
2. Domain name (e.g., hrms-app.com)
3. GitHub repository access
4. SSL certificate (Let's Encrypt - free)

### Step 1: DigitalOcean Droplet Setup

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y

# Create application directory
mkdir -p /var/www/hrms-app
cd /var/www/hrms-app
```

### Step 2: Set Up Managed PostgreSQL Database

1. Create a managed PostgreSQL database in DigitalOcean console
2. Note down connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password
   - Connection string

3. Configure firewall rules to allow connections from your droplet

### Step 3: Set Up DigitalOcean Spaces (S3)

1. Create a Space in DigitalOcean
2. Generate API keys (Access Key ID and Secret Access Key)
3. Update backend to use S3-compatible storage

### Step 4: Configure Environment Variables

Create production environment file:

```bash
# On your droplet
nano /var/www/hrms-app/.env.production
```

Add production variables (see .env.production.example in next section)

### Step 5: Set Up SSL Certificate

```bash
# Generate SSL certificate with Let's Encrypt
certbot --nginx -d hrms-app.com -d www.hrms-app.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

---

## CI/CD Pipeline

### GitHub Actions Workflow Strategy

**Three Environments:**
1. **Development** - Auto-deploy on push to `develop` branch
2. **Staging** - Auto-deploy on push to `staging` branch
3. **Production** - Manual approval on push to `main` branch

### Workflow Overview

```
Developer Push → GitHub
                   ↓
        Run Tests & Linting
                   ↓
         Build Docker Images
                   ↓
    Push to Container Registry
                   ↓
  Deploy to Target Environment
                   ↓
    Run Health Checks
                   ↓
      Notify Team (Slack/Email)
```

### Required GitHub Secrets

```
DROPLET_IP              # Your DigitalOcean droplet IP
DROPLET_USER            # SSH user (usually root)
SSH_PRIVATE_KEY         # SSH private key for deployment
DB_HOST                 # PostgreSQL host
DB_PASSWORD             # PostgreSQL password
JWT_SECRET              # Production JWT secret
SMTP_PASSWORD           # Email SMTP password
DO_SPACES_KEY           # DigitalOcean Spaces access key
DO_SPACES_SECRET        # DigitalOcean Spaces secret key
DOCKER_USERNAME         # Docker Hub username (optional)
DOCKER_PASSWORD         # Docker Hub password (optional)
SLACK_WEBHOOK_URL       # For deployment notifications (optional)
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong, randomly generated secrets
- ✅ Rotate credentials regularly
- ✅ Use different credentials for each environment

### 2. Database Security
- ✅ Use managed database with automatic backups
- ✅ Enable SSL/TLS connections
- ✅ Restrict database access by IP
- ✅ Use strong passwords (20+ characters)
- ✅ Regular backups (automated daily)

### 3. Application Security
- ✅ Use Helmet.js for HTTP headers
- ✅ Enable CORS with specific origins
- ✅ Implement rate limiting
- ✅ Use HTTPS everywhere (SSL/TLS)
- ✅ Sanitize user inputs
- ✅ Use parameterized queries (TypeORM handles this)
- ✅ Implement JWT token expiration
- ✅ Hash passwords with bcrypt (already implemented)

### 4. Infrastructure Security
- ✅ Configure firewall rules (UFW)
- ✅ Disable root SSH login
- ✅ Use SSH keys instead of passwords
- ✅ Keep system packages updated
- ✅ Monitor failed login attempts
- ✅ Set up fail2ban for brute force protection

### 5. File Upload Security
- ✅ Validate file types and sizes
- ✅ Scan for malware
- ✅ Store files outside web root
- ✅ Use cloud storage with access controls
- ✅ Generate unique file names

---

## Monitoring & Maintenance

### Health Checks
Implement health check endpoints:
- `/api/health` - Basic health check
- `/api/health/db` - Database connectivity
- `/api/health/storage` - File storage connectivity

### Logging
- Use Winston for structured logging
- Ship logs to external service (Papertrail, Loggly, or DigitalOcean Monitoring)
- Log levels: ERROR, WARN, INFO, DEBUG

### Monitoring Services
**Free/Cheap Options:**
1. **DigitalOcean Monitoring** (Built-in)
   - CPU, memory, disk usage
   - Bandwidth monitoring
   - Alert notifications

2. **UptimeRobot** (Free)
   - HTTP(S) monitoring
   - Email/SMS alerts
   - 5-minute checks

3. **Sentry** (Free tier)
   - Error tracking
   - Performance monitoring
   - User feedback

### Backup Strategy
1. **Database Backups**
   - Automated daily backups (DigitalOcean managed DB)
   - Keep 7 daily, 4 weekly, 3 monthly backups
   - Test restoration monthly

2. **File Backups**
   - DigitalOcean Spaces has versioning
   - Enable lifecycle policies for old files

3. **Application Code**
   - GitHub is your source of truth
   - Tag releases (v1.0.0, v1.0.1, etc.)

---

## Cost Estimates

### Starting Configuration (10-100 users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| VPS (2 vCPU, 4GB RAM) | DigitalOcean Droplet | $24 |
| PostgreSQL Database | DigitalOcean Managed DB | $15 |
| Object Storage (250GB) | DigitalOcean Spaces | $5 |
| Domain Name | Namecheap | $1 |
| SSL Certificate | Let's Encrypt | Free |
| Monitoring | UptimeRobot + DO Monitoring | Free |
| **Total** | | **$45/month** |

### Growth Configuration (100-500 users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| VPS (4 vCPU, 8GB RAM) | DigitalOcean Droplet | $48 |
| PostgreSQL Database | DigitalOcean Managed DB | $30 |
| Object Storage (500GB) | DigitalOcean Spaces | $5 |
| Load Balancer | DigitalOcean | $12 |
| Domain Name | Namecheap | $1 |
| CDN | Cloudflare | Free |
| **Total** | | **$96/month** |

### Scale Configuration (500-2000 users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| VPS x2 (8 vCPU, 16GB RAM) | DigitalOcean Droplets | $168 |
| PostgreSQL Database | DigitalOcean Managed DB | $60 |
| Object Storage (1TB) | DigitalOcean Spaces | $10 |
| Load Balancer | DigitalOcean | $12 |
| Redis Cache | DigitalOcean Managed | $15 |
| Domain + Email | Namecheap | $2 |
| CDN | Cloudflare Pro | $20 |
| **Total** | | **$287/month** |

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Backup strategy in place
- [ ] Monitoring tools configured

### Deployment
- [ ] Deploy backend to production
- [ ] Run database migrations
- [ ] Deploy frontend to production
- [ ] Configure Nginx reverse proxy
- [ ] Enable SSL/HTTPS
- [ ] Test all API endpoints
- [ ] Test WebSocket connections
- [ ] Test file uploads

### Post-Deployment
- [ ] Verify health checks
- [ ] Test user registration/login
- [ ] Smoke test critical features
- [ ] Monitor error logs
- [ ] Set up alerts
- [ ] Document rollback procedure
- [ ] Update team on deployment

---

## Quick Start Deployment

For the fastest production deployment:

1. **Use Railway.app** (15 minutes setup)
2. **Connect GitHub repository**
3. **Add PostgreSQL addon**
4. **Set environment variables**
5. **Deploy automatically**

For full control and scalability:

1. **Follow DigitalOcean setup** (2-3 hours initial setup)
2. **Configure CI/CD pipeline** (included in this guide)
3. **Automated deployments** going forward

---

## Next Steps

1. Review this guide and choose hosting provider
2. Set up production environment configurations
3. Update CI/CD pipeline with deployment workflows
4. Implement security enhancements
5. Set up monitoring and alerting
6. Create deployment runbook
7. Test deployment to staging environment
8. Deploy to production

---

## Support Resources

- [DigitalOcean Documentation](https://docs.digitalocean.com)
- [Docker Documentation](https://docs.docker.com)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Main_Page)

---

**Document Version**: 1.0
**Last Updated**: 2026-03-23
**Author**: HRMS Development Team
