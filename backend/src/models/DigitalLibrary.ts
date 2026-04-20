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

export enum ResourceType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

export enum AccessLevel {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

@Entity('digital_library')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'resourceType'])
@Index(['tenantId', 'accessLevel'])
export class DigitalLibrary {
  @PrimaryGeneratedColumn('uuid')
  libraryId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  @Index()
  employeeId!: string; // Owner of this library entry

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  // Original resource details
  @Column('uuid', { nullable: true })
  originalOwnerId?: string; // Who originally uploaded this

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'originalOwnerId' })
  originalOwner?: Employee;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'text' })
  fileUrl!: string; // Path to the file

  @Column({ type: 'varchar', length: 100 })
  fileType!: string; // MIME type

  @Column({ type: 'bigint' })
  fileSize!: number; // Size in bytes

  @Column({
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.DOCUMENT,
  })
  resourceType!: ResourceType;

  // Permission and access control
  @Column({
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  accessLevel!: AccessLevel;

  @Column({ type: 'boolean', default: false })
  isPaid!: boolean; // Is this a paid resource?

  @Column({ type: 'boolean', default: true })
  canDownload!: boolean; // Can user download locally?

  @Column({ type: 'boolean', default: false })
  canShare!: boolean; // Can user share with others?

  @Column({ type: 'boolean', default: false })
  canEdit!: boolean; // Can user edit/modify?

  // Source information
  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceType?: string; // 'chat', 'document', 'upload', etc.

  @Column({ type: 'uuid', nullable: true })
  sourceId?: string; // ID of the source (conversationId, documentId, etc.)

  // Categorization
  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string; // User-defined category

  @Column('simple-array', { nullable: true })
  tags?: string[]; // User-defined tags

  @Column({ type: 'text', nullable: true })
  description?: string; // User notes about this resource

  // Usage tracking
  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  // Expiry (for temporary access to paid/shared resources)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
