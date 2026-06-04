# AuroraHR Mobile Product Surface Inventory

This document provides a comprehensive inventory, architectural description, and integration status of the AuroraHR Mobile App (React Native/Expo) as of June 2026. This surface inventory serves as a alignment bridge for the **ACV Solutions Customer Zero** implementation.

---

## 1. Technical Architecture Overview

### Framework and Core Versions
The mobile application is built on the **Expo SDK 50** framework with **React Native 0.73.2**.
- **Core Library**: React 18.2.0
- **TypeScript**: 5.3.3
- **Styling UI**: React Native Paper 5.11.6 & native StyleSheets
- **Authentication Security**: Expo SecureStore (~12.8.1)
- **Local Settings / Cache**: AsyncStorage (1.21.0)
- **Navigation Engine**: React Navigation (Native 6.1.9, Bottom-Tabs 6.5.11, Stack 6.3.20)
- **HTTP Client**: Axios 1.6.5

### Directory Structure
```
mobile-app/
├── App.tsx                     # App entry point, registers theme and root navigator
├── app.json                    # Expo configuration metadata & plugins
├── babel.config.js             # Babel compile presets
├── index.js                    # Core entry index
├── jest.config.js              # Unit testing configurations & aliases
├── jest.setup.js               # Jest unit testing mock integrations
├── package.json                # Project dependencies and scripting
├── tsconfig.json               # TypeScript path mapping & compile rules
└── src/
    ├── api/
    │   ├── client.ts           # Axios client instantiation & interceptors
    │   ├── endpoints.ts        # Endpoint bindings with fallback mock databases
    │   └── __tests__/          # Client network interceptor tests
    ├── assets/                 # Brand SVG & PNG assets
    ├── components/
    │   ├── AnimatedTimer.tsx   # Pulse timer for active shifts
    │   ├── CommonButton.tsx    # Styled buttons with loading indicator
    │   ├── CommonCard.tsx      # Frosted glass card UI panels
    │   └── StatusBadge.tsx     # Custom color badges for statuses
    ├── context/
    │   ├── useAuthStore.ts     # Zustand store for user session and tokens
    │   └── __tests__/          # Zustand auth action tests
    ├── navigation/
    │   ├── AppNavigator.tsx    # Core tab navigator, floating action, modals
    │   ├── AuthNavigator.tsx   # Login stack navigator
    │   └── types.ts            # Route type descriptions
    ├── screens/
    │   ├── attendance/         # Geofenced Attendance screen
    │   ├── auth/               # Biometric and credential login
    │   ├── dashboard/          # Home workspace, calendar strip, pending alerts
    │   ├── employees/          # Directory search and employee detail cards
    │   ├── hr-command/         # Mock-based manager console detailing probation, exits
    │   ├── hr-connect/         # Collaborative posts and Direct Chat threads
    │   ├── leave/              # Leave tracker, balance dials, approval tabs
    │   ├── profile/            # Employee self-profile screen
    │   └── vault/              # Biometric gated digital document locker
    ├── types/
    │   └── index.ts            # Consolidated TypeScript entities
    └── utils/
        ├── format.ts           # Utility formatters (bytes, dates, duration)
        ├── notifications.ts    # Expo local push notification handlers
        ├── secureStore.ts      # Hardware Keychain read/write wraps
        └── theme.ts            # Unified design token system
```

### State Management & Authentication Flow
- **State Store**: Built on **Zustand** (`src/context/useAuthStore.ts`).
- **Session Tokens**: Active tokens are cached in the device Keychain/Keystore via `expo-secure-store`. Non-sensitive user profile metadata is cached in `AsyncStorage`.
- **Initialization Lifecycle**:
  - `initAuth()` reads SecureStore tokens and AsyncStorage profile.
  - If a biometric flag is enabled, the app locks the session and requires fingerprint/face check on startup.
  - If biometrics are off, it auto-authenticates into the tab bar layout.
  - Standard user login validates credentials on the server and caches tokens.

