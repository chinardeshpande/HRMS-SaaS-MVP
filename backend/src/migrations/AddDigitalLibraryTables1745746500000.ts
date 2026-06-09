import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddDigitalLibraryTables1745746500000 implements MigrationInterface {
  private async createForeignKeyIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existing = table?.foreignKeys.find(
      key =>
        key.columnNames.join(',') === foreignKey.columnNames.join(',') &&
        key.referencedTableName === foreignKey.referencedTableName &&
        key.referencedColumnNames.join(',') === foreignKey.referencedColumnNames.join(',')
    );

    if (!existing) {
      await queryRunner.createForeignKey(tableName, foreignKey);
    }
  }

  private async createIndexIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existing = table?.indices.find(existingIndex => existingIndex.name === index.name);

    if (!existing) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'document_category',
        columns: [
          {
            name: 'categoryId',
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
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
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

    await queryRunner.createTable(
      new Table({
        name: 'digital_library',
        columns: [
          {
            name: 'libraryId',
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
            name: 'employeeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'originalOwnerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'fileUrl',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'fileType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'fileSize',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'resourceType',
            type: 'varchar',
            length: '50',
            default: "'document'",
          },
          {
            name: 'accessLevel',
            type: 'varchar',
            length: '50',
            default: "'private'",
          },
          {
            name: 'isPaid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'canDownload',
            type: 'boolean',
            default: true,
          },
          {
            name: 'canShare',
            type: 'boolean',
            default: false,
          },
          {
            name: 'canEdit',
            type: 'boolean',
            default: false,
          },
          {
            name: 'sourceType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'sourceId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'viewCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'downloadCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'lastAccessedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isArchived',
            type: 'boolean',
            default: false,
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

    await this.createForeignKeyIfMissing(
      queryRunner,
      'document_category',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    await this.createForeignKeyIfMissing(
      queryRunner,
      'digital_library',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    await this.createForeignKeyIfMissing(
      queryRunner,
      'digital_library',
      new TableForeignKey({
        columnNames: ['employeeId'],
        referencedColumnNames: ['employeeId'],
        referencedTableName: 'employees',
        onDelete: 'CASCADE',
      })
    );

    await this.createForeignKeyIfMissing(
      queryRunner,
      'digital_library',
      new TableForeignKey({
        columnNames: ['originalOwnerId'],
        referencedColumnNames: ['employeeId'],
        referencedTableName: 'employees',
        onDelete: 'SET NULL',
      })
    );

    await this.createIndexIfMissing(
      queryRunner,
      'document_category',
      new TableIndex({
        name: 'idx_document_category_tenant',
        columnNames: ['tenantId'],
      })
    );

    await this.createIndexIfMissing(
      queryRunner,
      'document_category',
      new TableIndex({
        name: 'idx_document_category_tenant_name',
        columnNames: ['tenantId', 'name'],
        isUnique: true,
      })
    );

    await this.createIndexIfMissing(
      queryRunner,
      'digital_library',
      new TableIndex({
        name: 'idx_digital_library_tenant_employee',
        columnNames: ['tenantId', 'employeeId'],
      })
    );

    await this.createIndexIfMissing(
      queryRunner,
      'digital_library',
      new TableIndex({
        name: 'idx_digital_library_tenant_resource_type',
        columnNames: ['tenantId', 'resourceType'],
      })
    );

    await this.createIndexIfMissing(
      queryRunner,
      'digital_library',
      new TableIndex({
        name: 'idx_digital_library_tenant_access_level',
        columnNames: ['tenantId', 'accessLevel'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('digital_library', true);
    await queryRunner.dropTable('document_category', true);
  }
}
