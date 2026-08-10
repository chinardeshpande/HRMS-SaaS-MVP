import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeDocumentRequests1786320000000 implements MigrationInterface {
  name = 'AddEmployeeDocumentRequests1786320000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_document_requests" (
        "requestId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "requestedBy" uuid NOT NULL,
        "documentType" varchar(80) NOT NULL,
        "purpose" varchar(30) NOT NULL DEFAULT 'employment',
        "details" text,
        "status" varchar(30) NOT NULL DEFAULT 'requested',
        "responseNotes" text,
        "fulfilledDocumentId" uuid,
        "resolvedBy" uuid,
        "resolvedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_document_requests" PRIMARY KEY ("requestId"),
        CONSTRAINT "FK_document_request_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE,
        CONSTRAINT "FK_document_request_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE CASCADE,
        CONSTRAINT "FK_document_request_user" FOREIGN KEY ("requestedBy") REFERENCES "users"("userId") ON DELETE CASCADE,
        CONSTRAINT "FK_document_request_document" FOREIGN KEY ("fulfilledDocumentId") REFERENCES "employee_documents"("documentId") ON DELETE SET NULL
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_document_request_tenant_employee_status" ON "employee_document_requests" ("tenantId", "employeeId", "status")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "employee_document_requests"');
  }
}