### API Client & Interceptors
The client (`src/api/client.ts`) sets up an Axios instance target base URL (`http://localhost:5000/api/v1` for local iOS loopback, or `http://10.0.2.2:5000/api/v1` for Android).
- **Request Interceptor**: Extracts the JWT token from the Zustand store and injects it as an `Authorization: Bearer <JWT>` header.
- **Response Interceptor (Token Refresh)**: On a `401 Unauthorized` response, it intercepts the call, hits `/auth/refresh` using the secured refresh token, retrieves a fresh access token, updates SecureStore, and retries the original request.
- **Mock Fallbacks**: In `src/api/endpoints.ts`, endpoints catch network/status errors and resolve mock arrays (`_mockPosts`, `_mockGroups`, `_mockClearances`, etc.) to guarantee off-line UI presentation.

### Platform and Device Status
- **Android Target**: Android 13+ (API 33). Fully functional on emulator and physical testing hardware.
- **iOS Target**: iOS 16+. Fully functional on Xcode simulator and physical devices.
- **Local Testing**: Runs via Expo CLI (`npx expo start`). Requires an active tunnel (`--tunnel`) or direct local IP adjustments to interface with the Node.js backend.

---

## 2. Navigation Architecture

The app uses **React Navigation 6.x** with a custom tab bar (`CustomTabBar` inside `AppNavigator.tsx`).
- **Curved Bottom Floating Tab Bar**:
  - `Dashboard`: Accesses the nested dashboard stacks.
  - `DocumentHub`: Points to the Digital Vault document locker.
  - `HRConnect`: Opens the feeds, group channels, and chat lists.
  - `ProfileStack` / `HR Hub`: For normal employees, displays `ProfileScreen`. For Managers/Admins, displays `HRCommandCenterScreen` (labeled "HR Hub").
- **Central Action Portal (Floating '+' Button)**:
  - Opens a custom **Quick Creation Hub** frosted-glass modal overlay.
  - Quick options: Apply Leave, Schedule Event, Request Attendance Regularisation, Raise IT/HR Support Ticket, and jump to the HR Command Hub (Admins only).
- **Secondary Stack Navigators**:
  - `DirectoryStack`: EmployeeList ➔ EmployeeDetail.
  - `DashboardStack`: Connects the home screen to the Digital Vault and HR Command Center detail screens (ExitDetail, PerformanceDetail, OnboardingDetail, ProbationReview).

---

## 3. Screen Inventory & API Integration Matrix

