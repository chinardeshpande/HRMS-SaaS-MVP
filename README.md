# HRMS SaaS MVP

A modern, multi-tenant HRMS (Human Resource Management System) SaaS platform built to cover the entire employee lifecycle from onboarding to exit.

## Overview

This platform targets small to mid-size companies with a focus on:
- Easy onboarding and simple implementation
- Modern, minimalist user experience
- Multi-tenant architecture with strict data isolation
- API-first design with OpenAPI/Swagger documentation
- Role-based access control (RBAC)
- Comprehensive audit logging

## Tech Stack

### Frontend
- **Web**: React + TypeScript + Vite
- **Mobile**: React Native + TypeScript
- **UI Library**: Material-UI (MUI) / Ant Design
- **State Management**: React Context API / Redux
- **Form Management**: React Hook Form + Yup validation

### Backend
- **Runtime**: Node.js + Express.js
- **Language**: TypeScript
- **ORM**: TypeORM / Sequelize
- **Authentication**: JWT-based
- **API Documentation**: Swagger/OpenAPI

### Database
- **Primary**: PostgreSQL
- **Multi-tenancy**: Shared database with row-level isolation

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose
- **Hosting**: VPS / Cloud (AWS, GCP, Azure compatible)

## Project Structure

```
HRMS-SaaS-MVP/
├── backend/              # Express + TypeScript API
├── frontend-web/         # React web application
├── mobile-app/           # React Native mobile app
├── shared/               # Shared types and utilities
├── docs/                 # Documentation
├── docker/               # Docker configuration
└── .github/workflows/    # CI/CD pipelines
```

## Core Modules (MVP)

### ✅ Implemented Modules

1. **Attendance Management** ✅
   - Clock in/out tracking with geolocation support
   - Manual attendance entry and regularization
   - Biometric device integration
   - Real-time attendance monitoring
   - Late arrival and early departure tracking
   - Overtime calculation
   - Mass updates and bulk imports
   - Company-wide, team, and individual views
   - Export to CSV

2. **Leave Management** ✅
   - Leave application and approval workflow
   - Multiple leave types (Annual, Sick, Casual, Maternity, etc.)
   - Leave balance tracking
   - Manager approval workflow
   - Team leave calendar
   - Company-wide leave analytics
   - Export to CSV

3. **Performance Management (PMS)** ✅
   - Goal setting and tracking
   - Goal approval workflow (employee submits, manager approves)
   - Multi-dimensional performance reviews
   - Continuous feedback system
   - Review cycle management
   - Team performance dashboard
   - Company-wide analytics

4. **Employee Master** ✅
   - Comprehensive employee profiles
   - Department and designation management
   - Employee search and filtering
   - Role-based access control

5. **Dashboard** ✅
   - Role-specific dashboards
   - Quick stats and metrics
   - Recent activity tracking
   - Pending approvals summary

### 🚧 Planned Modules

6. **Onboarding** - Pre-joining candidate management
7. **Transfer & Promotion** - Internal movement workflows
8. **Confirmation** - Probation period management
9. **Exit & Offboarding** - Resignation and clearance
10. **Reports** - Advanced analytics and insights
11. **Admin Configuration** - Master data and settings

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Yarn or npm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd HRMS-SaaS-MVP
```

2. Install dependencies
```bash
# Backend
cd backend
yarn install

# Frontend Web
cd ../frontend-web
yarn install

# Mobile App
cd ../mobile-app
yarn install
```

3. Configure environment variables
```bash
# Copy example env file
cp backend/.env.example backend/.env
# Edit with your configuration
```

4. Run database migrations
```bash
cd backend
yarn run migrate
```

5. Start development servers
```bash
# Backend (Terminal 1)
cd backend
yarn run dev

# Frontend Web (Terminal 2)
cd frontend-web
yarn run dev

# Mobile App (Terminal 3)
cd mobile-app
yarn start
```

6. Seed test data (optional)
```bash
cd backend
npx ts-node src/scripts/seedTestData.ts
```

### Test Credentials

After seeding the database, you can login with these credentials:

**System Administrator**
- Email: `admin.user@acme.com`
- Password: `password123`
- Role: SYSTEM_ADMIN
- Access: All modules and features

**HR Administrator**
- Email: `sarah.johnson@acme.com`
- Password: `password123`
- Role: HR_ADMIN
- Access: All HR functions, company-wide analytics

**Manager**
- Email: `john.smith@acme.com`
- Password: `password123`
- Role: MANAGER
- Department: Engineering (VP Engineering)
- Access: Team management, approvals, team performance reviews

**Employee**
- Email: `alice.williams@acme.com`
- Password: `password123`
- Role: EMPLOYEE
- Department: Engineering
- Access: Self-service features (attendance, leave, performance)

## Features

### Authentication & Security
- JWT-based authentication
- Role-based access control (Employee, Manager, HR Admin)
- Multi-tenant data isolation
- Comprehensive audit logging
- GDPR-ready design

### User Roles
- **Employee** - Self-service access to attendance, leave, profile
- **Manager** - Team management, approvals, reporting
- **HR Admin** - Full HR operations access
- **System Admin** - Platform configuration and tenant management

### Multi-Tenancy
- Shared database with tenant_id isolation
- Configurable per-tenant settings
- Tenant-specific branding support
- Subdomain-based tenant identification

## API Documentation

Once the backend is running, access the Swagger UI at:
```
http://localhost:3000/api/docs
```

## Testing

```bash
# Backend tests
cd backend
yarn test

# Frontend tests
cd frontend-web
yarn test

# Run all tests
yarn test:all
```

## Deployment

Refer to [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

### Phase 1 (MVP) - Current
- Core HR modules (Onboarding to Exit)
- Web and mobile applications
- Basic reporting

### Phase 2 (Future)
- Payroll integration
- Recruitment/ATS module
- Advanced analytics
- SSO/SAML support
- Mobile push notifications

### Phase 3 (Future)
- AI-powered insights
- Custom workflow builder
- Advanced integrations
- White-label options

## Support

For support, email support@hrms-saas.com or create an issue in the repository.
