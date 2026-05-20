import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';

export enum ManualEmploymentHistoryType {
  PROMOTION = 'promotion',
  TRANSFER = 'transfer',
  SALARY_INCREASE = 'salary_increase',
  BONUS = 'bonus',
  UNPAID_BREAK = 'unpaid_break',
  SABBATICAL = 'sabbatical',
  ROLE_CHANGE = 'role_change',
  OTHER = 'other',
}

@Entity('manual_employment_history')
@Index(['tenantId', 'employeeId', 'effectiveDate'])
export class ManualEmploymentHistory {
  @PrimaryGeneratedColumn('uuid')
  manualHistoryId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({
    type: 'enum',
    enum: ManualEmploymentHistoryType,
  })
  eventType!: ManualEmploymentHistoryType;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  fromValue?: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  toValue?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: Employee;
}