| Screen File / Path | Persona Access | Current Integration Status | Backend Route Targeted | Mock / Local Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **LoginScreen**<br>`screens/auth/LoginScreen.tsx` | All Users | **Fully Connected** | `POST /auth/login`<br>`POST /auth/logout` | No mock fallback |
| **DashboardScreen**<br>`screens/dashboard/DashboardScreen.tsx` | All Users | **Fully Connected** | `GET /attendance/today`<br>`GET /performance/reviews`<br>`GET /leave/pending-approvals` | Fallback PMS goals mock lists if route fails |
| **EmployeeListScreen**<br>`screens/employees/EmployeeListScreen.tsx` | All Users | **Fully Connected** | `GET /employees` | Offline search mock fallbacks |
| **EmployeeDetailScreen**<br>`screens/employees/EmployeeDetailScreen.tsx` | All Users | **Fully Connected** | `GET /employees/:id`<br>`PUT /employees/:id` | No mock fallback |
| **ProfileScreen**<br>`screens/profile/ProfileScreen.tsx` | All Users | **Fully Connected** | `GET /employees/:my_id` | Core state data loaded from Zustand cache |
| **AttendanceScreen**<br>`screens/attendance/AttendanceScreen.tsx` | All Users | **Fully Connected** | `POST /attendance/clock-in`<br>`POST /attendance/clock-out`<br>`GET /attendance/my-attendance` | Location details geofenced on client; mock coordinates selector widget |
| **LeaveScreen**<br>`screens/leave/LeaveScreen.tsx` | All Users | **Fully Connected** | `GET /leave/my-balance`<br>`POST /leave/apply`<br>`GET /leave/my-requests`<br>`GET /leave/pending-approvals`<br>`PUT /leave/:id/approve` | Balance fallbacks: `{ CL: 12, SL: 10, PL: 15 }` |
| **DigitalVaultScreen**<br>`screens/vault/DigitalVaultScreen.tsx` | All Users | **Partially Connected** | `GET /digital-library`<br>`GET /documents/entity/employee/:id` | Fallback mock arrays for payslips, public policies, NDAs if backend fails |
| **HRConnectScreen**<br>`screens/hr-connect/HRConnectScreen.tsx` | All Users | **Partially Connected** | `GET /hr-connect/posts`<br>`POST /hr-connect/posts`<br>`GET /hr-connect/groups`<br>`POST /hr-connect/groups/:id/join` | Extensive local cache lists (`_mockPosts`, `_mockGroups`) written on error |
| **HRConnectChats**<br>`screens/hr-connect/HRConnectChats.tsx` | All Users | **Mock Only** | None | Runs on `SEED_CHATS` and `DIRECTORY_EMPLOYEES` local arrays |
| **HRCommandCenterScreen**<br>`screens/hr-command/HRCommandCenterScreen.tsx` | Managers, Admins | **Mock Only** | None | Reads hardcoded lists for candidates, reviews, exits. No endpoints imported |
| **ExitDetailScreen**<br>`screens/hr-command/ExitDetailScreen.tsx` | Managers, Admins | **Mock Only** | None | Interactive mock for asset checkout, resignation dates, and IT clearances |
| **OnboardingDetailScreen**<br>`screens/hr-command/OnboardingDetailScreen.tsx` | Managers, Admins | **Mock Only** | None | Interactive mock for BGV status checklists and orientation dates |
| **PerformanceDetailScreen**<br>`screens/hr-command/PerformanceDetailScreen.tsx` | Managers, Admins | **Mock Only** | None | Interactive mock for rating normalizations and mid-year cycle approvals |
| **ProbationReviewScreen**<br>`screens/hr-command/ProbationReviewScreen.tsx` | Managers, Admins | **Mock Only** | None | Interactive mock for probation confirmations and manager reviews |

---

## 4. Feature & Module Inspection

### 1. Document Hub and Payslip Vault
- **Digital Locker Separation**: Vault separates records into three sections: **Payslips** (private financial records), **Issued Docs** (system-issued NDA, appointment letters), and **Policies** (public employee handbook, travel policies).
- **Biometric Authentication Gating**: Accessing Payslips or Issued Docs tabs requires active fingerprint or face validation. The screen calls `LocalAuthentication.authenticateAsync`. If successful, the documents display; otherwise, they remain hidden.
- **In-App Document Preview**: Tap "View" initiates in-app preview by querying `/api/v1/digital-library/:id/view` (or `/api/v1/documents/:id/download`). It appends the current JWT token as a URL search parameter (`?token=<JWT>`) and opens the secure file inside `expo-web-browser`.
- **Download and Native Sharing**: Tapping "Share" downloads the file via `FileSystem.downloadAsync` using an `Authorization` Bearer header. Upon saving the file to `FileSystem.documentDirectory`, the app calls `Sharing.shareAsync` to open native system sharing dialogs.

### 2. Attendance punch with Geofencing
- **Premises Geofencing**: Attendance punching validates distance from the headquarters using the Haversine formula against hardcoded coordinates (`ACME_OFFICE_COORDS`: latitude 12.9716, longitude 77.5946) with a threshold of **100 meters**.
- **Geofencing modes**:
  - `office`: Forces coordinates to Acme HQ (0m distance) for mock testing.
  - `wfh`: Sets location to 5.2km away. Forces punch blocks unless the user includes "wfh" or "home" in the remarks input.
  - `gps`: Requests foreground geolocation coordinates via `expo-location` and verifies live location.
- **Punch Action**: Submits actions (`in` or `out`), coordinates, timestamp, and notes to the server. If a shift is running, the app starts a local tick timer (`AnimatedTimer`) calculating duration.

