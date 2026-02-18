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
import { Attendance } from './Attendance';

export enum TimeEntryEditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('time_entry_edits')
@Index(['employeeId', 'attendanceId'])
@Index(['status', 'tenantId'])
export class TimeEntryEdit {
  @PrimaryGeneratedColumn('uuid')
  editId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  attendanceId!: string;

  // Original Values
  @Column({ type: 'timestamp', nullable: true })
  originalCheckIn?: Date;

  @Column({ type: 'timestamp', nullable: true })
  originalCheckOut?: Date;

  // Requested Values
  @Column({ type: 'timestamp', nullable: true })
  requestedCheckIn?: Date;

  @Column({ type: 'timestamp', nullable: true })
  requestedCheckOut?: Date;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: TimeEntryEditStatus,
    default: TimeEntryEditStatus.PENDING,
  })
  status!: TimeEntryEditStatus;

  @Column({ type: 'uuid', nullable: true })
  approverId?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  approverComments?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Attendance)
  @JoinColumn({ name: 'attendanceId' })
  attendance?: Attendance;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver?: Employee;
}
