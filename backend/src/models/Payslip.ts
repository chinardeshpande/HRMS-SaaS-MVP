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
import { SalaryStructure } from './SalaryStructure';
import { PayslipComponent } from './PayslipComponent';
import { PayslipAttachment } from './PayslipAttachment';

export enum PayslipStatus {
  DRAFT = 'draft',
  UPLOADED = 'uploaded',
  FINAL = 'final',
  SHARED = 'shared',
  CORRECTED = 'corrected',
}

@Entity('payslips')
@Index(['tenantId', 'employeeId', 'year', 'month'])
@Index(['tenantId', 'status'])
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  payslipId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'uuid', nullable: true })
  salaryStructureId?: string | null;

  @ManyToOne(() => SalaryStructure, { nullable: true })
  @JoinColumn({ name: 'salaryStructureId' })
  salaryStructure?: SalaryStructure | null;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grossEarnings!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeductions!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netPay!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  paidDays!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  lopDays!: number;

  @Column({ type: 'date', nullable: true })
  paymentDate?: Date | null;

  @Column({
    type: 'enum',
    enum: PayslipStatus,
    enumName: 'payslip_status_enum',
    default: PayslipStatus.DRAFT,
  })
  status!: PayslipStatus;

  @Column({ type: 'boolean', default: false })
  employeeVisible!: boolean;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  generatedBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => PayslipComponent, (component) => component.payslip)
  components?: PayslipComponent[];

  @OneToMany(() => PayslipAttachment, (attachment) => attachment.payslip)
  attachments?: PayslipAttachment[];
}
