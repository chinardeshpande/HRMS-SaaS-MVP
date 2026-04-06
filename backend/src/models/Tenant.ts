import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  companyName!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  subdomain?: string;

  @Column({ type: 'varchar', length: 50, default: 'basic' })
  planType!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primaryColor?: string;

  // Trial & Onboarding fields
  @Column({ type: 'boolean', default: true })
  isTrialActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  trialStartDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  trialEndDate?: Date;

  @Column({ type: 'boolean', default: false })
  onboardingCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  onboardingCompletedAt?: Date;

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ type: 'boolean', default: false })
  setupWizardCompleted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => User, (user) => user.tenant)
  users?: User[];
}
