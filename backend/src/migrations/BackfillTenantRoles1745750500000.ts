import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillTenantRoles1745750500000 implements MigrationInterface {
  name = 'BackfillTenantRoles1745750500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" (
        "tenantId",
        "roleName",
        "description",
        "isSystemRole",
        "isActive",
        "level",
        "employeeCount",
        "dataAccessRules",
        "createdAt",
        "updatedAt"
      )
      SELECT
        t."tenantId",
        role_data."roleName",
        role_data."description",
        true,
        true,
        role_data."level",
        0,
        role_data."dataAccessRules"::jsonb,
        now(),
        now()
      FROM "tenants" t
      CROSS JOIN (
        VALUES
          ('System Admin', 'Full tenant administration access', 100, '{"allData":true}'),
          ('HR Admin', 'HR operations and employee administration access', 80, '{"allData":true}'),
          ('Manager', 'Team management access', 50, '{"teamDataOnly":true}'),
          ('Employee', 'Standard employee self-service access', 10, '{"ownDataOnly":true}')
      ) AS role_data("roleName", "description", "level", "dataAccessRules")
      WHERE NOT EXISTS (
        SELECT 1
        FROM "roles" r
        WHERE r."tenantId" = t."tenantId"
          AND r."roleName" = role_data."roleName"
      )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Default role backfills are intentionally retained to avoid removing live role assignments.
  }
}
