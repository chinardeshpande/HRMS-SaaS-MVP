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

export enum CompensationShareChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  HR_CONNECT = 'hr_connect',
}

export enum CompensationShareStatus {
  LOGGED = 'logged',
  SENT = 'sent',
  FAILED = 'failed',
  VIEWED = 'viewed',
}

@Entity('compensation_share_logs')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'payslipId'])
export class CompensationShareLog {
  @PrimaryGeneratedColumn('uuid')
  shareLogId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column({ type: 'uuid', nullable: true })
  payslipId?: string | null;

  @ManyToOne(() => Payslip, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payslipId' })
  payslip?: Payslip | null;

  @Column({
    type: 'enum',
    enum: CompensationShareChannel,
    enumName: 'compensation_share_channel_enum',
  })
  channel!: CompensationShareChannel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient?: string | null;

  @Column({
    type: 'enum',
    enum: CompensationShareStatus,
    enumName: 'compensation_share_status_enum',
    default: CompensationShareStatus.LOGGED,
  })
  status!: CompensationShareStatus;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @Column({ type: 'uuid', nullable: true })
  sharedBy?: string | null;

  @CreateDateColumn()
  sharedOn!: Date;
}
