# ACV Mobile Pilot User Checklist

This document defines the verification checklist and UAT (User Acceptance Testing) criteria to validate the mobile app build for limited pilot users of **ACV Solutions**.

---

## 1. Pilot Testing Checklist

Testers must verify the following items on a production-like build of the mobile application:

### Authentication & Sessions
- [ ] **Employee Login**: Enter valid employee credentials. Verify that sign-in completes and redirects to the main Dashboard.
- [ ] **Session Decryption**: Enable biometrics in profile settings, close the application, relaunch, and verify that biometric prompt unlocks the session.
- [ ] **Logout**: Tap Logout in settings. Verify that all standard cache storage and secure token keys are deleted from memory.

### Employee Self-Service (ESS)
- [ ] **Employee Profile View**: Navigate to the Profile tab. Verify that user details (Designation, Department, reporting manager, full name) are correct.
- [ ] **Attendance GPS Punch**: Navigate to Attendance. Verify that mock selectors are absent. Punch in/out and confirm that geofencing checks the device's real GPS sensor against HQ office coordinates.
- [ ] **Leave Logs & Applications**: Navigate to Leaves. Verify that Casual, Sick, and Privilege Leave balances load. Submit a leave application and verify that it lists as pending.

### Secure Digital Vault
- [ ] **Document List Retrieval**: Navigate to the Vault screen. Verify that lists load without throwing errors.
- [ ] **Document Preview**: Tap "View" on a document. Verify that the file opens in an in-app browser overlay with the JWT session query token attached.
- [ ] **Document Sharing & Download**: Tap "Share" on a document. Verify that the file downloads and triggers the native OS sharing drawer.
- [ ] **Password Fallback Verification**: Cancel biometrics or run on a device lacking biometric hardware. Tap a payslip and verify that a custom password prompt modal appears, verifying inputs against `/auth/login` to authorize access.

### Safety & Safeguards (Hardening Validation)
- [ ] **Block Mock Manager Screens**: Log in as a manager. Verify that the bottom bar does not show the "HR Hub" tab (it must route to "Profile" instead).
- [ ] **Block Dashboard Banners**: Verify that the "HR Command Center" floating portal card and dashboard banner are hidden on the employee dashboard.
- [ ] **Gate Detail Pages**: Directly navigate or trigger onboarding, exit clearances, or appraisal worksheets. Verify that the screen renders a safe "Access Restricted" view.
- [ ] **Coming Soon Chats Placeholder**: Navigate to HR Connect Chats. Verify that the chat lists are replaced with a "Direct Chats (Coming Soon)" placeholder card.
- [ ] **Safe API Errors**: Run the application offline or force API requests to fail. Verify that error layouts and retry buttons display instead of silent mock fallbacks.

---

## 2. Go/No-Go Criteria for Pilot Deployment

Before authorizing deployment to pilot users, the following criteria must be met:

1.  **Backend Verification [GO]**: User management permissions on the backend must be verified so that employee queries function correctly.
2.  **Test Accounts Ready [GO]**: A set of verified pilot employee accounts must be seeded in the staging database.
3.  **Client-Side Hardening [GO]**: Verify that coordinate switchers, mock chats, and command center screens are gated.
4.  **Feedback Channel Defined [GO]**: A feedback capture mechanism (e.g. email, internal ticket portal) must be defined and shared with pilot users.
5.  **Unsupported Feature Communication [GO]**: Ensure pilot users are informed that manager dashboards, chats, and push notifications are disabled in this phase.
