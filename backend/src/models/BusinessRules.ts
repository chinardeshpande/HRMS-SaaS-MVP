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

export enum RuleCategory {
  LEAVE = 'leave',
  ATTENDANCE = 'attendance',
  PAYROLL = 'payroll',
  PERFORMANCE = 'performance',
  ONBOARDING = 'onboarding',
  EXIT = 'exit',
  GENERAL = 'general',
}

@Entity('business_rules')
export class BusinessRules {
  @PrimaryGeneratedColumn('uuid')
  ruleId: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: RuleCategory,
  })
  category: RuleCategory;

  @Column({ length: 255 })
  ruleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  // Leave Rules
  @Column({ type: 'jsonb', nullable: true })
  leaveRules: {
    annualLeaveQuota?: number;
    sickLeaveQuota?: number;
    casualLeaveQuota?: number;
    parentalLeaveQuota?: number;
    carryForwardAllowed?: boolean;
    maxCarryForwardDays?: number;
    maxConsecutiveDays?: number;
    minimumNoticedays?: number;
    requireApproval?: boolean;
    allowNegativeBalance?: boolean;
    proRatedForNewJoiners?: boolean;
    accrualType?: 'monthly' | 'yearly' | 'quarterly';
  };

  // Attendance Rules
  @Column({ type: 'jsonb', nullable: true })
  attendanceRules: {
    requireClockIn?: boolean;
    requireClockOut?: boolean;
    allowMobileCheckIn?: boolean;
    geoFencingEnabled?: boolean;
    geoFenceRadius?: number; // in meters
    lateArrivalGracePeriod?: number; // in minutes
    earlyDepartureGracePeriod?: number; // in minutes
    overtimeAutoCalculate?: boolean;
    overtimeRequiresApproval?: boolean;
    halfDayThreshold?: number; // in hours
    fullDayThreshold?: number; // in hours
  };

  // Payroll Rules
  @Column({ type: 'jsonb', nullable: true })
  payrollRules: {
    payFrequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'semi-monthly';
    payDay?: number; // day of month or week
    overtimeRate?: number; // multiplier
    weekendOvertimeRate?: number;
    holidayOvertimeRate?: number;
    nightShiftAllowance?: number;
    taxCalculationMethod?: 'automatic' | 'manual';
    providentFundPercentage?: number;
    employerPFContribution?: number;
    professionalTaxApplicable?: boolean;
    gratuityApplicable?: boolean;
    bonusCalculationMethod?: 'fixed' | 'percentage' | 'performance';
  };

  // Performance Rules
  @Column({ type: 'jsonb', nullable: true })
  performanceRules: {
    reviewCycle?: 'quarterly' | 'half-yearly' | 'yearly';
    selfReviewEnabled?: boolean;
    peerReviewEnabled?: boolean;
    managerReviewRequired?: boolean;
    goalsTrackingEnabled?: boolean;
    competencyFrameworkEnabled?: boolean;
    ratingScale?: number; // e.g., 5 or 10
    probationPeriodDays?: number;
    noticePeriodays?: number;
  };

  // Onboarding Rules
  @Column({ type: 'jsonb', nullable: true })
  onboardingRules: {
    documentVerificationRequired?: boolean;
    backgroundCheckRequired?: boolean;
    referenceCheckRequired?: boolean;
    autoAssignBuddy?: boolean;
    welcomeEmailEnabled?: boolean;
    taskChecklistRequired?: boolean;
    trainingModulesRequired?: string[];
  };

  // Exit Rules
  @Column({ type: 'jsonb', nullable: true })
  exitRules: {
    exitInterviewRequired?: boolean;
    clearanceChecklistRequired?: boolean;
    noticePeriodDays?: number;
    noticeWaiverAllowed?: boolean;
    assetReturnRequired?: boolean;
    finalSettlementDays?: number;
    experienceLetterDays?: number;
  };

  // Custom Workflow Rules
  @Column({ type: 'jsonb', nullable: true })
  customWorkflows: {
    workflowName?: string;
    triggerEvent?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions?: Array<{
      type: string;
      config: Record<string, any>;
    }>;
  }[];

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
