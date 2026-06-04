# Document and Payslip Lifecycle API Tests

Date: 2026-06-04  
Branch: `codex/document-lifecycle-api-tests`  
Test command: `cd backend && npm run test:qa -- --runInBand`

## Summary

| Metric | Value |
| --- | --- |
| Test suites | 11 |
| Tests total | 76 |
| Tests passed | 76 |
| Tests failed | 0 |
| New lifecycle suite | `backend/tests/integration/11-document-payslip-lifecycle.test.ts` |

## Scope Completed

### QA Advisory Fixes

| Advisory | Status |
| --- | --- |
| Account enumeration through inactive/ambiguous account responses | Fixed. Login returns generic 401 `INVALID_CREDENTIALS`. |
| Missing second-tenant employee role fixture | Fixed. Added `employee@orbit.test`. |
| Silent-pass tests caused by `if (!ctx) return` | Fixed for current API suite. Seed-dependent tests now hard-fail through `requireAuth(...)`. |

### Employee Document Lifecycle

Covered through API tests:

- HR upload using safe temporary PDF fixture.
- HR list and employee self-list.
- Employee self-download roundtrip.
- Update metadata.
- Verify document.
- Archive document.
- Cross-employee denial.
- Cross-tenant denial.
- Missing document response.
- Audit checks for upload, download, update, verify, and archive.

### Company Document Lifecycle

Covered through API tests:

- HR upload using safe temporary PDF fixture.
- HR list.
- HR download roundtrip.
- Update metadata.
- Verify document.
- Archive document.
- Employee access denial.
- Cross-tenant denial.
- Missing document response.
- Missing file response for seeded nonexistent fixture.
- Audit checks for upload, download, update, verify, and archive.

### Payslip Lifecycle

Covered through API tests:

- HR creates a payslip.
- HR uploads a payslip attachment using a safe temporary PDF fixture.
- HR downloads the attachment.
- Employee downloads own visible attachment.
- Manager denied employee compensation.
- Second-tenant employee denied ACV compensation.
- Missing attachment response.
- Missing file response for seeded nonexistent fixture.
- Audit check for payslip attachment download.

## Production Code Changes

| File | Change |
| --- | --- |
| `backend/src/controllers/authController.ts` | Generic credential failure handling for inactive and ambiguous duplicate account cases. |
| `backend/src/routes/compensationRoutes.ts` | Added audit event recording for payslip attachment downloads. |

## Test Data Changes

Synthetic seed data only. No real ACV employee documents or salary files were committed.

| Seed area | Change |
| --- | --- |
| Auth users | Added inactive and duplicate-email test accounts. |
| Orbit tenant | Added employee-role user `employee@orbit.test`. |
| Test account matrix | Added second-tenant employee account. |

## Verification

Command:

```bash
cd backend
npm run test:qa -- --runInBand
```

Result:

```text
Test Suites: 11 passed, 11 total
Tests:       76 passed, 76 total
Snapshots:   0 total
```

Silent-pass scan:

```bash
rg -n "if \(!.*\) return|console\.warn\('SCAFFOLD|\[200,500\]|not\.toBe\(403\)" backend/tests/integration backend/tests/helpers
```

Result: no scaffold skip or `[200,500]` patterns remain. One `not.toBe(403)` assertion remains paired with an explicit `toBe(400)` validation assertion in the HR create employee authorization test.

## Remaining QA Blockers

- Browser E2E tests are still pending.
- Playwright is not added in this sprint.
- HR Connect, chat, helpdesk, calendar, realtime collaboration, profile photo upload, and Manu assistant are not covered by this API lifecycle suite.
- File preview rendering is not covered at API level; browser E2E should validate modal preview behavior.

## Recommended Next QA Sprint

Start Playwright E2E with a narrow smoke suite:

1. Login/logout and protected route behavior.
2. Navigation shell and role-specific sidebar visibility.
3. Employee register and employee detail tabs.
4. Company document vault list, upload, preview, download.
5. Employee document list, preview, download.
6. Payslip library visibility and download.
