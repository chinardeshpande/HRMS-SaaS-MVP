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
import { ProbationCase } from './ProbationCase';
import { Employee } from './Employee';
import { TaskStatus, TaskPriority, TaskCategory } from './enums/TaskStatus';

@Entity('probation_tasks')
@Index(['tenantId', 'probationId', 'status'])
@Index(['tenantId', 'assignedTo', 'status'])
@Index(['tenantId', 'dueDate'])
@Index(['tenantId', 'isOverdue'])
export class ProbationTask {
  @PrimaryGeneratedColumn('uuid')
  taskId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  probationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100 })
  taskType!: string;

  @Column({
    type: 'enum',
    enum: TaskCategory,
    default: TaskCategory.GENERAL,
  })
  category!: TaskCategory;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ length: 50, nullable: true })
  assignedRole?: string;

  @Column({ type: 'date' })
  dueDate!: Date;

  @Column({ default: true })
  isRequired!: boolean;

  @Column({ default: false })
  @Index()
  isOverdue!: boolean;

  @Column({ type: 'integer', default: 0 })
  escalationLevel!: number;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ type: 'text', nullable: true })
  completionNotes?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => ProbationCase)
  @JoinColumn({ name: 'probationId' })
  probationCase!: ProbationCase;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'completedBy' })
  completedByUser?: Employee;
}