### 3. Leave Management
- **Balance dials**: Reads Casul (CL), Sick (SL), and Privilege (PL) leaves. Subtracts pending and used leave allocations to calculate remaining days.
- **Request Flow**: Forms collect Category, Start Date, End Date, and Reason. Submits requests via `/leave/apply`.
- **Manager Approval**: Managers view team submissions in the "Approvals" tab. Can trigger Approve (`PUT /leave/:id/approve`) or Reject (which prompts for rejection remarks and submits comment metadata).

### 4. HR Connect Collaboration and Messaging
- **Social Feed**: Pulls posts from `/hr-connect/posts`. Employees can like/react and comment on threads.
- **Groups**: Allows joining or leaving specific topic categories.
- **Direct Messaging**: Purely mockup. Displays list of chat threads with managers and colleagues, and permits keyboard inputs that write to local arrays. No WebSockets or messaging servers are integrated.

### 5. HR Command Center (HR Hub)
- **Hiring Pipeline**: Monitors candidates and their Background Verification (BGV) checklist states.
- **Probation Review**: Evaluates employees ending probation and captures manager approval.
- **Performance Appraisals**: Evaluates self-ratings vs manager ratings and handles normalizing.
- **Exits**: Manages asset return schedules, IT clearances, and resignation notice periods.
- *Note: All of these features are built with static React state and do not hit backend APIs.*

---

## 5. Security & Access Control

- **Keychain Storage**: Access and refresh tokens are securely stored in the iOS Keychain/Android Keystore via `expo-secure-store` to prevent token theft.
- **Non-Sensitive Data**: User metadata (role, department, full name) are stored in standard AsyncStorage.
- **Biometric Credentials**: Local authentication gates the digital document vault and session restoration.
- **Role Permissions**: 
  - Standard employee: Tab displays "Profile". Can access vault, apply leave, log attendance, browse feed.
  - Manager / HR Admin / Admin: Bottom tab switches to "HR Hub" with badge numbers for pending approvals. Displays the `HRCommandCenterScreen` instead of the employee profile. Access to quick actions (like Schedule Event) is role-gated in the `CustomTabBar`.
- *Risk: Mobile role-enforcement is UI-driven in some views. If backend endpoints do not validate the incoming JWT role, managers' mock endpoints could theoretically be bypassed.*

---

## 6. UX/UI & Usability Assessment

- **Visual Theme**: Uses a premium, glassmorphic layout with translucent overlay cards (`CommonCard` with `variant="glass"`). It incorporates deep indigo, sky blue, and white gradient schemes (`themeColors.gradients.afternoon`).
- **Responsive Sizing**: Flex layouts and scroll containers dynamically adjust between compact Android interfaces and large tablet displays.
- **Interaction Feedback**: Buttons have loading indicators and touch-opacity feedback.
- **Accessibility Basics**: Standard interactive buttons use screen accessibility tags. High contrast text ratios are enforced (dark gray-900 on white).
- **ACV Branding Readiness**: Theme variables are consolidated in `theme.ts` but are hardcoded to AuroraHR values. The app logo is a static asset.

---

## 7. Key Gaps and Recommendations

1. **HR Command Center Integration**: The 5 admin screens are currently fully client-side mocked. They need to be wired to the backend API.
2. **HR Connect Chat**: The messaging engine relies on `SEED_CHATS` and has no real backend or WebSocket integration.
3. **Manu AI Client**: Entirely absent on mobile. Needs a chat shell interface and chat endpoints.
4. **Corporate Branding**: Configurable tenant branding from settings is not resolved in the app; colors and logos are hardcoded.
5. **Real-time Push Notifications**: Dependency is present but actual push notification dispatch integration is missing on the server.
6. **Detailed Gap Register**: Reference [ACV-Mobile-Gap-Register.md](file:///Users/chinar.deshpande06/CD-THG/2025/THG-AI/MyCodingJourney/current-projects/HRMS-SaaS-MVP/docs/acv-implementation/ACV-Mobile-Gap-Register.md) for a detailed list.
