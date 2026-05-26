import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddOutboundEmailLogs1771100200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'outbound_email_logs',
        columns: [
          { name: 'logId', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'tenantId', type: 'uuid', isNullable: true },
          { name: 'recipientEmail', type: 'varchar', length: '255', isNullable: false },
          { name: 'subject', type: 'varchar', length: '255', isNullable: false },
          { name: 'purpose', type: 'varchar', length: '100', default: "'general'" },
          { name: 'status', type: 'varchar', length: '30', isNullable: false },
          { name: 'provider', type: 'varchar', length: '30', isNullable: false },
          { name: 'fromEmail', type: 'varchar', length: '255', isNullable: false },
          { name: 'messageId', type: 'varchar', length: '255', isNullable: true },
          { name: 'errorMessage', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', default: "'{}'" },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('outbound_email_logs', new TableIndex({ columnNames: ['tenantId', 'createdAt'] }));
    await queryRunner.createIndex('outbound_email_logs', new TableIndex({ columnNames: ['tenantId', 'purpose'] }));
    await queryRunner.createIndex('outbound_email_logs', new TableIndex({ columnNames: ['status'] }));

    await queryRunner.createForeignKey(
      'outbound_email_logs',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['tenantId'],
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('outbound_email_logs', true);
  }
}
