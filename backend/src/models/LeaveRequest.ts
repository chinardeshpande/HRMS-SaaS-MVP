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
import { LeaveType } from './LeavePolicy';

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('leave_requests')
@Index(['employeeId', 'startDate', 'endDate'])
@Index(['status', 'tenantId'])
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  leaveId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  leaveType!: LeaveType;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  numberOfDays!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status!: LeaveStatus;

  @Column({ type: 'uuid', nullable: true })
  approverId?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  approverComments?: string;

  @Column({ type: 'text', nullable: true })
  attachmentUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emergencyContact?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver?: Employee;
}
