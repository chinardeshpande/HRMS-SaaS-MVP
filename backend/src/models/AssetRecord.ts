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

@Entity('asset_records')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'candidateId'])
@Index(['tenantId', 'assetType', 'status'])
@Index(['tenantId', 'serialNumber'], { unique: true })
@Index(['tenantId', 'assignedDate'])
export class AssetRecord {
  @PrimaryGeneratedColumn('uuid')
  assetRecordId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  @Column({ length: 100 })
  assetType!: string; // 'laptop' | 'desktop' | 'monitor' | 'keyboard' | 'mouse' | 'phone' | 'id_card' | 'access_card' | 'headset' | 'charger' | 'other'

  @Column({ length: 255 })
  assetName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 255, nullable: true })
  brand?: string;

  @Column({ length: 255, nullable: true })
  model?: string;

  @Column({ length: 100, unique: true })
  serialNumber!: string;

  @Column({ length: 100, nullable: true })
  assetTag?: string;

  @Column({ length: 50, default: 'assigned' })
  status!: string; // 'assigned' | 'returned' | 'damaged' | 'lost' | 'under_repair' | 'disposed'

  @Column({ type: 'date' })
  assignedDate!: Date;

  @Column({ type: 'date', nullable: true })
  returnDate?: Date;

  @Column({ type: 'date', nullable: true })
  expectedReturnDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  returnedTo?: string;

  @Column({ length: 50, nullable: true })
  condition?: string; // 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice?: number;

  @Column({ type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiryDate?: Date;

  @Column({ type: 'text', nullable: true })
  specifications?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ default: false })
  isReturnable!: boolean;

  @Column({ default: false })
  isReturned!: boolean;

  @Column({ default: false })
  requiresAcknowledgement!: boolean;

  @Column({ default: false })
  isAcknowledged!: boolean;

  @Column({ type: 'date', nullable: true })
  acknowledgementDate?: Date;

  @Column({ type: 'text', nullable: true })
  acknowledgementSignature?: string;

  @Column({ type: 'text', nullable: true })
  damageReportDetails?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  damageCharges?: number;

  @Column({ type: 'text', nullable: true })
  returnConditionNotes?: string;

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
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'returnedTo' })
  returnedToUser?: Employee;
}
