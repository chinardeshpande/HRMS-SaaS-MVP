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
import { User } from './User';

@Entity('status_transitions')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'transitionDate'])
@Index(['tenantId', 'triggeredBy'])
export class StatusTransition {
  @PrimaryGeneratedColumn('uuid')
  transitionId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ length: 50 })
  entityType!: string;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ length: 100 })
  fromState!: string;

  @Column({ length: 100 })
  toState!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transitionDate!: Date;

  @Column({ type: 'uuid' })
  triggeredBy!: string;

  @Column({ length: 50, default: 'manual' })
  triggerType!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggeredBy' })
  triggeredByUser!: User;
}
