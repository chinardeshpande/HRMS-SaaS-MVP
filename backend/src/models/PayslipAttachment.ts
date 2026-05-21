import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payslip } from './Payslip';
import { Employee } from './Employee';

@Entity('payslip_attachments')
@Index(['tenantId', 'payslipId'])
export class PayslipAttachment {
  @PrimaryGeneratedColumn('uuid')
  attachmentId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  payslipId!: string;

  @ManyToOne(() => Payslip, (payslip) => payslip.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payslipId' })
  payslip?: Payslip;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 100 })
  fileType!: string;

  @Column({ type: 'text' })
  fileUrl!: string;

  @Column({ type: 'bigint', default: 0 })
  fileSize!: number;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploader?: Employee | null;

  @Column({ type: 'boolean', default: true })
  isPrimary!: boolean;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn()
  uploadedOn!: Date;
}
