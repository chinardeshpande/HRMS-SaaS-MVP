# 07 — Secrets, IAM, and keyless CI

---

## 1. What is a secret, what is config, what is a build-arg

Three buckets. Getting this wrong is the most common cause of "it works locally but the
deployed app is broken".

| Bucket | Where it goes | AuroraHR examples |
|---|---|---|
| **Runtime secret** | Secret Manager → `--set-secrets` | `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_PASSWORD` |
| **Runtime config** (not sensitive) | `--set-env-vars` | `NODE_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_SSL`, `STORAGE_TYPE`, `GCS_BUCKET`, `CORS_ORIGIN`, `LOG_LEVEL` |
| **Build-time inlined** | Docker `--build-arg` | every `VITE_*` |

> **`VITE_*` behaves exactly like `NEXT_PUBLIC_*`: inlined into the client bundle at build
> time.** Setting it only at runtime is too late — the shipped JS contains `undefined`. This
> cost real debugging time on the Next.js apps; do not repeat it here.
>
> And the corollary: **anything in a `VITE_*` var is public.** It ships to every browser.
> Never put a secret in one. `VITE_SENTRY_DSN` is fine; an API key never is.

---

## 2. Secret naming

`<prefix>-<env-var-in-kebab-case>` — mechanical, so it is derivable rather than remembered:

```
JWT_SECRET          -> aurorahr-jwt-secret
JWT_REFRESH_SECRET  -> aurorahr-jwt-refresh-secret
DB_PASSWORD         -> aurorahr-db-password
SMTP_PASSWORD       -> aurorahr-smtp-password
```

Secrets live in the **same project** as the service that reads them, so staging and prod
secrets are naturally separate and cannot be confused.

---

## 3. The no-leak intake pattern

**Never type, echo, or paste a secret value into a chat, a log, or a command line that gets
recorded.** Use a local fill-file, consumed by a pipe.

**Step 1 — write the template** (`/tmp/aurorahr-secrets.env`, keys only):

```
DB_PASSWORD=
JWT_SECRET=
JWT_REFRESH_SECRET=
SMTP_PASSWORD=
```

**Step 2 — the human fills it in an editor.** Values come from the source of truth: the
droplet's `.env`, the password manager, or freshly generated (`openssl rand -base64 48` for
JWT secrets — and if the droplet is lost, these **must** be regenerated, which invalidates
existing sessions; plan for that).

**Step 3 — create secrets, piping so nothing prints:**

```bash
PID=aurorahr-staging; FILE=/tmp/aurorahr-secrets.env
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|\#*) continue;; esac
  key=${line%%=*}; val=${line#*=}
  key=$(printf '%s' "$key" | tr -d '[:space:]'); val=${val%$'\r'}
  [ -z "$key" ] && continue
  [ -z "$val" ] && { echo "  BLANK (skipped): $key"; continue; }
  sname="aurorahr-$(printf '%s' "$key" | tr 'A-Z_' 'a-z-')"
  if gcloud secrets describe "$sname" --project=$PID >/dev/null 2>&1; then
    printf '%s' "$val" | gcloud secrets versions add "$sname" --project=$PID --data-file=- >/dev/null \
      && echo "  updated $key -> $sname"
  else
    printf '%s' "$val" | gcloud secrets create "$sname" --project=$PID \
      --replication-policy=automatic --data-file=- >/dev/null && echo "  created $key -> $sname"
  fi
done < "$FILE"
```

**Step 4 — delete the fill-file:** `rm -f "$FILE"`

**Step 5 — transcript hygiene.** If a tool result, editor diff, or "file changed" notice
echoes the filled file back into a transcript, the values are exposed. **Say so plainly and
recommend rotation.** This happened during the portfolio migration; the honest disclosure is
part of the procedure, not an admission of failure.

**Verifying a secret without printing it:** probe it. An HTTP 200/401 from the service that
consumes it tells you whether it is live. Never `echo` it to check.

---

## 4. Rotation

Adding a version does not restart anything — `:latest` is resolved **at deploy time**:

```bash
printf '%s' "$NEW" | gcloud secrets versions add aurorahr-jwt-secret --project=$PID --data-file=-
gcloud run services update aurorahr-api --project=$PID --region=asia-south1 \
  --update-secrets=JWT_SECRET=aurorahr-jwt-secret:latest      # forces a new revision
```

**Rotate immediately (Phase 9):** everything that lived on the lost droplet. A host you no
longer control is a host you must assume was compromised — DB password, JWT signing secrets,
SMTP credentials, and any third-party API keys in its `.env`.

Note that rotating `JWT_SECRET`/`JWT_REFRESH_SECRET` invalidates every issued token: all users
are logged out. Fine during a migration; announce it.

---

## 5. Keyless CI (WIF) — why and how

**No service-account JSON key is ever created, downloaded, or stored in GitHub.** GitHub's
OIDC token is exchanged for short-lived GCP credentials; trust is pinned to one repository.

`scripts/setup-gcp-pipeline.sh` builds this:
- Pool `github-pool`, OIDC provider `github-provider`
  (issuer `token.actions.githubusercontent.com`), attribute-condition pinning
  `repository_owner`.
- Deployer SA `gha-deployer@<PID>.iam` with `roles/iam.workloadIdentityUser` bound to a
  **principalSet scoped to the exact repo** (`attribute.repository/<owner>/<repo>`).

**Reuse:** the pool and provider are per-project and reusable. A second app in the same
project needs only another repo binding — not a new pool.

### Role split (R13)

**Deployer SA** — what GitHub impersonates:
`cloudbuild.builds.editor`, `storage.admin`, `viewer`, `serviceusage.serviceUsageConsumer`,
plus `iam.serviceAccountUser` on the runtime SA.

**Runtime/compute SA** — what the build and the service run as:
`run.admin`, `artifactregistry.writer`, `secretmanager.secretAccessor`, `logging.logWriter`,
`cloudbuild.builds.builder`, `iam.serviceAccountUser` **on itself**, plus for AuroraHR:
`cloudsql.client` (project-level) and `storage.objectAdmin` (**bucket-scoped**, not
project-wide).

### The four GitHub **Variables** (not Secrets — they are not sensitive)

```
GCP_PROJECT_ID · GCP_REGION · GCP_WIF_PROVIDER · GCP_DEPLOYER_SA
```

---

## 6. Hardening after it works

Get the pipeline green first, then tighten — in this order:

1. Replace project-wide `secretmanager.secretAccessor` with per-secret bindings.
2. Add required reviewers on the GitHub `production` environment so prod deploys need a human.
3. Separate deployer SAs for staging and prod (they are already separate projects, so this is
   mostly natural).
4. Consider Secret Manager CMEK and per-secret rotation schedules.
5. Audit: `gcloud projects get-iam-policy <PID>` — confirm no stray `owner`/`editor` bindings
   and no user-managed SA keys (`gcloud iam service-accounts keys list`) anywhere.
