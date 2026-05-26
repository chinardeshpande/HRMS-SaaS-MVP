import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';

@Entity('outbound_email_logs')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'purpose'])
@Index(['status'])
export class OutboundEmailLog {
  @PrimaryGeneratedColumn('uuid')
  logId!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tenantId?: string;

  @Column({ length: 255 })
  recipientEmail!: string;

  @Column({ length: 255 })
  subject!: string;

  @Column({ length: 100, default: 'general' })
  purpose!: string;

  @Column({ length: 30 })
  status!: 'sent' | 'failed';

  @Column({ length: 30 })
  provider!: 'tenant' | 'platform';

  @Column({ length: 255 })
  fromEmail!: string;

  @Column({ length: 255, nullable: true })
  messageId?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;
}
