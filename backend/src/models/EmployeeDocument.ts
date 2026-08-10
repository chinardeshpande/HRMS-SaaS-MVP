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
import { User } from './User';

export enum EmployeeDocumentCategory {
  IDENTITY = 'identity',
  ADDRESS_PROOF = 'address_proof',
  EDUCATION = 'education',
  EXPERIENCE = 'experience',
  EMPLOYMENT_LETTER = 'employment_letter',
  COMPENSATION = 'compensation',
  PAYSLIP = 'payslip',
  FORM_16 = 'form16',
  POLICY_ACKNOWLEDGEMENT = 'policy_acknowledgement',
  PERFORMANCE = 'performance',
  EXIT = 'exit',
  OTHER = 'other',
}

export enum EmployeeDocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  NEEDS_REVIEW = 'needs_review',
}

export enum EmployeeDocumentVerificationStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('employee_documents')
@Index(['tenantId', 'employeeId', 'category'])
@Index(['tenantId', 'employeeId', 'status'])
@Index(['tenantId', 'verificationStatus'])
export class EmployeeDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({
    type: 'varchar',
    length: 80,
    default: EmployeeDocumentCategory.OTHER,
  })
  category!: EmployeeDocumentCategory;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  documentNumber?: string | null;

  @Column({ type: 'date', nullable: true })
  issueDate?: Date | null;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date | null;

  @Column({
    type: 'varchar',
    length: 40,
    default: EmployeeDocumentStatus.ACTIVE,
  })
  status!: EmployeeDocumentStatus;

  @Column({
    type: 'varchar',
    length: 40,
    default: EmployeeDocumentVerificationStatus.UNVERIFIED,
  })
  verificationStatus!: EmployeeDocumentVerificationStatus;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 255 })
  originalFileName!: string;

  @Column({ type: 'text' })
  fileUrl!: string;

  @Column({ type: 'varchar', length: 100 })
  fileType!: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;

  @Column({ type: 'uuid' })
  uploadedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader?: User;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier?: User | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
