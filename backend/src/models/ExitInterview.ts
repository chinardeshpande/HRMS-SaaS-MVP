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

@Entity('exit_interviews')
@Index(['tenantId', 'exitId'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'scheduledDate'])
export class ExitInterview {
  @PrimaryGeneratedColumn('uuid')
  exitInterviewId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  exitId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid', nullable: true })
  conductedBy?: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  @Column({ length: 50, default: 'scheduled' })
  status!: string; // scheduled, completed, cancelled, rescheduled

  // Reason for leaving
  @Column({ length: 100, nullable: true })
  primaryReasonForLeaving?: string; // better_opportunity, relocation, compensation, work_life_balance, career_growth, etc.

  @Column({ type: 'text', nullable: true })
  detailedReasonForLeaving?: string;

  // Ratings (1-5 scale)
  @Column({ type: 'integer', nullable: true })
  overallSatisfactionRating?: number;

  @Column({ type: 'integer', nullable: true })
  managerRating?: number;

  @Column({ type: 'integer', nullable: true })
  teamRating?: number;

  @Column({ type: 'integer', nullable: true })
  roleRating?: number;

  @Column({ type: 'integer', nullable: true })
  compensationRating?: number;

  @Column({ type: 'integer', nullable: true })
  workLifeBalanceRating?: number;

  @Column({ type: 'integer', nullable: true })
  learningOpportunitiesRating?: number;

  @Column({ type: 'integer', nullable: true })
  workEnvironmentRating?: number;

  @Column({ type: 'integer', nullable: true })
  benefitsRating?: number;

  // Feedback
  @Column({ type: 'text', nullable: true })
  whatDidYouLikeMost?: string;

  @Column({ type: 'text', nullable: true })
  whatDidYouLikeLeast?: string;

  @Column({ type: 'text', nullable: true })
  suggestionsForImprovement?: string;

  @Column({ type: 'text', nullable: true })
  feedbackOnManager?: string;

  @Column({ type: 'text', nullable: true })
  feedbackOnTeam?: string;

  @Column({ type: 'text', nullable: true })
  feedbackOnCompanyCulture?: string;

  // Recommendation
  @Column({ default: false })
  wouldRecommendCompany!: boolean;

  @Column({ type: 'integer', nullable: true })
  npsScore?: number; // Net Promoter Score (0-10)

  @Column({ default: false })
  wouldConsiderRejoining!: boolean;

  // New opportunity details (optional)
  @Column({ length: 200, nullable: true })
  newCompanyName?: string;

  @Column({ length: 100, nullable: true })
  newRole?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  salaryIncreasePercentage?: number;

  // Additional information
  @Column({ type: 'text', nullable: true })
  additionalComments?: string;

  @Column({ type: 'text', nullable: true })
  hrNotes?: string;

  @Column({ default: false })
  isConfidential!: boolean;

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
  @JoinColumn({ name: 'conductedBy' })
  conductedByUser?: Employee;
}
