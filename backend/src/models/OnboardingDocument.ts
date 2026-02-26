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
import { Candidate } from './Candidate';
import { Employee } from './Employee';
import { DocumentCategory, DocumentType, VerificationStatus } from './enums/DocumentEnums';

@Entity('onboarding_documents')
@Index(['tenantId', 'candidateId', 'documentType'])
@Index(['tenantId', 'verificationStatus'])
@Index(['tenantId', 'category'])
export class OnboardingDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType!: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  category!: DocumentCategory;

  @Column({ length: 255 })
  fileName!: string;

  @Column({ type: 'text' })
  filePath!: string;

  @Column({ type: 'integer', nullable: true })
  fileSize?: number;

  @Column({ length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ default: false })
  requiresSignature!: boolean;

  @Column({ default: false })
  isSigned!: boolean;

  @Column({ type: 'date', nullable: true })
  signedDate?: Date;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ type: 'date', nullable: true })
  verifiedDate?: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes?: string;

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

  @ManyToOne(() => Candidate, { nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate?: Candidate;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier?: Employee;
}
