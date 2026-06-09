import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddEmployeeDocuments1771100100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'employee_documents',
        columns: [
          { name: 'documentId', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: false },
          { name: 'employeeId', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'category', type: 'varchar', length: '80', default: "'other'" },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'documentNumber', type: 'varchar', length: '120', isNullable: true },
          { name: 'issueDate', type: 'date', isNullable: true },
          { name: 'expiryDate', type: 'date', isNullable: true },
          { name: 'status', type: 'varchar', length: '40', default: "'active'" },
          { name: 'verificationStatus', type: 'varchar', length: '40', default: "'unverified'" },
          { name: 'fileName', type: 'varchar', length: '255', isNullable: false },
          { name: 'originalFileName', type: 'varchar', length: '255', isNullable: false },
          { name: 'fileUrl', type: 'text', isNullable: false },
          { name: 'fileType', type: 'varchar', length: '100', isNullable: false },
          { name: 'fileSize', type: 'bigint', default: 0 },
          { name: 'uploadedBy', type: 'uuid', isNullable: false },
          { name: 'verifiedBy', type: 'uuid', isNullable: true },
          { name: 'verifiedAt', type: 'timestamp', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    const table = await queryRunner.getTable('employee_documents');
    const hasIndex = (columnNames: string[]) =>
      table?.indices.some(
        (index) =>
          index.columnNames.length === columnNames.length &&
          columnNames.every((columnName) => index.columnNames.includes(columnName))
      );
    const hasForeignKey = (columnNames: string[], referencedTableName: string) =>
      table?.foreignKeys.some(
        (foreignKey) =>
          foreignKey.referencedTableName === referencedTableName &&
          foreignKey.columnNames.length === columnNames.length &&
          columnNames.every((columnName) => foreignKey.columnNames.includes(columnName))
      );

    if (!hasIndex(['tenantId'])) {
      await queryRunner.createIndex(
        'employee_documents',
        new TableIndex({ name: 'IDX_employee_documents_tenant', columnNames: ['tenantId'] })
      );
    }
    if (!hasIndex(['tenantId', 'employeeId', 'category'])) {
      await queryRunner.createIndex(
        'employee_documents',
        new TableIndex({
          name: 'IDX_employee_documents_tenant_employee_category',
          columnNames: ['tenantId', 'employeeId', 'category'],
        })
      );
    }
    if (!hasIndex(['tenantId', 'employeeId', 'status'])) {
      await queryRunner.createIndex(
        'employee_documents',
        new TableIndex({
          name: 'IDX_employee_documents_tenant_employee_status',
          columnNames: ['tenantId', 'employeeId', 'status'],
        })
      );
    }
    if (!hasIndex(['tenantId', 'verificationStatus'])) {
      await queryRunner.createIndex(
        'employee_documents',
        new TableIndex({
          name: 'IDX_employee_documents_tenant_verification',
          columnNames: ['tenantId', 'verificationStatus'],
        })
      );
    }

    if (!hasForeignKey(['tenantId'], 'tenants')) {
      await queryRunner.createForeignKey(
        'employee_documents',
        new TableForeignKey({
          columnNames: ['tenantId'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['tenantId'],
          onDelete: 'CASCADE',
        })
      );
    }
    if (!hasForeignKey(['employeeId'], 'employees')) {
      await queryRunner.createForeignKey(
        'employee_documents',
        new TableForeignKey({
          columnNames: ['employeeId'],
          referencedTableName: 'employees',
          referencedColumnNames: ['employeeId'],
          onDelete: 'CASCADE',
        })
      );
    }
    if (!hasForeignKey(['uploadedBy'], 'users')) {
      await queryRunner.createForeignKey(
        'employee_documents',
        new TableForeignKey({
          columnNames: ['uploadedBy'],
          referencedTableName: 'users',
          referencedColumnNames: ['userId'],
        })
      );
    }
    if (!hasForeignKey(['verifiedBy'], 'users')) {
      await queryRunner.createForeignKey(
        'employee_documents',
        new TableForeignKey({
          columnNames: ['verifiedBy'],
          referencedTableName: 'users',
          referencedColumnNames: ['userId'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('employee_documents', true);
  }
}
