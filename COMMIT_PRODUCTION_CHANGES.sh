#!/bin/bash

# Commit Production Deployment Changes
# Run this script when you have git access

cd "$(dirname "$0")"

echo "📝 Staging production deployment changes..."

# Add modified files
git add frontend-web/src/pages/SimpleLogin.tsx
git add frontend-web/src/pages/ModernLogin.tsx
git add frontend-web/.env.production
git add .github/workflows/deploy-aurorahr.yml
git add DEPLOYMENT.md

# Add new files
git add scripts/nginx-production.conf
git add PRODUCTION_DEPLOYMENT_COMPLETE.md
git add COMMIT_PRODUCTION_CHANGES.sh

echo ""
echo "📊 Files staged for commit:"
git status --short

echo ""
echo "💾 Creating commit..."

git commit -m "feat: production deployment with same-domain API configuration

- Fix corporate firewall blocking by serving API on same domain
- Update frontend to use https://aurorahr.in/api/v1 instead of api.aurorahr.in
- Fix hardcoded localhost URLs in SimpleLogin.tsx
- Update CI/CD pipeline for same-domain deployment
- Add Nginx production configuration template
- Update deployment documentation with final architecture

Production URL: https://aurorahr.in
Login: admin.user@acme.com / password123

BREAKING CHANGE: API URL changed from api.aurorahr.in to aurorahr.in/api/v1
This change was required to bypass corporate firewall (Netskope) blocking.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo ""
echo "✅ Commit created successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Review commit: git show"
echo "   2. Push to GitHub: git push origin main"
echo ""
echo "   This will trigger automatic deployment via GitHub Actions"
