# ACV Data Intake Checklist

## Organization

- Legal name: ACV Solutions Pvt Ltd
- Display name:
- Company email domain:
- Registered address:
- Primary HR contact:
- Director / owner user:
- Pilot start date:
- Target go-live date:

## Masters

Required before employee import:

- departments
- designations
- reporting relationships
- employment types
- office/work locations, if applicable
- leave policy
- attendance policy
- holiday calendar

## Employee Data

Required fields:

- employeeCode
- firstName
- lastName
- email
- department
- designation
- dateOfJoining
- employmentType
- managerEmail

Recommended fields:

- phone
- dateOfBirth
- gender
- work location
- probation status/date
- employment status
- personal email
- emergency contact

## Access Roles

Map every user to one of:

- system_admin
- hr_admin
- manager
- employee

Initial pilot users:

- Director:
- HR leader:
- HR operations user:
- Manager sample 1:
- Manager sample 2:
- Employee sample 1:
- Employee sample 2:

## Pre-Import Validation

- All departments in employee file exist in Masters.
- All designations in employee file exist in Masters.
- All `managerEmail` values either are blank for top-level roles or exist as employee emails.
- No duplicate employee codes.
- No duplicate emails.
- Dates are in `YYYY-MM-DD` format.
- Employment types match allowed values: `Full-Time`, `Part-Time`, `Contract`, `Intern`.
- Gender values match allowed values: `Male`, `Female`, `Other`.

## Sign-Offs

- Data source approved by ACV HR:
- Masters approved by ACV HR:
- Employee import dry run approved:
- Real import approved:
- Credential release approved:

