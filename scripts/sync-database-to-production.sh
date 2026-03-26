#!/bin/bash
# Sync database schema from local to production
# This script dumps the local schema and applies it to production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Local database
LOCAL_DB="hrms_saas"
LOCAL_USER="chinar.deshpande06"

# Production database (DigitalOcean)
PROD_HOST="aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com"
PROD_PORT="25060"
PROD_DB="defaultdb"
PROD_USER="doadmin"
PROD_PASSWORD="YOUR_AIVEN_PASSWORD_HERE"

echo -e "${RED}========================================${NC}"
echo -e "${RED}WARNING: PRODUCTION DATABASE SYNC${NC}"
echo -e "${RED}========================================${NC}"
echo -e "${YELLOW}This will update the production database schema.${NC}"
echo -e "${YELLOW}Data will be preserved, but schema changes will be applied.${NC}"
echo -e ""

read -p "Are you ABSOLUTELY SURE you want to proceed? (type 'SYNC' to confirm): " confirm
if [ "$confirm" != "SYNC" ]; then
    echo -e "${RED}Sync cancelled${NC}"
    exit 1
fi

echo -e "\n${GREEN}Step 1: Dumping local schema (structure only, no data)...${NC}"
pg_dump -h localhost -U ${LOCAL_USER} -d ${LOCAL_DB} \
    --schema-only \
    --no-owner \
    --no-privileges \
    -f /tmp/schema_dump.sql

echo -e "${GREEN}✅ Schema dumped to /tmp/schema_dump.sql${NC}"

echo -e "\n${GREEN}Step 2: Creating backup of production schema...${NC}"
PGPASSWORD=${PROD_PASSWORD} pg_dump \
    -h ${PROD_HOST} \
    -p ${PROD_PORT} \
    -U ${PROD_USER} \
    -d ${PROD_DB} \
    --schema-only \
    --no-owner \
    --no-privileges \
    -f /tmp/prod_schema_backup.sql

echo -e "${GREEN}✅ Production schema backed up to /tmp/prod_schema_backup.sql${NC}"

echo -e "\n${YELLOW}Step 3: Applying schema to production...${NC}"
echo -e "${YELLOW}This may take a few moments...${NC}"

PGPASSWORD=${PROD_PASSWORD} psql \
    -h ${PROD_HOST} \
    -p ${PROD_PORT} \
    -U ${PROD_USER} \
    -d ${PROD_DB} \
    -f /tmp/schema_dump.sql \
    2>&1 | grep -v "already exists" || true

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Schema sync completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Local schema dump: /tmp/schema_dump.sql"
echo -e "Production backup: /tmp/prod_schema_backup.sql"
echo -e "${GREEN}========================================${NC}"
