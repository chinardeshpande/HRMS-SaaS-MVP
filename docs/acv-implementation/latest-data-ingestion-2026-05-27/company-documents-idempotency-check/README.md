# ACV Company Document Import Dry Run

Generated: 2026-05-27T15:52:15.069Z

## Tenant

- Company: ACV Solutions
- Tenant ID: f5ed3bd0-d89f-4762-b212-c3b41d358fe8
- Mode: dry-run

## Summary

- total: 9
- create: 0
- skip_existing_hash: 9
- update_existing_metadata: 0
- repair_existing_file: 0
- warnings: 0

## Planned Actions

| Action | Title | Category | Existing ID | Source |
|---|---|---|---|---|
| skip_existing_hash | ACV PTEC Certificate | tax_registration | b79474d1-2aeb-4b32-999b-a258fd3ae646 | ACV PTEC Certificate.pdf |
| skip_existing_hash | PTRC Certificate | tax_registration | 6d308da1-0446-4bc4-b3d1-c1e0337b61be | PTRC Certifcate.pdf |
| skip_existing_hash | GST Certificate | tax_registration | b5bcee67-6d18-464d-a27b-01f7fad1e79b | GST Certificate-ACV Solutions.pdf |
| skip_existing_hash | PAN Card | tax_registration | f2c53784-f5d0-4cca-9101-60351eb827bd | PAN Card-ACV.pdf |
| skip_existing_hash | Certificate of Incorporation | incorporation_identity | 722fba4e-f42d-4e54-94ed-5c1b2f6c827f | CERTIFICATE OF INCORPORATION.PDF |
| skip_existing_hash | Form INC-20A Declaration | incorporation_identity | 0d6447c4-af20-427f-94ef-011af118a412 | Form_INC-20A_ACV Solutions.pdf |
| skip_existing_hash | Company Registration Acknowledgement | incorporation_identity | e38fe8ab-78dc-4931-9f01-a5e3a6260c08 | Acknowlegement.pdf |
| skip_existing_hash | Udyam Registration Certificate | incorporation_identity | ca3315d5-9116-4a57-b8aa-a104e7a0478f | Print _ Udyam Registration Certificate with Anexure.pdf |
| skip_existing_hash | Gumasta / Shops and Establishment License | labor_hr_compliance | db0660ab-aa3c-4980-825f-cd8db384acf9 | Gumasta License.pdf |

## Rollback Notes

- Created records can be identified by `metadata.importBatch = acv-latest-data-2026-05-27`.
- Copied files are stored under `uploads/company-documents` with deterministic hash-suffixed names.
- If rollback is needed, archive/delete records created by this batch and remove matching copied files.
- Existing document updates should be restored from database backup if a full rollback is needed.

## Warnings

- None
