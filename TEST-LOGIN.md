# Login Test Instructions

## Problem
Login is failing with "Invalid credentials" even though the API works when tested directly.

## Root Cause
The frontend was cached with the old API URL (port 3001). After changing to port 3000, the browser needs a hard refresh.

## Solution

### 1. **HARD REFRESH YOUR BROWSER** (This is the most likely fix!)

   **On Mac:**
   - Press: `Cmd + Shift + R`

   **On Windows/Linux:**
   - Press: `Ctrl + Shift + R`

   OR

   **Clear Cache Manually:**
   1. Open Developer Tools (F12)
   2. Right-click the refresh button
   3. Select "Empty Cache and Hard Reload"

### 2. Verify Frontend is Using Correct API URL

Open Developer Tools (F12) → Console tab, then run:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

You should see: `http://localhost:3000/api/v1`

If it shows `3001` instead of `3000`, the cache needs to be cleared.

### 3. Test API Connection Directly

Open Developer Tools (F12) → Console tab, then run:
```javascript
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sarah.johnson@acme.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

If this works, you'll see a response with `success: true` and user data.

### 4. Restart Frontend Server (If hard refresh doesn't work)

```bash
# Stop the frontend
# Press Ctrl+C in the terminal running frontend

# Start it again
cd frontend-web
npm run dev
```

Then try logging in again after a hard refresh.

---

## Verified Working Credentials

These credentials are **CONFIRMED WORKING** via direct API test:

```
Email: sarah.johnson@acme.com
Password: password123
```

```
Email: admin.user@acme.com
Password: password123
```

---

## If Still Not Working

1. Check browser console for errors (F12 → Console tab)
2. Check network tab to see if request is being sent (F12 → Network tab)
3. Make sure both servers are running:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

---

## Quick Test via Terminal

Test the API directly (this bypasses the frontend):

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@acme.com","password":"password123"}'
```

If you see `"success":true` in the response, the backend is working correctly and the issue is in the frontend cache.
