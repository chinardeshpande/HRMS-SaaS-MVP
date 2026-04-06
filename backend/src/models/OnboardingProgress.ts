import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';

export interface OnboardingStepData {
  companyDetails?: {
    logoUrl?: string;
    primaryColor?: string;
    timeZone?: string;
    address?: string;
  };
  departments?: Array<{
    name: string;
    parentDepartmentId?: string;
    headEmployeeId?: string;
  }>;
  designations?: Array<{
    name: string;
    level?: number;
  }>;
  users?: Array<{
    email: string;
    fullName: string;
    role: string;
    departmentId?: string;
  }>;
  invitedUsers?: Array<{
    email: string;
    fullName: string;
    role: string;
    departmentId?: string;
  }>;
  businessRules?: {
    leavePolicies?: Array<{
      name: string;
      daysAllowed: number;
      type: string;
    }>;
    attendancePolicy?: {
      workingHoursPerDay: number;
      workingDaysPerWeek: number[];
      checkInTime?: string;
      checkOutTime?: string;
    };
    probationPeriodDays?: number;
    noticePeriodDays?: number;
  };
}

@Entity('onboarding_progress')
export class OnboardingProgress {
  @PrimaryGeneratedColumn('uuid')
  progressId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'int', default: 1 })
  currentStep!: number; // 1-6

  @Column({ type: 'simple-array', default: '' })
  completedSteps!: number[]; // Array of completed step numbers

  @Column({ type: 'jsonb', default: {} })
  stepData!: OnboardingStepData; // JSON data for all steps

  @Column({ type: 'boolean', default: false })
  isComplete!: boolean;

  @Column({ type: 'simple-array', nullable: true })
  skippedSteps?: number[]; // Optional steps that were skipped

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;
}
