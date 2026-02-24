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
import { ProbationCase } from './ProbationCase';
import { Employee } from './Employee';
import { ReviewType, ReviewStatus, MonitoringStatus, ProbationRecommendation } from './enums/ReviewType';

@Entity('probation_reviews')
@Index(['tenantId', 'probationId', 'reviewType'], { unique: true })
@Index(['tenantId', 'managerId', 'status'])
@Index(['tenantId', 'dueDate'])
export class ProbationReview {
  @PrimaryGeneratedColumn('uuid')
  reviewId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  probationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  managerId!: string;

  @Column({
    type: 'enum',
    enum: ReviewType,
  })
  reviewType!: ReviewType;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status!: ReviewStatus;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  // 30-day review fields
  @Column({ type: 'integer', nullable: true })
  roleClarityRating?: number;

  @Column({ type: 'integer', nullable: true })
  learningSpeedRating?: number;

  @Column({ type: 'integer', nullable: true })
  communicationRating?: number;

  @Column({ type: 'integer', nullable: true })
  cultureFitRating?: number;

  @Column({ default: false })
  hasRiskFlag!: boolean;

  @Column({ type: 'text', nullable: true })
  riskFlagReason?: string;

  // 60-day review fields
  @Column({ type: 'integer', nullable: true })
  kpiProgressRating?: number;

  @Column({ type: 'integer', nullable: true })
  independenceRating?: number;

  @Column({
    type: 'enum',
    enum: MonitoringStatus,
    nullable: true,
  })
  monitoringStatus?: MonitoringStatus;

  // Final review fields
  @Column({
    type: 'enum',
    enum: ProbationRecommendation,
    nullable: true,
  })
  recommendation?: ProbationRecommendation;

  @Column({ type: 'integer', nullable: true })
  recommendedExtensionDays?: number;

  @Column({ default: false })
  improvementPlanRequired!: boolean;

  @Column({ type: 'text', nullable: true })
  improvementPlanDetails?: string;

  // Common fields
  @Column({ type: 'text', nullable: true })
  managerComments?: string;

  @Column({ type: 'text', nullable: true })
  hrNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  hrReviewedBy?: string;

  @Column({ type: 'date', nullable: true })
  hrReviewedDate?: Date;

  @Column({ default: false })
  hrApproved!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => ProbationCase)
  @JoinColumn({ name: 'probationId' })
  probationCase!: ProbationCase;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'managerId' })
  manager!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'hrReviewedBy' })
  hrReviewer?: Employee;
}
