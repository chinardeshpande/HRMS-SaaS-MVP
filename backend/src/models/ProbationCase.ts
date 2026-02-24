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
import { ProbationState } from './enums/ProbationState';

@Entity('probation_cases')
@Index(['tenantId', 'employeeId'], { unique: true })
@Index(['tenantId', 'currentState'])
@Index(['tenantId', 'probationEndDate'])
@Index(['tenantId', 'isAtRisk'])
export class ProbationCase {
  @PrimaryGeneratedColumn('uuid')
  probationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: ProbationState,
    default: ProbationState.PROBATION_ACTIVE,
  })
  currentState!: ProbationState;

  @Column({ type: 'date' })
  probationStartDate!: Date;

  @Column({ type: 'date' })
  probationEndDate!: Date;

  @Column({ type: 'integer', default: 90 })
  probationDurationDays!: number;

  // Review tracking
  @Column({ type: 'date', nullable: true })
  review30DueDate?: Date;

  @Column({ default: false })
  review30Completed!: boolean;

  @Column({ type: 'date', nullable: true })
  review60DueDate?: Date;

  @Column({ default: false })
  review60Completed!: boolean;

  @Column({ type: 'date', nullable: true })
  finalReviewDueDate?: Date;

  @Column({ default: false })
  finalReviewCompleted!: boolean;

  // Extension support
  @Column({ default: false })
  isExtended!: boolean;

  @Column({ type: 'integer', nullable: true })
  extensionDurationDays?: number;

  @Column({ type: 'date', nullable: true })
  originalEndDate?: Date;

  @Column({ type: 'text', nullable: true })
  extensionReason?: string;

  @Column({ type: 'text', nullable: true })
  improvementPlan?: string;

  @Column({ type: 'uuid', nullable: true })
  extendedBy?: string;

  @Column({ type: 'date', nullable: true })
  extensionDate?: Date;

  // Risk flags
  @Column({ default: false })
  @Index()
  isAtRisk!: boolean;

  @Column({ length: 50, nullable: true })
  riskLevel?: string;

  @Column({ type: 'text', nullable: true })
  riskReason?: string;

  @Column({ type: 'uuid', nullable: true })
  riskFlaggedBy?: string;

  @Column({ type: 'date', nullable: true })
  riskFlaggedDate?: Date;

  // Final decision
  @Column({ length: 50, nullable: true })
  finalDecision?: string;

  @Column({ type: 'date', nullable: true })
  decisionDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  decidedBy?: string;

  @Column({ type: 'text', nullable: true })
  decisionNotes?: string;

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
  @JoinColumn({ name: 'extendedBy' })
  extendedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'riskFlaggedBy' })
  riskFlaggedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'decidedBy' })
  decidedByUser?: Employee;
}
