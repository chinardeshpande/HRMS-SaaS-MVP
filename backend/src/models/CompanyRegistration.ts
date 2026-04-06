import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RegistrationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

@Entity('company_registrations')
export class CompanyRegistration {
  @PrimaryGeneratedColumn('uuid')
  registrationId!: string;

  @Column({ type: 'varchar', length: 255 })
  companyName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  adminEmail!: string;

  @Column({ type: 'varchar', length: 255 })
  adminFullName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companySize?: string; // '1-10', '11-50', '51-200', '201-500', '500+'

  @Column({ type: 'varchar', length: 255, unique: true })
  registrationToken!: string;

  @Column({ type: 'timestamp' })
  tokenExpiry!: Date;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status!: RegistrationStatus;

  @Column({
    type: 'enum',
    enum: PlanType,
    nullable: true,
  })
  selectedPlan?: PlanType;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    nullable: true,
  })
  selectedBillingCycle?: BillingCycle;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmSource?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utmCampaign?: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string; // Created tenant ID after completion

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
