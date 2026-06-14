# AuroraHR — Launch Readiness Mission Brief
**Goal:** Production-grade, cloud-native, multi-tenant SaaS ready to onboard 3 free pilot customers with full functionality. No payment gateway this sprint; Freemium tiers next sprint.
**Owner:** Chinar Deshpande · **Executors:** Claude Code (primary), Codex (ongoing dev) · **Live:** https://www.aurorahr.in/

---

## Launch Gate Criteria (definition of "ready")

A pilot customer can be onboarded only when ALL of these pass:

1. **Tenant isolation proven** — zero cross-tenant data leakage under adversarial testing
2. **Core HR flows pass E2E** — employee lifecycle, org structure, leave/attendance, and whatever modules are in scope, green across the full test matrix
3. **Security baseline** — OWASP Top 10 audit clean or mitigated; secrets out of code; auth hardened
4. **Recoverable** — backup/restore tested end-to-end; rollback procedure rehearsed
5. **Observable** — errors, latency, and uptime visible before a customer reports them
6. **Frictionless front door** — registration → first value in under 10 minutes, no dead ends
7. **Pipeline machinery live** — analytics, lead capture, and at least 3 CTA routes instrumented

---

## Phase 0 — Baseline Audit (Claude Code, Day 1–2)

Run from repo root. Output: `audit/BASELINE.md`

- **Repo inventory:** stack, frameworks, versions, dependency health (`npm audit` / equivalent), dead code, TODO/FIXME census
- **Architecture map:** services, data stores, tenancy model (shared schema with tenant_id? schema-per-tenant? DB-per-tenant?), auth flow, API surface
- **Environment audit:** env vars, secrets handling, config drift between local/staging/prod
- **Deployment map:** how does code reach aurorahr.in today? Hosting, DNS, TLS, CDN, CI/CD (or lack of it)
- **Data model review:** every table/collection — does tenant scoping exist at the query layer, ORM layer, or only by convention?

> **Critical question to answer first:** what enforces tenant isolation? If the answer is "developer discipline in WHERE clauses," that is the #1 launch risk.

## Phase 1 — Functional & Multi-Tenant Testing (Day 2–6)

Output: automated test suite committed to repo + `audit/TEST-REPORT.md`

**Test matrix dimensions:** {module} × {role: super-admin, tenant-admin, HR manager, employee} × {tenant A, tenant B}

- **Happy paths:** every core module E2E (Playwright or Cypress)
- **Tenant isolation (adversarial):**
  - Tenant A user manipulates IDs/URLs/API params to reach Tenant B records
  - JWT/session token from Tenant A replayed against Tenant B endpoints
  - Search, exports, reports, file uploads — do any aggregate across tenants?
- **RBAC edge cases:** employee hitting admin endpoints directly; privilege escalation via role change mid-session; deactivated user with live session
- **Data edge cases:** unicode names, 1-char and 500-char inputs, duplicate emails across tenants (must be allowed) vs within tenant (must be blocked), timezone/date boundaries, leap years, mid-cycle joiner/leaver in leave accruals
- **Concurrency:** two admins editing same record; double-submit on forms; idempotency of critical writes
- **Lifecycle edges:** delete tenant → orphaned data? Offboard employee → access revoked everywhere?

## Phase 2 — Non-Functional: Security, Performance, Resilience (Day 5–9)

Output: `audit/SECURITY.md`, `audit/PERFORMANCE.md`

- **Security:** OWASP Top 10 pass (injection, broken auth, IDOR — IDOR is the killer for multi-tenant), rate limiting on auth endpoints, password policy + reset flow abuse, CORS/CSP headers, dependency CVEs, secrets scan of git history
- **Load/stress (k6 or Artillery):**
  - Baseline: 3 tenants × 200 employees, normal usage profile
  - Stress: 10× spike on login + heaviest read endpoint; find the knee of the curve
  - Soak: 2-hour sustained load — memory leaks, connection pool exhaustion
  - Document: p95 latency, error rate, and the actual breaking point
- **Data resilience:** automated backups verified by an actual restore drill; point-in-time recovery if DB supports it; what happens on mid-transaction failure?

## Phase 3 — DevOps & Production Readiness (Day 7–10)

Output: `audit/DEVOPS.md` + fixes committed

- **CI/CD:** every merge runs tests; deploy is one command/click; rollback rehearsed and < 5 min
- **Environments:** clean separation of dev/staging/prod with separate data and secrets
- **Observability:** error tracking (Sentry), structured logs, uptime monitoring with alerting to your phone, basic APM on slowest endpoints
- **Secrets:** vault or platform secret store; rotate anything ever committed to git
- **Scalability posture:** stateless app layer (can it run 2+ instances?), DB connection pooling, file storage on object store not local disk, session store externalized
- **Cost check:** projected monthly run-rate at 3 / 10 / 50 tenants — keep the prudence filter on

## Phase 4 — GTM Surface: Landing, Onboarding, Pipeline (parallel, Day 3–10)

Output: shipped changes + `audit/CONVERSION.md`

