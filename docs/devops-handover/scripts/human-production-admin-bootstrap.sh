#!/usr/bin/env bash
set -euo pipefail

umask 077

PROJECT='aurahrms-prod'
REGION='asia-south1'
INSTANCE='aurahrms-pg'
DATABASE='aurahrms'
DATABASE_USER='aurahrms_app'
CONNECTION="${PROJECT}:${REGION}:${INSTANCE}"
PROXY_PORT='6544'

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"; }

confirm_exact() {
  local expected="$1" answer
  printf '%s\nType exactly: %s\n> ' \
    'This creates or repairs exactly one production system administrator in one explicitly selected active tenant.' \
    "$expected"
  IFS= read -r answer
  [[ "$answer" == "$expected" ]] || die 'Confirmation did not match; no change was made'
}

for command_name in gcloud cloud-sql-proxy psql node base64; do require_command "$command_name"; done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
[[ -d "$REPO_ROOT/backend/node_modules/bcrypt" ]] || \
  die 'Backend dependencies are missing; run npm ci in backend/ first'

printf 'Tenant UUID or exact subdomain (input hidden): ' >&2
IFS= read -r -s TENANT_SELECTOR
printf '\n' >&2
[[ "$TENANT_SELECTOR" =~ ^[A-Za-z0-9._-]{2,100}$ ]] || \
  die 'Tenant selector must be a UUID or exact subdomain'

printf 'Administrator email (input hidden): ' >&2
IFS= read -r -s TARGET_EMAIL
printf '\n' >&2
[[ "$TARGET_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || \
  die 'Enter a valid email address'

printf 'Administrator full name (input hidden): ' >&2
IFS= read -r -s FULL_NAME
printf '\n' >&2
FULL_NAME_BYTES="$(printf '%s' "$FULL_NAME" | LC_ALL=C wc -c | tr -d ' ')"
(( FULL_NAME_BYTES >= 2 && FULL_NAME_BYTES <= 255 )) || die 'Full name must be 2-255 bytes'
FULL_NAME_BASE64="$(printf '%s' "$FULL_NAME" | base64 | tr -d '\n')"
unset FULL_NAME

printf 'New unique password (12-72 bytes; input hidden): ' >&2
IFS= read -r -s NEW_PASSWORD
printf '\n' >&2
printf 'Repeat new password (input hidden): ' >&2
IFS= read -r -s REPEATED_PASSWORD
printf '\n' >&2
[[ "$NEW_PASSWORD" == "$REPEATED_PASSWORD" ]] || die 'Passwords did not match'
PASSWORD_BYTES="$(printf '%s' "$NEW_PASSWORD" | LC_ALL=C wc -c | tr -d ' ')"
(( PASSWORD_BYTES >= 12 && PASSWORD_BYTES <= 72 )) || die 'Password must be 12-72 bytes'
unset REPEATED_PASSWORD

confirm_exact 'BOOTSTRAP ONE PRODUCTION SYSTEM ADMIN'

NEW_HASH="$(cd "$REPO_ROOT/backend" && AURA_BOOTSTRAP_PASSWORD="$NEW_PASSWORD" node -e \
  'require("bcrypt").hash(process.env.AURA_BOOTSTRAP_PASSWORD, 10).then((hash) => process.stdout.write(hash))')"
unset NEW_PASSWORD AURA_BOOTSTRAP_PASSWORD
[[ "$NEW_HASH" == \$2* ]] || die 'Password hashing failed'

WORK_DIR="$(mktemp -d /private/tmp/aurahrms-admin-bootstrap.XXXXXX)"
chmod 700 "$WORK_DIR"
PROXY_LOG="$WORK_DIR/cloud-sql-proxy.log"
PROXY_PID=''

cleanup() {
  if [[ -n "$PROXY_PID" ]]; then kill "$PROXY_PID" 2>/dev/null || true; wait "$PROXY_PID" 2>/dev/null || true; fi
  unset TENANT_SELECTOR TARGET_EMAIL FULL_NAME_BASE64 NEW_HASH TARGET_PASSWORD PGPASSWORD PGOPTIONS
  case "$WORK_DIR" in
    /private/tmp/aurahrms-admin-bootstrap.*) rm -rf -- "$WORK_DIR" ;;
    *) printf 'Refusing to remove unexpected work directory: %s\n' "$WORK_DIR" >&2 ;;
  esac
}
trap cleanup EXIT

