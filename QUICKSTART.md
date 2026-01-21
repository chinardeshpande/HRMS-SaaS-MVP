# Quick Start Guide

Get the HRMS SaaS MVP up and running in minutes!

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 13+ ([Download](https://www.postgresql.org/download/))
- **Yarn** (recommended) or npm
- **Git**

Optional:
- **Docker** and **Docker Compose** (for containerized setup)

## Installation Options

Choose one of the following installation methods:

### Option 1: Docker Setup (Easiest)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HRMS-SaaS-MVP
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   docker-compose exec backend yarn run migrate
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Swagger UI: http://localhost:3000/api/docs

That's it! The application is now running with PostgreSQL, backend, and frontend all configured.

### Option 2: Local Setup (More Control)

#### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd HRMS-SaaS-MVP
```

#### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL** (if not already running)
   ```bash
   # macOS (using Homebrew)
   brew services start postgresql@15

   # Linux
   sudo systemctl start postgresql

   # Windows - use pgAdmin or command line
   ```

2. **Create the database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database and user
   CREATE DATABASE hrms_saas;
   CREATE USER hrms_user WITH PASSWORD 'hrms_password';
   GRANT ALL PRIVILEGES ON DATABASE hrms_saas TO hrms_user;
   \q
   ```

#### Step 3: Set Up Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your database credentials
   ```bash
   # Open in your favorite editor
   nano .env
   # or
   code .env
   ```

   Update these values:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hrms_saas
   DB_USER=hrms_user
   DB_PASSWORD=hrms_password
   JWT_SECRET=your_secure_random_string_here
   ```

5. **Run database migrations**
   ```bash
   yarn run migrate
   ```

6. **Start the backend server**
   ```bash
   yarn run dev
   ```

   Backend should now be running on http://localhost:3000

#### Step 4: Set Up Frontend Web

Open a new terminal window/tab:

1. **Navigate to frontend directory**
   ```bash
   cd frontend-web
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   yarn run dev
   ```

   Frontend should now be running on http://localhost:5173

#### Step 5: Set Up Mobile App (Optional)

Open another terminal window/tab:

1. **Navigate to mobile directory**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Start Expo**
   ```bash
   yarn start
   ```

4. **Run on device/simulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on physical device

## Verify Installation

### Check Backend
Open http://localhost:3000/api/v1/health in your browser.

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-21T12:00:00Z"
  }
}
```

### Check Swagger Documentation
Open http://localhost:3000/api/docs to see interactive API documentation.

### Check Frontend
Open http://localhost:5173 in your browser. You should see the login page.

## Initial Data Setup

### Create First Tenant (Company)

You can use the Swagger UI or make a direct API call:

```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Demo Company",
    "subdomain": "demo",
    "planType": "basic"
  }'
```

### Create First Admin User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@democompany.com",
    "password": "Admin@123",
    "fullName": "Admin User",
    "role": "admin",
    "tenantId": "<tenant-id-from-previous-step>"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@democompany.com",
    "password": "Admin@123"
  }'
```

You'll receive a JWT token. Use this token in the `Authorization` header for subsequent requests:
```
Authorization: Bearer <your-jwt-token>
```

## Common Development Tasks

### Running Tests

```bash
# Backend tests
cd backend
yarn test

# Frontend tests
cd frontend-web
yarn test

# Mobile tests
cd mobile-app
yarn test
```

### Database Operations

```bash
# Run migrations
cd backend
yarn run migrate

# Seed database with sample data
yarn run seed

# Reset database (careful!)
yarn run db:reset
```

### Linting and Formatting

```bash
# Backend
cd backend
yarn run lint
yarn run format

# Frontend
cd frontend-web
yarn run lint
yarn run format
```

### Building for Production

```bash
# Backend
cd backend
yarn run build

# Frontend
cd frontend-web
yarn run build
```

## Troubleshooting

### Port Already in Use

If you see "Port 3000 already in use" or similar:

```bash
# Find and kill the process using the port
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Failed

1. Ensure PostgreSQL is running
2. Check credentials in `.env` file
3. Verify database exists: `psql -U postgres -l`
4. Check firewall settings

### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules
yarn install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
yarn run build
```

## Next Steps

1. **Explore the API** - Visit http://localhost:3000/api/docs
2. **Read the Documentation** - Check out [docs/](docs/) folder
3. **Review Database Schema** - See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
4. **Understand the Architecture** - Read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
5. **Start Coding** - Pick a module and start implementing!

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/employee-onboarding
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   yarn test
   yarn run lint
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: implement employee onboarding module"
   git push origin feature/employee-onboarding
   ```

5. **Create a pull request**
   - Open PR on GitHub
   - Wait for CI/CD checks
   - Request code review

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && yarn run dev` |
| Start frontend | `cd frontend-web && yarn run dev` |
| Start mobile | `cd mobile-app && yarn start` |
| Run all tests | `yarn test:all` |
| Database migrate | `cd backend && yarn run migrate` |
| View logs | `docker-compose logs -f` |
| Stop all services | `docker-compose down` |
| Rebuild containers | `docker-compose up -d --build` |

## Getting Help

- **Documentation**: Check the [docs/](docs/) folder
- **API Reference**: http://localhost:3000/api/docs
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions

## Resources

- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Material-UI Documentation](https://mui.com/)

---

Happy coding! 🚀
