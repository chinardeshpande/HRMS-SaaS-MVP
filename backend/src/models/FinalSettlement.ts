import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { ExitCase } from './ExitCase';
import { SettlementStatus } from './enums/SettlementStatus';

@Entity('final_settlements')
@Index(['tenantId', 'exitId'], { unique: true })
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'status'])
export class FinalSettlement {
  @PrimaryGeneratedColumn('uuid')
  settlementId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  exitId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status!: SettlementStatus;

  // Salary components
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basicSalaryDue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  allowancesDue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonusDue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  incentivesDue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overtimeDue?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissionDue?: number;

  // Leave encashment
  @Column({ type: 'integer', default: 0 })
  unUtilizedLeaveDays?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  leaveEncashmentAmount?: number;

  // Notice period
  @Column({ type: 'integer', default: 0 })
  noticePeriodDays?: number;

  @Column({ type: 'integer', default: 0 })
  noticePeriodServed?: number;

  @Column({ type: 'integer', default: 0 })
  noticePeriodShortfall?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  noticePeriodRecovery?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  noticePeriodBuyoutAmount?: number;

  // Gratuity
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gratuityAmount?: number;

  // Provident Fund
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pfEmployeeContribution?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pfEmployerContribution?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pfInterest?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPfAmount?: number;

  // Deductions
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  loanRecovery?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  advanceRecovery?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  assetDamageDeduction?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeductions?: number;

  @Column({ type: 'text', nullable: true })
  deductionNotes?: string;

  // Tax
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tdsDeducted?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  professionalTax?: number;

  // Totals
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEarnings?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeductions?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netPayable?: number;

  // Calculation and approval
  @Column({ type: 'uuid', nullable: true })
  calculatedBy?: string;

  @Column({ type: 'date', nullable: true })
  calculatedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'date', nullable: true })
  approvedDate?: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Payment
  @Column({ type: 'date', nullable: true })
  paymentDate?: Date;

  @Column({ length: 100, nullable: true })
  paymentMode?: string; // bank_transfer, cheque, cash

  @Column({ length: 200, nullable: true })
  paymentReferenceNumber?: string;

  @Column({ type: 'uuid', nullable: true })
  paymentProcessedBy?: string;

  @Column({ type: 'date', nullable: true })
  paymentProcessedDate?: Date;

  @Column({ default: false })
  isPaid!: boolean;

  // Additional information
  @Column({ type: 'json', nullable: true })
  breakupDetails?: any; // Detailed JSON breakup

  @Column({ type: 'text', nullable: true })
  calculationNotes?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => ExitCase)
  @JoinColumn({ name: 'exitId' })
  exitCase!: ExitCase;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'calculatedBy' })
  calculatedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'paymentProcessedBy' })
  paymentProcessedByUser?: Employee;
}
