# AuroraHR.in - Complete Production Deployment Guide

**Your Domain**: aurorahr.in ✅ PURCHASED
**Target**: Production-ready HRMS platform
**Estimated Time**: 2-3 hours
**Total Cost**: ₹3,300/month (free for first 2 months with credits)

---

## 🎯 What You'll Achieve Today

By the end of this guide, you'll have:
- ✅ AuroraHR.in live and accessible with HTTPS
- ✅ Professional HRMS application running
- ✅ Managed PostgreSQL database
- ✅ Cloud file storage
- ✅ Automated backups
- ✅ Monitoring and alerts

---

## 📋 Deployment Roadmap

```
✅ Step 1: Domain Purchase (COMPLETED!)
→ Step 2: Create DigitalOcean Account (10 mins) ← YOU ARE HERE
→ Step 3: Set Up Infrastructure (30 mins)
→ Step 4: Configure Domain DNS (15 mins)
→ Step 5: Deploy Application (45 mins)
→ Step 6: Set Up SSL & Security (20 mins)
→ Step 7: Verify & Test (15 mins)
→ Step 8: Backups & Monitoring (15 mins)
```

---

## STEP 2: Create DigitalOcean Account (10 minutes)

### What You'll Need:
- ✅ Email address (use your primary email)
- ✅ Credit/Debit card (Visa/Mastercard/PayPal)
- ✅ 10 minutes

### 2.1: Sign Up

1. **Open this link**: https://www.digitalocean.com/

2. **Click "Sign Up"** (top right)

3. **Enter your details**:
   ```
   Email: your_email@domain.com
   Password: (create a strong password)
   ```

4. **Verify email**:
   - Check your inbox
   - Click verification link
   - Return to DigitalOcean

### 2.2: Get $200 FREE Credit! 💰

**IMPORTANT**: Before adding payment, get free credits!

**Option 1: Referral Code**
- Search Google: "DigitalOcean referral code 2026"
- Use any active referral link
- You get **$200 credit** (₹16,000)
- Valid for 60 days

