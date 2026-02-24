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
import { Candidate } from './Candidate';
import { OnboardingState } from './enums/OnboardingState';
import { BGVStatus } from './enums/DocumentEnums';

@Entity('onboarding_cases')
@Index(['tenantId', 'candidateId'], { unique: true })
@Index(['tenantId', 'currentState'])
export class OnboardingCase {
  @PrimaryGeneratedColumn('uuid')
  caseId!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'uuid' })
  @Index()
  candidateId!: string;

  @Column({
    type: 'enum',
    enum: OnboardingState,
    default: OnboardingState.OFFER_APPROVED,
  })
  currentState!: OnboardingState;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage!: number;

  // Checkpoint flags
  @Column({ default: false })
  offerSent!: boolean;

  @Column({ default: false })
  offerAccepted!: boolean;

  @Column({ default: false })
  documentsSubmitted!: boolean;

  @Column({ default: false })
  documentsVerified!: boolean;

  @Column({ default: false })
  bgvCompleted!: boolean;

  @Column({ default: false })
  preJoiningComplete!: boolean;

  @Column({ default: false })
  joined!: boolean;

  @Column({ default: false })
  orientationComplete!: boolean;

  // BGV details
  @Column({
    type: 'enum',
    enum: BGVStatus,
    default: BGVStatus.NOT_INITIATED,
  })
  bgvStatus!: BGVStatus;

  @Column({ length: 100, nullable: true })
  bgvVendor?: string;

  @Column({ length: 100, nullable: true })
  bgvReferenceId?: string;

  @Column({ type: 'date', nullable: true })
  bgvInitiatedDate?: Date;

  @Column({ type: 'date', nullable: true })
  bgvCompletedDate?: Date;

  @Column({ type: 'text', nullable: true })
  bgvNotes?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidateId' })
  candidate!: Candidate;
}
