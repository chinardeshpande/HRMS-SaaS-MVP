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
import { ApprovalStatus, ApprovalEntityType, ApprovalType } from './enums/ApprovalEnums';

@Entity('approvals')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'approverId', 'status'])
@Index(['tenantId', 'status'])
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  approvalId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: ApprovalEntityType,
  })
  entityType!: ApprovalEntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({
    type: 'enum',
    enum: ApprovalType,
  })
  approvalType!: ApprovalType;

  @Column({ type: 'integer', default: 1 })
  approvalLevel!: number;

  @Column({ type: 'uuid' })
  @Index()
  approverId!: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status!: ApprovalStatus;

  @Column({ type: 'date' })
  requestedDate!: Date;

  @Column({ type: 'date', nullable: true })
  respondedDate?: Date;

  @Column({ type: 'text', nullable: true })
  comments?: string;

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

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approverId' })
  approver!: Employee;
}
