import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LeaveType {
  SICK = 'sick',
  CASUAL = 'casual',
  EARNED = 'earned',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  UNPAID = 'unpaid',
  COMPENSATORY = 'compensatory',
}

@Entity('leave_policies')
@Index(['tenantId', 'leaveType'])
export class LeavePolicy {
  @PrimaryGeneratedColumn('uuid')
  policyId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  policyName!: string;

  @Column({
    type: 'enum',
    enum: LeaveType,
  })
  leaveType!: LeaveType;

  @Column({ type: 'int', comment: 'Total leaves allowed per year' })
  totalLeaves!: number;

  @Column({ type: 'int', default: 0, comment: 'Maximum consecutive days allowed' })
  maxConsecutiveDays!: number;

  @Column({ type: 'boolean', default: true })
  carryForward!: boolean;

  @Column({ type: 'int', default: 0, comment: 'Maximum leaves that can be carried forward' })
  maxCarryForward!: number;

  @Column({ type: 'boolean', default: false })
  encashable!: boolean;

  @Column({ type: 'int', default: 0, comment: 'Minimum notice days required' })
  minNoticeDays!: number;

  @Column({ type: 'boolean', default: true })
  requiresApproval!: boolean;

  @Column({ type: 'int', default: 0, comment: 'Probation period in months' })
  probationPeriod!: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'Gender applicability: male, female, all' })
  applicableGender?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
