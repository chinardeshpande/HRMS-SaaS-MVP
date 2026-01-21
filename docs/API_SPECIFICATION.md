# API Specification

## Base URL
```
Production: https://api.hrms-saas.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API requests (except login/register) require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "uuid",
      "email": "user@company.com",
      "fullName": "John Doe",
      "role": "employee",
      "tenantId": "uuid"
    }
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

#### POST /auth/logout
Logout and invalidate token.

## Multi-Tenancy

Tenant context is automatically extracted from the JWT token. All requests are scoped to the authenticated user's tenant.

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## API Endpoints

### 1. Onboarding

#### POST /onboarding/candidates
Create a new candidate and send offer.

**Request:**
```json
{
  "fullName": "Jane Smith",
  "personalEmail": "jane@email.com",
  "phone": "1234567890",
  "positionOffered": "Software Engineer",
  "departmentId": "uuid",
  "designationId": "uuid",
  "managerId": "uuid",
  "expectedJoinDate": "2025-02-01"
}
```

#### GET /onboarding/candidates
List all candidates with filters.

**Query Params:**
- status: offer_released | documents_pending | ready_to_join
- page: 1
- limit: 20

#### GET /onboarding/candidates/:id
Get candidate details.

#### POST /onboarding/candidates/:id/documents
Upload candidate documents.

**Request:** Multipart form-data
- documentType: aadhaar | pan | certificates
- file: File upload

#### POST /onboarding/candidates/:id/convert
Convert candidate to employee.

### 2. Employee Master

#### GET /employees
List all employees.

**Query Params:**
- departmentId
- status: active | inactive | exited
- search: name or email
- page, limit

#### POST /employees
Create new employee.

#### GET /employees/:id
Get employee profile with all details.

**Response:**
```json
{
  "success": true,
  "data": {
    "employeeId": "uuid",
    "employeeCode": "E123",
    "fullName": "John Doe",
    "email": "john@company.com",
    "department": {
      "id": "uuid",
      "name": "Engineering"
    },
    "designation": {
      "id": "uuid",
      "name": "Senior Engineer"
    },
    "personalInfo": {
      "phone": "1234567890",
      "dateOfBirth": "1990-05-20",
      "address": "..."
    },
    "attendanceSummary": {
      "totalDays": 220,
      "present": 210,
      "absent": 5
    },
    "leaveBalance": {
      "CL": 2,
      "PL": 5,
      "SL": 7
    }
  }
}
```

#### PUT /employees/:id
Update employee information.

#### GET /employees/:id/attendance
Get employee attendance history.

#### GET /employees/:id/leaves
Get employee leave history.

### 3. Attendance Management

#### POST /attendance/punch
Clock in or clock out.

**Request:**
```json
{
  "action": "in" | "out",
  "timestamp": "2025-01-21T09:00:00Z",
  "remarks": "optional"
}
```

#### GET /attendance/logs
Get attendance logs.

**Query Params:**
- employeeId: filter by employee
- startDate, endDate: date range
- page, limit

#### GET /attendance/today
Get today's attendance summary.

### 4. Leave Management

#### GET /leaves/types
Get all leave types.

#### POST /leaves/apply
Apply for leave.

**Request:**
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2025-02-01",
  "endDate": "2025-02-03",
  "days": 3,
  "isHalfDay": false,
  "reason": "Personal work"
}
```

#### GET /leaves/applications
Get leave applications.

**Query Params:**
- status: pending | approved | rejected
- employeeId
- managerId

#### POST /leaves/:id/approve
Approve leave request.

#### POST /leaves/:id/reject
Reject leave request.

**Request:**
```json
{
  "comments": "Reason for rejection"
}
```

#### GET /leaves/balance
Get leave balance for current user.

### 5. Performance Management

#### GET /pms/cycles
List performance cycles.

#### POST /pms/goals
Create a new goal.

**Request:**
```json
{
  "cycleId": "uuid",
  "title": "Complete project X",
  "description": "...",
  "weightage": 30,
  "targetDate": "2025-06-30"
}
```

#### GET /pms/goals
Get goals (filtered by employee/cycle).

#### POST /pms/review
Submit performance review.

**Request:**
```json
{
  "employeeId": "uuid",
  "cycleId": "uuid",
  "selfRating": 4,
  "managerRating": 4,
  "managerComments": "Good performance"
}
```

### 6. Transfer & Promotion

#### POST /transfer/initiate
Initiate transfer or promotion.

**Request:**
```json
{
  "employeeId": "uuid",
  "newDepartmentId": "uuid",
  "newDesignationId": "uuid",
  "effectiveDate": "2025-03-01",
  "reason": "Promotion for excellent performance"
}
```

#### GET /transfer/pending
Get pending transfers.

#### POST /transfer/:id/approve
Approve transfer/promotion.

#### POST /transfer/:id/reject
Reject transfer/promotion.

### 7. Confirmation

#### GET /confirmation/pending
Get employees pending confirmation.

#### POST /confirmation/:employeeId
Submit confirmation decision.

**Request:**
```json
{
  "decision": "confirm" | "extend" | "terminate",
  "performanceRating": 4,
  "hrRemarks": "...",
  "newProbationEndDate": "2025-08-01"
}
```

### 8. Exit & Offboarding

#### POST /exit/resign
Submit resignation.

**Request:**
```json
{
  "noticeDate": "2025-01-21",
  "lastWorkingDay": "2025-02-21",
  "reason": "Better opportunity"
}
```

#### GET /exit/pending
Get pending resignations.

#### POST /exit/:employeeId/accept
Accept resignation and initiate clearance.

#### GET /exit/:resignId/clearance
Get clearance checklist.

#### POST /exit/:resignId/clearance/:clearanceId
Mark clearance item as cleared.

### 9. Reports

#### GET /reports/attendance
Get attendance report.

**Query Params:**
- month: 2025-01
- departmentId
- format: json | csv

#### GET /reports/leaves
Get leave report.

#### GET /reports/headcount
Get headcount report.

#### GET /reports/pms
Get PMS report.

### 10. Admin Configuration

#### GET /admin/departments
List departments.

#### POST /admin/departments
Create department.

#### PUT /admin/departments/:id
Update department.

#### DELETE /admin/departments/:id
Delete department.

#### GET /admin/designations
List designations.

#### POST /admin/designations
Create designation.

#### GET /admin/leave-types
List leave types.

#### POST /admin/leave-types
Create leave type.

#### GET /admin/shifts
List shift timings.

#### POST /admin/shifts
Create shift.

#### GET /admin/roles
List roles and permissions.

#### PUT /admin/roles/:id
Update role permissions.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |
| TENANT_MISMATCH | 403 | Attempted cross-tenant access |

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authenticated: 1000 requests per 15 minutes per user

## Pagination

All list endpoints support pagination:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)

Response includes meta information:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## File Uploads

File uploads use multipart/form-data:
- Max file size: 5MB
- Allowed types: PDF, JPG, PNG, DOC, DOCX

## Webhooks (Future)

Webhook support for events:
- employee.created
- leave.approved
- resignation.submitted
- etc.
