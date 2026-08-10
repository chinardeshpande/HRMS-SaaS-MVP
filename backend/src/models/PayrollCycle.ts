import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PayrollCycleStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED_FOR_PARTNER = 'approved_for_partner',
  PARTNER_PROCESSING = 'partner_processing',
  BANK_APPROVAL_PENDING = 'bank_approval_pending',
  PAID = 'paid',
  PAYSLIPS_PUBLISHED = 'payslips_published',
  CLOSED = 'closed',
}

@Entity('payroll_cycles')
@Index(['tenantId', 'year', 'month', 'version'], { unique: true })
@Index(['tenantId', 'status'])
export class PayrollCycle {
  @PrimaryGeneratedColumn('uuid')
  payrollCycleId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', length: 40, default: PayrollCycleStatus.DRAFT })
  status!: PayrollCycleStatus;

  @Column({ type: 'varchar', length: 20, default: '1.0' })
  exchangeFormatVersion!: string;

  @Column({ type: 'varchar', length: 160 })
  partnerName!: string;

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  grossTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  deductionTotal!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  netTotal!: number;

  @Column({ type: 'varchar', length: 160, nullable: true })
  partnerReference?: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  bankReference?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payslipSummary!: Record<string, number>;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  executedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
