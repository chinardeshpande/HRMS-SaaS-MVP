#!/bin/bash
# Manual deployment script for AuroraHR production
# Usage: ./scripts/deploy-production.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="64.227.191.51"
SERVER_USER="root"
SERVER_PATH="/var/www/hrms-app"
BACKEND_PATH="backend"
FRONTEND_PATH="frontend-web"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AuroraHR Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Confirm deployment
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Check if we're on the right branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo -e "${YELLOW}Warning: You're not on main/master branch${NC}"
    read -p "Continue anyway? (yes/no): " continue_deploy
    if [ "$continue_deploy" != "yes" ]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 1: Building Backend...${NC}"
cd $BACKEND_PATH
yarn install
yarn build
cd ..

echo -e "\n${GREEN}Step 2: Building Frontend...${NC}"
cd $FRONTEND_PATH
yarn install
VITE_API_URL=https://api.aurorahr.in/api/v1 \
VITE_SOCKET_URL=https://api.aurorahr.in \
VITE_APP_NAME=AuroraHR \
yarn build
cd ..

echo -e "\n${GREEN}Step 3: Creating deployment archives...${NC}"
cd $BACKEND_PATH
tar -czf ../backend-deploy.tar.gz dist package.json yarn.lock
cd ..

cd $FRONTEND_PATH
tar -czf ../frontend-deploy.tar.gz dist
cd ..

echo -e "\n${GREEN}Step 4: Copying files to server...${NC}"
scp backend-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
scp frontend-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

echo -e "\n${GREEN}Step 5: Deploying on server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "📦 Backing up current backend..."
if [ -d /var/www/hrms-app/backend ]; then
    cp -r /var/www/hrms-app/backend /var/www/hrms-app/backend.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "📦 Extracting backend..."
mkdir -p /var/www/hrms-app/backend
cd /var/www/hrms-app/backend
tar -xzf /tmp/backend-deploy.tar.gz

echo "📦 Installing backend dependencies..."
yarn install --production --frozen-lockfile

echo "🔄 Restarting backend with PM2..."
pm2 restart aurorahr-backend || pm2 start yarn --name aurorahr-backend -- dev

echo "📦 Backing up current frontend..."
if [ -d /var/www/hrms-app/frontend-web/dist ]; then
    cp -r /var/www/hrms-app/frontend-web/dist /var/www/hrms-app/frontend-web/dist.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "📦 Extracting frontend..."
mkdir -p /var/www/hrms-app/frontend-web/dist
cd /var/www/hrms-app/frontend-web/dist
rm -rf ./*
tar -xzf /tmp/frontend-deploy.tar.gz

echo "🔄 Restarting frontend with PM2..."
pm2 restart aurorahr-frontend || echo "Frontend is served statically by nginx"

echo "🧹 Cleaning up..."
rm /tmp/backend-deploy.tar.gz
rm /tmp/frontend-deploy.tar.gz

echo "🧹 Removing old backups (keeping last 3)..."
cd /var/www/hrms-app
ls -dt backend.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
cd /var/www/hrms-app/frontend-web
ls -dt dist.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

echo "✅ Deployment completed!"
ENDSSH

echo -e "\n${GREEN}Step 6: Verifying deployment...${NC}"
sleep 10

backend_status=$(curl -s -o /dev/null -w "%{http_code}" https://api.aurorahr.in/api/v1/health || echo "000")
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://aurorahr.in/ || echo "000")

if [ "$backend_status" == "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy (HTTP $backend_status)${NC}"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $backend_status)${NC}"
fi

if [ "$frontend_status" == "200" ]; then
    echo -e "${GREEN}✅ Frontend is healthy (HTTP $frontend_status)${NC}"
else
    echo -e "${RED}❌ Frontend health check failed (HTTP $frontend_status)${NC}"
fi

echo -e "\n${GREEN}Cleaning up local build artifacts...${NC}"
rm backend-deploy.tar.gz
rm frontend-deploy.tar.gz

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend: https://api.aurorahr.in"
echo -e "Frontend: https://aurorahr.in"
echo -e "${GREEN}========================================${NC}"
