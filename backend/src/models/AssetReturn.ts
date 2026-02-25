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
import { ExitCase } from './ExitCase';
import { AssetReturnStatus } from './enums/AssetReturnStatus';

@Entity('asset_returns')
@Index(['tenantId', 'exitId'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'assetType'])
@Index(['tenantId', 'status'])
export class AssetReturn {
  @PrimaryGeneratedColumn('uuid')
  assetReturnId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  exitId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @Column({ length: 100 })
  assetType!: string; // laptop, desktop, mobile, access_card, id_card, books, etc.

  @Column({ length: 200, nullable: true })
  assetName?: string;

  @Column({ length: 100, nullable: true })
  assetId?: string; // Serial number or asset tag

  @Column({ length: 100, nullable: true })
  make?: string;

  @Column({ length: 100, nullable: true })
  model?: string;

  @Column({
    type: 'enum',
    enum: AssetReturnStatus,
    default: AssetReturnStatus.PENDING,
  })
  status!: AssetReturnStatus;

  @Column({ type: 'date', nullable: true })
  issuedDate?: Date;

  @Column({ type: 'date', nullable: true })
  expectedReturnDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualReturnDate?: Date;

  @Column({ default: false })
  isReturned!: boolean;

  @Column({ default: false })
  isDamaged!: boolean;

  @Column({ type: 'text', nullable: true })
  damageDescription?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  damageCharge?: number;

  @Column({ default: false })
  isMissing!: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  replacementCost?: number;

  @Column({ default: false })
  isWaived!: boolean;

  @Column({ type: 'text', nullable: true })
  waiverReason?: string;

  @Column({ type: 'uuid', nullable: true })
  waivedBy?: string;

  @Column({ type: 'date', nullable: true })
  waivedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ type: 'date', nullable: true })
  verifiedDate?: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => ExitCase)
  @JoinColumn({ name: 'exitId' })
  exitCase!: ExitCase;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'waivedBy' })
  waivedByUser?: Employee;
}
