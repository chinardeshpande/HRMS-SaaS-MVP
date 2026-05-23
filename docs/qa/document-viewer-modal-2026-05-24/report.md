# Document Viewer Modal QA

Date: 2026-05-24

## Scope

Verified the new view-in-modal experience for uploaded/generated documents across the active document surfaces.

## Coverage

| Area | Change | Result | Evidence |
| --- | --- | --- | --- |
| Generated document history | Added View action and card/list switch | Pass | `generated-history-modal-after-load.png` |
| Company document vault | Added View action and card/list switch | Pass | `company-document-modal-after-load.png` |
| Employee documents | Added View action and card/list switch | Build verified; local ACV employee had no uploaded employee docs to open | Frontend build |
| My HR Documents | Added View action on document cards | Build verified | Frontend build |
| Payslip attachments | Added modal preview for uploaded payslip files | Build verified; local test data did not include a payslip attachment row for browser evidence | Frontend build |
| Protected document loading | Viewer loads documents via authenticated blob fetch instead of naked protected URLs | Pass | Company vault PDF opened in modal |

## Notes

- PDF and image files render directly in the modal.
- Other file types show a clear preview-unavailable state with download available.
- The viewer preserves download behavior while adding a safer in-app viewing path.
- No backend API changes were required for this pass.
