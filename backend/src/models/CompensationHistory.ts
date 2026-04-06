import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

export enum CompensationChangeType {
  INITIAL_SALARY = 'initial_salary',
  INCREMENT = 'increment',
  PROMOTION = 'promotion',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  MARKET_CORRECTION = 'market_correction',
}

export enum CompensationComponent {
  BASE_SALARY = 'base_salary',
  BONUS = 'bonus',
  ALLOWANCE = 'allowance',
  COMMISSION = 'commission',
  STOCK_OPTIONS = 'stock_options',
}

@Entity('compensation_history')
@Index(['tenantId', 'employeeId', 'effectiveDate'])
export class CompensationHistory {
  @PrimaryGeneratedColumn('uuid')
  historyId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: CompensationChangeType,
  })
  changeType!: CompensationChangeType;

  @Column({
    type: 'enum',
    enum: CompensationComponent,
    default: CompensationComponent.BASE_SALARY,
  })
  component!: CompensationComponent;

  // Previous compensation
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  previousAmount?: number;

  // New compensation
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  newAmount!: number;

  // Change details
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  changeAmount?: number; // Difference

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  changePercentage?: number; // Percentage increase/decrease

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // For performance-linked increments
  @Column({ type: 'uuid', nullable: true })
  performanceReviewId?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  performanceRating?: number;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: Employee;
}
