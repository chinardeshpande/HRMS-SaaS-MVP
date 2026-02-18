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

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  HALF_DAY = 'half_day',
  ON_LEAVE = 'on_leave',
  HOLIDAY = 'holiday',
  WEEKEND = 'weekend',
}

@Entity('attendance')
@Index(['employeeId', 'date'], { unique: true })
@Index(['tenantId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  attendanceId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkIn?: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut?: Date;

  @Column({ type: 'int', default: 0, comment: 'Total work minutes' })
  workMinutes!: number;

  @Column({ type: 'int', default: 0, comment: 'Break minutes' })
  breakMinutes!: number;

  @Column({ type: 'int', default: 0, comment: 'Overtime minutes' })
  overtimeMinutes!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status!: AttendanceStatus;

  @Column({ type: 'boolean', default: false })
  isLate!: boolean;

  @Column({ type: 'int', default: 0 })
  lateMinutes!: number;

  @Column({ type: 'boolean', default: false })
  isEarlyOut!: boolean;

  @Column({ type: 'int', default: 0 })
  earlyMinutes!: number;

  // Override fields (for HR manual adjustments)
  @Column({ type: 'boolean', default: false })
  isManualOverride!: boolean;

  @Column({ type: 'uuid', nullable: true })
  overriddenBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  overriddenAt?: Date;

  @Column({ type: 'text', nullable: true })
  overrideReason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'overriddenBy' })
  overrider?: Employee;
}
