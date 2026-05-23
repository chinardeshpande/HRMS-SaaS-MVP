# ACV Tenant Branding Visual QA

Date: 2026-05-24

## Scope

This pass validates the first visible ACV identity slice inside the authenticated AuroraHR application shell.

## What Was Tested

- ACV tenant login through backend API.
- Desktop dashboard render at 1440 x 900.
- Mobile dashboard render at 390 x 844 with the mobile navigation opened.
- Organization Settings render with tenant brand controls.
- Tenant identity visibility in the title bar near the user profile.
- AuroraHR logo remains untouched in the desktop sidebar and mobile drawer.
- ACV logo loading from tenant/organization settings.
- AuroraHR platform identity retained as the underlying product brand.
- Frontend and backend production builds.

## Result

Passed.

| Check | Result |
| --- | --- |
| AuroraHR logo remains primary sidebar/drawer logo | Passed |
| ACV Solutions visible in desktop title bar | Passed |
| ACV logo visible in desktop title bar | Passed |
| ACV Solutions visible in mobile title bar | Passed |
| ACV logo visible in mobile title bar | Passed |
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
