import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PerformanceReview } from './PerformanceReview';
import { Employee } from './Employee';

export enum FeedbackRelationship {
  PEER = 'peer',
  SUBORDINATE = 'subordinate',
  STAKEHOLDER = 'stakeholder',
}

@Entity('feedback_360')
export class Feedback360 {
  @PrimaryGeneratedColumn('uuid')
  feedbackId: string;

  @Column()
  tenantId: string;

  @Column()
  reviewId: string;

  @ManyToOne(() => PerformanceReview)
  @JoinColumn({ name: 'reviewId' })
  review: PerformanceReview;

  @Column()
  feedbackFromId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'feedbackFromId' })
  feedbackFrom: Employee;

  @Column({
    type: 'enum',
    enum: FeedbackRelationship,
  })
  relationship: FeedbackRelationship;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  rating: number;

  @Column({ type: 'text' })
  comments: string;

  @Column({ type: 'json', nullable: true })
  strengths: string[];

  @Column({ type: 'json', nullable: true })
  areasOfImprovement: string[];

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
