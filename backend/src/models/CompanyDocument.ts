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
import { User } from './User';

export enum CompanyDocumentCategory {
  INCORPORATION_IDENTITY = 'incorporation_identity',
  TAX_REGISTRATION = 'tax_registration',
  LABOR_HR_COMPLIANCE = 'labor_hr_compliance',
  HR_POLICY = 'hr_policy',
  INSURANCE_BENEFITS = 'insurance_benefits',
  STATUTORY_RETURN = 'statutory_return',
  BOARD_GOVERNANCE = 'board_governance',
  HR_TEMPLATE = 'hr_template',
  VENDOR_PARTNER_AGREEMENT = 'vendor_partner_agreement',
  OTHER = 'other',
}

export enum CompanyDocumentStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
  NEEDS_REVIEW = 'needs_review',
}

export enum CompanyDocumentVerificationStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('company_documents')
@Index(['tenantId', 'category'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'expiryDate'])
export class CompanyDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({
    type: 'varchar',
    length: 80,
    default: CompanyDocumentCategory.OTHER,
  })
  category!: CompanyDocumentCategory;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  documentNumber?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  issuingAuthority?: string | null;

  @Column({ type: 'date', nullable: true })
  issueDate?: Date | null;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  renewalOwner?: string | null;

  @Column({
    type: 'varchar',
    length: 40,
    default: CompanyDocumentStatus.ACTIVE,
  })
  status!: CompanyDocumentStatus;

  @Column({
    type: 'varchar',
    length: 40,
    default: CompanyDocumentVerificationStatus.UNVERIFIED,
  })
  verificationStatus!: CompanyDocumentVerificationStatus;

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

