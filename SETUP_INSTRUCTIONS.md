# Local Development Setup Instructions

**System Detected:**
- ✅ macOS
- ✅ Homebrew 5.0.3
- ✅ Node.js v22.19.0
- ❌ PostgreSQL (needs installation)
- ❌ Yarn (needs installation)

Follow these steps to get your development environment running:

---

## Step 1: Install Prerequisites

### Install Yarn
```bash
npm install -g yarn
```

### Install PostgreSQL
```bash
# Install PostgreSQL 15
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add PostgreSQL to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
psql --version
```

---

## Step 2: Create Database

```bash
# Create the database
createdb hrms_saas

# Verify database was created
psql -l | grep hrms_saas

# Optional: Create a dedicated user (recommended for production-like setup)
psql postgres <<EOF
CREATE USER hrms_user WITH PASSWORD 'hrms_password';
GRANT ALL PRIVILEGES ON DATABASE hrms_saas TO hrms_user;
\q
EOF
```

---

## Step 3: Backend Setup

```bash
# Navigate to backend directory
cd /Users/chinar.deshpande06/CD-THG/2025/THG-AI/MyCodingJourney/current-projects/HRMS-SaaS-MVP/backend

# Install dependencies
yarn install

# Create .env file from template
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

**Update these values in `.env`:**
```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms_saas
DB_USER=postgres  # or hrms_user if you created a dedicated user
DB_PASSWORD=      # leave empty for default postgres user, or 'hrms_password' if you created hrms_user

# JWT Configuration (generate a secure secret)
JWT_SECRET=your_super_secret_jwt_key_please_change_this_to_something_random
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Step 4: Frontend Setup

```bash
# Open a new terminal window/tab
cd /Users/chinar.deshpande06/CD-THG/2025/THG-AI/MyCodingJourney/current-projects/HRMS-SaaS-MVP/frontend-web

# Install dependencies
yarn install
```

---

## Step 5: Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
yarn run dev
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 HRMS SaaS API Server Started Successfully        ║
║                                                        ║
║   Environment: development                            ║
║   Port:        3000                                   ║
║   API Version: v1                                     ║
║                                                        ║
║   📚 API Docs: http://localhost:3000/api/docs         ║
║   🏥 Health:   http://localhost:3000/health           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### Terminal 2 - Frontend
```bash
cd frontend-web
yarn run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 6: Verify Setup

### Test Backend
Open in browser: http://localhost:3000/health

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-21T...",
    "environment": "development"
  }
}
```

### Test Frontend
Open in browser: http://localhost:5173

You should see: "Login Page - To be implemented"

### Test API Documentation
Open in browser: http://localhost:3000/api/docs

You should see the Swagger UI interface.

---

## Troubleshooting

### PostgreSQL Connection Error
If you get "connection refused":
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start it if not running
brew services start postgresql@15
```

### Port Already in Use
If port 3000 or 5173 is in use:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules
yarn install

cd ../frontend-web
rm -rf node_modules
yarn install
```

### Database Does Not Exist
```bash
# Recreate database
dropdb hrms_saas  # if it exists
createdb hrms_saas
```

---

## Quick Command Reference

| Action | Command |
|--------|---------|
| Start PostgreSQL | `brew services start postgresql@15` |
| Stop PostgreSQL | `brew services stop postgresql@15` |
| Start Backend | `cd backend && yarn run dev` |
| Start Frontend | `cd frontend-web && yarn run dev` |
| View Logs | `cd backend && tail -f logs/app.log` |
| Run Tests | `cd backend && yarn test` |
| Database Console | `psql hrms_saas` |

---

## Next Steps After Setup

Once everything is running:

1. **Create Database Models** - Start with Tenant and User entities
2. **Implement Authentication** - Build login/register endpoints
3. **Build Login Page** - Create the frontend login UI
4. **Test Authentication** - Verify login flow works end-to-end

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the complete development roadmap.

---

**Need Help?** Check the [QUICKSTART.md](QUICKSTART.md) guide or review the troubleshooting section above.
