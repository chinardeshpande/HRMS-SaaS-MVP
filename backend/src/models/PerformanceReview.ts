import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Employee } from './Employee';

export enum PerformanceState {
  GOAL_SETTING = 'goal_setting',
  GOALS_SUBMITTED = 'goals_submitted',
  GOALS_APPROVED = 'goals_approved',
  MID_YEAR_PENDING = 'mid_year_pending',
  MID_YEAR_SUBMITTED = 'mid_year_submitted',
  MID_YEAR_COMPLETED = 'mid_year_completed',
  ANNUAL_REVIEW_PENDING = 'annual_review_pending',
  ANNUAL_REVIEW_SUBMITTED = 'annual_review_submitted',
  ANNUAL_REVIEW_COMPLETED = 'annual_review_completed',
  RATING_PENDING = 'rating_pending',
  RATING_SUBMITTED = 'rating_submitted',
  RATING_APPROVED = 'rating_approved',
  DEVELOPMENT_PLAN = 'development_plan',
  CYCLE_COMPLETE = 'cycle_complete',
}

@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  reviewId: string;

  @Column()
  tenantId: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  reviewerId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: Employee;

  @Column({ length: 50 })
  reviewCycle: string; // e.g., '2026', 'H1-2026', 'Q1-2026'

  @Column({ type: 'date' })
  reviewStartDate: Date;

  @Column({ type: 'date' })
  reviewEndDate: Date;

  @Column({
    type: 'enum',
    enum: PerformanceState,
    default: PerformanceState.GOAL_SETTING,
  })
  currentState: PerformanceState;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  selfRatingMidYear: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  managerRatingMidYear: number;

  @Column({ type: 'text', nullable: true })
  selfCommentsMidYear: string;

  @Column({ type: 'text', nullable: true })
  managerCommentsMidYear: string;

  @Column({ type: 'date', nullable: true })
  midYearSubmittedDate: Date;

  @Column({ type: 'date', nullable: true })
  midYearCompletedDate: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  selfRatingAnnual: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  managerRatingAnnual: number;

  @Column({ type: 'text', nullable: true })
  selfCommentsAnnual: string;

  @Column({ type: 'text', nullable: true })
  managerCommentsAnnual: string;

  @Column({ type: 'date', nullable: true })
  annualSubmittedDate: Date;

  @Column({ type: 'date', nullable: true })
  annualCompletedDate: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  finalRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  normalizationRating: number;

  @Column({ length: 50, nullable: true })
  ratingCategory: string; // exceeds_expectations, meets_expectations, needs_improvement, unsatisfactory

  @Column({ type: 'boolean', default: false })
  promotionRecommended: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  incrementPercentage: number;

  @Column({ type: 'text', nullable: true })
  finalComments: string;

  @Column({ type: 'json', nullable: true })
  achievements: string[];

  @Column({ type: 'json', nullable: true })
  challenges: string[];

  @Column({ type: 'json', nullable: true })
  skillGaps: string[];

  @Column({ type: 'json', nullable: true })
  trainingRecommendations: string[];

  @Column({ type: 'text', nullable: true })
  careerAspirations: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
