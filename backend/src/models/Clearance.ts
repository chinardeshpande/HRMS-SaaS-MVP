import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { Department } from './Department';
import { ExitCase } from './ExitCase';
import { ClearanceStatus } from './enums/ClearanceStatus';

@Entity('clearances')
@Index(['tenantId', 'exitId'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'departmentType'])
@Index(['tenantId', 'status'])
export class Clearance {
  @PrimaryGeneratedColumn('uuid')
  clearanceId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  exitId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ length: 100 })
  departmentType!: string; // manager, hr, it, finance, admin, legal, facilities, etc.

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ length: 200 })
  clearanceName!: string;

  @Column({ type: 'text', nullable: true })
  clearanceDescription?: string;

  @Column({
    type: 'enum',
    enum: ClearanceStatus,
    default: ClearanceStatus.PENDING,
  })
  status!: ClearanceStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string; // Person responsible for clearance

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'date', nullable: true })
  initiatedDate?: Date;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  @Column({ default: false })
  isCleared!: boolean;

  @Column({ default: false })
  isRejected!: boolean;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ default: false })
  requiresApproval!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'date', nullable: true })
  approvedDate?: Date;

  @Column({ default: false })
  isEscalated!: boolean;

  @Column({ type: 'uuid', nullable: true })
  escalatedTo?: string;

  @Column({ type: 'date', nullable: true })
  escalatedDate?: Date;

  @Column({ type: 'text', nullable: true })
  escalationReason?: string;

  // Checklist items
  @Column({ type: 'json', nullable: true })
  checklistItems?: string[]; // Array of checklist items

  @Column({ type: 'json', nullable: true })
  completedChecklistItems?: string[]; // Array of completed items

  @Column({ type: 'text', nullable: true })
  clearerComments?: string;

  @Column({ type: 'text', nullable: true })
  hrNotes?: string;

  @Column({ default: true })
  isRequired!: boolean;

  @Column({ type: 'integer', default: 0 })
  priority!: number; // 0 = low, 1 = medium, 2 = high, 3 = critical

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => ExitCase)
  @JoinColumn({ name: 'exitId' })
  exitCase!: ExitCase;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: Department;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignedToUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'escalatedTo' })
  escalatedToUser?: Employee;
}
