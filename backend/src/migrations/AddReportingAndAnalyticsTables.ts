import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddReportingAndAnalyticsTables1743998400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create saved_reports table
    await queryRunner.createTable(
      new Table({
        name: 'saved_reports',
        columns: [
          {
            name: 'reportId',
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
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reportName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reportType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'filterConfig',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'chartConfig',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'outputFormat',
            type: 'varchar',
            length: '20',
            default: "'pdf'",
          },
          {
            name: 'scheduleConfig',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'executionCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'lastExecutedAt',
            type: 'timestamp',
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

    // 2. Create generated_documents table
    await queryRunner.createTable(
      new Table({
        name: 'generated_documents',
        columns: [
          {
            name: 'documentId',
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
            name: 'templateId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'documentType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'documentName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'employeeId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'candidateId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'generatedBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
          },
          {
            name: 'format',
            type: 'varchar',
            length: '20',
            default: "'pdf'",
          },
          {
            name: 'filePath',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'fileUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'fileSizeBytes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'issuedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sentTo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'receivedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revocationReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hasWatermark',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isConfidential',
            type: 'boolean',
            default: false,
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
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

    // 3. Create analytics_metrics table
    await queryRunner.createTable(
      new Table({
        name: 'analytics_metrics',
        columns: [
          {
            name: 'metricId',
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
            name: 'metricName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'metricType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'aggregation',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'queryConfig',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'dimensions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'thresholds',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'formula',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'synonyms',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isCustom',
            type: 'boolean',
            default: false,
          },
          {
            name: 'usageCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'lastCalculatedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastValue',
            type: 'jsonb',
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

    // Add foreign keys for saved_reports
    await queryRunner.createForeignKey(
      'saved_reports',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'saved_reports',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add foreign keys for generated_documents
    await queryRunner.createForeignKey(
      'generated_documents',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'generated_documents',
      new TableForeignKey({
        columnNames: ['templateId'],
        referencedColumnNames: ['templateId'],
        referencedTableName: 'document_templates',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'generated_documents',
      new TableForeignKey({
        columnNames: ['employeeId'],
        referencedColumnNames: ['employeeId'],
        referencedTableName: 'employees',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'generated_documents',
      new TableForeignKey({
        columnNames: ['candidateId'],
        referencedColumnNames: ['candidateId'],
        referencedTableName: 'candidates',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'generated_documents',
      new TableForeignKey({
        columnNames: ['generatedBy'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Add foreign keys for analytics_metrics
    await queryRunner.createForeignKey(
      'analytics_metrics',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedColumnNames: ['tenantId'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    // Create indexes for saved_reports
    await queryRunner.query(`
      CREATE INDEX idx_saved_reports_tenant ON saved_reports("tenantId");
      CREATE INDEX idx_saved_reports_created_by ON saved_reports("tenantId", "createdBy");
      CREATE INDEX idx_saved_reports_type ON saved_reports("tenantId", "reportType");
      CREATE INDEX idx_saved_reports_name ON saved_reports("tenantId", "reportName");
    `);

    // Create indexes for generated_documents
    await queryRunner.query(`
      CREATE INDEX idx_generated_documents_tenant ON generated_documents("tenantId");
      CREATE INDEX idx_generated_documents_type ON generated_documents("tenantId", "documentType");
      CREATE INDEX idx_generated_documents_employee ON generated_documents("tenantId", "employeeId");
      CREATE INDEX idx_generated_documents_candidate ON generated_documents("tenantId", "candidateId");
      CREATE INDEX idx_generated_documents_status ON generated_documents("tenantId", "status");
      CREATE INDEX idx_generated_documents_generated_by ON generated_documents("tenantId", "generatedBy");
    `);

    // Create indexes for analytics_metrics
    await queryRunner.query(`
      CREATE INDEX idx_analytics_metrics_tenant ON analytics_metrics("tenantId");
      CREATE INDEX idx_analytics_metrics_name ON analytics_metrics("tenantId", "metricName");
      CREATE UNIQUE INDEX idx_analytics_metrics_unique_name ON analytics_metrics("tenantId", "metricName");
      CREATE INDEX idx_analytics_metrics_category ON analytics_metrics("tenantId", "category");
      CREATE INDEX idx_analytics_metrics_active ON analytics_metrics("tenantId", "isActive");
    `);

    // Create materialized views for reporting performance

    // View 1: Employee headcount snapshot
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_employee_headcount AS
      SELECT
        e."tenantId",
        e."departmentId",
        d."name" as "departmentName",
        e.status,
        e."employmentType",
        COUNT(*) as headcount,
        DATE_TRUNC('day', e."createdAt") as snapshot_date
      FROM employees e
      LEFT JOIN departments d ON e."departmentId" = d."departmentId"
      GROUP BY e."tenantId", e."departmentId", d."name", e.status, e."employmentType", DATE_TRUNC('day', e."createdAt");

      CREATE INDEX idx_mv_employee_headcount_tenant ON mv_employee_headcount("tenantId");
      CREATE INDEX idx_mv_employee_headcount_date ON mv_employee_headcount(snapshot_date);
    `);

    // View 2: Attendance summary
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_attendance_summary AS
      SELECT
        a."tenantId",
        a."employeeId",
        a.status,
        DATE_TRUNC('month', a.date) as month,
        COUNT(*) as days_count,
        SUM(CASE WHEN a."isLate" = true THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a."overtimeMinutes" > 0 THEN 1 ELSE 0 END) as overtime_count
      FROM attendance a
      GROUP BY a."tenantId", a."employeeId", a.status, DATE_TRUNC('month', a.date);

      CREATE INDEX idx_mv_attendance_summary_tenant ON mv_attendance_summary("tenantId");
      CREATE INDEX idx_mv_attendance_summary_employee ON mv_attendance_summary("employeeId");
      CREATE INDEX idx_mv_attendance_summary_month ON mv_attendance_summary(month);
    `);

    // View 3: Leave utilization
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_leave_utilization AS
      SELECT
        lr."tenantId",
        lr."employeeId",
        lr."leaveType",
        lr.status,
        DATE_TRUNC('year', lr."startDate") as year,
        COUNT(*) as leave_count,
        SUM(lr."numberOfDays") as total_days
      FROM leave_requests lr
      GROUP BY lr."tenantId", lr."employeeId", lr."leaveType", lr.status, DATE_TRUNC('year', lr."startDate");

      CREATE INDEX idx_mv_leave_utilization_tenant ON mv_leave_utilization("tenantId");
      CREATE INDEX idx_mv_leave_utilization_employee ON mv_leave_utilization("employeeId");
      CREATE INDEX idx_mv_leave_utilization_year ON mv_leave_utilization(year);
    `);

    // View 4: Onboarding progress
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_onboarding_progress AS
      SELECT
        oc."tenantId",
        oc."candidateId",
        oc."currentState",
        oc."completionPercentage",
        COUNT(ot."taskId") as total_tasks,
        SUM(CASE WHEN ot.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        CASE
          WHEN COUNT(ot."taskId") > 0
          THEN ROUND((SUM(CASE WHEN ot.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(ot."taskId")::decimal) * 100, 2)
          ELSE 0
        END as task_completion_percentage
      FROM onboarding_cases oc
      LEFT JOIN onboarding_tasks ot ON oc."candidateId" = ot."candidateId" AND oc."tenantId" = ot."tenantId"
      GROUP BY oc."tenantId", oc."candidateId", oc."currentState", oc."completionPercentage";

      CREATE INDEX idx_mv_onboarding_progress_tenant ON mv_onboarding_progress("tenantId");
      CREATE INDEX idx_mv_onboarding_progress_candidate ON mv_onboarding_progress("candidateId");
    `);

    // View 5: Confirmation tracker
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW mv_confirmation_tracker AS
      SELECT
        e."tenantId",
        e."employeeId",
        e."firstName",
        e."lastName",
        e."departmentId",
        e."probationEndDate",
        pc."currentState" as probation_status,
        CASE
          WHEN e."probationEndDate" IS NULL THEN 'no_probation'
          WHEN e."probationEndDate" < CURRENT_DATE THEN 'overdue'
          WHEN e."probationEndDate" <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
          ELSE 'future'
        END as due_status
      FROM employees e
      LEFT JOIN probation_cases pc ON e."employeeId" = pc."employeeId" AND e."tenantId" = pc."tenantId"
      WHERE e.status = 'active';

      CREATE INDEX idx_mv_confirmation_tracker_tenant ON mv_confirmation_tracker("tenantId");
      CREATE INDEX idx_mv_confirmation_tracker_employee ON mv_confirmation_tracker("employeeId");
      CREATE INDEX idx_mv_confirmation_tracker_due_status ON mv_confirmation_tracker(due_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop materialized views
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS mv_confirmation_tracker');
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS mv_onboarding_progress');
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS mv_leave_utilization');
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS mv_attendance_summary');
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS mv_employee_headcount');

    // Drop indexes for analytics_metrics
    await queryRunner.query('DROP INDEX IF EXISTS idx_analytics_metrics_active');
    await queryRunner.query('DROP INDEX IF EXISTS idx_analytics_metrics_category');
    await queryRunner.query('DROP INDEX IF EXISTS idx_analytics_metrics_unique_name');
    await queryRunner.query('DROP INDEX IF EXISTS idx_analytics_metrics_name');
    await queryRunner.query('DROP INDEX IF EXISTS idx_analytics_metrics_tenant');

    // Drop indexes for generated_documents
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_generated_by');
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_candidate');
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_employee');
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_type');
    await queryRunner.query('DROP INDEX IF EXISTS idx_generated_documents_tenant');

    // Drop indexes for saved_reports
    await queryRunner.query('DROP INDEX IF EXISTS idx_saved_reports_name');
    await queryRunner.query('DROP INDEX IF EXISTS idx_saved_reports_type');
    await queryRunner.query('DROP INDEX IF EXISTS idx_saved_reports_created_by');
    await queryRunner.query('DROP INDEX IF EXISTS idx_saved_reports_tenant');

    // Drop foreign keys and tables
    await queryRunner.dropTable('analytics_metrics');
    await queryRunner.dropTable('generated_documents');
    await queryRunner.dropTable('saved_reports');
  }
}
