import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('attendance_policies')
@Index(['tenantId'])
export class AttendancePolicy {
  @PrimaryGeneratedColumn('uuid')
  policyId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  policyName!: string;

  // Work Hours
  @Column({ type: 'time' })
  standardCheckIn!: string; // e.g., '09:00:00'

  @Column({ type: 'time' })
  standardCheckOut!: string; // e.g., '18:00:00'

  @Column({ type: 'int', default: 480, comment: 'Required work minutes per day' })
  requiredWorkMinutes!: number;

  // Grace Period
  @Column({ type: 'int', default: 15, comment: 'Late check-in grace period in minutes' })
  lateGraceMinutes!: number;

  @Column({ type: 'int', default: 15, comment: 'Early check-out grace period in minutes' })
  earlyGraceMinutes!: number;

  // Break Configuration
  @Column({ type: 'int', default: 60, comment: 'Total break time in minutes' })
  breakMinutes!: number;

  @Column({ type: 'boolean', default: false })
  trackBreaks!: boolean;

  // Overtime
  @Column({ type: 'boolean', default: false })
  allowOvertime!: boolean;

  @Column({ type: 'int', default: 120, comment: 'Maximum overtime minutes per day' })
  maxOvertimeMinutes!: number;

  // Working Days
  @Column({ type: 'simple-json', comment: 'Working days: [1,2,3,4,5] for Mon-Fri' })
  workingDays!: number[];

  // Half Day
  @Column({ type: 'boolean', default: true })
  allowHalfDay!: boolean;

  @Column({ type: 'int', default: 240, comment: 'Minimum minutes for half day' })
  halfDayMinutes!: number;

  // Shift Configuration
  @Column({ type: 'boolean', default: false })
  hasShifts!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
