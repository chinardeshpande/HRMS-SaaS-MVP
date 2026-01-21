# Database Schema Design

## Overview
This document outlines the PostgreSQL database schema for the HRMS SaaS MVP. The schema implements multi-tenancy using a shared database with row-level isolation via `tenant_id` columns.

## Multi-Tenancy Strategy
- **Approach**: Shared database, shared schema with row-level isolation
- **Isolation Method**: Every table includes a `tenant_id` column
- **Enforcement**: Application-level filtering + PostgreSQL Row-Level Security (RLS) policies

## Core Tables

### 1. Tenant Management

#### tenants
Master table for each company (tenant) in the system.

```sql
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    plan_type VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    logo_url TEXT,
    primary_color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Authentication & Authorization

#### users
Stores login credentials and user profile information.

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    employee_id UUID REFERENCES employees(employee_id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

### 3. Master Data

#### departments
Organizational departments with hierarchy support.

```sql
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(255) NOT NULL,
    parent_dept_id UUID REFERENCES departments(department_id),
    head_employee_id UUID REFERENCES employees(employee_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
```

#### designations
Job titles and positions.

```sql
CREATE TABLE designations (
    designation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(255) NOT NULL,
    level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_designations_tenant ON designations(tenant_id);
```

### 4. Employee Management

#### employees
Core employee master data.

```sql
CREATE TABLE employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,

    -- Job Information
    department_id UUID REFERENCES departments(department_id),
    designation_id UUID REFERENCES designations(designation_id),
    manager_id UUID REFERENCES employees(employee_id),
    date_of_joining DATE NOT NULL,
    probation_end_date DATE,
    employment_type VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'active',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, employee_code),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
```

### 5. Onboarding

#### candidates
Pre-joining candidate records.

```sql
CREATE TABLE candidates (
    candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    full_name VARCHAR(255) NOT NULL,
    personal_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    position_offered VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(department_id),
    designation_id UUID REFERENCES designations(designation_id),
    manager_id UUID REFERENCES employees(employee_id),

    offer_date DATE,
    expected_join_date DATE,
    actual_join_date DATE,

    status VARCHAR(50) DEFAULT 'offer_released',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_candidates_tenant ON candidates(tenant_id);
CREATE INDEX idx_candidates_status ON candidates(status);
```

#### candidate_documents
Documents uploaded during onboarding.

```sql
CREATE TABLE candidate_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    candidate_id UUID NOT NULL REFERENCES candidates(candidate_id),
    document_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_candidate_docs_tenant ON candidate_documents(tenant_id);
CREATE INDEX idx_candidate_docs_candidate ON candidate_documents(candidate_id);
```

### 6. Attendance Management

#### attendance_records
Daily attendance tracking.

```sql
CREATE TABLE attendance_records (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    date DATE NOT NULL,
    punch_in TIMESTAMP,
    punch_out TIMESTAMP,
    work_hours DECIMAL(5,2),
    status VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, employee_id, date)
);

CREATE INDEX idx_attendance_tenant ON attendance_records(tenant_id);
CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
```

### 7. Leave Management

#### leave_types
Master data for leave categories.

```sql
CREATE TABLE leave_types (
    leave_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    annual_allocation INTEGER NOT NULL,
    carry_forward_allowed BOOLEAN DEFAULT false,
    max_carry_forward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_leave_types_tenant ON leave_types(tenant_id);
```

#### leave_applications
Employee leave requests.

```sql
CREATE TABLE leave_applications (
    leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(leave_type_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days DECIMAL(3,1) NOT NULL,
    is_half_day BOOLEAN DEFAULT false,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,
    manager_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_apps_tenant ON leave_applications(tenant_id);
CREATE INDEX idx_leave_apps_employee ON leave_applications(employee_id);
CREATE INDEX idx_leave_apps_status ON leave_applications(status);
```

### 8. Performance Management

#### performance_cycles
Review periods.

```sql
CREATE TABLE performance_cycles (
    cycle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perf_cycles_tenant ON performance_cycles(tenant_id);
```

#### goals
Employee goals and objectives.

```sql
CREATE TABLE goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    cycle_id UUID NOT NULL REFERENCES performance_cycles(cycle_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weightage INTEGER,
    target_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_tenant ON goals(tenant_id);
CREATE INDEX idx_goals_employee ON goals(employee_id);
```

#### performance_reviews
Performance review records.

```sql
CREATE TABLE performance_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    cycle_id UUID NOT NULL REFERENCES performance_cycles(cycle_id),
    manager_id UUID NOT NULL REFERENCES employees(employee_id),
    self_rating INTEGER,
    manager_rating INTEGER,
    manager_comments TEXT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perf_reviews_tenant ON performance_reviews(tenant_id);
CREATE INDEX idx_perf_reviews_employee ON performance_reviews(employee_id);
```

### 9. Transfer & Promotion

#### promotions
Transfer and promotion records.

```sql
CREATE TABLE promotions (
    promotion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    new_designation_id UUID REFERENCES designations(designation_id),
    new_department_id UUID REFERENCES departments(department_id),
    effective_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    initiated_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_tenant ON promotions(tenant_id);
CREATE INDEX idx_promotions_employee ON promotions(employee_id);
CREATE INDEX idx_promotions_status ON promotions(status);
```

### 10. Confirmation (Probation)

#### confirmation_reviews
Probation period confirmation records.

```sql
CREATE TABLE confirmation_reviews (
    confirm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    review_date DATE NOT NULL,
    performance_rating INTEGER,
    hr_remarks TEXT,
    decision VARCHAR(50),
    new_probation_end_date DATE,
    decided_at TIMESTAMP,
    decided_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_confirmations_tenant ON confirmation_reviews(tenant_id);
CREATE INDEX idx_confirmations_employee ON confirmation_reviews(employee_id);
```

### 11. Exit Management

#### resignations
Employee resignation records.

```sql
CREATE TABLE resignations (
    resign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID NOT NULL REFERENCES employees(employee_id),
    notice_date DATE NOT NULL,
    last_working_day DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_resignations_tenant ON resignations(tenant_id);
CREATE INDEX idx_resignations_employee ON resignations(employee_id);
CREATE INDEX idx_resignations_status ON resignations(status);
```

#### exit_clearance
Exit clearance checklist items.

```sql
CREATE TABLE exit_clearance (
    clearance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    resign_id UUID NOT NULL REFERENCES resignations(resign_id),
    department_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    cleared_by UUID REFERENCES users(user_id),
    cleared_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exit_clearance_tenant ON exit_clearance(tenant_id);
CREATE INDEX idx_exit_clearance_resign ON exit_clearance(resign_id);
```

### 12. Document Management

#### documents
General document storage.

```sql
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    employee_id UUID REFERENCES employees(employee_id),
    document_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_employee ON documents(employee_id);
```

### 13. Audit Logging

#### audit_logs
Comprehensive audit trail.

```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

## Row-Level Security (RLS)

Enable RLS on all tenant-scoped tables:

```sql
-- Example for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employees
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

## Indexes

All tables with `tenant_id` have indexes for performance. Additional indexes are created on:
- Foreign keys
- Status fields
- Date fields used in queries
- Frequently filtered columns

## Database Functions

### Update timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Apply to all tables with `updated_at`:
```sql
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Migration Strategy

1. Create initial schema with all tables
2. Add indexes
3. Enable RLS policies
4. Add triggers
5. Seed master data (default leave types, etc.)
