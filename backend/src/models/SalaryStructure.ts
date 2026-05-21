import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Employee } from './Employee';
import { SalaryComponent } from './SalaryComponent';

export enum SalaryStructureStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUPERSEDED = 'superseded',
  ARCHIVED = 'archived',
}

export enum SalaryApprovalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
}

@Entity('salary_structures')
@Index(['tenantId', 'employeeId', 'effectiveFrom'])
@Index(['tenantId', 'employeeId', 'status'])
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  structureId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'varchar', length: 120, default: 'Current Salary Structure' })
  structureName!: string;

  @Column({ type: 'date' })
  effectiveFrom!: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  annualCtc!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyGross!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyNetEstimate!: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 30, default: 'monthly' })
  payFrequency!: string;

  @Column({ type: 'varchar', length: 50, default: 'bank_transfer' })
  paymentMode!: string;

  @Column({
    type: 'enum',
    enum: SalaryStructureStatus,
    enumName: 'salary_structure_status_enum',
    default: SalaryStructureStatus.DRAFT,
  })
  status!: SalaryStructureStatus;

  @Column({
    type: 'enum',
    enum: SalaryApprovalStatus,
    enumName: 'salary_approval_status_enum',
    default: SalaryApprovalStatus.DRAFT,
  })
  approvalStatus!: SalaryApprovalStatus;

  @Column({ type: 'boolean', default: false })
  employeeVisible!: boolean;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SalaryComponent, (component) => component.salaryStructure)
  components?: SalaryComponent[];
}
