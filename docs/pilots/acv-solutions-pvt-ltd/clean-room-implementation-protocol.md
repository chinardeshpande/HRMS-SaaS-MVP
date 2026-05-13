# ACV Clean-Room Implementation Protocol

ACV Solutions Pvt Ltd is a serious real-client pilot. It must be implemented as a fresh production tenant with no inherited demo, QA, CampusLife, Acme, Aurora demo, or previous test data.

## Non-Negotiables

- Do not reuse any existing demo tenant.
- Do not clone or copy from the AuroraHR demo tenant.
- Do not seed ACV through any `seedDemo`, `seedTestData`, `seedReportingData`, CampusLife, Acme, or QA scripts.
- Do not import ACV employees into any tenant whose row counts show old operational data.
- Do not share credentials until tenant cleanliness, data reconciliation, role access, and workflow smoke tests pass.
- Do not commit real ACV employee data to Git.

## Required Fresh-Tenant State

Before employee import, the ACV tenant may contain only controlled setup records:

- one owner/admin user, if created by registration or invite flow
- default tenant initialization records such as roles, document templates, leave policies, attendance policy, subscription, organization settings, and onboarding progress
- approved ACV departments and designations once master setup begins

It must not contain:

- employees from old tests
- demo users
- `campuslife.com`, `aurorahr.in`, `acme`, or sample-domain employees
- QA suffix rows such as `88824874`, `89157172`, or `89916215`
- attendance, leave, performance, onboarding, exit, HR Connect, chat, document, or report records from previous test exercises

## Clean Implementation Sequence

1. Take a production database backup.
2. Create a new ACV tenant using the normal registration/onboarding path or a reviewed provisioning script.
3. Run tenant initialization only for default policies/templates/roles.
4. Run the cleanliness audit:

   ```bash
   npm --prefix backend run audit:tenant-clean -- --company-name="ACV Solutions Pvt Ltd" --allowed-email-domain=acvsolutions.in --max-existing-employees=0 --max-existing-users=1
   ```

5. Load ACV master data only after the audit passes.
6. Re-run the audit with employee limit still set to zero.
7. Dry-run the reviewed private CSV import using the pilot import utility.
8. Import ACV employees from the approved private CSV only after the dry-run passes.
9. Reconcile imported counts against the approved source file.
10. Run role-based UI and API checks.
11. Release credentials in waves: Director and HR first, then managers, then employees.

## Import Utility

Use private CSV paths only. Do not commit real employee files or generated credential files.

Dry-run:

```bash
npm --prefix backend run import:pilot-org -- \
  --company-name="ACV Solutions Pvt Ltd" \
  --allowed-email-domain=acvsolutions.in \
  --masters-csv=/private/tmp/acv-onboarding-prep/final/acv-master-data-final.csv \
  --employees-csv=/private/tmp/acv-onboarding-prep/final/acv-employee-import-final.csv
```

Execution is intentionally explicit:

```bash
PILOT_DEFAULT_PASSWORD="<temporary-password>" \
npm --prefix backend run import:pilot-org -- \
  --company-name="ACV Solutions Pvt Ltd" \
  --allowed-email-domain=acvsolutions.in \
  --masters-csv=/private/tmp/acv-onboarding-prep/final/acv-master-data-final.csv \
  --employees-csv=/private/tmp/acv-onboarding-prep/final/acv-employee-import-final.csv \
  --create-users \
  --credentials-out=/private/tmp/acv-onboarding-prep/final/acv-credentials.csv \
  --execute
```

The script refuses to import into a tenant that already has employees unless `--allow-existing-employees` is passed deliberately after review.

## If Audit Fails

Stop immediately.

Do not clean manually inside production without a reviewed plan. First determine whether:

- the tenant selector matched the wrong tenant
- the tenant was reused accidentally
- old data was imported into ACV
- the allowed email domain is wrong
- a legitimate admin user exceeds the configured threshold

Then either recreate a fresh tenant or execute a reviewed rollback/cleanup with a fresh backup.
