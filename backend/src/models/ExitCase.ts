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
import { ExitState } from './enums/ExitState';
import { ResignationType } from './enums/ResignationType';

@Entity('exit_cases')
@Index(['tenantId', 'employeeId'], { unique: true })
@Index(['tenantId', 'currentState'])
@Index(['tenantId', 'lastWorkingDate'])
@Index(['tenantId', 'resignationType'])
export class ExitCase {
  @PrimaryGeneratedColumn('uuid')
  exitId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: ExitState,
    default: ExitState.RESIGNATION_SUBMITTED,
  })
  currentState!: ExitState;

  @Column({
    type: 'enum',
    enum: ResignationType,
    default: ResignationType.VOLUNTARY,
  })
  resignationType!: ResignationType;

  // Resignation dates
  @Column({ type: 'date' })
  resignationSubmittedDate!: Date;

  @Column({ type: 'date', nullable: true })
  resignationApprovedDate?: Date;

  @Column({ type: 'date', nullable: true })
  resignationRejectedDate?: Date;

  @Column({ type: 'text', nullable: true })
  resignationReason?: string;

  @Column({ type: 'text', nullable: true })
  detailedReason?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Notice period
  @Column({ type: 'integer', default: 30 })
  noticePeriodDays!: number;

  @Column({ type: 'date', nullable: true })
  noticePeriodStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  noticePeriodEndDate?: Date;

  @Column({ default: false })
  isNoticePeriodBuyout!: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  buyoutAmount?: number;

  @Column({ type: 'date' })
  lastWorkingDate!: Date;

  @Column({ type: 'date', nullable: true })
  actualExitDate?: Date;

  // Clearance tracking
  @Column({ type: 'date', nullable: true })
  clearanceInitiatedDate?: Date;

  @Column({ type: 'date', nullable: true })
  clearanceCompletedDate?: Date;

  @Column({ default: false })
  allClearancesCleared!: boolean;

  @Column({ type: 'integer', default: 0 })
  totalClearances!: number;

  @Column({ type: 'integer', default: 0 })
  completedClearances!: number;

  // Asset return tracking
  @Column({ type: 'date', nullable: true })
  assetsReturnInitiatedDate?: Date;

  @Column({ type: 'date', nullable: true })
  assetsReturnedDate?: Date;

  @Column({ default: false })
  allAssetsReturned!: boolean;

  @Column({ type: 'integer', default: 0 })
  totalAssets!: number;

  @Column({ type: 'integer', default: 0 })
  returnedAssets!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  assetDamageDeduction?: number;

  // Exit interview tracking
  @Column({ type: 'date', nullable: true })
  exitInterviewScheduledDate?: Date;

  @Column({ type: 'date', nullable: true })
  exitInterviewCompletedDate?: Date;

  @Column({ default: false })
  exitInterviewCompleted!: boolean;

  @Column({ type: 'uuid', nullable: true })
  exitInterviewConductedBy?: string;

  // Settlement tracking
  @Column({ type: 'date', nullable: true })
  settlementCalculatedDate?: Date;

  @Column({ type: 'date', nullable: true })
  settlementApprovedDate?: Date;

  @Column({ type: 'date', nullable: true })
  settlementPaidDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  settlementAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeductions?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  netSettlementAmount?: number;

  @Column({ type: 'uuid', nullable: true })
  settlementApprovedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  settlementCalculatedBy?: string;

  // Rehire eligibility
  @Column({ default: true })
  isEligibleForRehire!: boolean;

  @Column({ type: 'text', nullable: true })
  rehireEligibilityNotes?: string;

  // Exit completion
  @Column({ type: 'date', nullable: true })
  exitCompletedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  exitCompletedBy?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'exitInterviewConductedBy' })
  exitInterviewConductedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'settlementApprovedBy' })
  settlementApprovedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'settlementCalculatedBy' })
  settlementCalculatedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'exitCompletedBy' })
  exitCompletedByUser?: Employee;
}
