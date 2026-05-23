# ACV Tenant Branding Visual QA

Date: 2026-05-23

## Scope

This pass validates the first visible ACV identity slice inside the authenticated AuroraHR application shell.

## What Was Tested

- ACV tenant login through backend API.
- Desktop dashboard render at 1440 x 900.
- Mobile dashboard render at 390 x 844 with the mobile navigation opened.
- Organization Settings render with tenant brand controls.
- Tenant identity visibility in the sidebar and top bar.
- ACV logo loading from tenant/organization settings.
- AuroraHR platform identity retained as the underlying product brand.
- Frontend and backend production builds.

## Result

Passed.

| Check | Result |
| --- | --- |
| ACV Solutions visible in desktop app shell | Passed |
| ACV logo visible in desktop app shell | Passed |
| AuroraHR workspace label visible | Passed |
| ACV Solutions visible in mobile navigation | Passed |
| ACV logo visible in mobile navigation | Passed |
| Organization Settings exposes brand color controls | Passed |
| Backend build | Passed |
| Frontend build | Passed |

## Evidence

- [Desktop dashboard](./desktop-dashboard.png)
- [Mobile dashboard](./mobile-dashboard.png)
- [Organization Settings](./settings-organization.png)

## Notes

- ACV tenant branding was configured through existing local tenant/organization settings:
  - `logo`: `/images/tenant-logos/acv-solutions.svg`
  - `primaryColor`: `#244aa8`
  - `secondaryColor`: `#f4310c`
- Product code remains generic. No ACV-specific tenant logic was hardcoded into the React shell.
- Demo tenant isolation visual check could not be completed because local demo seed data is not currently available.
