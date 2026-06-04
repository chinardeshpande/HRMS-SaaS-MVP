# ACV Limited Mobile Pilot Release Notes

This document provides the release notes for the **AuroraHR Mobile Application** (Expo/React Native) prepared for the **ACV Solutions Customer Zero** limited pilot deployment.

---

## 1. Pilot Deployment Classification

> [!IMPORTANT]
> **Pilot Classification**: **SAFE FOR LIMITED ACV EMPLOYEE PILOT ONLY**
>
> *   The mobile application has been hardened to securely expose core Employee Self-Service (ESS) workflows.
> *   **NOT READY FOR FULL HR/ADMIN/MANAGER ROLLOUT**: Manager dashboard screens, direct messaging, and advanced workflows are gated or disabled in production to prevent exposure of mock datasets. Manager actions must continue to be performed on the Web Application.

---

## 2. Allowed Pilot User Roles

*   **Employee Role**: Authorized for all pilot participants. Accesses self-service modules (Attendance punch, Leave logs, Profile records, and document previews).
*   **HR / Admin / Manager Roles**: Permitted **only for internal validation and QA testing** in staging environments. Not authorized for operational use on mobile in production due to administrative workspace gating.

---

## 3. Scope of Features

### Allowed Mobile Features (Active & Connected)
*   **Login & Authentication**: Secure sign-in via `POST /auth/login` with JWT session tokens stored in the device's secure keychain. Auto-login on launch is enabled.
*   **Administrative User Profile**: Displays user details (full name, job designation, reporting manager, contact details, and department settings).
*   **Dashboard & Alerts strip**: Displays active performance objectives and pending leave approvals for employees.
*   **Geofenced Attendance Punch**: Punches shift records in/out. Attendance punches rely strictly on the device's real GPS sensor, validating position against the 100-meter Acme Office geofence.
*   **Leave Management Log**: Displays remaining Casual, Sick, and Privilege Leave balances, submits new leave requests, and lists application logs.
*   **Digital Vault Access**: Displays corporate reference policies, system-issued agreements, and personal payslips. Access to private categories is locked behind biometric verification. If biometrics are unconfigured or unavailable, a fallback account password prompt verifies credentials against `/auth/login` before granting file access.

### Gated/Disabled Features (Blocked in Production Mode)
*   **HR Command Center Dashboard**: Disabled for production builds. The bottom tab defaults to "Profile" instead of "HR Hub" for managers. Accessing command center screens triggers an "Access Restricted" blocker page directing users to the Web Application.
*   **HR Connect Direct Chats**: Thread logs, direct messaging channels, and conversation histories are blocked in production mode. Tapping Chats renders a "Direct Chats (Coming Soon)" layout.
*   **HR Command Workflows**: The following dashboards are completely blocked in production mode:
    *   *Candidate Onboarding*: Pipeline stages, background verification checklists, and joining confirmations.
    *   *Probation Review Worksheets*: Timeline progress tracking and HR final audit confirmations.
    *   *Performance Appraisals Sheets*: Self vs manager review worksheets and increment/promotion recommendations.
    *   *Exit Clearance Offboarding*: Clearance checkboards and resignation letter uploads.
*   **Manu AI Mobile Shell**: Conversational templates are absent from the mobile codebase.
*   **Server-Side Push Notifications**: Real-time push triggers for leave requests and clearance updates are client-side only.

---

## 4. Known Risks

*   **No Server-Side Vault Audit Logs**: Viewing or downloading private files (payslips, contracts) on mobile does not write transaction records to the backend auditing log database.
*   **No Server-Side Direct Chats**: Direct chats run on local states and are not connected to live databases or WebSockets on the server.
*   **No Admin/Manager Mobile Endpoints**: Onboarding detail pages, probation reviews, and exit clearances do not have backend endpoint or database support.
*   **Unverified EAS Production Build**: Expo Application Services (EAS) release profiles (`.ipa` and `.apk` bundles) have not been compiled or verified due to a lack of active provisioning credentials.

---

## 5. Next Mobile Engineering Recommendation

1.  **Server-Side Audit Alignment**: Implement a `POST /api/v1/audit-logs` endpoint on the server to record document access from mobile.
2.  **Mobile API Contract Alignment**: Finalize API contracts for HR Command workflows (Onboarding, Performance, Exits) based on Codex validation reports to allow subsequent connection of gated screens.
