# ACV Mobile Readiness Checklist

This checklist evaluates the **AuroraHR Mobile Application** (Expo/React Native) against the core functional requirements for the **ACV Solutions Customer Zero** pilot launch. It determines what features are ready for production, what requires backend connection, and what is currently blocked.

---

## 1. Readiness Summary

*   **Employee Self-Service (ESS)**: **90% READY** (Core features like login, profile, leave, geofenced attendance, and secure vault viewing are fully functional).
*   **Manager / HR Approvals**: **80% READY** (Leave requests can be approved/rejected dynamically in real-time).
*   **HR Connect Collaborations**: **50% READY** (Social feeds and group forums work, but direct chats are fully mock-only).
*   **HR Command Hub & Admin Tools**: **0% READY** (All 5 advanced manager/admin dashboards run entirely on local mock data).
*   **Manu AI Mobile Assistant**: **0% READY** (No mobile presence).

| Status | Verification Area | Target Users | Current Readiness | Blockers / Risks |
| :--- | :--- | :--- | :--- | :--- |
| **PASS** | **Employee Login & Auth** | All Employees | Ready for deployment | None |
| **PASS** | **View Personal Profile** | All Employees | Ready for deployment | None |
| **PASS** | **Mark/View Attendance** | All Employees | Ready for deployment | Geofencing limits must be clearly explained to users |
| **PASS** | **Apply/Track Leave** | All Employees | Ready for deployment | None |
| **PASS** | **Review Leave Applications** | Managers, HR | Ready for deployment | Reject comments prompt uses native alerts |
| **PARTIAL** | **Digital Document Vault** | All Employees | Ready (with fallback) | Private docs retrieve mock items if server down |
| **PARTIAL** | **Payslip Preview/Download** | All Employees | Ready (with fallback) | Payslips use mock files if server down |
| **PARTIAL** | **HR Connect Feed & Groups** | All Employees | Ready (with fallback) | Failures revert to static mock posts |
| **FAIL** | **HR Connect Chats** | All Employees | **Mock Only** | Needs direct chat API endpoints & WebSocket |
| **FAIL** | **Real-time Notifications** | All Employees | **Client-side only** | Server-side notification dispatch is missing |
| **FAIL** | **HR Command Hub** | Managers, HR | **Mock Only** | Onboarding/Exit/PMS detail pages have no backend |
| **FAIL** | **Manu AI Mobile Shell** | All Employees | **Absent** | Not implemented on mobile |

---

## 2. Detailed Audit Checklist

### ESS-01: Employee Login & Session Management
- [x] Supports login with email and password via `POST /auth/login`.
- [x] Tokens (Access and Refresh) are stored securely in keychain via `expo-secure-store`.
- [x] Standard metadata (name, role, avatar) is saved in `AsyncStorage`.
- [x] Supports auto-login on application launch (`initAuth`).
- [x] Integrates biometric authentication (Fingerprint / Face ID) to unlock cached sessions.
- [x] Handles token expiration and silent token renewal via request interceptors.

### ESS-02: Employee Profile Self-Service
- [x] Displays user profile photo, email, telephone, department, and designation.
- [x] Displays job status (e.g., Active) and reporting manager.
- [x] Settings tab supports toggling biometrics preference on/off.
- [x] Logout clearing deletes SecureStore keys and logs out of session store.

### ESS-03: Secure Document Vault
- [x] Separates files into Payslips, Issued Docs (e.g., offer letters), and Corporate Policies.
- [x] Gates Payslips and Issued Docs behind local biometric authentication.
- [x] Tapping "View" appends JWT token (`?token=<JWT>`) and loads the document inside an in-app browser overlay.
- [x] Tapping "Share" downloads the file via `FileSystem` and displays the native system sharing drawer.
- [ ] *Gap*: Auditing of document views/downloads is client-side only; requires backend auditing logic.

### ESS-04: Leave Management
- [x] Displays active leave balances (Casual, Sick, and Privilege Leave).
- [x] Dynamically recalculates available balances based on pending/approved allocations.
- [x] Submits leave applications with Date Picker and Reason inputs.
- [x] Shows leave history log with status badges (Pending, Approved, Rejected).
- [x] Displays manager remarks in case of rejection.

### ESS-05: Attendance Punch & Geofencing
- [x] Fetches active punch records and calculates daily work hours.
- [x] Pulls device GPS location and calculates distance from ACME office coordinates.
- [x] Geofencing logic blocks punches if user is > 100 meters away.
- [x] Permits Work From Home (WFH) punches if WFH coordinates are simulated and "WFH" is typed in remarks.
- [x] Displays a locations widget for simulation and testing.

### MGR-01: Manager Approvals
- [x] Displays counts of pending approvals on bottom menu ("HR Hub" badge).
- [x] Approves leave requests directly from the approvals list (`PUT /leave/:id/approve`).
- [x] Prompts for rejection remarks and submits to the backend.

### MGR-02: HR Command Hub (Manager Dashboards)
- [ ] *Hiring Onboarding*: Candidates list, onboarding checklist, and BGV verification are mock-only.
- [ ] *Probation Tracker*: Probation reviews, confirmation forms, and timelines are mock-only.
- [ ] *Performance Appraisals*: Self vs Manager review forms, cycle ratings, and normalizations are mock-only.
- [ ] *Exit Clearances*: Asset checklists, IT/Finance clearance signs, last working date schedules are mock-only.

### COM-01: HR Connect & Collaboration
- [x] Pulls social posts from `/hr-connect/posts`.
- [x] Supports liking, reacting, and commenting on announcements.
- [x] Pulls group channels from `/hr-connect/groups`.
- [ ] *Direct Chat*: Thread logs, conversation lists, and message deliveries are mock-only.

---

## 3. ACV Customer Zero Launch Criteria Gaps

To support ACV Solutions users in production, the mobile app requires the following minimum hardening:
1.  **Enforce Tenant Isolation in Fallbacks**: Endpoints (`endpoints.ts`) must never default to static "demo-tenant" mock lists if requests fail. It must raise clear network error panels to prevent accidental display of demo data.
2.  **Redirect Mock Chats**: The direct chat tab should be disabled or marked as a "Future Enhancement" to avoid confusing users.
3.  **Hide Mock HR command center screens**: If an ACV manager logs into mobile, the "HR Hub" bottom tab must be hidden or restrict operations to Leave Approvals only, hiding the mock onboarding/performance/exit dashboards.
4.  **Connect Vault Auditing**: Secure Document download and sharing actions on mobile must trigger a backend audit log record (`POST /audit-logs`), identical to the web application document tracking.
