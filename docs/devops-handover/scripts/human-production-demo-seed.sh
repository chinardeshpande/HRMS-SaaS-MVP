#!/usr/bin/env bash
set -euo pipefail

umask 077

PROJECT='aurahrms-prod'
REGION='asia-south1'
API_SERVICE='aurahrms-api'
JOB='aurahrms-demo-seed'
SQL_INSTANCE='aurahrms-pg'
DATABASE='aurahrms'
DATABASE_USER='aurahrms_app'
EXPECTED_CONFIRMATION='SEED ISOLATED PRODUCTION DEMO TENANT'

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"; }

require_command gcloud

printf '%s\n' \
  'This rebuilds synthetic data only for the tenant with subdomain aurorahr-demo.' \
  'It does not select, read, or modify the ACV tenant.' \
  "Type exactly: $EXPECTED_CONFIRMATION"
printf '> '
IFS= read -r answer
[[ "$answer" == "$EXPECTED_CONFIRMATION" ]] || die 'Confirmation did not match; no change was made'

API_IMAGE="$(gcloud run services describe "$API_SERVICE" \
  --project="$PROJECT" \
  --region="$REGION" \
  --format='value(spec.template.spec.containers[0].image)')"
[[ -n "$API_IMAGE" ]] || die 'Could not resolve the deployed production API image'

RUNTIME_SA="$(gcloud run services describe "$API_SERVICE" \
  --project="$PROJECT" \
  --region="$REGION" \
  --format='value(spec.template.spec.serviceAccountName)')"
[[ -n "$RUNTIME_SA" ]] || die 'Could not resolve the production runtime service account'

SQL_CONNECTION="$PROJECT:$REGION:$SQL_INSTANCE"

gcloud run jobs deploy "$JOB" \
  --project="$PROJECT" \
  --region="$REGION" \
  --image="$API_IMAGE" \
  --service-account="$RUNTIME_SA" \
  --set-cloudsql-instances="$SQL_CONNECTION" \
  --set-secrets=DB_PASSWORD=aurahrms-db-password:latest \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/$SQL_CONNECTION,DB_NAME=$DATABASE,DB_USER=$DATABASE_USER,DB_SSL=false" \
  --command=npm \
  --args=run,seed:demo:prod \
  --max-retries=0 \
  --task-timeout=900s

gcloud run jobs execute "$JOB" \
  --project="$PROJECT" \
  --region="$REGION" \
  --wait

printf '%s\n' \
  'Synthetic production demo tenant seed completed.' \
  'Validate by switching an authenticated user into demo mode; the button must change to Return to my account.'
