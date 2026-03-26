#!/bin/bash

# ==================================
# Database Restore Script
# ==================================
# Restores PostgreSQL database from backup
# WARNING: This will overwrite the existing database!

set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="/var/www/hrms-app/backups/database"

echo "========================================"
echo "HRMS Database Restore"
echo "========================================"
echo "⚠️  WARNING: This will OVERWRITE the existing database!"
echo "Database: ${DB_NAME}"
echo ""

# Check if backup directory exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo "❌ Backup directory not found: ${BACKUP_DIR}"
    exit 1
fi

# List available backups
echo "Available backups:"
echo ""
ls -lh "${BACKUP_DIR}" | grep "hrms_backup_" | awk '{print NR") " $9 " (" $5 ")"}'
echo ""

# Prompt for backup file
read -p "Enter the number of the backup to restore (or filename): " BACKUP_CHOICE

# Determine backup file
if [[ "$BACKUP_CHOICE" =~ ^[0-9]+$ ]]; then
    # User entered a number
    BACKUP_FILE=$(ls "${BACKUP_DIR}" | grep "hrms_backup_" | sed -n "${BACKUP_CHOICE}p")
else
    # User entered a filename
    BACKUP_FILE="$BACKUP_CHOICE"
fi

# Check if backup file exists
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo ""
echo "Selected backup: ${BACKUP_FILE}"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}"
echo ""

# Final confirmation
read -p "Are you ABSOLUTELY sure you want to restore? This will DELETE all current data! (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create a safety backup before restore
echo ""
echo "Creating safety backup of current database..."
SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"

echo "✅ Safety backup created: ${SAFETY_BACKUP}"
echo ""

# Perform restore
echo "Restoring database from ${BACKUP_FILE}..."
gunzip < "${BACKUP_DIR}/${BACKUP_FILE}" | \
    PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -v ON_ERROR_STOP=1

echo ""
echo "========================================"
echo "✅ Database restored successfully!"
echo "========================================"
echo ""
echo "Restored from: ${BACKUP_FILE}"
echo "Safety backup: ${SAFETY_BACKUP}"
echo ""
echo "⚠️  Remember to:"
echo "  1. Restart your application"
echo "  2. Run database migrations if needed"
echo "  3. Clear application caches"
echo "  4. Test critical functionality"
echo ""
