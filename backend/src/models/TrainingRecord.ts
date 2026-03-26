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

@Entity('training_records')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'candidateId'])
@Index(['tenantId', 'trainingType', 'status'])
@Index(['tenantId', 'completionDate'])
export class TrainingRecord {
  @PrimaryGeneratedColumn('uuid')
  trainingRecordId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  candidateId?: string;

  @Column({ length: 100 })
  trainingType!: string; // 'orientation' | 'safety' | 'compliance' | 'technical' | 'soft_skills' | 'product_knowledge'

  @Column({ length: 255 })
  trainingName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, default: 'pending' })
  status!: string; // 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'

  @Column({ type: 'date', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'date', nullable: true })
  completionDate?: Date;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ default: false })
  isMandatory!: boolean;

  @Column({ type: 'integer', nullable: true })
  durationHours?: number;

  @Column({ length: 255, nullable: true })
  trainer?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ length: 50, nullable: true })
  deliveryMode?: string; // 'online' | 'offline' | 'hybrid'

  @Column({ type: 'text', nullable: true })
  materialsProvided?: string;

  @Column({ type: 'integer', nullable: true })
  scoreObtained?: number;

  @Column({ type: 'integer', nullable: true })
  scoreMaximum?: number;

  @Column({ default: false })
  certificateIssued!: boolean;

  @Column({ type: 'text', nullable: true })
  certificatePath?: string;

  @Column({ type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ type: 'date', nullable: true })
  verifiedDate?: Date;

  @Column({ type: 'text', nullable: true })
  feedbackComments?: string;

  @Column({ type: 'integer', nullable: true })
  feedbackRating?: number;

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
  @JoinColumn({ name: 'completedBy' })
  completedByUser?: Employee;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier?: Employee;
}
