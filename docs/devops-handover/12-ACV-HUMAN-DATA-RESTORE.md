# 12 — Human-operated ACV local database restore

This procedure is for the explicitly chosen full restore of the working local ACV database.
It handles real employee PII. The human operator owns and executes every data-touching step;
Codex may prepare commands and inspect resource metadata, but must not run these commands,
open the archive, inspect rows, or validate PII.

## What this does—and does not do

The helper script:

- creates a private PostgreSQL custom-format archive from the local database;
- verifies the archive structurally and records its SHA-256 checksum;
- restores to staging first;
- refuses production until a human records staging acceptance;
- creates a target backup immediately before each restore;
- replaces the target `public` schema and restores it with `--no-owner`, `--no-privileges`,
  one transaction, and fail-fast, so schema drift cannot leave a partial restore;
- uploads local documents to the environment bucket without deleting existing objects;
- never prints passwords or database row values.

It does **not** claim that restored document references work. The local database contains both
legacy `/uploads/...` references and newer tenant-scoped object keys. After upload, a human must
test representative company, employee, compensation, generated, onboarding, and profile files
through the application. Any path rewrite requires a separate dry-run report and explicit
approval; it must not be hidden inside the database restore.

## Preconditions

Run from the repository root on Chinar's trusted workstation.

```bash
gcloud auth list
gcloud config get-value account
command -v pg_dump pg_restore psql cloud-sql-proxy gcloud
```

The local PostgreSQL defaults are `localhost:5432`, database `hrms_saas`, user `postgres`.
Override them with `AURA_LOCAL_DB_*` environment variables when necessary. Never put a password
on a command line, in Git, in chat, or in this document.

## Human-only production administrator password reset

If production login is unavailable and the authorised operator chooses not to use the email
reset flow, use the dedicated helper. Codex must prepare and review the helper but must not run
it, provide its inputs, inspect its result in the database, or receive the password in chat.

The helper accepts an email and password through hidden terminal prompts, refuses non-admin or
inactive accounts, requires exactly one matching account, and performs the single update in a
transaction. It does not create a user, change a role, print account data, or store credentials.

Run from the repository root on the trusted workstation:

```bash
cd backend && npm ci && cd ..
bash docs/devops-handover/scripts/human-production-admin-password-reset.sh
```

Type the exact confirmation phrase only after checking that the active `gcloud` identity is the
authorised production operator. Do not paste the email, password, or terminal transcript into
chat. After the helper reports completion, sign in normally and record only pass/fail.

If the account does not exist or is not currently an administrator, use the separately reviewed
bootstrap/repair helper. It requires an exact active-tenant UUID or subdomain, creates or repairs
one matching account, activates it, and assigns `system_admin`. This is a privileged production
write and must be explicitly approved before the human runs it:

```bash
bash docs/devops-handover/scripts/human-production-admin-bootstrap.sh
```

All identity and password prompts are hidden. Use a new unique password that has never appeared
in chat. The helper refuses missing or ambiguous tenants and performs the repair/create operation
in one transaction.

Create a unique private work directory:

```bash
WORK_DIR="/private/tmp/aurahrms-acv-restore-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$WORK_DIR"
```

Keep the same `WORK_DIR` for every step.

## Step 1 — human creates the local archive

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  dump-local "$WORK_DIR"
```

The script prompts for the local database password without displaying it. If the local database
uses non-default connection settings, set only non-secret values normally and read the password
silently:

```bash
export AURA_LOCAL_DB_HOST=localhost
export AURA_LOCAL_DB_PORT=5432
export AURA_LOCAL_DB_NAME=hrms_saas
export AURA_LOCAL_DB_USER=postgres
read -r -s AURA_LOCAL_DB_PASSWORD
export AURA_LOCAL_DB_PASSWORD
```

Unset the password after `dump-local`:

```bash
unset AURA_LOCAL_DB_PASSWORD
```

The target restore is atomic. The existing `public` schema is dropped and recreated inside the
same transaction as the streamed archive restore. If any schema or data statement fails, the
transaction rolls back and the target retains its previous schema. A separate custom-format
pre-restore archive is also retained as defense in depth.

## Step 2 — human restores staging

Staging Cloud SQL is currently stopped to save cost. The script starts it before connecting.

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  restore-staging "$WORK_DIR"
```

Then upload documents non-destructively:

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  upload-documents "$WORK_DIR" staging backend/uploads
```

## Step 3 — human validates staging

At minimum, verify through the staging application:

- ACV administrator login succeeds using an existing local account;
- the tenant is ACV Solutions and no synthetic tenant is mistaken for ACV;
- expected employees, active/inactive states, departments, designations, and managers appear;
- HR, manager, and employee roles have the expected boundaries;
- attendance, leave, compensation, onboarding, exit, and audit screens open;
- representative employee and company documents download;
- no cross-tenant visibility is observed.

Do not paste names, emails, salary values, document numbers, or screenshots containing PII into
chat or Git. Record only redacted pass/fail notes.

When the human validation passes:

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  approve-staging "$WORK_DIR"
```

## Step 4 — human restores production

This is the production data write. Codex must not run it.

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  restore-production "$WORK_DIR"
```

The script creates `pre-restore-production.pgcustom` before replacing matching production
objects. Keep it until production acceptance passes.

Upload documents:

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  upload-documents "$WORK_DIR" production backend/uploads
```

## Step 5 — production acceptance

The human operator signs in at `https://aurahrms.com` and verifies the same functional set used
for staging. Codex may verify health, TLS, CORS, service configuration, log severity, bucket
metadata, and other non-PII evidence, but not employee records.

Database restore parity is necessary but not sufficient. Production is accepted only after:

- human login succeeds;
- tenant and role boundaries are correct;
- representative operational screens load;
- sampled document references resolve from GCS;
- no unexpected write or error burst appears in Cloud Logging;
- the pre-restore backup remains available for rollback.

## Step 6 — cleanup only after acceptance

The cleanup is destructive and requires an exact typed confirmation:

```bash
bash docs/devops-handover/scripts/human-acv-database-transfer.sh \
  cleanup "$WORK_DIR"
unset WORK_DIR
```

After cleanup, stop staging Cloud SQL again if no further rehearsal is needed. Do not remove the
production backup/PITR configuration.

## Rollback

If production acceptance fails, stop further use and preserve all evidence. The human operator
can restore `pre-restore-production.pgcustom` using the same Cloud SQL Auth Proxy pattern. Do not
attempt an improvised partial rollback or manually edit employee rows.
