import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddCompanyDocuments1771100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'company_documents',
        columns: [
          { name: 'documentId', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: false },
          { name: 'title', type: 'varchar', length: '200', isNullable: false },
          { name: 'category', type: 'varchar', length: '80', default: "'other'" },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'documentNumber', type: 'varchar', length: '120', isNullable: true },
          { name: 'issuingAuthority', type: 'varchar', length: '150', isNullable: true },
          { name: 'issueDate', type: 'date', isNullable: true },
          { name: 'expiryDate', type: 'date', isNullable: true },
          { name: 'renewalOwner', type: 'varchar', length: '150', isNullable: true },
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

    await queryRunner.createIndex('company_documents', new TableIndex({ columnNames: ['tenantId'] }));
    await queryRunner.createIndex('company_documents', new TableIndex({ columnNames: ['tenantId', 'category'] }));
    await queryRunner.createIndex('company_documents', new TableIndex({ columnNames: ['tenantId', 'status'] }));
    await queryRunner.createIndex('company_documents', new TableIndex({ columnNames: ['tenantId', 'expiryDate'] }));

    await queryRunner.createForeignKey(
      'company_documents',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['tenantId'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'company_documents',
      new TableForeignKey({
        columnNames: ['uploadedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['userId'],
      })
    );

    await queryRunner.createForeignKey(
      'company_documents',
      new TableForeignKey({
        columnNames: ['verifiedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['userId'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('company_documents', true);
  }
}

