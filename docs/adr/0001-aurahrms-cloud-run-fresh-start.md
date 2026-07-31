# ADR 0001: AuraHRMS Cloud Run fresh start

- Status: Accepted
- Date: 2026-07-28
- Decision owner: Chinar Deshpande

## Context

The former DigitalOcean droplet was destroyed and DigitalOcean has no retained snapshot.
The previous production database and droplet-local uploads are therefore not migration
inputs. The current local application is the source baseline for a fresh deployment.

This system will handle real ACV Solutions employee PII. Staging must contain synthetic
data only, and production data handling remains a separately approved, human-controlled
procedure.

## Decision

1. Use `aurahrms.com` as the production domain. Support `www.aurahrms.com` at the front
   door and select one canonical hostname during load-balancer configuration.
2. Deploy the API and web application as separate Cloud Run services in `asia-south1`,
   behind the shared Global External HTTPS Load Balancer.
3. Create separate `aurahrms-staging` and `aurahrms-prod` GCP projects.
4. Ship from `main` first. The unexecuted `hardening` branch remains a separate,
   post-platform-stabilisation workstream.
5. For v1, cap the Socket.IO API service at one instance with concurrency 250, session
   affinity, a 3600-second timeout, and one minimum instance. Add a Redis adapter before
   raising the instance ceiling or onboarding another production tenant.
6. Use private Cloud SQL PostgreSQL, private GCS document buckets, Secret Manager,
   structured stdout/stderr logging, and keyless GitHub Actions authentication through WIF.
7. Build once in staging and promote the tested image digest to production.
8. Recreate the ACV implementation only after synthetic staging acceptance, through a
   separately approved production runbook. No production PII enters git, CI, or staging.

## Approval gates

Explicit human approval remains required before:

- creating or changing production GCP resources;
- linking billing or accepting recurring load-balancer/minimum-instance costs;
- changing DNS for `aurahrms.com`;
- running production migrations or ACV import procedures;
- merging to `main` or triggering a production deployment.

## Consequences

The deployment is a fresh implementation, not a data migration. The single API instance is
a deliberate v1 correctness and scaling ceiling. The old `aurorahr.in` domain is not part of
the new production path unless a later decision adds a redirect.
