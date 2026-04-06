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
import { Department } from './Department';
import { Designation } from './Designation';

export enum PositionChangeType {
  PROMOTION = 'promotion',
  TRANSFER = 'transfer',
  DEMOTION = 'demotion',
  JOINING = 'joining',
  ROLE_CHANGE = 'role_change',
}

@Entity('position_history')
@Index(['tenantId', 'employeeId', 'effectiveDate'])
export class PositionHistory {
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
    enum: PositionChangeType,
  })
  changeType!: PositionChangeType;

  // From position
  @Column({ type: 'uuid', nullable: true })
  fromDepartmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  fromDesignationId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromJobTitle?: string;

  // To position
  @Column({ type: 'uuid', nullable: true })
  toDepartmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  toDesignationId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  toJobTitle?: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'fromDepartmentId' })
  fromDepartment?: Department;

  @ManyToOne(() => Designation, { nullable: true })
  @JoinColumn({ name: 'fromDesignationId' })
  fromDesignation?: Designation;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'toDepartmentId' })
  toDepartment?: Department;

  @ManyToOne(() => Designation, { nullable: true })
  @JoinColumn({ name: 'toDesignationId' })
  toDesignation?: Designation;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: Employee;
}
