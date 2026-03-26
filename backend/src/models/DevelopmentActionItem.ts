import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PerformanceReview } from './PerformanceReview';

export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('development_action_items')
export class DevelopmentActionItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column()
  tenantId: string;

  @Column()
  reviewId: string;

  @ManyToOne(() => PerformanceReview)
  @JoinColumn({ name: 'reviewId' })
  review: PerformanceReview;

  @Column({ type: 'text' })
  action: string;

  @Column({ length: 100 })
  timeline: string;

  @Column({
    type: 'enum',
    enum: ActionItemStatus,
    default: ActionItemStatus.PENDING,
  })
  status: ActionItemStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