**Option 2: GitHub Student Pack** (if you're a student)
- Free $200 credit
- Visit: https://education.github.com/pack

**Option 3: Direct Signup**
- Sometimes they offer $200 on signup
- Check the homepage for banners

### 2.3: Add Payment Method

1. **Go to**: Account → Billing → Payment Methods

2. **Click**: Add Payment Method

3. **Choose**:
   - Credit Card (Visa, Mastercard, Amex)
   - Debit Card (Visa, Mastercard)
   - PayPal (can fund with UPI/NetBanking)

4. **Enter card details**

5. **Verification charge**:
   - They'll charge ₹40 (₹0.50 USD)
   - Immediately refunded
   - Just to verify your card

### 2.4: Verify Account

✅ Email verified
✅ Payment method added
✅ Credits applied (if used referral)

**Your Dashboard should show**: $200.00 credit (or your credit amount)

---

## STEP 3: Set Up Infrastructure (30 minutes)

### 3.1: Create Droplet (Virtual Server)

1. **Click**: Create → Droplets

2. **Choose Region**:
   ```
   Region: Bangalore (BLR1)

   Why Bangalore?
   - Lowest latency for India
   - Data sovereignty (India-based)
   - Better for Indian users
   ```

3. **Choose Image**:
   ```
   Distribution: Ubuntu
   Version: 22.04 (LTS) x64

   ✅ This is the latest stable Ubuntu
   ✅ Long-term support
   ✅ Best for production
   ```

4. **Choose Size**:
   ```
   Droplet Type: Basic
   CPU Options: Regular Intel with SSD

   Plan: $24/month
   - 2 vCPUs
   - 4 GB RAM
   - 80 GB SSD
   - 4 TB Transfer

   ₹1,800/month (FREE with credits!)
   ```

5. **Choose Authentication**:

   **RECOMMENDED: SSH Key** (more secure)

   **On Mac/Linux:**
   ```bash
   # Open Terminal and run:
   ssh-keygen -t ed25519 -C "aurorahr-production"

   # Press Enter for default location
   # Press Enter for no passphrase (or create one)

   # Copy the public key:
   cat ~/.ssh/id_ed25519.pub
   ```

   **On Windows:**
   ```powershell
   # Open PowerShell and run:
   ssh-keygen -t ed25519 -C "aurorahr-production"

   # Press Enter for defaults

   # Copy the public key:
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```

   **Add to DigitalOcean:**
   - Click "New SSH Key"
   - Paste the public key
   - Name: "AuroraHR Production"
   - Click "Add SSH Key"

   **ALTERNATIVE: Password** (easier but less secure)
   - Just select "Password"
   - DigitalOcean will email you the root password

6. **Additional Options**:
   ```
   ✅ IPv6
   ✅ Monitoring (FREE)
   ❌ Backups (we'll do manual backups - saves ₹360/month)
   ```

7. **Finalize**:
   ```
   Hostname: aurorahr-production-01
   Tags: production, hrms, aurorahr
   ```

8. **Click**: Create Droplet

9. **Wait**: 1-2 minutes for provisioning

10. **SAVE THIS**: Droplet IP address
    ```
    Example: 206.189.143.25

    Write it down or copy it!
    You'll need this multiple times.
    ```

**✅ CHECKPOINT**: You should see your Droplet running with an IP address

---

### 3.2: Create PostgreSQL Database

1. **Click**: Create → Databases

2. **Choose Database**:
   ```
   Database Engine: PostgreSQL
   Version: 15 (latest stable)
   ```

3. **Choose Configuration**:
   ```
   Plan: Basic Node
   Size: 1 GB RAM / 1 vCPU / 10 GB Disk
   Cost: $15/month (₹1,125/month)

   ✅ Perfect for starting out
   ✅ Can scale up later
   ✅ Auto-backups included
   ```

4. **Choose Datacenter**:
   ```
   Region: Bangalore (BLR1)

   ⚠️ IMPORTANT: Must be same as Droplet!
   ```

5. **Database Name**:
   ```
   Database cluster name: aurorahr-db-production
   ```

6. **Click**: Create Database Cluster

7. **Wait**: 3-5 minutes for provisioning

8. **SAVE THESE** (very important!):
   ```
   Click on the database → Connection Details

   Host: db-postgresql-blr1-XXXXX.db.ondigitalocean.com
   Port: 25060
   User: doadmin
   Password: [copy and save this!]
   Database: defaultdb
   SSL Mode: required
   ```

   **💾 Save these in a secure note! You'll need them later.**

9. **Create HRMS Database**:
   - Go to "Users & Databases" tab
   - Click "Add Database"
   - Database name: `hrms_production`
   - Click "Save"

10. **Add Trusted Source**:
    - Go to "Settings" tab
    - Under "Trusted Sources"
    - Click "Edit"
    - Add your Droplet IP address
    - Click "Allow"

**✅ CHECKPOINT**: Database created and your Droplet IP is in trusted sources

---

### 3.3: Create DigitalOcean Spaces (File Storage)

1. **Click**: Create → Spaces Object Storage

2. **Choose Datacenter**:
   ```
   Region: Bangalore (BLR1)

   ⚠️ IMPORTANT: Same as Droplet & Database!
   ```

3. **CDN Options**:
   ```
   Enable CDN: ✅ Yes

   This makes file downloads faster globally
   ```

4. **Choose Unique Name**:
   ```
   Space Name: aurorahr-uploads

   (must be globally unique, try variations if taken:
   - aurorahr-files
   - aurora-hr-uploads
   - aurorahr-prod-files)
   ```

5. **Select File Listing**:
   ```
   File Listing: Restricted

   ✅ More secure - files not publicly listable
   ```

6. **Click**: Create Space

7. **Generate API Keys**:
   - Click on the Space name
   - Go to "Settings" tab
   - Scroll to "Spaces access keys"
   - Click "Generate New Key"
   - Key name: `aurorahr-production-api`
   - Click "Generate Key"

8. **SAVE THESE IMMEDIATELY** (shown only once!):
   ```
   Access Key: DO00XXXXXXXXXXXXXXXXX
   Secret Key: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

   ⚠️ You cannot see the Secret Key again!
   Copy it now to a secure note!
   ```

9. **Note These Settings**:
   ```
   Endpoint: https://blr1.digitaloceanspaces.com
   Region: blr1
   Bucket Name: aurorahr-uploads
   CDN Endpoint: https://aurorahr-uploads.blr1.cdn.digitaloceanspaces.com
   ```

**✅ CHECKPOINT**: Space created with API keys saved

---

## 💰 Cost Summary So Far

```
Droplet (4GB):          $24/month  = ₹1,800/month
Database (1GB):         $15/month  = ₹1,125/month
Spaces (250GB):         $5/month   = ₹375/month
─────────────────────────────────────────────────
Total:                  $44/month  = ₹3,300/month

With $200 credit:       FREE for first 4-5 months!
```

---

## STEP 4: Configure Domain DNS (15 minutes)

### 4.1: Get Your Droplet IP

**Your Droplet IP**: _______________ (from Step 3.1.10)

**Example**: 206.189.143.25

### 4.2: Configure GoDaddy DNS

1. **Log in to GoDaddy India**: https://www.godaddy.com/en-in

2. **Go to**: My Products → Domains

3. **Find**: aurorahr.in

4. **Click**: DNS or Manage DNS

### 4.3: Update DNS Records

**DELETE these existing records**:
- Any existing A records pointing to GoDaddy parking page
- Default CNAME records (except if you need them)

**KEEP these records**:
- NS (Nameserver) records
- SOA record

**ADD these NEW A records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 600 |
| A | www | YOUR_DROPLET_IP | 600 |
| A | api | YOUR_DROPLET_IP | 600 |

**Example**:
```
Type: A
Name: @
Value: 206.189.143.25
TTL: 600 (10 minutes)

Type: A
Name: www
Value: 206.189.143.25
TTL: 600

Type: A
Name: api
Value: 206.189.143.25
TTL: 600
```

**Click "Save" after adding all records**

### 4.4: Verify DNS Propagation

**This takes 15-30 minutes** (sometimes up to 24 hours)

**Check online**: https://dnschecker.org/
- Enter: aurorahr.in
- Should show your Droplet IP globally

**Check via command line**:
```bash
# Mac/Linux Terminal or Windows PowerShell
nslookup aurorahr.in
nslookup www.aurorahr.in
nslookup api.aurorahr.in
```

**Expected**: All should show your Droplet IP

⏰ **WAIT for DNS to propagate before continuing**

**Meanwhile**: Take a break! Get coffee! ☕

**✅ CHECKPOINT**: DNS records updated and propagating

---

## STEP 5: Deploy Application (45 minutes)

### 5.1: Connect to Your Droplet

**Using SSH Key**:
```bash
ssh root@YOUR_DROPLET_IP

# Example:
ssh root@206.189.143.25
```

**Using Password** (if you didn't use SSH key):
```bash
ssh root@YOUR_DROPLET_IP
# Enter password from DigitalOcean email
```

**First time**: Type `yes` when asked about fingerprint

**You should see**: Ubuntu welcome message and command prompt

### 5.2: Run Automated Setup Script

```bash
# Download the setup script
curl -o setup.sh https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/HRMS-SaaS-MVP/main/scripts/setup-production-server.sh

# Make it executable
chmod +x setup.sh

# Run the setup (takes 10-15 minutes)
sudo ./setup.sh
```

**This script installs**:
- ✅ Docker & Docker Compose
- ✅ Nginx web server
- ✅ Certbot (for SSL)
- ✅ UFW Firewall
- ✅ Fail2ban (security)
- ✅ Creates application directory

**Wait for**: "✅ Production server setup complete!"

### 5.3: Clone Your Code

```bash
# Go to application directory
cd /var/www/hrms-app

# Clone your repository
git clone https://github.com/YOUR_GITHUB_USERNAME/HRMS-SaaS-MVP.git .

# Verify files
ls -la
```

**You should see**: backend/, frontend-web/, docker/, scripts/, etc.

### 5.4: Create Environment Files

**Create backend environment**:
```bash
nano /var/www/hrms-app/backend/.env.production
```

**Paste this** (I'll provide the complete file in next section):

Press `Ctrl+X`, then `Y`, then `Enter` to save

**Create frontend environment**:
```bash
nano /var/www/hrms-app/frontend-web/.env.production
```

**✅ CHECKPOINT**: Connected to server, code cloned, ready to configure

---

### 5.5: Complete Environment Configuration

**Backend .env.production** file:

```bash
# ==============================================
# AURORAHR.IN PRODUCTION CONFIGURATION
# ==============================================

# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1

# URLs
BACKEND_URL=https://api.aurorahr.in
FRONTEND_URL=https://aurorahr.in

# ==============================================
# Database (Your DigitalOcean Database)
# ==============================================
DB_HOST=YOUR_DB_HOST_FROM_STEP_3.2.8
DB_PORT=25060
DB_NAME=hrms_production
DB_USER=doadmin
DB_PASSWORD=YOUR_DB_PASSWORD_FROM_STEP_3.2.8
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MIN=2
DB_POOL_MAX=10

# ==============================================
# JWT Secrets (Generate new ones!)
# ==============================================
# Run this on your LOCAL machine to generate:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=PASTE_GENERATED_SECRET_HERE
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=PASTE_DIFFERENT_SECRET_HERE
JWT_REFRESH_EXPIRY=7d

# ==============================================
# Email (SendGrid FREE)
# ==============================================
# Sign up at https://sendgrid.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM=noreply@aurorahr.in
SMTP_FROM_NAME=AuroraHR

# ==============================================
# File Storage (Your DigitalOcean Space)
# ==============================================
STORAGE_TYPE=s3
S3_ENDPOINT=https://blr1.digitaloceanspaces.com
S3_REGION=blr1
S3_BUCKET=YOUR_SPACE_NAME_FROM_STEP_3.3.4
S3_ACCESS_KEY_ID=YOUR_ACCESS_KEY_FROM_STEP_3.3.8
S3_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_FROM_STEP_3.3.8
S3_PUBLIC_URL=https://YOUR_SPACE_NAME.blr1.digitaloceanspaces.com

# Fallback
UPLOAD_DIR=/var/www/hrms-app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx

# ==============================================
# Rate Limiting & Security
# ==============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# CORS
CORS_ORIGIN=https://aurorahr.in,https://www.aurorahr.in
CORS_CREDENTIALS=true

# Security
HELMET_ENABLED=true
TRUST_PROXY=true
SESSION_SECRET=PASTE_ANOTHER_SECRET_HERE

# ==============================================
# Logging & Features
# ==============================================
LOG_LEVEL=info
LOG_FILE=/var/www/hrms-app/logs/app.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

ENABLE_SWAGGER=false
ENABLE_AUDIT_LOG=true
ENABLE_EMAIL_NOTIFICATIONS=true

# ==============================================
# Multi-Tenancy
# ==============================================
TENANT_ID_HEADER=X-Tenant-ID
SUBDOMAIN_ENABLED=false
DEFAULT_TENANT_ID=1
```

**Frontend .env.production** file:

```bash
VITE_API_URL=https://api.aurorahr.in/api
VITE_SOCKET_URL=https://api.aurorahr.in
VITE_APP_NAME=AuroraHR
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
```

---

### 5.6: Generate Security Secrets

**On your LOCAL machine** (Mac/Linux/Windows PowerShell):

```bash
# Generate 3 different secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy and paste** into .env.production:
- First one → JWT_SECRET
- Second one → JWT_REFRESH_SECRET
- Third one → SESSION_SECRET

---

### 5.7: Sign Up for SendGrid (FREE Email)

**While still on your local machine**:

1. **Go to**: https://sendgrid.com/

2. **Sign up** (free account)

3. **Verify email**

4. **Create API Key**:
   - Settings → API Keys
   - Create API Key
   - Name: "AuroraHR Production"
   - Permissions: Full Access
   - Create & View

5. **Copy API Key** immediately (shown only once!)

6. **Add to .env.production** as SMTP_PASSWORD

7. **Verify sender identity**:
   - Settings → Sender Authentication
   - Verify Single Sender
   - Use: noreply@aurorahr.in
   - Complete verification

---

**✅ CHECKPOINT**: All environment files configured with real credentials

---

## STEP 6: Set Up SSL & Deploy (40 minutes)

### 6.1: Verify DNS is Ready

```bash
# On your server, run:
nslookup aurorahr.in
```

**Must show your Droplet IP!** If not, wait longer.

### 6.2: Obtain SSL Certificates

```bash
# Stop nginx if running
systemctl stop nginx

# Get SSL certificate
certbot certonly --standalone \
  -d aurorahr.in \
  -d www.aurorahr.in \
  -d api.aurorahr.in \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# Wait for completion
# Should say: "Congratulations!"

# Start nginx
systemctl start nginx
```

### 6.3: Update Nginx Configuration

```bash
# Edit nginx config
nano /var/www/hrms-app/docker/nginx/nginx.conf
```

**Find and replace**:
- `hrms-app.com` → `aurorahr.in`
- `/etc/letsencrypt/live/hrms-app.com/` → `/etc/letsencrypt/live/aurorahr.in/`

**Save**: Ctrl+X, Y, Enter

### 6.4: Build Docker Images

```bash
cd /var/www/hrms-app

# Build backend (takes 5-7 minutes)
docker build -f docker/backend/Dockerfile -t aurorahr-backend:latest ./backend

# Build frontend (takes 3-5 minutes)
docker build -f docker/frontend/Dockerfile -t aurorahr-frontend:latest ./frontend-web
```

### 6.5: Start All Services

```bash
# Create necessary directories
mkdir -p logs uploads backups

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose ps
```

**Expected**: All containers showing "Up"

### 6.6: Run Database Migrations

```bash
# Run migrations
docker-compose exec backend yarn run migrate

# Seed initial data
docker-compose exec backend yarn run seed
```

**✅ CHECKPOINT**: Application deployed and running!

---

## STEP 7: Verify Deployment (15 minutes)

### 7.1: Health Checks

```bash
# Check backend
curl https://api.aurorahr.in/api/health

# Expected: {"success":true,"data":{"status":"healthy"...}}

# Check database
curl https://api.aurorahr.in/api/health/db

# Check frontend
curl https://aurorahr.in/
```

### 7.2: Browser Testing

1. **Open**: https://aurorahr.in
2. **Check**: SSL padlock (secure)
3. **See**: Login page
4. **Test login**:
   ```
   Email: admin.user@acme.com
   Password: password123
   ```

5. **Open DevTools** (F12): Check for errors

### 7.3: Test Features

- ✅ Navigation works
- ✅ Dashboard loads
- ✅ File upload works
- ✅ Real-time chat works
- ✅ All modules accessible

**✅ CHECKPOINT**: AuroraHR.in is LIVE! 🎉

---

## STEP 8: Backups & Monitoring (15 minutes)

### 8.1: Set Up Automated Backups

```bash
cd /var/www/hrms-app

# Test backup
./scripts/backup-database.sh

# Set up daily backups at 2 AM
./scripts/setup-automated-backups.sh
```

Choose option 1 (Daily at 2 AM)

### 8.2: Set Up Monitoring

**UptimeRobot** (FREE):

1. Go to: https://uptimerobot.com/
2. Sign up (free)
3. Add monitors:
   - https://aurorahr.in (check every 5 min)
   - https://api.aurorahr.in/api/health
4. Set up email alerts

**✅ CHECKPOINT**: Backups and monitoring active

---

## 🎉 CONGRATULATIONS!

### Your Live URLs:

- **Website**: https://aurorahr.in
- **API**: https://api.aurorahr.in/api
- **Admin Login**: Use seeded credentials

### What You've Accomplished:

✅ Domain purchased and configured
✅ Production infrastructure set up
✅ Managed database with backups
✅ Cloud file storage configured
✅ SSL/HTTPS enabled
✅ Application deployed
✅ Automated backups running
✅ Monitoring active

### Monthly Cost:

```
DigitalOcean: ₹3,300/month
Domain: ₹699/year (₹58/month)
Email: FREE (SendGrid)
SSL: FREE (Let's Encrypt)
──────────────────────────────
Total: ₹3,358/month
FREE for first 4-5 months with credits!
```

---

## 📚 Next Steps

1. **Change default passwords**
2. **Create your first organization**
3. **Add team members**
4. **Customize branding**
5. **Set up CI/CD** (see GITHUB-SECRETS-SETUP.md)

---

## 🆘 Need Help?

**Check logs**:
```bash
docker-compose logs -f
```

**Restart services**:
```bash
docker-compose restart
```

**I'm here to help at every step!**

---

**Your HRMS is now live at aurorahr.in! 🚀**
