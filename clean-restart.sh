#!/bin/bash

echo "🧹 HRMS Clean Restart - Fixing Login Issue"
echo "=========================================="
echo ""

# Kill all existing processes
echo "1️⃣ Stopping all running processes..."
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Clear Vite cache (this is the key fix for login issue)
echo "2️⃣ Clearing Vite cache..."
cd frontend-web
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
echo "   ✅ Vite cache cleared"
cd ..

# Verify .env has correct port
echo "3️⃣ Verifying frontend .env configuration..."
if grep -q "VITE_API_URL=http://localhost:3000/api/v1" frontend-web/.env; then
  echo "   ✅ Frontend .env is correct (port 3000)"
else
  echo "   ⚠️  Fixing frontend .env..."
  echo "VITE_API_URL=http://localhost:3000/api/v1" > frontend-web/.env
  echo "   ✅ Frontend .env updated"
fi

# Start backend
echo "4️⃣ Starting Backend Server..."
cd backend
npm run dev > /tmp/hrms-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to initialize
echo "⏳ Waiting for backend to initialize..."
sleep 8

# Check if backend started successfully
if tail -10 /tmp/hrms-backend.log | grep -q "HRMS SaaS API Server Started Successfully"; then
  echo "   ✅ Backend started successfully on http://localhost:3000"
else
  echo "   ❌ Backend failed to start. Check /tmp/hrms-backend.log for errors"
  exit 1
fi

# Start frontend with cleared cache
echo "5️⃣ Starting Frontend Server (with cleared cache)..."
cd frontend-web
npm run dev > /tmp/hrms-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

# Wait for frontend to initialize
echo "⏳ Waiting for frontend to initialize..."
sleep 6

# Check if frontend started successfully
if tail -10 /tmp/hrms-frontend.log | grep -q "ready in"; then
  echo "   ✅ Frontend started successfully on http://localhost:5173"
else
  echo "   ❌ Frontend failed to start. Check /tmp/hrms-frontend.log for errors"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  ✅ CLEAN RESTART COMPLETE - LOGIN SHOULD WORK NOW!          ║"
echo "║                                                              ║"
echo "║  🌐 Open: http://localhost:5173                             ║"
echo "║                                                              ║"
echo "║  👤 Login with:                                              ║"
echo "║     Email:    sarah.johnson@acme.com                         ║"
echo "║     Password: password123                                    ║"
echo "║                                                              ║"
echo "║  🔑 IMPORTANT: Use a fresh browser window or incognito mode  ║"
echo "║                                                              ║"
echo "║  📝 Logs:                                                    ║"
echo "║     Backend:  /tmp/hrms-backend.log                         ║"
echo "║     Frontend: /tmp/hrms-frontend.log                        ║"
echo "║                                                              ║"
echo "║  🛑 To stop: pkill -f \"npm run dev\"                          ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
