# Complete Setup Guide for Maa.ai Domain

**Your Domain**: maa.ai
**Hosting**: DigitalOcean
**Estimated Time**: 2-3 hours
**Cost**: ₹3,500-4,000/month

---

## 🎯 Overview

You will:
1. Buy `maa.ai` domain from GoDaddy
2. Create DigitalOcean account
3. Set up infrastructure (Droplet, Database, Storage)
4. Point domain to DigitalOcean
5. Deploy your HRMS application

---

## Part 1: Purchase Domain from GoDaddy (10 minutes)

### Step 1.1: Check Domain Availability

1. **Log in to GoDaddy India**: https://www.godaddy.com/en-in
2. Search for: `maa.ai`
3. Check if available

**Note**: `.ai` domains are premium domains from Anguilla
- **Cost**: ₹5,000-8,000/year (more expensive than .com)
- **Why expensive**: AI domains are in high demand

**Alternative if maa.ai is too expensive or unavailable:**
- `maa.com` - ₹799/year
- `maahrms.com` - ₹799/year
- `maa.in` - ₹699/year (Indian domain)
- `getmaa.com` - ₹799/year

### Step 1.2: Purchase Domain

1. Add domain to cart
2. **Important**: Uncheck unnecessary add-ons:
   - ❌ Website Builder (not needed)
   - ❌ Email (we'll use Google Workspace or SendGrid)
   - ❌ SSL Certificate (we'll use free Let's Encrypt)
   - ✅ Domain Privacy Protection (keep this for privacy)

3. Proceed to checkout
4. Complete payment

### Step 1.3: Verify Domain Ownership

1. Check email for domain confirmation
2. Verify domain ownership if required
3. Domain should show in your GoDaddy dashboard

**✅ Checkpoint**: Domain `maa.ai` visible in your GoDaddy account

---

## Part 2: Create DigitalOcean Account (15 minutes)

### Step 2.1: Sign Up

1. **Go to**: https://www.digitalocean.com/
2. Click **Sign Up**
3. Use your email (same as GoDaddy or work email)
4. Create strong password
5. Verify email

### Step 2.2: Add Payment Method

**Accepted from India:**
- ✅ Credit Card (Visa, Mastercard, Amex)
- ✅ Debit Card (Visa, Mastercard)
- ✅ PayPal

**Steps:**
1. Go to **Account → Billing**
2. Click **Add Payment Method**
3. Enter card details
4. They will charge ₹40 (₹0.50) to verify - will be refunded

### Step 2.3: Get Free Credits

**Use Referral Link for $200 (₹16,000) Free Credit!**

1. Search for "DigitalOcean referral code 2026" or
2. Use promotion code at signup
3. Credit valid for 60 days
4. Enough to run your app free for 2 months!

**✅ Checkpoint**: DigitalOcean account active with payment method

---

## Part 3: Create DigitalOcean Infrastructure (30 minutes)

### Step 3.1: Create Droplet (VPS)

1. **In DigitalOcean Dashboard**, click **Create** → **Droplets**

2. **Choose Configuration:**
   ```
   Image:           Ubuntu 22.04 (LTS) x64
   Plan:            Basic
   CPU Options:     Regular Intel with SSD
   Size:            2 vCPUs, 4 GB RAM, 80 GB SSD
                    ($24/month = ₹1,800/month)

   Datacenter:      Bangalore 1 (BLR1)
                    (Choose Bangalore for lowest latency in India)

   Additional:
   ✅ IPv6
   ✅ Monitoring (free)
   ❌ Backups (we'll do manual backups)

   Authentication:
   ✅ SSH keys (recommended)
   or
   ✅ Password (easier but less secure)
   ```

3. **SSH Key Setup** (Recommended):

   **On Mac/Linux:**
   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "maa-ai-droplet"

   # Press Enter for default location
   # Enter passphrase (optional)

   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   ```

   **On Windows:**
   ```powershell
   # Open PowerShell
   ssh-keygen -t ed25519 -C "maa-ai-droplet"

   # Copy public key
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

   **Add to DigitalOcean:**
   - Paste the public key
   - Name it "Maa AI Production"

4. **Hostname**: `maa-production-01`

5. **Click**: Create Droplet

6. **Note down**: Droplet IP address (e.g., 206.189.143.25)

**✅ Checkpoint**: Droplet created and running

### Step 3.2: Create Managed PostgreSQL Database

1. **Click** **Create** → **Databases**

2. **Choose Configuration:**
   ```
   Database Engine:    PostgreSQL 15
   Plan:              Basic Node
   Size:              1 GB RAM, 1 vCPU, 10 GB Disk
                      ($15/month = ₹1,125/month)

   Datacenter:        Bangalore 1 (BLR1)
                      (Same as Droplet!)

   Database name:     maa-production-db
   ```

3. **Create Database Cluster**

4. **Wait 3-5 minutes** for provisioning

5. **Note Down Connection Details:**
   - Host: (e.g., `db-postgresql-blr1-12345-do-user-123456-0.b.db.ondigitalocean.com`)
   - Port: (usually `25060`)
   - Username: `doadmin`
   - Password: (auto-generated, save it!)
   - Database: `defaultdb`

6. **Create HRMS Database:**
   - Go to **Users & Databases** tab
   - Click **Add Database**
   - Name: `hrms_production`
   - Click **Save**

7. **Configure Trusted Sources:**
   - Go to **Settings** tab
   - Add your Droplet IP to trusted sources
   - This allows Droplet to connect to database

**✅ Checkpoint**: Database created and accessible

### Step 3.3: Create DigitalOcean Spaces (Object Storage)

1. **Click** **Create** → **Spaces**

2. **Choose Configuration:**
   ```
   Datacenter:     Bangalore 1 (BLR1)
                   (Same as Droplet & Database!)

   Enable CDN:     ✅ Yes (recommended)

   Space Name:     maa-uploads
                   (must be unique globally)

   File Listing:   Restricted
                   (for security)
   ```

3. **Create Space**

4. **Generate API Keys:**
   - Click on Space name
   - Go to **Settings** → **API**
   - Click **Generate New Key**
   - Name: `maa-production-uploads`
   - **Save Access Key and Secret Key** immediately!

5. **Note Down:**
   - Endpoint: `https://blr1.digitaloceanspaces.com`
   - Region: `blr1`
   - Bucket Name: `maa-uploads`
   - Access Key: (save it!)
   - Secret Key: (save it!)

**✅ Checkpoint**: Spaces created with API keys

---

## Part 4: Point Domain to DigitalOcean (20 minutes)

### Step 4.1: Configure DNS in GoDaddy

1. **Log in to GoDaddy**
2. Go to **My Products** → **Domains**
3. Click on `maa.ai`
4. Click **DNS** or **Manage DNS**

### Step 4.2: Delete Existing Records

**Delete these default records:**
- All A records (except @)
- Default CNAME records
- Parked records

**Keep:**
- NS (Nameserver) records
- SOA records

### Step 4.3: Add New A Records

**Add these A records:**

| Type | Name | Value (Points to) | TTL |
|------|------|-------------------|-----|
| A | @ | YOUR_DROPLET_IP | 600 |
| A | www | YOUR_DROPLET_IP | 600 |
| A | api | YOUR_DROPLET_IP | 600 |

Example:
```
Type: A
Name: @
Value: 206.189.143.25  (your actual Droplet IP)
TTL: 600 seconds (10 minutes)
```

**Save all records**

### Step 4.4: Wait for DNS Propagation

- **Time**: 15-30 minutes (sometimes up to 24 hours)
- **Check status**: https://dnschecker.org/
- Enter `maa.ai` and check if it shows your Droplet IP

**Verify with command:**
```bash
# On Mac/Linux
nslookup maa.ai
nslookup www.maa.ai
nslookup api.maa.ai

# Should show your Droplet IP
```

**✅ Checkpoint**: DNS records updated and propagating

---

## Part 5: Set Up Production Server (45 minutes)

### Step 5.1: Connect to Droplet

**Using SSH Key:**
```bash
ssh root@YOUR_DROPLET_IP

# Example:
ssh root@206.189.143.25
```

**Using Password:**
```bash
ssh root@YOUR_DROPLET_IP
# Enter password when prompted
```

**First time:** Type `yes` when asked about fingerprint

### Step 5.2: Run Automated Setup Script

```bash
# Download setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/HRMS-SaaS-MVP/main/scripts/setup-production-server.sh

# Make executable
chmod +x setup.sh

# Run setup (takes 10-15 minutes)
sudo ./setup.sh
```

**This script installs:**
- Docker & Docker Compose
- Nginx
- Certbot (for SSL)
- Firewall (UFW)
- Fail2ban (security)
- Creates application directory

### Step 5.3: Clone Your Repository

```bash
cd /var/www/hrms-app

# Clone repository
git clone https://github.com/YOUR_GITHUB_USERNAME/HRMS-SaaS-MVP.git .

# Verify
ls -la
```

### Step 5.4: Create Production Environment File

```bash
# Copy example file
cp backend/.env.production.example backend/.env.production

# Edit the file
nano backend/.env.production
```

**Fill in ALL values** (I'll provide complete file below)

**Press `Ctrl+X`, then `Y`, then `Enter` to save**

**✅ Checkpoint**: Server set up with code and configuration

---

## Part 6: Configure Environment Variables

### Complete .env.production File for Maa.ai

Create/edit: `/var/www/hrms-app/backend/.env.production`

```bash
# ==================================
# MAA.AI PRODUCTION CONFIGURATION
# ==================================

# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# URLs
BACKEND_URL=https://api.maa.ai
FRONTEND_URL=https://maa.ai

# ==================================
# Database Configuration (DigitalOcean)
# ==================================
DB_HOST=db-postgresql-blr1-XXXXX.b.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=hrms_production
DB_USER=doadmin
DB_PASSWORD=YOUR_DATABASE_PASSWORD_FROM_DIGITALOCEAN
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MIN=2
DB_POOL_MAX=10

# ==================================
# JWT Configuration
# ==================================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=PASTE_DIFFERENT_GENERATED_SECRET_HERE
JWT_REFRESH_EXPIRY=7d

# ==================================
# Email Configuration
# ==================================
# Option 1: SendGrid (Free 12,000 emails/month)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM=noreply@maa.ai
SMTP_FROM_NAME=Maa HRMS

# Option 2: Google Workspace
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=admin@maa.ai
# SMTP_PASSWORD=your_app_password

# ==================================
# File Storage (DigitalOcean Spaces)
# ==================================
STORAGE_TYPE=s3
S3_ENDPOINT=https://blr1.digitaloceanspaces.com
S3_REGION=blr1
S3_BUCKET=maa-uploads
S3_ACCESS_KEY_ID=YOUR_SPACES_ACCESS_KEY
S3_SECRET_ACCESS_KEY=YOUR_SPACES_SECRET_KEY
S3_PUBLIC_URL=https://maa-uploads.blr1.digitaloceanspaces.com

# Fallback local storage
UPLOAD_DIR=/var/www/hrms-app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx

# ==================================
# Rate Limiting
# ==================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# ==================================
# CORS Configuration
# ==================================
CORS_ORIGIN=https://maa.ai,https://www.maa.ai
CORS_CREDENTIALS=true

# ==================================
# Logging
# ==================================
LOG_LEVEL=info
LOG_FILE=/var/www/hrms-app/logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# ==================================
# Multi-Tenancy
# ==================================
TENANT_ID_HEADER=X-Tenant-ID
SUBDOMAIN_ENABLED=false
DEFAULT_TENANT_ID=1

# ==================================
# Feature Flags
# ==================================
ENABLE_SWAGGER=false
ENABLE_AUDIT_LOG=true
ENABLE_EMAIL_NOTIFICATIONS=true

# ==================================
# Security
# ==================================
HELMET_ENABLED=true
TRUST_PROXY=true
SESSION_SECRET=PASTE_ANOTHER_GENERATED_SECRET_HERE

# ==================================
# Monitoring (Optional)
# ==================================
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

### Frontend Environment File

Create: `/var/www/hrms-app/frontend-web/.env.production`

```bash
VITE_API_URL=https://api.maa.ai/api
VITE_SOCKET_URL=https://api.maa.ai
VITE_APP_NAME=Maa HRMS
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
```

**✅ Checkpoint**: Environment variables configured

---

## Part 7: Generate Secrets

You need to generate random secrets for security.

**On your local machine:**

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy each output and paste into .env.production file**

**✅ Checkpoint**: Secrets generated and added

---

## Part 8: Set Up SSL Certificate (15 minutes)

### Wait for DNS Propagation

Before continuing, ensure DNS is propagated:
```bash
nslookup maa.ai
# Should show your Droplet IP
```

### Obtain SSL Certificate

**On your server:**

```bash
# Stop Nginx if running
systemctl stop nginx

# Get certificate
certbot certonly --standalone \
  -d maa.ai \
  -d www.maa.ai \
  -d api.maa.ai \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# Start Nginx
systemctl start nginx
```

**✅ Checkpoint**: SSL certificates obtained

---

## Part 9: Deploy Application (30 minutes)

### Step 9.1: Update Nginx Configuration

```bash
# Edit Nginx config to use maa.ai
nano /var/www/hrms-app/docker/nginx/nginx.conf
```

**Change all instances of `hrms-app.com` to `maa.ai`:**
- `server_name hrms-app.com www.hrms-app.com;`
  → `server_name maa.ai www.maa.ai;`

- SSL certificate paths:
  → `/etc/letsencrypt/live/maa.ai/fullchain.pem`

### Step 9.2: Build Docker Images

```bash
cd /var/www/hrms-app

# Build backend
docker build -f docker/backend/Dockerfile -t maa-backend:latest ./backend

# Build frontend
docker build -f docker/frontend/Dockerfile -t maa-frontend:latest ./frontend-web
```

**Takes 5-10 minutes**

### Step 9.3: Start Services

```bash
# Create directories
mkdir -p logs uploads backups

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose ps
```

**All services should show "Up"**

### Step 9.4: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend yarn run migrate

# Seed initial data (optional)
docker-compose exec backend yarn run seed
```

**✅ Checkpoint**: Application deployed and running

---

## Part 10: Verify Deployment (15 minutes)

### Health Checks

```bash
# Check backend health
curl https://api.maa.ai/api/health

# Expected response:
# {"success":true,"data":{"status":"healthy",...}}

# Check frontend
curl https://maa.ai/

# Expected: HTML response

# Check database
curl https://api.maa.ai/api/health/db
```

### Browser Testing

1. Open browser: `https://maa.ai`
2. You should see your HRMS login page
3. Check for SSL padlock (secure connection)
4. Open Developer Console (F12) - check for errors

### Test Login

Use seeded credentials:
```
Email: admin.user@acme.com
Password: password123
```

**✅ Checkpoint**: Application accessible and working

---

## Part 11: Set Up Automated Backups (10 minutes)

```bash
# Test backup
cd /var/www/hrms-app
./scripts/backup-database.sh

# Set up automated daily backups
./scripts/setup-automated-backups.sh

# Choose option 1 (Daily at 2:00 AM)
```

**✅ Checkpoint**: Backups configured

---

## Part 12: Set Up Monitoring (10 minutes)

### UptimeRobot (Free)

1. **Go to**: https://uptimerobot.com/
2. **Sign up** (free account)
3. **Add Monitor**:
   ```
   Monitor Type: HTTPS
   Friendly Name: Maa.ai Website
   URL: https://maa.ai
   Monitoring Interval: 5 minutes
   ```

4. **Add Another Monitor**:
   ```
   Monitor Type: HTTPS
   Friendly Name: Maa.ai API Health
   URL: https://api.maa.ai/api/health
   Monitoring Interval: 5 minutes
   ```

5. **Set up alerts**: Email/SMS when site is down

**✅ Checkpoint**: Monitoring configured

---

## 🎉 SUCCESS! Your Application is Live!

### What You Have:

✅ Domain: **maa.ai** (from GoDaddy)
✅ Hosting: **DigitalOcean Bangalore**
✅ Database: **Managed PostgreSQL**
✅ Storage: **DigitalOcean Spaces**
✅ SSL: **Let's Encrypt (auto-renewing)**
✅ Backups: **Automated daily**
✅ Monitoring: **UptimeRobot**

### Your URLs:

- **Website**: https://maa.ai
- **API**: https://api.maa.ai/api
- **API Docs**: https://api.maa.ai/api/docs (if enabled)

### Monthly Cost:

```
Droplet (VPS):          ₹1,800
Database:               ₹1,125
Spaces (Storage):       ₹375
Domain (maa.ai/year):   ₹5,000-8,000 (divide by 12)
──────────────────────────────────
Total:                  ₹3,900-4,000/month
```

---

## 📞 Support & Next Steps

### If Something Doesn't Work:

**Check Logs:**
```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# Nginx logs
docker-compose logs nginx

# All logs
docker-compose logs -f
```

**Restart Services:**
```bash
docker-compose restart
```

### Next Steps:

1. **Change Default Passwords** (from seed data)
2. **Create Your First Organization**
3. **Add Team Members**
4. **Configure Email Templates**
5. **Customize Branding**

### Set Up CI/CD (Later):

Follow **[GITHUB-SECRETS-SETUP.md](./GITHUB-SECRETS-SETUP.md)** to enable automated deployments.

---

## 🔐 Security Reminder

**Never share these publicly:**
- ❌ Database password
- ❌ JWT secrets
- ❌ Spaces API keys
- ❌ Email SMTP passwords
- ❌ SSH private keys

**Save securely in:**
- Password manager (1Password, LastPass, Bitwarden)
- Encrypted notes
- Team vault

---

**Congratulations! Maa.ai is now live! 🚀**

Any questions or issues during setup? Let me know which step you're on!
