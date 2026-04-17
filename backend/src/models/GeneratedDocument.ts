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
import { Tenant } from './Tenant';
import { User } from './User';
import { Employee } from './Employee';
import { Candidate } from './Candidate';
import { DocumentTemplate } from './DocumentTemplate';
import { DocumentType } from './enums/DocumentEnums';

export enum GeneratedDocumentStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  ISSUED = 'issued',
  SENT = 'sent',
  RECEIVED = 'received',
  REVOKED = 'revoked',
}

export enum GeneratedDocumentFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
}

@Entity('generated_documents')
@Index(['tenantId', 'documentType'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'candidateId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'generatedBy'])
export class GeneratedDocument {
  @PrimaryGeneratedColumn('uuid')
  documentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType!: DocumentType;

  @Column({ type: 'varchar', length: 200 })
  documentName!: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  @Column({ type: 'uuid' })
  generatedBy!: string;

  @Column({
    type: 'enum',
    enum: GeneratedDocumentStatus,
    default: GeneratedDocumentStatus.DRAFT,
  })
  status!: GeneratedDocumentStatus;

  @Column({
    type: 'enum',
    enum: GeneratedDocumentFormat,
    default: GeneratedDocumentFormat.PDF,
  })
  format!: GeneratedDocumentFormat;

  @Column({ type: 'text', nullable: true })
  filePath?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileUrl?: string;

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes?: number;

  @Column({ type: 'jsonb' })
  metadata!: {
    variables?: Record<string, any>;
    issuedTo?: {
      name: string;
      email: string;
      phone?: string;
    };
    signatories?: Array<{
      name: string;
      designation: string;
      signature?: string;
    }>;
    validity?: {
      issueDate: string;
      expiryDate?: string;
    };
    customData?: Record<string, any>;
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sentTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'text', nullable: true })
  revocationReason?: string;

  @Column({ default: false })
  hasWatermark!: boolean;

  @Column({ default: false })
  isConfidential!: boolean;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => DocumentTemplate, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: DocumentTemplate;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @ManyToOne(() => Candidate, { nullable: true })
  @JoinColumn({ name: 'candidateId' })
  candidate?: Candidate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'generatedBy' })
  generator!: User;
}
