#!/bin/bash

echo "🚀 Starting HRMS Application..."
echo ""

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "npm run dev" 2>/dev/null
sleep 2

# Start backend
echo "📦 Starting Backend Server..."
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
  echo "✅ Backend started successfully on http://localhost:3000"
else
  echo "❌ Backend failed to start. Check /tmp/hrms-backend.log for errors"
  exit 1
fi

# Start frontend
echo "🎨 Starting Frontend Server..."
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
  echo "✅ Frontend started successfully on http://localhost:5173"
else
  echo "❌ Frontend failed to start. Check /tmp/hrms-frontend.log for errors"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║  ✅ HRMS Application Started Successfully!               ║"
echo "║                                                          ║"
echo "║  🌐 Frontend:  http://localhost:5173                    ║"
echo "║  🔌 Backend:   http://localhost:3000                    ║"
echo "║  📚 API Docs:  http://localhost:3000/api/docs           ║"
echo "║                                                          ║"
echo "║  📝 Logs:                                                ║"
echo "║     Backend:  /tmp/hrms-backend.log                     ║"
echo "║     Frontend: /tmp/hrms-frontend.log                    ║"
echo "║                                                          ║"
echo "║  🛑 To stop: pkill -f \"npm run dev\"                     ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
