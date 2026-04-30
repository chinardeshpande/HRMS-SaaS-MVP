import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantOnboardingColumns1745748500000 implements MigrationInterface {
  name = 'AddTenantOnboardingColumns1745748500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      { name: 'isTrialActive', definition: 'boolean NOT NULL DEFAULT true' },
      { name: 'trialStartDate', definition: 'timestamp' },
      { name: 'trialEndDate', definition: 'timestamp' },
      { name: 'onboardingCompleted', definition: 'boolean NOT NULL DEFAULT false' },
      { name: 'onboardingCompletedAt', definition: 'timestamp' },
      { name: 'employeeCount', definition: 'integer NOT NULL DEFAULT 0' },
      { name: 'setupWizardCompleted', definition: 'boolean NOT NULL DEFAULT false' },
    ];

    for (const column of columns) {
      const hasColumn = await queryRunner.hasColumn('tenants', column.name);
      if (!hasColumn) {
        await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN "${column.name}" ${column.definition}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      'setupWizardCompleted',
      'employeeCount',
      'onboardingCompletedAt',
      'onboardingCompleted',
      'trialEndDate',
      'trialStartDate',
      'isTrialActive',
    ];

    for (const column of columns) {
      const hasColumn = await queryRunner.hasColumn('tenants', column);
      if (hasColumn) {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "${column}"`);
      }
    }
  }
}
