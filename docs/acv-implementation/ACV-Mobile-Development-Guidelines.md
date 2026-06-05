# Guidelines for Antigravity — AuroraHR Mobile App Development

This document establishes the operational principles, safety rules, product boundary guidelines, and reporting standards for the **AuroraHR Mobile Application** (Expo/React Native).

---

## 1. Core Operating Principle

> **Mobile must be a disciplined employee self-service extension of AuroraHR, not a parallel HRMS product.**

The mobile app follows the backend/web product truth. It must not invent its own business logic, permissions, workflows, fake data, or shortcuts.

---

## 2. Current Mobile Classification

| Area | Status |
| :--- | :--- |
| **Limited ACV employee pilot** | Conditionally safe |
| **Full employee rollout** | Not yet |
| **Manager mobile rollout** | Not yet |
| **HR/admin mobile rollout** | Not yet |
| **Mobile HR Command Center** | Not yet |
| **Mobile Manu AI** | Not yet |
| **Mobile direct chat** | Not yet |
| **Push notifications** | Not yet |
| **App store/public release** | Not yet |

*Mobile remains employee-only pilot focused until backend audit logging, API contract stability, and E2E testing mature.*

---

## 3. Product Boundary Rules

### Allowed Mobile Features (Employee Dashboard)
*   Employee dashboard summary views.
*   Employee profile detail view.
*   Attendance punch / history view.
*   Leave application / balance view.
*   Payslip view/download (after backend audit readiness is wired).
*   Own document view/download (after backend audit readiness is wired).
*   Push notification displays (Future phase).
*   Simple HR request statuses (Future phase).
*   Mobile UX polish and liquid-glass styling.
*   Offline-friendly error/retry screens.
*   Session and security hardening.

### Blocked/Out-of-Scope Features
*   HR Command Center administration.
*   Manager approval-heavy workspaces.
*   Onboarding workflow management.
*   Probation review workflows.
*   Performance appraisals and normalizations.
*   Exit clearance workflows.
*   Direct chat / real-time messaging.
*   Manu AI actions and mobile shell.
*   Zoho integrations directly from mobile.
*   Payroll calculations or statutory processing.
*   Recruitment/ATS mobile flows.
*   Mobile-only business logic.

---

## 4. Hard Rules for Mobile Development

### Rule 1 — No Silent Mock Data in Production
Production builds must never show fake HR data as real.
*   **Allowed**: Development mode mock data with a visible "Demo / Mock Data" warning label.
*   **Not Allowed**: Reverting to component-level mock arrays on API failure. If an API fails, the app must display a safe error layout, retry button, or empty state.

### Rule 2 — No Mobile-Only Permissions
Mobile must not decide sensitive access rights on the client side. Access controls must be enforced by the backend API. Mobile only reflects the actions permitted by the server response.

### Rule 3 — No Mobile-Only HR Logic
Mobile must not perform calculations for leave balances, salary structures, manager hierarchies, or geofence validity thresholds. Mobile acts as an input collector, and the backend remains the source of truth.

### Rule 4 — Sensitive Access Must Be Auditable
Before broader pilot rollouts, backend APIs must audit all vault file actions (payslip previews, contract downloads, failed access attempts). Mobile should transmit useful metadata (device platform, app version, and action channel) to the server.

### Rule 5 — Pilot Mode Must Be Honest
If a screen is unintegrated, it must be hidden or clearly marked as "This feature is not available in the mobile pilot. Please use AuroraHR web or contact HR." Realistic fake workflows must not be exposed.

---

## 5. Branch and Release Discipline

*   Use narrow, explicit engineering branches:
    *   `antigravity/acv-mobile-api-contract-alignment`
    *   `antigravity/acv-mobile-device-testing`
    *   `antigravity/acv-mobile-document-audit-alignment`
    *   `antigravity/acv-mobile-payslip-flow-hardening`
    *   `antigravity/acv-mobile-leave-attendance-polish`
*   Avoid generic branches (e.g. `mobile-improvements`, `fix-mobile`).
*   Every branch must maintain documentation updates for readiness checklists, gap registers, and testing strategies.
