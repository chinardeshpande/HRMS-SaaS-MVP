#!/bin/bash
# Configure production environment variables on server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_IP="64.227.191.51"
SERVER_USER="root"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Configure Production Environment${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${GREEN}Creating production .env files on server...${NC}"

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Backend .env
cat > /var/www/hrms-app/backend/.env << 'EOF'
NODE_ENV=production
PORT=3000

# Database
DB_HOST=aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE
DB_SSL=true

# JWT
JWT_SECRET=prod-jwt-secret-change-this-to-strong-random-string-2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://aurorahr.in,http://localhost:5173

# S3/Spaces
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_BUCKET=aurorahr-uploads
S3_ACCESS_KEY=your-spaces-access-key
S3_SECRET_KEY=your-spaces-secret-key
S3_REGION=sgp1

# Email (SendGrid - optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@aurorahr.in

# App
APP_NAME=AuroraHR
APP_URL=https://aurorahr.in
API_URL=https://api.aurorahr.in

# Logging
LOG_LEVEL=info
EOF

# Frontend .env.production
cat > /var/www/hrms-app/frontend-web/.env.production << 'EOF'
VITE_API_URL=https://api.aurorahr.in/api/v1
VITE_SOCKET_URL=https://api.aurorahr.in
VITE_APP_NAME=AuroraHR
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
EOF

echo "✅ Environment files created"

# Set proper permissions
chmod 600 /var/www/hrms-app/backend/.env
chmod 600 /var/www/hrms-app/frontend-web/.env.production

echo "✅ Permissions set"

ENDSSH

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Environment configured!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Note: Update the following in /var/www/hrms-app/backend/.env:${NC}"
echo -e "  - JWT_SECRET (use a strong random string)"
echo -e "  - S3_ACCESS_KEY and S3_SECRET_KEY (if using Spaces)"
echo -e "  - SMTP credentials (if using email)"
echo -e "${GREEN}========================================${NC}"
