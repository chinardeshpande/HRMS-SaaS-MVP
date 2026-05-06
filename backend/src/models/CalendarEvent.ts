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
import { Tenant } from './Tenant';
import { Employee } from './Employee';

export enum CalendarEventStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('calendar_events')
@Index(['tenantId', 'startDate'])
@Index(['tenantId', 'eventType'])
@Index(['tenantId', 'status'])
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  eventId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'meeting' })
  eventType!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  startTime?: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  endTime?: string;

  @Column({ type: 'boolean', default: false })
  isAllDay!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'uuid', nullable: true })
  organizerId?: string;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organizerId' })
  organizer?: Employee;

  @Column({ type: 'jsonb', nullable: true })
  attendees?: string[];

  @Column({ type: 'varchar', length: 20, default: CalendarEventStatus.SCHEDULED })
  status!: CalendarEventStatus;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedEntityType?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  navigationUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
