#!/usr/bin/env bash
set -euo pipefail

umask 077

usage() {
  cat <<'EOF'
Human-operated ACV database transfer. This script handles real employee data.

Usage:
  human-acv-database-transfer.sh dump-local WORK_DIR
  human-acv-database-transfer.sh restore-staging WORK_DIR
  human-acv-database-transfer.sh approve-staging WORK_DIR
  human-acv-database-transfer.sh restore-production WORK_DIR
  human-acv-database-transfer.sh upload-documents WORK_DIR staging|production [UPLOAD_ROOT]
  human-acv-database-transfer.sh cleanup WORK_DIR

Local database defaults:
  host=localhost port=5432 database=hrms_saas user=postgres

Override them without putting credentials on the command line:
  AURA_LOCAL_DB_HOST, AURA_LOCAL_DB_PORT, AURA_LOCAL_DB_NAME,
  AURA_LOCAL_DB_USER, AURA_LOCAL_DB_PASSWORD

The script never prints database passwords or row values. It does not place data in Git.
Production restore is refused until approve-staging has been completed in the same WORK_DIR.
EOF
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

validate_work_dir() {
  local requested="$1"
  [[ -n "$requested" ]] || die 'WORK_DIR is required'
  [[ "$requested" == /private/tmp/aurahrms-acv-restore-* || "$requested" == /tmp/aurahrms-acv-restore-* ]] ||
    die 'WORK_DIR must be an explicit /private/tmp/aurahrms-acv-restore-* or /tmp/aurahrms-acv-restore-* path'
  mkdir -p "$requested"
  chmod 700 "$requested"
  WORK_DIR="$requested"
  ARCHIVE="$WORK_DIR/local-acv.pgcustom"
  MANIFEST="$WORK_DIR/local-acv.pgcustom.sha256"
  STAGING_MARKER="$WORK_DIR/STAGING-RESTORE-APPROVED"
}

confirm_exact() {
  local expected="$1"
  local prompt="$2"
  local answer
  printf '%s\nType exactly: %s\n> ' "$prompt" "$expected"
  IFS= read -r answer
  [[ "$answer" == "$expected" ]] || die 'Confirmation did not match; no change was made'
}

local_db_password() {
  if [[ -n "${AURA_LOCAL_DB_PASSWORD:-}" ]]; then
    LOCAL_PASSWORD="$AURA_LOCAL_DB_PASSWORD"
    return
  fi
  printf 'Local PostgreSQL password (input hidden): ' >&2
  IFS= read -r -s LOCAL_PASSWORD
  printf '\n' >&2
  [[ -n "$LOCAL_PASSWORD" ]] || die 'Local database password cannot be blank'
}

dump_local() {
  require_command pg_dump
  require_command pg_restore
  require_command shasum
  [[ ! -e "$ARCHIVE" ]] || die "Archive already exists: $ARCHIVE"

  local host="${AURA_LOCAL_DB_HOST:-localhost}"
  local port="${AURA_LOCAL_DB_PORT:-5432}"
  local database="${AURA_LOCAL_DB_NAME:-hrms_saas}"
  local user="${AURA_LOCAL_DB_USER:-postgres}"

  confirm_exact 'DUMP LOCAL ACV DATABASE' \
    "This reads the complete local ACV database into a private custom-format archive at $ARCHIVE."
  local_db_password
  PGPASSWORD="$LOCAL_PASSWORD" pg_dump \
    --host="$host" \
    --port="$port" \
    --username="$user" \
    --dbname="$database" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --file="$ARCHIVE"
  unset LOCAL_PASSWORD AURA_LOCAL_DB_PASSWORD PGPASSWORD

  pg_restore --list "$ARCHIVE" >/dev/null
  shasum -a 256 "$ARCHIVE" > "$MANIFEST"
  printf 'Local archive created and structurally verified: %s\n' "$ARCHIVE"
}

target_values() {
  local environment="$1"
  case "$environment" in
    staging)
      TARGET_PROJECT='aurahrms-staging'
      TARGET_BUCKET='aurahrms-staging-documents'
      ;;
    production)
      TARGET_PROJECT='aurahrms-prod'
      TARGET_BUCKET='aurahrms-prod-documents'
      ;;
    *) die "Unknown target environment: $environment" ;;
  esac
  TARGET_REGION='asia-south1'
  TARGET_INSTANCE='aurahrms-pg'
  TARGET_DATABASE='aurahrms'
  TARGET_USER='aurahrms_app'
  TARGET_CONNECTION="${TARGET_PROJECT}:${TARGET_REGION}:${TARGET_INSTANCE}"
}

start_proxy() {
  require_command cloud-sql-proxy
  require_command psql
  PROXY_PORT="$1"
  PROXY_LOG="$WORK_DIR/cloud-sql-proxy-${TARGET_PROJECT}.log"
  cloud-sql-proxy \
    --address=127.0.0.1 \
    --port="$PROXY_PORT" \
    "$TARGET_CONNECTION" >"$PROXY_LOG" 2>&1 &
  PROXY_PID=$!
  trap 'if [[ -n "${PROXY_PID:-}" ]]; then kill "$PROXY_PID" 2>/dev/null || true; fi' EXIT

  local attempt
  for attempt in $(seq 1 30); do
    if PGPASSWORD="$TARGET_PASSWORD" psql \
      --host=127.0.0.1 --port="$PROXY_PORT" \
      --username="$TARGET_USER" --dbname="$TARGET_DATABASE" \
      --no-psqlrc --tuples-only --command='SELECT 1' >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  die "Cloud SQL proxy did not become ready; inspect $PROXY_LOG"
}

