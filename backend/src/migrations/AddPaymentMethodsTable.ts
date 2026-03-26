import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddPaymentMethodsTable1711234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
        columns: [
          {
            name: 'paymentMethodId',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          // Card details
          {
            name: 'cardLast4',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'cardBrand',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'expiryMonth',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'expiryYear',
            type: 'varchar',
            length: '4',
            isNullable: true,
          },
          {
            name: 'cardholderName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Bank account details
          {
            name: 'bankName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'accountLast4',
            type: 'varchar',
            length: '4',
            isNullable: true,
          },
          {
            name: 'accountType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'routingNumber',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // Billing address
          {
            name: 'billingAddress',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'billingCity',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'billingState',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'billingZip',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'billingCountry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          // Payment gateway integration
          {
            name: 'stripePaymentMethodId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeCustomerId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'paypalEmail',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'nickname',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign key to tenants table
    await queryRunner.createForeignKey(
      'payment_methods',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_payment_methods_tenant ON payment_methods("tenantId");
      CREATE INDEX idx_payment_methods_default ON payment_methods("tenantId", "isDefault");
      CREATE INDEX idx_payment_methods_active ON payment_methods("isActive");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_payment_methods_tenant;
      DROP INDEX IF EXISTS idx_payment_methods_default;
      DROP INDEX IF EXISTS idx_payment_methods_active;
    `);

    // Drop foreign key
    const table = await queryRunner.getTable('payment_methods');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('payment_methods', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('payment_methods');
  }
}
