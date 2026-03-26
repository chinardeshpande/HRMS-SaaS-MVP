import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PerformanceReview } from './PerformanceReview';

export enum GoalCategory {
  BUSINESS = 'business',
  PERSONAL = 'personal',
  TECHNICAL = 'technical',
  LEADERSHIP = 'leadership',
}

export enum GoalStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  NOT_ACHIEVED = 'not_achieved',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  goalId: string;

  @Column()
  tenantId: string;

  @Column()
  reviewId: string;

  @ManyToOne(() => PerformanceReview)
  @JoinColumn({ name: 'reviewId' })
  review: PerformanceReview;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalCategory,
    default: GoalCategory.BUSINESS,
  })
  category: GoalCategory;

  @Column({ type: 'date' })
  targetDate: Date;

  @Column({ type: 'int', default: 0 })
  weightage: number; // Percentage weightage (0-100)

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.DRAFT,
  })
  status: GoalStatus;

  @Column({ type: 'int', default: 0 })
  progress: number; // Percentage progress (0-100)

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  managerFeedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