**Landing page (aurorahr.in):**
- Current title "Illuminate The Journey | Grow Every Person" is emotional but vague for GCC/SME buyers. Hero must answer in 5 seconds: *what it is, who it's for, why now.* Recommended direction: "The AI-native HRMS built for GCCs and growing SMEs — go live in a day."
- Verify SSR/pre-rendering — the page currently appears client-rendered, which hurts SEO and link previews
- Social proof section (even "Built by operators who've run 1,000+ person GCCs" until you have logos)
- Page speed: Lighthouse ≥ 90 mobile

**CTA routes (minimum 3, all instrumented):**
1. **"Start free — full access for pilot partners"** → self-serve registration (primary)
2. **"Book a 20-min demo"** → Calendly/Cal.com embed (high-intent, founder-led)
3. **"Get the GCC HR playbook"** → email-gated lead magnet (top-of-funnel nurture)
4. Optional: WhatsApp business CTA — high conversion in the India SME segment

**Registration & onboarding friction audit:**
- Steps from landing → usable account: target ≤ 4 screens
- Email verification must work reliably (transactional email provider, not SMTP hope)
- First-run experience: seeded demo data or guided setup wizard — never an empty dashboard
- "Aha moment" defined and reachable in < 10 minutes (e.g., org chart populated + first leave policy live)

**Instrumentation:** GA4 or PostHog (PostHog recommended — funnels + session replay, generous free tier); track landing → signup → activated → invited-second-user

## Phase 5 — Pilot Program Operations (Day 10+)

- **Design-partner agreement** (1 page): free full access for X months, in exchange for fortnightly feedback calls, permission to use logo/testimonial at exit, data processing terms
- **Feature flag:** `pilot_full_access` per tenant — clean migration path to Freemium tiers next sprint
- **Provisioning:** manual/concierge onboarding is fine — and is actually a feature at this stage
- **Support channel:** dedicated WhatsApp/Slack per pilot; you respond same-day
- **Success metrics per pilot:** weekly active users / total employees, modules adopted, NPS at day 30
- **Exit criteria:** testimonial + case study + reference call willingness

---

## Claude Code Execution Prompts

Paste these sequentially into Claude Code from the repo root.

**Mission 1 — Baseline:**
```
Read this entire repo. Produce audit/BASELINE.md covering: stack and dependency
health, architecture map, the exact mechanism enforcing multi-tenant isolation
(cite file/line), auth flow, deployment path to aurorahr.in, and a ranked list
of the top 10 launch risks. Do not change code yet.
```

**Mission 2 — Tenant isolation adversarial suite:**
```
Based on audit/BASELINE.md, write an automated adversarial test suite proving
tenant isolation: IDOR attempts, token replay across tenants, cross-tenant
search/export/report leakage, and RBAC escalation. Use [Playwright/Jest per
stack]. Run it, fix every failure, re-run to green. Report in
audit/TEST-REPORT.md.
```

**Mission 3 — E2E + edge cases:**
```
Build E2E coverage for every core module across the role × tenant matrix in
AURORAHR-LAUNCH-READINESS.md Phase 1, including the listed data and lifecycle
edge cases. Fix failures. Append results to audit/TEST-REPORT.md.
```

**Mission 4 — Security + performance:**
```
Execute Phase 2: OWASP audit with fixes, secrets scan of git history, rate
limiting, then k6 load/stress/soak tests per the brief. Document breaking
points and p95 latencies in audit/SECURITY.md and audit/PERFORMANCE.md.
```

**Mission 5 — DevOps hardening:**
```
Execute Phase 3: CI/CD with test gates, env separation, Sentry + uptime
monitoring + structured logging, secret store migration, backup/restore drill,
rollback rehearsal. Document in audit/DEVOPS.md with cost projections at
3/10/50 tenants.
```

**Mission 6 — Conversion layer:**
```
Execute Phase 4: rework the landing hero for GCC/SME clarity, ensure
SSR/pre-rendering, implement the 3 CTA routes, audit and fix registration
friction to ≤4 screens with seeded first-run data, instrument PostHog funnels.
Document in audit/CONVERSION.md.
```

---

## Risks & Trade-offs

- **Biggest risk:** tenant isolation enforced by convention, not architecture. If Mission 1 reveals this, fix it before anything else — it's existential for a B2B HR product holding salary and personal data.
- **Codex/Claude Code collision:** two agents in one repo will conflict. Assign Codex feature work on a branch; Claude Code owns the audit/hardening track on another. You merge.
- **Scope creep:** resist polishing modules pilots won't use. Wedge-before-breadth applies here too — launch with the 3–4 modules your first pilots actually need.
- **HR data compliance (India):** DPDP Act 2023 applies. Minimum bar for pilots: privacy policy, consent on signup, data deletion on request. Don't skip this for "free" customers — they're still trusting you with employee PII.

## Next Actions (this week)

1. Run **Mission 1** in Claude Code today; send me `audit/BASELINE.md` — I'll re-rank the risk list and adjust the plan
2. Decide the **3 pilot targets** (warm network first — ACV clients? THG ecosystem contacts outside conflict-of-interest lines?)
3. Set up **PostHog + Sentry** accounts (15 minutes, free tiers)
4. If your Chrome is connected to Claude, I can do a live registration-flow walkthrough of aurorahr.in right now and give you the friction report before any code changes
