#!/bin/bash
# ============================================================
#  AuroraHR.in — One-Command Deployment Script
#  Run this on your DigitalOcean server as root
#  Usage: bash deploy.sh
# ============================================================

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_DIR="/var/www/hrms-app"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend-web"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🚀 AuroraHR Deployment Script                ${NC}"
echo -e "${BLUE}================================================${NC}"

# ── Step 1: Pull latest code ──────────────────────────────
echo -e "\n${YELLOW}[1/6] Pulling latest code from GitHub...${NC}"
cd $APP_DIR
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"

# ── Step 2: Install & build backend ──────────────────────
echo -e "\n${YELLOW}[2/6] Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo -e "\n${YELLOW}[3/6] Building backend (TypeScript → JavaScript)...${NC}"
npx tsc
echo -e "${GREEN}✅ Backend built → dist/${NC}"

# ── Step 3: Install & build frontend ─────────────────────
echo -e "\n${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd $FRONTEND_DIR
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo -e "\n${YELLOW}[5/6] Building frontend (React → static files)...${NC}"
npx vite build
echo -e "${GREEN}✅ Frontend built → dist/${NC}"

# ── Step 4: Restart backend with PM2 ─────────────────────
echo -e "\n${YELLOW}[6/6] Restarting backend server...${NC}"
cd $BACKEND_DIR

# Stop and delete old pm2 process if exists
pm2 delete aurorahr-backend 2>/dev/null || true

# Start backend using compiled JS (production mode)
NODE_ENV=production pm2 start dist/server.js --name aurorahr-backend

pm2 save
echo -e "${GREEN}✅ Backend restarted with PM2${NC}"

# ── Step 5: Update Nginx to serve built frontend ──────────
echo -e "\n${YELLOW}Updating Nginx to serve static files...${NC}"

cat > /etc/nginx/sites-available/aurorahr << 'NGINXCONF'
server {
    listen 80;
    server_name aurorahr.in www.aurorahr.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aurorahr.in www.aurorahr.in;

    ssl_certificate /etc/letsencrypt/live/aurorahr.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aurorahr.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Serve built React frontend
    root /var/www/hrms-app/frontend-web/dist;
    index index.html;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 20M;
}
NGINXCONF

nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx updated${NC}"

# ── Final Status ──────────────────────────────────────────
echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}  🎉 Deployment Complete!                      ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}Your app is live at: https://aurorahr.in${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  pm2 logs aurorahr-backend     # View backend logs"
echo "  pm2 restart aurorahr-backend  # Restart backend"
echo "  nginx -t && systemctl reload nginx  # Reload nginx"
echo ""
