# ACV Company Document Import Dry Run

Generated: 2026-05-27T15:51:17.677Z

## Tenant

- Company: ACV Solutions
- Tenant ID: f5ed3bd0-d89f-4762-b212-c3b41d358fe8
- Mode: dry-run

## Summary

- total: 9
- create: 8
- skip_existing_hash: 0
- update_existing_metadata: 1
- repair_existing_file: 0
- warnings: 0

## Planned Actions

| Action | Title | Category | Existing ID | Source |
|---|---|---|---|---|
| create | ACV PTEC Certificate | tax_registration |  | ACV PTEC Certificate.pdf |
| create | PTRC Certificate | tax_registration |  | PTRC Certifcate.pdf |
| update_existing_metadata | GST Certificate | tax_registration | b5bcee67-6d18-464d-a27b-01f7fad1e79b | GST Certificate-ACV Solutions.pdf |
| create | PAN Card | tax_registration |  | PAN Card-ACV.pdf |
| create | Certificate of Incorporation | incorporation_identity |  | CERTIFICATE OF INCORPORATION.PDF |
| create | Form INC-20A Declaration | incorporation_identity |  | Form_INC-20A_ACV Solutions.pdf |
| create | Company Registration Acknowledgement | incorporation_identity |  | Acknowlegement.pdf |
| create | Udyam Registration Certificate | incorporation_identity |  | Print _ Udyam Registration Certificate with Anexure.pdf |
| create | Gumasta / Shops and Establishment License | labor_hr_compliance |  | Gumasta License.pdf |

## Rollback Notes

- Created records can be identified by `metadata.importBatch = acv-latest-data-2026-05-27`.
- Copied files are stored under `uploads/company-documents` with deterministic hash-suffixed names.
- If rollback is needed, archive/delete records created by this batch and remove matching copied files.
- Existing document updates should be restored from database backup if a full rollback is needed.

## Warnings

- None
