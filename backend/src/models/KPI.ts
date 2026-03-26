import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Goal } from './Goal';

export enum KPIStatus {
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  OFF_TRACK = 'off_track',
  ACHIEVED = 'achieved',
}

@Entity('kpis')
export class KPI {
  @PrimaryGeneratedColumn('uuid')
  kpiId: string;

  @Column()
  tenantId: string;

  @Column()
  goalId: string;

  @ManyToOne(() => Goal)
  @JoinColumn({ name: 'goalId' })
  goal: Goal;

  @Column({ length: 255 })
  metric: string;

  @Column({ length: 100 })
  target: string;

  @Column({ length: 100, nullable: true })
  actual: string;

  @Column({ length: 50 })
  unit: string;

  @Column({
    type: 'enum',
    enum: KPIStatus,
    default: KPIStatus.ON_TRACK,
  })
  status: KPIStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
