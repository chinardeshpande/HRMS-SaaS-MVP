#!/bin/bash

# ==================================
# Automated Backup Setup Script
# ==================================
# Sets up cron jobs for automated database backups

set -e

echo "========================================"
echo "Automated Backup Setup"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the application directory
APP_DIR="/var/www/hrms-app"
BACKUP_SCRIPT="${APP_DIR}/scripts/backup-database.sh"

# Check if backup script exists
if [ ! -f "${BACKUP_SCRIPT}" ]; then
    echo "❌ Backup script not found: ${BACKUP_SCRIPT}"
    exit 1
fi

# Make sure backup script is executable
chmod +x "${BACKUP_SCRIPT}"

echo "Backup script: ${BACKUP_SCRIPT}"
echo ""
echo "Select backup schedule:"
echo "1) Daily at 2:00 AM"
echo "2) Every 6 hours"
echo "3) Every 12 hours"
echo "4) Custom schedule"
echo ""
read -p "Enter your choice (1-4): " CHOICE

# Determine cron schedule
case $CHOICE in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="Every 6 hours"
        ;;
    3)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="Every 12 hours"
        ;;
    4)
        echo ""
        echo "Enter custom cron schedule (e.g., '0 3 * * *' for daily at 3 AM):"
        read -p "Cron schedule: " CRON_SCHEDULE
        DESCRIPTION="Custom: ${CRON_SCHEDULE}"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Schedule: ${DESCRIPTION}"
echo "Cron: ${CRON_SCHEDULE}"
echo ""
read -p "Continue? [Y/n]: " CONFIRM

if [ "$CONFIRM" == "n" ] || [ "$CONFIRM" == "N" ]; then
    echo "Aborted"
    exit 0
fi

# Create cron job
CRON_JOB="${CRON_SCHEDULE} cd ${APP_DIR} && ${BACKUP_SCRIPT} >> /var/log/hrms-backup.log 2>&1"

# Add to root's crontab
(crontab -l 2>/dev/null | grep -v "backup-database.sh"; echo "${CRON_JOB}") | crontab -

echo ""
echo "========================================"
echo "✅ Automated backups configured!"
echo "========================================"
echo ""
echo "Schedule: ${DESCRIPTION}"
echo "Log file: /var/log/hrms-backup.log"
echo ""
echo "Current crontab:"
crontab -l | grep "backup-database.sh"
echo ""
echo "To view backup logs:"
echo "  tail -f /var/log/hrms-backup.log"
echo ""
echo "To modify or remove:"
echo "  crontab -e"
echo ""
