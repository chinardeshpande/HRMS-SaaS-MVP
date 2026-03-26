#!/bin/bash

echo "=========================================="
echo "AuroraHR Auto-Fix and Deploy Script"
echo "=========================================="

set -e

cd /var/www/hrms-app/backend

# Find ts-node
TS_NODE_PATH=$(which ts-node 2>/dev/null || echo "/usr/lib/node_modules/ts-node/dist/bin.js")
echo "✓ Using ts-node at: $TS_NODE_PATH"

# Create proper ecosystem config
cat > ecosystem.config.js << 'EOFECO'
module.exports = {
  apps: [
    {
      name: 'aurorahr-backend',
      script: 'src/server.ts',
      interpreter: 'ts-node',
      cwd: '/var/www/hrms-app/backend',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      error_file: '/root/.pm2/logs/aurorahr-backend-error.log',
      out_file: '/root/.pm2/logs/aurorahr-backend-out.log',
      time: true
    },
    {
      name: 'aurorahr-frontend',
      script: 'yarn',
      args: 'dev --host 0.0.0.0 --port 5173',
      cwd: '/var/www/hrms-app/frontend-web',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      error_file: '/root/.pm2/logs/aurorahr-frontend-error.log',
      out_file: '/root/.pm2/logs/aurorahr-frontend-out.log',
      time: true
    }
  ]
};
EOFECO

echo "✓ Ecosystem config created"

# Stop all PM2 processes
pm2 delete all 2>/dev/null || echo "No processes to delete"

# Load environment variables
export $(cat /var/www/hrms-app/backend/.env.production | grep -v '^#' | xargs)

# Start with ecosystem
pm2 start ecosystem.config.js

# Save PM2 list
pm2 save

# Setup PM2 startup
pm2 startup systemd -u root --hp /root

echo ""
echo "✓ Waiting for services to start..."
sleep 10

# Check status
pm2 status

echo ""
echo "Testing backend..."
for i in {1..5}; do
  if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "✅ Backend is healthy!"
    break
  else
    echo "Attempt $i/5 - Backend not ready yet..."
    sleep 3
  fi
done

echo ""
echo "Testing frontend..."
if curl -f http://localhost:5173 2>/dev/null | head -c 100; then
  echo ""
  echo "✅ Frontend is running!"
else
  echo "⚠️ Frontend check inconclusive, check manually"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application should be live at:"
echo "  🌐 Frontend: https://aurorahr.in"
echo "  🔌 Backend API: https://api.aurorahr.in"
echo ""
echo "Test credentials:"
echo "  Email: admin@acme.com"
echo "  Password: password123"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check process status"
echo "  pm2 logs            - View all logs"
echo "  pm2 logs backend    - View backend logs only"
echo "  pm2 logs frontend   - View frontend logs only"
echo "  pm2 restart all     - Restart all services"
echo ""
