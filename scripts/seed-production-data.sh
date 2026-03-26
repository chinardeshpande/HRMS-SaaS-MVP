#!/bin/bash
# Seed production database with initial data
# This creates a test tenant and admin user for production testing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Production database (DigitalOcean)
PROD_HOST="aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com"
PROD_PORT="25060"
PROD_DB="defaultdb"
PROD_USER="doadmin"
PROD_PASSWORD="YOUR_AIVEN_PASSWORD_HERE"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Production Database Seeding${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${GREEN}This will create:${NC}"
echo -e "  - Test Company tenant"
echo -e "  - Admin user (admin@aurorahr.in / Admin@123)"
echo -e "  - Departments, Designations, and Sample Employees"
echo -e ""

read -p "Proceed with seeding? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Seeding cancelled${NC}"
    exit 1
fi

echo -e "\n${GREEN}Connecting to production database...${NC}"

PGPASSWORD=${PROD_PASSWORD} psql \
    -h ${PROD_HOST} \
    -p ${PROD_PORT} \
    -U ${PROD_USER} \
    -d ${PROD_DB} << 'EOF'

-- Check if tenant already exists
DO $$
DECLARE
    tenant_count INTEGER;
    tenant_uuid UUID := 'da4dbd35-f693-4cd4-b904-e7f88ee87125';
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants WHERE "tenantId" = tenant_uuid;

    IF tenant_count = 0 THEN
        -- Create tenant
        INSERT INTO tenants ("tenantId", "companyName", subdomain, "planType", status)
        VALUES (tenant_uuid, 'AuroraHR Demo', 'demo', 'professional', 'active');
        RAISE NOTICE 'Tenant created: AuroraHR Demo';
    ELSE
        RAISE NOTICE 'Tenant already exists';
    END IF;
END $$;

-- Create admin user (password: Admin@123)
DO $$
DECLARE
    user_count INTEGER;
    tenant_uuid UUID := 'da4dbd35-f693-4cd4-b904-e7f88ee87125';
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE email = 'admin@aurorahr.in';

    IF user_count = 0 THEN
        INSERT INTO users ("tenantId", email, password, "firstName", "lastName", role, status)
        VALUES (
            tenant_uuid,
            'admin@aurorahr.in',
            '$2b$10$YourHashedPasswordHere',  -- You'll need to hash Admin@123
            'Admin',
            'User',
            'admin',
            'active'
        );
        RAISE NOTICE 'Admin user created: admin@aurorahr.in';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- Create sample departments
INSERT INTO departments ("tenantId", name)
SELECT 'da4dbd35-f693-4cd4-b904-e7f88ee87125', dept_name
FROM (VALUES
    ('Engineering'),
    ('Human Resources'),
    ('Sales'),
    ('Marketing'),
    ('Finance')
) AS depts(dept_name)
ON CONFLICT ("tenantId", name) DO NOTHING;

-- Create sample designations
INSERT INTO designations ("tenantId", name, level)
SELECT 'da4dbd35-f693-4cd4-b904-e7f88ee87125', desig_name, desig_level
FROM (VALUES
    ('CEO', 1),
    ('VP Engineering', 2),
    ('Engineering Manager', 3),
    ('Senior Software Engineer', 4),
    ('Software Engineer', 5),
    ('HR Manager', 3),
    ('HR Executive', 5),
    ('Sales Manager', 3),
    ('Sales Executive', 5)
) AS desigs(desig_name, desig_level)
ON CONFLICT ("tenantId", name) DO NOTHING;

SELECT '✅ Production database seeded successfully!' as status;

EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Seeding completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Admin credentials:"
echo -e "  Email: ${YELLOW}admin@aurorahr.in${NC}"
echo -e "  Password: ${YELLOW}Admin@123${NC}"
echo -e "${GREEN}========================================${NC}"
