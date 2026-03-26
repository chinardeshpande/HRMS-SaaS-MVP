#!/bin/bash

# AuroraHR Production Deployment Script
# This script handles complete deployment automatically

set -e  # Exit on error

echo "=========================================="
echo "AuroraHR Production Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/hrms-app"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend-web"
DOMAIN="aurorahr.in"
API_DOMAIN="api.aurorahr.in"

echo -e "${YELLOW}Step 1: Stopping existing processes...${NC}"
pm2 delete aurorahr-backend 2>/dev/null || echo "Backend not running"
pm2 delete aurorahr-frontend 2>/dev/null || echo "Frontend not running"

echo -e "${YELLOW}Step 2: Checking backend logs for errors...${NC}"
cd $BACKEND_DIR

# Check if database is accessible
echo -e "${YELLOW}Step 3: Testing database connection...${NC}"
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'YOUR_AIVEN_PASSWORD_HERE',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✓ Database connected successfully at', res.rows[0].now);
  pool.end();
});
" || {
  echo -e "${RED}Database connection failed. Please check credentials.${NC}"
  exit 1
}

echo -e "${YELLOW}Step 4: Starting backend...${NC}"
cd $BACKEND_DIR
pm2 start src/server.ts --name aurorahr-backend --interpreter ts-node --time

echo -e "${YELLOW}Step 5: Waiting for backend to start...${NC}"
sleep 5

# Check if backend is responding
echo -e "${YELLOW}Step 6: Testing backend health...${NC}"
curl -f http://localhost:3000/health 2>/dev/null || {
  echo -e "${RED}Backend health check failed. Checking logs...${NC}"
  pm2 logs aurorahr-backend --lines 30 --nostream
  exit 1
}

echo -e "${GREEN}✓ Backend is healthy${NC}"

echo -e "${YELLOW}Step 7: Starting frontend in dev mode...${NC}"
cd $FRONTEND_DIR
pm2 start "yarn dev --host 0.0.0.0 --port 5173" --name aurorahr-frontend --time

echo -e "${YELLOW}Step 8: Waiting for frontend to start...${NC}"
sleep 10

# Check if frontend is responding
echo -e "${YELLOW}Step 9: Testing frontend...${NC}"
curl -f http://localhost:5173 2>/dev/null || {
  echo -e "${RED}Frontend health check failed. Checking logs...${NC}"
  pm2 logs aurorahr-frontend --lines 30 --nostream
  exit 1
}

echo -e "${GREEN}✓ Frontend is running${NC}"

echo -e "${YELLOW}Step 10: Configuring Nginx...${NC}"

# Create Nginx configuration
cat > /etc/nginx/sites-available/aurorahr << 'NGINXCONF'
# Frontend - aurorahr.in
server {
    listen 80;
    listen [::]:80;
    server_name aurorahr.in www.aurorahr.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name aurorahr.in www.aurorahr.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aurorahr.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aurorahr.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Vite dev server
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Backend API - api.aurorahr.in
server {
    listen 80;
    listen [::]:80;
    server_name api.aurorahr.in;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.aurorahr.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aurorahr.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aurorahr.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://aurorahr.in" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.io
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/aurorahr /etc/nginx/sites-enabled/

# Test Nginx configuration
echo -e "${YELLOW}Step 11: Testing Nginx configuration...${NC}"
nginx -t || {
  echo -e "${RED}Nginx configuration test failed${NC}"
  exit 1
}

# Reload Nginx
echo -e "${YELLOW}Step 12: Reloading Nginx...${NC}"
systemctl reload nginx

echo -e "${YELLOW}Step 13: Setting up PM2 to start on boot...${NC}"
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ Deployment Complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${GREEN}Your application is now live at:${NC}"
echo -e "  • Frontend: ${YELLOW}https://aurorahr.in${NC}"
echo -e "  • Backend API: ${YELLOW}https://api.aurorahr.in${NC}"
echo ""
echo -e "${GREEN}PM2 Process Status:${NC}"
pm2 status
echo ""
echo -e "${GREEN}To view logs:${NC}"
echo -e "  • Backend:  ${YELLOW}pm2 logs aurorahr-backend${NC}"
echo -e "  • Frontend: ${YELLOW}pm2 logs aurorahr-frontend${NC}"
echo ""
echo -e "${GREEN}To restart services:${NC}"
echo -e "  • ${YELLOW}pm2 restart aurorahr-backend${NC}"
echo -e "  • ${YELLOW}pm2 restart aurorahr-frontend${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Test the application in your browser"
echo -e "  2. Set up proper JWT secrets"
echo -e "  3. Configure SendGrid for emails"
echo -e "  4. Set up automated backups"
echo -e "  5. Configure monitoring"
echo ""
