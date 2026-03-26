#!/bin/bash

# ==================================
# Database Backup Script
# ==================================
# Creates timestamped PostgreSQL database backups
# Can be run manually or via cron job

set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="/var/www/hrms-app/backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="hrms_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# S3 Configuration (optional - for cloud backups)
S3_BACKUP=${S3_BACKUP_ENABLED:-false}
S3_BUCKET=${BACKUP_S3_BUCKET:-hrms-app-backups}

echo "========================================"
echo "HRMS Database Backup"
echo "========================================"
echo "Timestamp: $(date)"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Perform backup
echo "Creating database backup..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Upload to S3 if enabled
if [ "${S3_BACKUP}" = "true" ]; then
    echo "Uploading to S3..."
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/database/${BACKUP_FILE}" \
            --storage-class STANDARD_IA
        echo "✅ Backup uploaded to S3: s3://${S3_BUCKET}/database/${BACKUP_FILE}"
    else
        echo "⚠️  AWS CLI not installed. Skipping S3 upload."
    fi
fi

# Remove old backups
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "hrms_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "✅ Cleanup complete"

# Remove old S3 backups if enabled
if [ "${S3_BACKUP}" = "true" ] && command -v aws &> /dev/null; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    echo "Cleaning up old S3 backups (older than ${CUTOFF_DATE})..."
    aws s3 ls "s3://${S3_BUCKET}/database/" | while read -r line; do
        FILE_DATE=$(echo $line | awk '{print $1}')
        FILE_NAME=$(echo $line | awk '{print $4}')
        if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
            aws s3 rm "s3://${S3_BUCKET}/database/${FILE_NAME}"
            echo "Deleted: ${FILE_NAME}"
        fi
    done
fi

echo ""
echo "========================================"
echo "Backup Summary"
echo "========================================"
echo "Latest backup: ${BACKUP_FILE}"
echo "Location: ${BACKUP_DIR}"
if [ "${S3_BACKUP}" = "true" ]; then
    echo "S3 Location: s3://${S3_BUCKET}/database/"
fi
echo ""

# List recent backups
echo "Recent local backups:"
ls -lh "${BACKUP_DIR}" | tail -n 5
echo ""

echo "✅ Backup completed successfully!"
