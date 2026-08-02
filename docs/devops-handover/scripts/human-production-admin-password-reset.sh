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

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

confirm_exact() {
  local expected="$1"
  local answer
  printf '%s\nType exactly: %s\n> ' \
    'This updates the password hash for exactly one active production HR or system administrator account.' \
    "$expected"
  IFS= read -r answer
  [[ "$answer" == "$expected" ]] || die 'Confirmation did not match; no change was made'
}

require_command gcloud
require_command cloud-sql-proxy
require_command psql
require_command node

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
[[ -d "$REPO_ROOT/backend/node_modules/bcrypt" ]] || \
  die 'Backend dependencies are missing; run npm ci in backend/ first'

printf 'Production administrator email (input hidden): ' >&2
IFS= read -r -s TARGET_EMAIL
printf '\n' >&2
[[ "$TARGET_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || \
  die 'Enter a valid email address'

printf 'New password (12-72 bytes; input hidden): ' >&2
IFS= read -r -s NEW_PASSWORD
printf '\n' >&2
printf 'Repeat new password (input hidden): ' >&2
IFS= read -r -s REPEATED_PASSWORD
printf '\n' >&2
[[ "$NEW_PASSWORD" == "$REPEATED_PASSWORD" ]] || die 'Passwords did not match'
PASSWORD_BYTES="$(printf '%s' "$NEW_PASSWORD" | LC_ALL=C wc -c | tr -d ' ')"
(( PASSWORD_BYTES >= 12 && PASSWORD_BYTES <= 72 )) || die 'Password must be 12-72 bytes'
unset REPEATED_PASSWORD

confirm_exact 'RESET ONE PRODUCTION ADMIN PASSWORD'

NEW_HASH="$(
  cd "$REPO_ROOT/backend"
  AURA_RESET_PASSWORD="$NEW_PASSWORD" node -e \
    'require("bcrypt").hash(process.env.AURA_RESET_PASSWORD, 10).then((hash) => process.stdout.write(hash))'
)"
unset NEW_PASSWORD AURA_RESET_PASSWORD
[[ "$NEW_HASH" == \$2* ]] || die 'Password hashing failed'

WORK_DIR="$(mktemp -d /private/tmp/aurahrms-admin-reset.XXXXXX)"
chmod 700 "$WORK_DIR"
PROXY_LOG="$WORK_DIR/cloud-sql-proxy.log"
PROXY_PID=''

cleanup() {
  if [[ -n "$PROXY_PID" ]]; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
  unset TARGET_EMAIL NEW_HASH TARGET_PASSWORD PGPASSWORD PGOPTIONS
  case "$WORK_DIR" in
    /private/tmp/aurahrms-admin-reset.*) rm -rf -- "$WORK_DIR" ;;
    *) printf 'Refusing to remove unexpected work directory: %s\n' "$WORK_DIR" >&2 ;;
  esac
}
trap cleanup EXIT

TARGET_PASSWORD="$(gcloud secrets versions access latest \
  --secret=aurahrms-db-password --project="$PROJECT")"
[[ -n "$TARGET_PASSWORD" ]] || die 'Production database secret was blank'

cloud-sql-proxy --address=127.0.0.1 --port="$PROXY_PORT" "$CONNECTION" \
  >"$PROXY_LOG" 2>&1 &
PROXY_PID=$!

for attempt in $(seq 1 30); do
  if PGPASSWORD="$TARGET_PASSWORD" psql \
    --host=127.0.0.1 --port="$PROXY_PORT" --username="$DATABASE_USER" \
    --dbname="$DATABASE" --no-psqlrc --tuples-only --command='SELECT 1' \
    >/dev/null 2>&1; then
    break
  fi
  [[ "$attempt" -lt 30 ]] || die "Cloud SQL proxy did not become ready; inspect $PROXY_LOG"
  sleep 2
done

PGPASSWORD="$TARGET_PASSWORD" \
PGOPTIONS="-c aura.reset_email=$TARGET_EMAIL -c aura.reset_hash=$NEW_HASH" \
psql --host=127.0.0.1 --port="$PROXY_PORT" --username="$DATABASE_USER" \
  --dbname="$DATABASE" --no-psqlrc --quiet --set=ON_ERROR_STOP=1 --file=- \
  >/dev/null <<'SQL'
BEGIN;
CREATE TEMP TABLE password_reset_target ON COMMIT DROP AS
SELECT "userId"
FROM users
WHERE lower(email) = lower(current_setting('aura.reset_email'))
  AND "isActive" = true
  AND role::text IN ('hr_admin', 'system_admin');

DO $reset$
DECLARE
  matches integer;
BEGIN
  SELECT count(*) INTO matches FROM password_reset_target;
  IF matches <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active administrator account; found %', matches;
  END IF;
END
$reset$;

UPDATE users
SET "passwordHash" = current_setting('aura.reset_hash'),
    "updatedAt" = NOW()
WHERE "userId" = (SELECT "userId" FROM password_reset_target);
COMMIT;
SQL

printf 'Password reset completed for exactly one active production administrator account.\n'
