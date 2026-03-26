#!/bin/bash

# Fix backend .env.production with correct database credentials

cat > /var/www/hrms-app/backend/.env.production << 'EOF'
NODE_ENV=production
PORT=3000
API_VERSION=v1
BACKEND_URL=https://api.aurorahr.in
FRONTEND_URL=https://aurorahr.in

# Database Configuration
DB_HOST=aurorahr-db-production-do-user-34922829-0.e.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE
DB_SSL=true

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# S3/Spaces Configuration
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_REGION=sgp1
S3_BUCKET=aurorahr-uploads
S3_ACCESS_KEY_ID=DO8019LPMVAMT6YEVP93
S3_SECRET_ACCESS_KEY=LabnRgPICp8ENBH+UhC5RDXwwnd8JzQi5Q4UQFPJ/I0

# Email Configuration (Optional - configure later)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Other
LOG_LEVEL=info
ENABLE_CORS=true
CORS_ORIGIN=https://aurorahr.in
EOF

echo "✓ Backend .env.production updated with correct credentials"
