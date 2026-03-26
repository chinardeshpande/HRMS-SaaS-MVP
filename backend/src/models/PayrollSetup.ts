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
import { Candidate } from './Candidate';

@Entity('payroll_setups')
@Index(['tenantId', 'employeeId'], { unique: true })
@Index(['tenantId', 'candidateId'])
@Index(['tenantId', 'verificationStatus'])
@Index(['tenantId', 'panNumber'], { unique: true })
export class PayrollSetup {
  @PrimaryGeneratedColumn('uuid')
  payrollSetupId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  // Bank Details
  @Column({ length: 255 })
  bankName!: string;

  @Column({ length: 100 })
  bankBranch!: string;

  @Column({ length: 50 })
  accountNumber!: string;

  @Column({ length: 50 })
  ifscCode!: string;

  @Column({ length: 100, nullable: true })
  accountHolderName?: string;

  @Column({ length: 50, default: 'savings' })
  accountType!: string; // 'savings' | 'current'

  @Column({ default: false })
  bankDetailsVerified!: boolean;

  @Column({ type: 'date', nullable: true })
  bankDetailsVerifiedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  bankDetailsVerifiedBy?: string;

  // PAN Details
  @Column({ length: 10, unique: true })
  panNumber!: string;

  @Column({ length: 255, nullable: true })
  panHolderName?: string;

  @Column({ default: false })
  panVerified!: boolean;

  @Column({ type: 'date', nullable: true })
  panVerifiedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  panVerifiedBy?: string;

  @Column({ type: 'text', nullable: true })
  panDocumentPath?: string;

  // UAN (Universal Account Number - for PF)
  @Column({ length: 12, nullable: true })
  uanNumber?: string;

  @Column({ default: false })
  uanVerified!: boolean;

  @Column({ type: 'date', nullable: true })
  uanVerifiedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  uanVerifiedBy?: string;

  // Aadhaar Details
  @Column({ length: 12, nullable: true })
  aadhaarNumber?: string;

  @Column({ default: false })
  aadhaarVerified!: boolean;

  @Column({ type: 'date', nullable: true })
  aadhaarVerifiedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  aadhaarVerifiedBy?: string;

  @Column({ type: 'text', nullable: true })
  aadhaarDocumentPath?: string;

  // PF (Provident Fund) Details
  @Column({ length: 50, nullable: true })
  pfNumber?: string;

  @Column({ default: false })
  pfApplicable!: boolean;

  @Column({ default: false })
  pfNomineeSubmitted!: boolean;

  @Column({ length: 255, nullable: true })
  pfNomineeName?: string;

  @Column({ length: 100, nullable: true })
  pfNomineeRelation?: string;

  // ESI (Employee State Insurance) Details
  @Column({ length: 50, nullable: true })
  esiNumber?: string;

  @Column({ default: false })
  esiApplicable!: boolean;

  @Column({ default: false })
  esiNomineeSubmitted!: boolean;

  @Column({ length: 255, nullable: true })
  esiNomineeName?: string;

  @Column({ length: 100, nullable: true })
  esiNomineeRelation?: string;

  // Salary Details
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  basicSalary?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  hra?: number; // House Rent Allowance

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  specialAllowance?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  otherAllowances?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  grossSalary?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ctc?: number; // Cost to Company

  // Tax Details
  @Column({ length: 50, nullable: true })
  taxRegime?: string; // 'old' | 'new'

  @Column({ default: false })
  form16Available!: boolean;

  @Column({ type: 'text', nullable: true })
  form16Path?: string;

  @Column({ default: false })
  investmentDeclarationSubmitted!: boolean;

  // Overall Verification Status
  @Column({ length: 50, default: 'pending' })
  verificationStatus!: string; // 'pending' | 'in_progress' | 'verified' | 'rejected' | 'incomplete'

  @Column({ type: 'date', nullable: true })
  setupCompletedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  setupCompletedBy?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Candidate, { nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate?: Candidate;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'bankDetailsVerifiedBy' })
  bankVerifier?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'panVerifiedBy' })
  panVerifier?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'uanVerifiedBy' })
  uanVerifier?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'aadhaarVerifiedBy' })
  aadhaarVerifier?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'setupCompletedBy' })
  setupCompleter?: Employee;
}
