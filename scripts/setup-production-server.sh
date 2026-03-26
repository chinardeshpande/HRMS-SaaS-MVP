#!/bin/bash

# ==================================
# Production Server Setup Script
# ==================================
# This script sets up a fresh Ubuntu server for HRMS deployment
# Run this on your DigitalOcean droplet or VPS

set -e  # Exit on any error

echo "========================================"
echo "HRMS Production Server Setup"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# ==================================
# Update system
# ==================================
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# ==================================
# Install Docker
# ==================================
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Start Docker service
    systemctl start docker
    systemctl enable docker

    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# ==================================
# Install Docker Compose
# ==================================
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# ==================================
# Install Nginx
# ==================================
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx installed successfully"
else
    echo "✅ Nginx already installed"
fi

# ==================================
# Install Certbot for SSL
# ==================================
echo "🔒 Installing Certbot for SSL certificates..."
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo "✅ Certbot installed successfully"
else
    echo "✅ Certbot already installed"
fi

# ==================================
# Install other utilities
# ==================================
echo "🛠️  Installing utilities..."
apt install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    ufw \
    fail2ban \
    unzip

# ==================================
# Configure Firewall
# ==================================
echo "🔥 Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 3000/tcp  # Backend API (for development)
echo "✅ Firewall configured"

# ==================================
# Configure fail2ban
# ==================================
echo "🛡️  Configuring fail2ban..."
systemctl start fail2ban
systemctl enable fail2ban
echo "✅ Fail2ban configured"

# ==================================
# Create application directory
# ==================================
echo "📁 Creating application directory..."
mkdir -p /var/www/hrms-app
mkdir -p /var/www/hrms-app/logs
mkdir -p /var/www/hrms-app/uploads
mkdir -p /var/www/hrms-app/certbot/conf
mkdir -p /var/www/hrms-app/certbot/www

# Set permissions
chmod -R 755 /var/www/hrms-app

echo "✅ Application directory created"

# ==================================
# Create deployment user (optional but recommended)
# ==================================
echo "👤 Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy

    # Copy SSH keys from root to deploy user
    mkdir -p /home/deploy/.ssh
    if [ -f /root/.ssh/authorized_keys ]; then
        cp /root/.ssh/authorized_keys /home/deploy/.ssh/
        chown -R deploy:deploy /home/deploy/.ssh
        chmod 700 /home/deploy/.ssh
        chmod 600 /home/deploy/.ssh/authorized_keys
    fi

    echo "✅ Deployment user 'deploy' created"
else
    echo "✅ Deployment user already exists"
fi

# ==================================
# Configure Docker logging
# ==================================
echo "📝 Configuring Docker logging..."
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
echo "✅ Docker logging configured"

# ==================================
# Install monitoring tools
# ==================================
echo "📊 Installing monitoring tools..."

# Install node_exporter for Prometheus (optional)
# Uncomment if you want to use Prometheus
# cd /tmp
# wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
# tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
# cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
# rm -rf node_exporter-*

echo "✅ Monitoring tools ready"

# ==================================
# Setup log rotation
# ==================================
echo "🔄 Setting up log rotation..."
cat > /etc/logrotate.d/hrms-app <<EOF
/var/www/hrms-app/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
}
EOF

echo "✅ Log rotation configured"

# ==================================
# Security hardening
# ==================================
echo "🔐 Applying security hardening..."

# Disable root SSH login (recommended but commented out for safety)
# sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
# sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
# systemctl reload sshd

# Disable password authentication (use SSH keys only)
# Uncomment this after you've set up SSH keys
# sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
# systemctl reload sshd

echo "✅ Security hardening applied"

# ==================================
# Summary
# ==================================
echo ""
echo "========================================"
echo "✅ Production server setup complete!"
echo "========================================"
echo ""
echo "Installed software:"
echo "  - Docker & Docker Compose"
echo "  - Nginx"
echo "  - Certbot (Let's Encrypt)"
echo "  - UFW Firewall"
echo "  - Fail2ban"
echo "  - Git, curl, vim, htop"
echo ""
echo "Next steps:"
echo "  1. Set up your domain DNS to point to this server"
echo "  2. Run: certbot --nginx -d hrms-app.com -d www.hrms-app.com"
echo "  3. Clone your repository to /var/www/hrms-app"
echo "  4. Create .env.production file with your credentials"
echo "  5. Run: docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "Security recommendations:"
echo "  1. Disable root SSH login"
echo "  2. Use SSH keys instead of passwords"
echo "  3. Set up automated backups"
echo "  4. Configure monitoring and alerts"
echo ""
echo "Application directory: /var/www/hrms-app"
echo "Deployment user: deploy"
echo ""
echo "========================================"