restore_target() {
  local environment="$1"
  require_command gcloud
  require_command pg_dump
  require_command pg_restore
  require_command psql
  require_command shasum
  [[ -f "$ARCHIVE" && -f "$MANIFEST" ]] || die 'Run dump-local first'
  shasum -a 256 --check "$MANIFEST" >/dev/null || die 'Local archive checksum failed'
  target_values "$environment"

  if [[ "$environment" == production ]]; then
    [[ -f "$STAGING_MARKER" ]] || die 'Production refused: run approve-staging after human staging acceptance'
    confirm_exact 'RESTORE ACV INTO PRODUCTION' \
      'This replaces matching objects in the production database. A pre-restore production backup is created first.'
  else
    confirm_exact 'RESTORE ACV INTO STAGING' \
      'This replaces matching objects in the staging database. A pre-restore staging backup is created first.'
    gcloud sql instances patch "$TARGET_INSTANCE" \
      --project="$TARGET_PROJECT" --activation-policy=ALWAYS --quiet >/dev/null
  fi

  TARGET_PASSWORD="$(gcloud secrets versions access latest \
    --secret=aurahrms-db-password --project="$TARGET_PROJECT")"
  [[ -n "$TARGET_PASSWORD" ]] || die 'Target database secret was blank'
  start_proxy "$([[ "$environment" == production ]] && printf 6544 || printf 6543)"

  local backup="$WORK_DIR/pre-restore-${environment}.pgcustom"
  [[ ! -e "$backup" ]] || die "Pre-restore backup already exists: $backup"
  PGPASSWORD="$TARGET_PASSWORD" pg_dump \
    --host=127.0.0.1 --port="$PROXY_PORT" \
    --username="$TARGET_USER" --dbname="$TARGET_DATABASE" \
    --format=custom --compress=9 --no-owner --no-privileges \
    --file="$backup"
  pg_restore --list "$backup" >/dev/null
  shasum -a 256 "$backup" > "$backup.sha256"
  printf 'Pre-restore backup created: %s\n' "$backup"

  PGPASSWORD="$TARGET_PASSWORD" pg_restore \
    --host=127.0.0.1 --port="$PROXY_PORT" \
    --username="$TARGET_USER" --dbname="$TARGET_DATABASE" \
    --clean --if-exists --no-owner --no-privileges \
    --exit-on-error --single-transaction \
    "$ARCHIVE"
  unset TARGET_PASSWORD PGPASSWORD
  printf '%s database restore completed. Application and document validation are still required.\n' "$environment"
}

approve_staging() {
  [[ -f "$ARCHIVE" ]] || die 'Run dump-local and restore-staging first'
  confirm_exact 'STAGING LOGIN AND DATA VALIDATION PASSED' \
    'Confirm that a human verified ACV login, tenant identity, employee visibility, roles, and representative records in staging.'
  printf 'approved_at_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STAGING_MARKER"
  chmod 600 "$STAGING_MARKER"
  printf 'Staging approval marker created: %s\n' "$STAGING_MARKER"
}

upload_documents() {
  local environment="$1"
  local upload_root="${2:-backend/uploads}"
  require_command gcloud
  target_values "$environment"
  [[ -d "$upload_root" ]] || die "Upload root does not exist: $upload_root"
  if [[ "$environment" == production ]]; then
    [[ -f "$STAGING_MARKER" ]] || die 'Production document upload refused: staging approval marker missing'
    confirm_exact 'UPLOAD ACV DOCUMENTS TO PRODUCTION' \
      "This uploads files non-destructively from $upload_root to gs://$TARGET_BUCKET. Existing objects are not deleted."
  else
    confirm_exact 'UPLOAD ACV DOCUMENTS TO STAGING' \
      "This uploads files non-destructively from $upload_root to gs://$TARGET_BUCKET. Existing objects are not deleted."
  fi
  gcloud storage rsync --recursive "$upload_root" "gs://$TARGET_BUCKET"
  printf 'Document upload completed. Legacy database paths must still be reconciled and sampled through the application.\n'
}

cleanup_work_dir() {
  [[ -d "$WORK_DIR" ]] || die 'Work directory does not exist'
  confirm_exact 'DELETE TEMPORARY ACV DATABASE ARCHIVES' \
    "This permanently removes the private migration work directory: $WORK_DIR"
  find "$WORK_DIR" -type f -exec sh -c 'for file do : > "$file"; done' sh {} +
  rm -rf -- "$WORK_DIR"
  printf 'Temporary migration archives removed. This cannot be undone.\n'
}

[[ $# -ge 2 ]] || { usage; exit 2; }
ACTION="$1"
validate_work_dir "$2"

case "$ACTION" in
  dump-local) dump_local ;;
  restore-staging) restore_target staging ;;
  approve-staging) approve_staging ;;
  restore-production) restore_target production ;;
  upload-documents)
    [[ $# -ge 3 ]] || die 'upload-documents requires staging or production'
    upload_documents "$3" "${4:-backend/uploads}"
    ;;
  cleanup) cleanup_work_dir ;;
  *) usage; die "Unknown action: $ACTION" ;;
esac
