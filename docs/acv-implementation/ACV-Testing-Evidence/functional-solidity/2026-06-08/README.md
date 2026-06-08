# Functional Solidity Evidence - 2026-06-08

Branch: `codex/acv-functional-solidity-sprint`  
Environment: local backend test database `hrms_saas_test`  
Data policy: synthetic test users and synthetic files only. No sensitive real ACV employee data was committed.

## Commands Run

```bash
npm --prefix backend run build
npm --prefix backend run test:qa -- --runTestsByPath tests/integration/09-attendance-basic.test.ts tests/integration/10-leave-basic.test.ts
npm --prefix backend run test:qa
```

## Results

| Command | Result |
| --- | --- |
| Backend build | Passed |
| Focused Attendance + Leave QA | Passed: 2 suites, 20 tests |
| Full backend QA | Passed: 11 suites, 84 tests |

## Defect Found And Fixed

Leave application could pass an over-balance request because the service checked the raw `LeaveBalance.available` getter instead of the normalized, gender-aware effective balance helper. The check now uses `toEffectiveLeaveBalance(...)`.

## New Coverage Added

- Attendance self-service clock-in.
- Duplicate clock-in rejection.
- Attendance self-service clock-out.
- Leave apply and manager approval.
- Leave insufficient-balance rejection.
- Gender-restricted leave mismatch rejection.

## Explicit Non-Scope

- Historical document file restoration.
- Zoho/SMTP integration.
- Manu AI expansion.
- Payroll computation.
- Recruitment/ATS.
- Browser Playwright E2E.

