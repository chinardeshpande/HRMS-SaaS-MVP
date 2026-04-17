import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';

export enum ReportCategory {
  WORKFORCE = 'workforce',
  ONBOARDING = 'onboarding',
  ATTENDANCE = 'attendance',
  LEAVE = 'leave',
  PERFORMANCE = 'performance',
  CONFIRMATION = 'confirmation',
  EXIT = 'exit',
  COMPLIANCE = 'compliance',
}

export enum ReportType {
  // Workforce
  HEADCOUNT = 'headcount',
  JOINERS_LEAVERS = 'joiners_leavers',
  ORG_MOVEMENT = 'org_movement',
  SPAN_OF_CONTROL = 'span_of_control',

  // Onboarding
  OFFER_CONVERSION = 'offer_conversion',
  ONBOARDING_STATUS = 'onboarding_status',
  JOINING_READINESS = 'joining_readiness',

  // Attendance
  ATTENDANCE_SUMMARY = 'attendance_summary',
  LATE_MARKS = 'late_marks',
  SHIFT_ADHERENCE = 'shift_adherence',
  OVERTIME_SUMMARY = 'overtime_summary',

  // Leave
  LEAVE_BALANCE = 'leave_balance',
  LEAVE_UTILIZATION = 'leave_utilization',
  LEAVE_CONCENTRATION = 'leave_concentration',
  LEAVE_LIABILITY = 'leave_liability',

  // Performance & Confirmation
  GOAL_COMPLETION = 'goal_completion',
  REVIEW_COMPLETION = 'review_completion',
  RATING_DISTRIBUTION = 'rating_distribution',
  CONFIRMATION_DUE = 'confirmation_due',
  PROBATION_TRENDS = 'probation_trends',

  // Exit
  ATTRITION = 'attrition',
  EXIT_CLEARANCE = 'exit_clearance',
  NOTICE_ADHERENCE = 'notice_adherence',

  // Compliance
  MISSING_DOCUMENTS = 'missing_documents',
  EXPIRING_DOCUMENTS = 'expiring_documents',
  AUDIT_TRAIL = 'audit_trail',
  POLICY_ACKNOWLEDGMENT = 'policy_acknowledgment',
}

export enum ReportOutputFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

@Entity('saved_reports')
@Index(['tenantId', 'reportName'])
@Index(['tenantId', 'createdBy'])
@Index(['tenantId', 'reportType'])
export class SavedReport {
  @PrimaryGeneratedColumn('uuid')
  reportId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'varchar', length: 200 })
  reportName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ReportCategory,
  })
  category!: ReportCategory;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType!: ReportType;

  @Column({ type: 'jsonb' })
  filterConfig!: {
    departments?: string[];
    locations?: string[];
    employmentTypes?: string[];
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    status?: string[];
    customFilters?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  chartConfig?: {
    type: string;
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    aggregation?: string;
  };

  @Column({
    type: 'enum',
    enum: ReportOutputFormat,
    default: ReportOutputFormat.PDF,
  })
  outputFormat!: ReportOutputFormat;

  @Column({ type: 'jsonb', nullable: true })
  scheduleConfig?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
    recipients?: string[];
  };

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isPublic!: boolean;

  @Column({ type: 'integer', default: 0 })
  executionCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;
}
