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
import { LeavePolicy, LeaveType } from './LeavePolicy';

@Entity('leave_balances')
@Index(['employeeId', 'leaveType', 'year'], { unique: true })
export class LeaveBalance {
  @PrimaryGeneratedColumn('uuid')
  balanceId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  policyId!: string;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  leaveType!: LeaveType;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalAllocated!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  used!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  pending!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  carriedForward!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  encashed!: number;

  get available(): number {
    return this.totalAllocated + this.carriedForward - this.used - this.pending;
  }

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => LeavePolicy)
  @JoinColumn({ name: 'policyId' })
  policy?: LeavePolicy;
}
