# GitHub Secrets Setup Guide

This guide explains how to configure GitHub Secrets for automated CI/CD deployments.

## Overview

GitHub Actions uses secrets to store sensitive information like passwords, API keys, and deployment credentials. These secrets are encrypted and only exposed to the workflow during execution.

---

## Required Secrets for CI/CD

### Production Deployment Secrets

Go to: **Your Repository → Settings → Secrets and variables → Actions → New repository secret**

Add each of the following secrets:

### 1. Server Access

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DROPLET_IP` | Your production server IP address | DigitalOcean Droplets dashboard |
| `DROPLET_USER` | SSH user (usually `root` or `deploy`) | Server username |
| `SSH_PRIVATE_KEY` | SSH private key for deployment | See instructions below |

#### Generating SSH Key for Deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# This creates two files:
# - github_deploy_key (private key - add to GitHub Secrets)
# - github_deploy_key.pub (public key - add to server)

# Add public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@YOUR_DROPLET_IP

# Or manually:
cat ~/.ssh/github_deploy_key.pub
# Copy the output and add it to /root/.ssh/authorized_keys on your server

# Copy ENTIRE private key content (including BEGIN and END lines)
cat ~/.ssh/github_deploy_key
# Paste this into SSH_PRIVATE_KEY secret
```

### 2. Database Credentials

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `DB_HOST` | PostgreSQL host | DigitalOcean Databases → Connection Details |
| `DB_PORT` | PostgreSQL port (usually 25060) | DigitalOcean Databases → Connection Details |
| `DB_NAME` | Database name | DigitalOcean Databases → Connection Details |
| `DB_USER` | Database username | DigitalOcean Databases → Connection Details |
| `DB_PASSWORD` | Database password | DigitalOcean Databases → Connection Details |

### 3. Application Secrets

| Secret Name | Description | How to Generate |
|------------|-------------|-----------------|
| `JWT_SECRET` | JWT signing secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SESSION_SECRET` | Session secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

⚠️ **IMPORTANT**: Generate NEW random secrets for production. Never use example/default values!

### 4. Email Configuration

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `SMTP_HOST` | SMTP server host | Email provider (e.g., smtp.sendgrid.net) |
| `SMTP_PORT` | SMTP port (usually 587) | Email provider documentation |
| `SMTP_USER` | SMTP username | Email provider dashboard |
| `SMTP_PASSWORD` | SMTP password/API key | Email provider dashboard |
| `SMTP_FROM` | From email address | Your domain email |

**Recommended Email Providers:**
- SendGrid (12,000 free emails/month)
- Mailgun (5,000 free emails/month)
- AWS SES (62,000 free emails/month)

### 5. File Storage (DigitalOcean Spaces)

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `S3_ENDPOINT` | Spaces endpoint | e.g., https://nyc3.digitaloceanspaces.com |
| `S3_REGION` | Spaces region | e.g., nyc3 |
| `S3_BUCKET` | Spaces bucket name | Your created Space name |
| `S3_ACCESS_KEY_ID` | Spaces access key | Spaces → Settings → API Keys |
| `S3_SECRET_ACCESS_KEY` | Spaces secret key | Spaces → Settings → API Keys |

### 6. Frontend URLs

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PRODUCTION_API_URL` | Backend API URL | https://api.hrms-app.com/api |
| `PRODUCTION_SOCKET_URL` | WebSocket URL | https://api.hrms-app.com |
| `FRONTEND_URL` | Frontend URL | https://hrms-app.com |
| `BACKEND_URL` | Backend base URL | https://api.hrms-app.com |

### 7. Notification & Monitoring (Optional)

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Slack → Incoming Webhooks |
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry.io → Project Settings |

### 8. Environment File

| Secret Name | Description | Content |
|------------|-------------|---------|
| `PRODUCTION_ENV` | Complete .env file | See below |

#### Creating PRODUCTION_ENV Secret

This secret should contain your ENTIRE `.env.production` file:

```bash
# Generate the secret content
cat backend/.env.production

# Copy the output and create a secret named PRODUCTION_ENV
# with the entire file content
```

Example content:
```
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=hrms_saas_prod
DB_USER=doadmin
DB_PASSWORD=your_actual_password
JWT_SECRET=your_actual_secret
# ... all other environment variables
```

---

## Staging Environment Secrets

If you're using staging environment, add these additional secrets:

| Secret Name | Description |
|------------|-------------|
| `STAGING_IP` | Staging server IP |
| `STAGING_USER` | Staging SSH user |
| `STAGING_SSH_KEY` | Staging SSH private key |
| `STAGING_API_URL` | Staging API URL |
| `STAGING_SOCKET_URL` | Staging WebSocket URL |

---

## Docker Hub Secrets (Optional)

If you want to push Docker images to Docker Hub:

| Secret Name | Description |
|------------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |

---

## Verifying Secrets

After adding all secrets, verify in your repository:

**Settings → Secrets and variables → Actions**

You should see all the secrets listed (values are hidden).

---

## Security Best Practices

### ✅ DO:
- Use strong, randomly generated secrets (64+ characters)
- Rotate secrets regularly (every 3-6 months)
- Use different secrets for staging and production
- Limit GitHub Actions permissions
- Use environment protection rules for production
- Keep secrets in GitHub Secrets, never in code

### ❌ DON'T:
- Commit secrets to git
- Share secrets in chat/email
- Use default/example secrets in production
- Reuse secrets across environments
- Store secrets in code comments
- Print secrets in logs

---

## Testing GitHub Actions

### Test Staging Deployment

```bash
# Create and push to staging branch
git checkout -b staging
git push origin staging

# Watch GitHub Actions tab for deployment
```

### Test Production Deployment

```bash
# Push to main (requires manual approval)
git checkout main
git merge develop
git push origin main

# Go to GitHub Actions → Deploy to Production
# Click "Run workflow" and type "DEPLOY" to confirm
```

---

## Troubleshooting

### SSH Connection Failed

**Problem**: `Permission denied (publickey)`

**Solution**:
1. Verify SSH_PRIVATE_KEY secret contains the entire private key
2. Ensure public key is in `/root/.ssh/authorized_keys` on server
3. Check server firewall allows SSH (port 22)

### Database Connection Failed

**Problem**: Cannot connect to database

**Solution**:
1. Verify all DB_* secrets are correct
2. Check database firewall allows connections from droplet IP
3. Ensure DB_SSL=true if using managed database

### Docker Build Failed

**Problem**: Docker build errors

**Solution**:
1. Check Dockerfile paths
2. Verify build context
3. Review build logs in GitHub Actions

### Health Check Failed

**Problem**: Deployment succeeds but health check fails

**Solution**:
1. Wait longer for services to start
2. Check service logs: `docker-compose logs`
3. Verify URLs in secrets match actual domain

---

## Quick Setup Checklist

- [ ] Generate SSH keys for deployment
- [ ] Add public key to production server
- [ ] Add private key to SSH_PRIVATE_KEY secret
- [ ] Copy all database credentials from DigitalOcean
- [ ] Generate new JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Create DigitalOcean Space and get API keys
- [ ] Configure all URL secrets (API, Socket, Frontend)
- [ ] Create PRODUCTION_ENV secret with complete .env file
- [ ] (Optional) Set up Slack webhook for notifications
- [ ] Test staging deployment
- [ ] Test production deployment

---

## Need Help?

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **GitHub Secrets Documentation**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **DigitalOcean Docs**: https://docs.digitalocean.com

---

**Last Updated**: 2026-03-23
