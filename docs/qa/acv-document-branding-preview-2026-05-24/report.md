# ACV Tenant-Branded HR Document Preview QA

Date: 2026-05-24

## Scope

Verified that HR document generation now applies tenant branding and shows a view-only modal preview before the document is saved/generated.

## Test Coverage

| Area | Scenario | Result | Evidence |
| --- | --- | --- | --- |
| API login | ACV admin login using `anupama.bhat@acvsolutions.in` | Pass | Login API returned tenant context for ACV Solutions |
| Template listing | Fetch document templates for ACV tenant | Pass | Appointment, offer, and confirmation templates returned |
| Preview API | Generate an appointment-letter preview | Pass | HTML returned with ACV Solutions, ACV logo URL, primary color `#244aa8`, accent color `#f4310c` |
| PDF generation | Generate appointment-letter PDF after preview payload | Pass | API returned HTTP 200, `application/pdf`, valid one-page PDF |
| Browser modal | Open Documents, select template, fill fields, preview before save | Pass | `preview-modal.png` |
| View-only behavior | Preview is rendered inside an iframe with no edit controls | Pass | User can only go back or save/download |

## Evidence

- Screenshot: `docs/qa/acv-document-branding-preview-2026-05-24/preview-modal.png`
- Generated PDF check artifact: `/tmp/aurora_generated.pdf`
- Preview API response check artifact: `/tmp/aurora_preview.json`

## Notes

- The HTML preview uses the tenant logo asset directly from `/images/tenant-logos/acv-solutions.svg`.
- The saved/generated PDF receives tenant-branded letterhead, company name, tenant colors, document title, and footer.
- This remains tenant-generic. No ACV-specific logic was hardcoded into document generation.
