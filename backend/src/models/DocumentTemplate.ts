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
import { DocumentType } from './enums/DocumentEnums';

@Entity('document_templates')
@Index(['tenantId', 'templateName'], { unique: true })
@Index(['tenantId', 'isActive'])
export class DocumentTemplate {
  @PrimaryGeneratedColumn('uuid')
  templateId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  templateName!: DocumentType;

  @Column({ length: 255 })
  displayName!: string;

  @Column({ length: 100, nullable: true })
  category?: string;

  @Column({ type: 'text' })
  htmlTemplate!: string;

  @Column({ type: 'jsonb' })
  availableFields!: string[];

  @Column({ default: true })
  @Index()
  isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;
}
