# Starting the HRMS Application

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
Backend will start on: http://localhost:3000

### 2. Start Frontend Server
```bash
cd frontend-web
npm run dev
```
Frontend will start on: http://localhost:5173

### 3. Access Application
Open your browser to: **http://localhost:5173**

**Default Login Credentials:**
```
👑 System Admin:
   admin.user@acme.com / password123

👤 HR Admin:
   sarah.johnson@acme.com / password123
   emily.brown@acme.com / password123

👔 Manager:
   john.smith@acme.com / password123
   michael.chen@acme.com / password123
   jessica.taylor@acme.com / password123
   matthew.clark@acme.com / password123
```

**All passwords:** `password123`

---

## Available Modules

✅ **Dashboard** - Overview and analytics
✅ **Employees** - Employee management
✅ **Attendance** - Clock in/out and attendance tracking
✅ **Leave Management** - Leave requests and approvals
✅ **Performance** - Performance reviews and goals
✅ **Onboarding** - Candidate onboarding workflow
✅ **Probation Tracker** - Probation reviews (30/60/85 days)
✅ **Exit Management** - Employee offboarding workflow ⭐ NEW
✅ **Departments** - Department management
✅ **Designations** - Designation management
✅ **Settings** - System configuration

---

## Exit Management Module

The Exit Management module includes:
- **15 sample exit cases** across all workflow states
- Resignation tracking (Submitted → Approved → Notice Period)
- Clearance management (IT, Finance, HR, Admin, Facilities)
- Asset return tracking
- Exit interview scheduling
- Final settlement calculation and approval

### Exit Workflow States:
1. Resignation Submitted (3 cases)
2. Resignation Approved (1 case)
3. Notice Period Active (3 cases)
4. Clearance Initiated (1 case)
5. Clearance In Progress (2 cases)
6. Assets Pending (1 case)
7. Exit Interview Pending (1 case)
8. Exit Interview Completed (1 case)
9. Settlement Calculated (1 case)
10. Settlement Approved (1 case)

---

## Troubleshooting

### If login fails with "invalid credentials":

**STEP 1: Test if backend API is working:**
Open `/test-login.html` in your browser (from project root directory).
Click "Test Login" - if you see ✅ SUCCESS, the backend is fine.

**STEP 2: Use Incognito/Private browsing mode (EASIEST FIX):**
1. Open a new Incognito/Private window in your browser
2. Go to http://localhost:5173
3. Login with: sarah.johnson@acme.com / password123

**STEP 3: If you want to use regular browser, clear ALL cache:**
1. Close ALL browser tabs with localhost:5173
2. Clear browser cache completely (not just hard refresh)
3. Chrome: Settings → Privacy → Clear browsing data → Cached files
4. Firefox: Settings → Privacy → Clear Data → Cached Web Content
5. Safari: Develop → Empty Caches (enable Develop menu first)
6. Then go to http://localhost:5173 again

### If you see "No exit cases found":
1. Make sure backend is running on port 3000
2. Make sure you're logged in to the application
3. Check browser console for API errors
4. Verify database has exit data: `SELECT COUNT(*) FROM exit_cases;`

### If backend won't start:
1. Make sure PostgreSQL is running
2. Check database connection settings in `.env`
3. Check logs for errors

### If frontend won't start:
1. Make sure port 5173 is not in use
2. Run `npm install` if packages are missing
3. Clear browser cache and reload

---

## Clean Restart

To do a complete clean restart:

```bash
# Kill all processes
pkill -f "npm run dev"

# Wait a moment
sleep 2

# Start backend
cd backend && npm run dev &

# Wait for backend to initialize
sleep 5

# Start frontend
cd ../frontend-web && npm run dev &
```

---

## API Documentation

When backend is running, API documentation is available at:
**http://localhost:3000/api/docs**

Health check endpoint:
**http://localhost:3000/health**
