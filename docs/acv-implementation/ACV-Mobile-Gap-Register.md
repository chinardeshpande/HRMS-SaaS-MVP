# ACV Mobile Gap Register

This document lists and classifies the gaps, limitations, and missing integration points identified in the **AuroraHR Mobile Application** (Expo/React Native) in comparison to the web and backend capabilities during the **ACV Solutions Customer Zero** implementation review.

> [!NOTE]
> Refer to [ACV-Mobile-Limited-Pilot-Release-Notes.md](file:///Users/chinar.deshpande06/CD-THG/2025/THG-AI/MyCodingJourney/current-projects/HRMS-SaaS-MVP/docs/acv-implementation/ACV-Mobile-Limited-Pilot-Release-Notes.md) for the active pilot scope, allowed roles, and mitigation details.

---

## Classification Key

-   **Bug**: Current intended behavior does not work correctly or crashes.
-   **Configuration Gap**: The backend support or configurations exist but are not applied/resolved on mobile.
-   **Data Model Gap**: Existing client data schemas cannot represent required backend/production parameters.
-   **UX Gap**: The flow is present but incomplete, hard to use, or displays misleading mockup information.
-   **Integration Gap**: Active APIs, endpoints, or sockets are missing or bypassed using static local mocks.
-   **Reporting Gap**: Auditing logs, download confirmations, or validation records are not reported back to the database.
-   **Future Enhancement**: Desirable capability, but not required for the initial ACV Solutions Customer Zero mobile launch.
-   **Out of Scope**: Explicitly excluded from mobile app development in the current sprint.

---

## Active Mobile Gaps

| Gap ID | Module | Classification | Description | Required Outcome for ACV Solutions | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ACV-MOB-GAP-001** | HR Hub | Integration Gap | **HR Command Center is Mock-Only**<br>The entire HR Command Hub (Hiring Pipeline, Probation reviews, Performance ratings, Exit Clearances detail screens) runs on static, component-level local mock state. No endpoints are called. | Securely gate these screens or hide them for ACV users in production until backend integrations are wired. | P1 | Mitigated (Gated behind `__DEV__` check; restricts access to Web App in production) |
| **ACV-MOB-GAP-002** | Chat | Integration Gap | **Direct Chats are Mock-Only**<br>The "Chats" tab under HR Connect loads static data from `SEED_CHATS` and logs message inputs locally without hitting any database or messaging server. | Disable the Chat button or direct users to web platform. Avoid releasing mock communication channels. | P1 | Mitigated (Gated behind `__DEV__` check; redirects to Web App via Coming Soon screen in production) |
| **ACV-MOB-GAP-003** | Manu AI | Future Enhancement | **Manu AI Mobile Assistant is Absent**<br>The Manu AI natural language assistant is completely missing on mobile. No chat UI, speech-to-text, or backend endpoints exist in the mobile code. | Implement a natural language chat interface that integrates with the backend Gemini/AI logic, with confirmation gates. | P3 | Deferred |
| **ACV-MOB-GAP-004** | Notifications | Integration Gap | **Push Notifications not Wired to Server**<br>The app package has `expo-notifications` setup, but the server-side push engine (e.g. Firebase Cloud Messaging) is not connected to dispatch alerts. | Ensure alerts for leaves, exits, and tickets are sent to devices using valid Expo push tokens stored on user records. | P2 | Identified |
| **ACV-MOB-GAP-005** | Branding | Configuration Gap | **Branding is Hardcoded**<br>The mobile app colors (`themeColors`) and app icons are hardcoded. It does not load or resolve the custom logos, background colors, or company branding configuration from `/settings/org`. | Dynamically load organizational settings on auth and override the primary theme colors to match ACV's brand scheme. | P2 | Identified |
| **ACV-MOB-GAP-006** | Vault | Reporting Gap | **Vault Auditing not Logged**<br>Viewing, downloading, and sharing private documents or payslips on mobile do not trigger audit log records on the backend. | Add API call-outs (`POST /audit-logs`) when files are accessed or shared on mobile to comply with ACV document governance. | P1 | Identified |
| **ACV-MOB-GAP-007** | Profile | UX Gap / Reporting Gap | **Compensation History Tab Missing**<br>Web profiles include a Compensation tab showing salary structures and historical ledger adjustments. The mobile `ProfileScreen` only shows basic administrative tags. | Build a secure, biometric-gated Compensation History tab in the user Profile matching the web structure. | P2 | Identified |
| **ACV-MOB-GAP-008** | Security | UX Gap | **Device Passcode Fallback Risk**<br>If biometric hardware is absent, the app falls back to a simple, non-secure user-confirmation dialog asking "Would you like to view this file anyway?". | Remove the bypass option. If biometrics are unavailable, require the user to input their account password to unlock files. | P1 | Mitigated (Prompt for account password and verify against `/auth/login` when biometrics are unavailable) |
| **ACV-MOB-GAP-009** | Attendance | UX Gap | **QA Location Mock Controls Visible**<br>The `AttendanceScreen` displays a coordinate mock selector widget ("Office Desk", "WFH", "Live GPS") directly in the user view. | Hide or compile-out mock location selectors using conditional `__DEV__` variables to prevent production abuse. | P1 | Mitigated (Mock controls hidden and real GPS forced when `__DEV__` is false) |
| **ACV-MOB-GAP-010** | System | Bug | **Endpoint Path Discrepancy**<br>The DigitalVaultScreen contains path correction hacks: replacing `/api/documents/` with `/api/v1/documents/` because endpoints were returning legacy paths. | Harden backend URL generation to return clean `/api/v1/...` relative file paths. | P2 | Identified |

---

## Gap Mitigation Plan

1.  **Phase 1: Security and Safeguards (Immediate)**
    - Run pre-processor scripts to hide the geofence mock controls in production builds.
    - Restrict the `LocalAuthentication` fallback in `DigitalVaultScreen` to require password inputs instead of bypasses.
    - Hide or disable the "HR Command Center" card and "Direct Chats" option for ACV employees and managers to prevent mock data exposure.
2.  **Phase 2: Core Connection (Sprint 2)**
    - Implement a `POST /api/v1/audit-logs` endpoint on the backend and integrate mobile file download trackers.
    - Adjust `/leave/pending-approvals` to support approval actions from mobile in real-time.
3.  **Phase 3: Extended Features (Future)**
    - Build real-time chats using WebSockets, matching the web-based team chats.
    - Design a Manu AI interactive voice assistant screen on mobile.
