# AuroraHR Responsive Visual QA - 2026-05-19

## Scope

Responsive visual smoke testing for the AuroraHR landing page and authenticated HRMS application screens.

## Tested Viewports

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1440 x 900

## Tested Routes

- Public: landing, login, registration, forgot password
- Authenticated demo: dashboard, employees, attendance, leave, HR Connect, reports, documents, settings

## Fixes Applied

- Tightened authenticated mobile header spacing and changed the global search placeholder to a mobile-safe label.
- Converted Attendance module tabs into a mobile grid so all core views are visible without clipped labels.
- Converted HR Connect tabs into a mobile grid so Feed, Chat, Groups, and Helpdesk remain directly reachable.
- Kept the Investor Demo Journey map collapsed by default on mobile dashboard to preserve useful first-screen content.
- Improved landing-page mobile hero image sizing so the image is visible instead of compressed into a thin strip.
- Adjusted desktop landing hero composition and card text clamping to avoid visually broken card content.
- Added `VITE_SOCKET_URL` support for HR Connect sockets and configurable Vite API proxy target for reliable local QA.

## Validation

Final command:

```bash
QA_BASE_URL=http://127.0.0.1:5185 QA_SESSION_API_URL=http://127.0.0.1:5185 QA_OUT_DIR=docs/qa/responsive-polish-2026-05-19/final node scripts/qa/responsive-visual-smoke.mjs
```

Final result:

```json
{
  "target": "http://127.0.0.1:5185",
  "count": 36,
  "needsReview": 0,
  "horizontalOverflow": [],
  "consoleOrPageErrors": []
}
```

Screenshots:

- `docs/qa/responsive-polish-2026-05-19/final/screenshots/`

Build:

- `frontend-web`: `yarn build` passed.
