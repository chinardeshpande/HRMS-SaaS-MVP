#!/bin/bash

# ==================================
# SSL Certificate Setup Script
# ==================================
# This script obtains SSL certificates from Let's Encrypt
# Run this after your domain DNS is pointing to the server

set -e

echo "========================================"
echo "SSL Certificate Setup (Let's Encrypt)"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Prompt for domain name
read -p "Enter your domain name (e.g., hrms-app.com): " DOMAIN
read -p "Enter www subdomain (www.$DOMAIN) [Y/n]: " ADD_WWW

# Validate domain
if [ -z "$DOMAIN" ]; then
    echo "Error: Domain name cannot be empty"
    exit 1
fi

# Build certbot command
CERTBOT_CMD="certbot --nginx -d $DOMAIN"

if [ "$ADD_WWW" != "n" ] && [ "$ADD_WWW" != "N" ]; then
    CERTBOT_CMD="$CERTBOT_CMD -d www.$DOMAIN"
fi

# Prompt for email
read -p "Enter your email address for certificate renewal notifications: " EMAIL

if [ -z "$EMAIL" ]; then
    echo "Error: Email cannot be empty"
    exit 1
fi

CERTBOT_CMD="$CERTBOT_CMD --email $EMAIL --agree-tos --no-eff-email"

echo ""
echo "About to run:"
echo "$CERTBOT_CMD"
echo ""
read -p "Continue? [Y/n]: " CONFIRM

if [ "$CONFIRM" == "n" ] || [ "$CONFIRM" == "N" ]; then
    echo "Aborted"
    exit 0
fi

# Stop nginx if running
echo "Stopping Nginx..."
systemctl stop nginx || true

# Run certbot
echo "Obtaining SSL certificate..."
$CERTBOT_CMD

# Start nginx
echo "Starting Nginx..."
systemctl start nginx

echo ""
echo "========================================"
echo "✅ SSL Certificate obtained successfully!"
echo "========================================"
echo ""
echo "Certificate details:"
echo "  Domain: $DOMAIN"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "Certificate will auto-renew via cron job"
echo "Test renewal: certbot renew --dry-run"
echo ""
echo "Next steps:"
echo "  1. Update your Nginx configuration to use SSL"
echo "  2. Update environment variables (BACKEND_URL, FRONTEND_URL)"
echo "  3. Deploy your application"
echo ""
