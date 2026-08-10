import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payroll_cycle_events')
@Index(['tenantId', 'payrollCycleId', 'createdAt'])
export class PayrollCycleEvent {
  @PrimaryGeneratedColumn('uuid')
  payrollCycleEventId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  payrollCycleId!: string;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  fromStatus?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  toStatus?: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorUserId?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