TARGET_PASSWORD="$(gcloud secrets versions access latest --secret=aurahrms-db-password --project="$PROJECT")"
[[ -n "$TARGET_PASSWORD" ]] || die 'Production database secret was blank'

cloud-sql-proxy --address=127.0.0.1 --port="$PROXY_PORT" "$CONNECTION" >"$PROXY_LOG" 2>&1 &
PROXY_PID=$!
for attempt in $(seq 1 30); do
  if PGPASSWORD="$TARGET_PASSWORD" psql --host=127.0.0.1 --port="$PROXY_PORT" \
    --username="$DATABASE_USER" --dbname="$DATABASE" --no-psqlrc --tuples-only \
    --command='SELECT 1' >/dev/null 2>&1; then break; fi
  [[ "$attempt" -lt 30 ]] || die "Cloud SQL proxy did not become ready; inspect $PROXY_LOG"
  sleep 2
done

PGPASSWORD="$TARGET_PASSWORD" \
PGOPTIONS="-c aura.tenant_selector=$TENANT_SELECTOR -c aura.admin_email=$TARGET_EMAIL -c aura.admin_name_b64=$FULL_NAME_BASE64 -c aura.admin_hash=$NEW_HASH" \
psql --host=127.0.0.1 --port="$PROXY_PORT" --username="$DATABASE_USER" --dbname="$DATABASE" \
  --no-psqlrc --quiet --set=ON_ERROR_STOP=1 --file=- >/dev/null <<'SQL'
BEGIN;
CREATE TEMP TABLE bootstrap_tenant ON COMMIT DROP AS
SELECT "tenantId" FROM tenants
WHERE status = 'active'
  AND (lower("tenantId"::text) = lower(current_setting('aura.tenant_selector'))
       OR lower(coalesce(subdomain, '')) = lower(current_setting('aura.tenant_selector')));

DO $tenant_check$
DECLARE matches integer;
BEGIN
  SELECT count(*) INTO matches FROM bootstrap_tenant;
  IF matches <> 1 THEN RAISE EXCEPTION 'Expected exactly one active tenant; found %', matches; END IF;
END
$tenant_check$;

CREATE TEMP TABLE bootstrap_user ON COMMIT DROP AS
SELECT "userId" FROM users
WHERE "tenantId" = (SELECT "tenantId" FROM bootstrap_tenant)
  AND lower(email) = lower(current_setting('aura.admin_email'));

DO $user_check$
DECLARE matches integer;
BEGIN
  SELECT count(*) INTO matches FROM bootstrap_user;
  IF matches > 1 THEN RAISE EXCEPTION 'Expected at most one matching account; found %', matches; END IF;
END
$user_check$;

UPDATE users
SET "passwordHash" = current_setting('aura.admin_hash'),
    "fullName" = convert_from(decode(current_setting('aura.admin_name_b64'), 'base64'), 'UTF8'),
    role = 'system_admin', "isActive" = true, "updatedAt" = NOW()
WHERE "userId" = (SELECT "userId" FROM bootstrap_user);

INSERT INTO users ("tenantId", email, "passwordHash", "fullName", role, "isActive", "createdAt", "updatedAt")
SELECT "tenantId", current_setting('aura.admin_email'), current_setting('aura.admin_hash'),
  convert_from(decode(current_setting('aura.admin_name_b64'), 'base64'), 'UTF8'),
  'system_admin', true, NOW(), NOW()
FROM bootstrap_tenant WHERE NOT EXISTS (SELECT 1 FROM bootstrap_user);
COMMIT;
SQL

printf 'Production system administrator bootstrap/repair completed for exactly one tenant.\n'
