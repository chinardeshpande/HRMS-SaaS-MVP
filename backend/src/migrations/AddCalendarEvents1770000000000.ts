import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarEvents1770000000000 implements MigrationInterface {
  name = 'AddCalendarEvents1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calendar_events" (
        "eventId" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "eventType" varchar(50) NOT NULL DEFAULT 'meeting',
        "startDate" date NOT NULL,
        "endDate" date,
        "startTime" varchar(5),
        "endTime" varchar(5),
        "isAllDay" boolean NOT NULL DEFAULT false,
        "location" varchar(255),
        "organizerId" uuid,
        "attendees" jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'scheduled',
        "relatedEntityId" uuid,
        "relatedEntityType" varchar(50),
        "navigationUrl" varchar(500),
        "metadata" jsonb,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_calendar_events_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_calendar_events_organizer" FOREIGN KEY ("organizerId") REFERENCES "employees"("employeeId") ON DELETE SET NULL
      )
    `);

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_calendar_events_tenant_start" ON "calendar_events" ("tenantId", "startDate")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_calendar_events_tenant_type" ON "calendar_events" ("tenantId", "eventType")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_calendar_events_tenant_status" ON "calendar_events" ("tenantId", "status")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_calendar_events_tenant_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_calendar_events_tenant_type"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_calendar_events_tenant_start"');
    await queryRunner.query('DROP TABLE IF EXISTS "calendar_events"');
  }
}
