import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { OnboardingProgress, OnboardingStepData } from '../models/OnboardingProgress';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { UserInvitation, InvitationStatus } from '../models/UserInvitation';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { User } from '../models/User';
import { UserRole } from '../../../shared/types';
import crypto from 'crypto';

export class OnboardingWizardService {
  private onboardingRepo: Repository<OnboardingProgress>;
  private tenantRepo: Repository<Tenant>;
  private departmentRepo: Repository<Department>;
  private designationRepo: Repository<Designation>;
  private leavePolicyRepo: Repository<LeavePolicy>;
  private attendancePolicyRepo: Repository<AttendancePolicy>;
  private userInvitationRepo: Repository<UserInvitation>;
  private userRepo: Repository<User>;

  constructor() {
    this.onboardingRepo = AppDataSource.getRepository(OnboardingProgress);
    this.tenantRepo = AppDataSource.getRepository(Tenant);
    this.departmentRepo = AppDataSource.getRepository(Department);
    this.designationRepo = AppDataSource.getRepository(Designation);
    this.leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
    this.attendancePolicyRepo = AppDataSource.getRepository(AttendancePolicy);
    this.userInvitationRepo = AppDataSource.getRepository(UserInvitation);
    this.userRepo = AppDataSource.getRepository(User);
  }

  /**
   * Get onboarding progress for a tenant
   */
  async getProgress(tenantId: string): Promise<OnboardingProgress> {
    let progress = await this.onboardingRepo.findOne({
      where: { tenantId },
    });

    // Create if doesn't exist
    if (!progress) {
      progress = this.onboardingRepo.create({
        tenantId,
        currentStep: 1,
        completedSteps: [],
        stepData: {},
        isComplete: false,
      });
      progress = await this.onboardingRepo.save(progress);
    }

    return progress;
  }

  /**
   * Save step data
   */
  async saveStepData(
    tenantId: string,
    stepNumber: number,
    data: Partial<OnboardingStepData>
  ): Promise<OnboardingProgress> {
    const progress = await this.getProgress(tenantId);

    // Merge step data
    progress.stepData = {
      ...progress.stepData,
      ...data,
    };

    // Add to completed steps if not already there
    if (!progress.completedSteps.includes(stepNumber)) {
      progress.completedSteps = [...progress.completedSteps, stepNumber];
    }

    // Update current step to next step if moving forward
    if (stepNumber >= progress.currentStep) {
      progress.currentStep = Math.min(stepNumber + 1, 6);
    }

    return await this.onboardingRepo.save(progress);
  }

  /**
   * Complete onboarding wizard
   */
  async completeOnboarding(tenantId: string, invitedBy: string): Promise<{ success: boolean }> {
    const progress = await this.getProgress(tenantId);

    if (progress.isComplete) {
      return { success: true };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create departments from wizard data
      if (progress.stepData.departments && progress.stepData.departments.length > 0) {
        for (const dept of progress.stepData.departments) {
          const department = queryRunner.manager.create(Department, {
            tenantId,
            name: dept.name,
            ...(dept.parentDepartmentId && { parentDeptId: dept.parentDepartmentId }),
          });
          await queryRunner.manager.save(department);
        }
      }

      // 2. Create designations from wizard data
      if (progress.stepData.designations && progress.stepData.designations.length > 0) {
        for (const desig of progress.stepData.designations) {
          const designation = queryRunner.manager.create(Designation, {
            tenantId,
            name: desig.name,
            level: desig.level || 1,
          });
          await queryRunner.manager.save(designation);
        }
      }

      // 2.5. Create user invitations from wizard data
      const usersToInvite = progress.stepData.users || progress.stepData.invitedUsers || [];
      if (usersToInvite.length > 0) {
        for (const user of usersToInvite) {
          const normalizedEmail = user.email?.toLowerCase();

          // Skip if email is invalid
          if (!normalizedEmail || !normalizedEmail.includes('@')) {
            console.warn(`Skipping invalid user email: ${user.email}`);
            continue;
          }

          const existingUser = await this.userRepo.findOne({
            where: { email: normalizedEmail },
          });

          if (existingUser) {
            console.warn(`Skipping invitation for existing user email: ${normalizedEmail}`);
            continue;
          }

          const existingInvitation = await this.userInvitationRepo.findOne({
            where: {
              email: normalizedEmail,
              status: InvitationStatus.PENDING,
            },
          });

          if (existingInvitation) {
            console.warn(`Skipping duplicate pending invitation: ${normalizedEmail}`);
            continue;
          }

          // Generate invitation token (32 random bytes as hex)
          const invitationToken = crypto.randomBytes(32).toString('hex');

          // Set token expiry to 7 days from now
          const tokenExpiry = new Date();
          tokenExpiry.setDate(tokenExpiry.getDate() + 7);

          // Map role from wizard (employee/manager/hr/admin) to UserRole enum
          let roleEnum: UserRole = UserRole.EMPLOYEE;
          if (user.role === 'manager') roleEnum = UserRole.MANAGER;
          else if (user.role === 'hr' || user.role === 'hr_admin') roleEnum = UserRole.HR_ADMIN;
          else if (user.role === 'admin' || user.role === 'system_admin') roleEnum = UserRole.SYSTEM_ADMIN;

          const invitation = queryRunner.manager.create(UserInvitation, {
            tenantId,
            email: normalizedEmail,
            fullName: user.fullName || normalizedEmail.split('@')[0], // Fallback to email username if no name
            role: roleEnum,
            departmentId: user.departmentId,
            invitedBy: invitedBy,
            invitationToken,
            tokenExpiry,
            status: InvitationStatus.PENDING,
          });

          await queryRunner.manager.save(invitation);
        }
      }

      // 3. Create leave policies from wizard data
      if (progress.stepData.businessRules?.leavePolicies) {
        for (const policy of progress.stepData.businessRules.leavePolicies) {
          const leavePolicy = queryRunner.manager.create(LeavePolicy, {
            tenantId,
            policyName: policy.name,
            leaveType: policy.type as LeaveType,
            totalLeaves: policy.daysAllowed,
            isActive: true,
          });
          await queryRunner.manager.save(leavePolicy);
        }
      } else {
        // Create default leave policies
        await this.createDefaultLeavePolicies(queryRunner, tenantId);
      }

      // 4. Create attendance policy from wizard data or defaults
      const wizardAttendance = progress.stepData.businessRules?.attendancePolicy;
      const workingDays = wizardAttendance?.workingDaysPerWeek || [1, 2, 3, 4, 5]; // Mon-Fri default

      const attendancePolicy = queryRunner.manager.create(AttendancePolicy, {
        tenantId,
        policyName: 'Default Attendance Policy',
        standardCheckIn: '09:00:00', // 9 AM
        standardCheckOut: '18:00:00', // 6 PM
        requiredWorkMinutes: (wizardAttendance?.workingHoursPerDay || 8) * 60,
        lateGraceMinutes: 15,
        earlyGraceMinutes: 15,
        breakMinutes: 60,
        trackBreaks: false,
        allowOvertime: true,
        maxOvertimeMinutes: 120,
        workingDays: workingDays,
        allowHalfDay: true,
        halfDayMinutes: 240,
        hasShifts: false,
        isActive: true,
        description: 'Default attendance policy created during onboarding',
      });
      await queryRunner.manager.save(attendancePolicy);

      // 5. Update tenant
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { tenantId },
      });

      if (tenant) {
        tenant.onboardingCompleted = true;
        tenant.onboardingCompletedAt = new Date();
        tenant.setupWizardCompleted = true;

        // Update company details if provided
        if (progress.stepData.companyDetails) {
          tenant.logoUrl = progress.stepData.companyDetails.logoUrl;
          tenant.primaryColor = progress.stepData.companyDetails.primaryColor;
        }

        await queryRunner.manager.save(tenant);
      }

      // 5.5. Create OrganizationSettings record
      // This ensures organization settings are available in Settings module
      const orgSettingsData: any = {
        tenantId,
        companyName: tenant?.companyName || 'My Company',
        timezone: progress.stepData.companyDetails?.timeZone || 'UTC',
        defaultLanguage: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        fiscalYearStartMonth: 1,
        weekStartDay: 1, // Monday
        twoFactorAuthRequired: false,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 30,
        ipWhitelistEnabled: false,
      };

      // Add optional fields if provided
      if (progress.stepData.companyDetails?.address) {
        orgSettingsData.address = progress.stepData.companyDetails.address;
      }

      if (progress.stepData.companyDetails?.logoUrl || progress.stepData.companyDetails?.primaryColor) {
        orgSettingsData.branding = {
          primaryColor: progress.stepData.companyDetails.primaryColor || '#3B82F6',
          secondaryColor: '#1E40AF',
          accentColor: '#10B981',
          logoUrl: progress.stepData.companyDetails.logoUrl || '',
          faviconUrl: '',
        };
      }

      const orgSettings = queryRunner.manager.create(OrganizationSettings, orgSettingsData);
      await queryRunner.manager.save(orgSettings);

      // 6. Mark onboarding as complete
      progress.isComplete = true;
      progress.completedAt = new Date();
      await queryRunner.manager.save(progress);

      await queryRunner.commitTransaction();

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Skip a step (for optional steps)
   */
  async skipStep(tenantId: string, stepNumber: number): Promise<OnboardingProgress> {
    const progress = await this.getProgress(tenantId);

    // Add to skipped steps
    progress.skippedSteps = progress.skippedSteps || [];
    if (!progress.skippedSteps.includes(stepNumber)) {
      progress.skippedSteps.push(stepNumber);
    }

    // Move to next step
    progress.currentStep = Math.min(stepNumber + 1, 6);

    return await this.onboardingRepo.save(progress);
  }

  /**
   * Get wizard data (all steps combined)
   */
  async getWizardData(tenantId: string): Promise<OnboardingStepData> {
    const progress = await this.getProgress(tenantId);
    return progress.stepData;
  }

  /**
   * Initialize default data for new tenant
   */
  async initializeDefaultData(tenantId: string): Promise<void> {
    // This can be called to set up default configurations
    // For now, we'll create this during onboarding completion
  }

  /**
   * Helper: Create default leave policies
   */
  private async createDefaultLeavePolicies(queryRunner: any, tenantId: string): Promise<void> {
    const defaultPolicies = [
      { policyName: 'Sick Leave', leaveType: LeaveType.SICK, totalLeaves: 12 },
      { policyName: 'Casual Leave', leaveType: LeaveType.CASUAL, totalLeaves: 12 },
      { policyName: 'Earned Leave', leaveType: LeaveType.EARNED, totalLeaves: 21 },
    ];

    for (const policy of defaultPolicies) {
      const leavePolicy = queryRunner.manager.create(LeavePolicy, {
        tenantId,
        policyName: policy.policyName,
        leaveType: policy.leaveType,
        totalLeaves: policy.totalLeaves,
        maxConsecutiveDays: 10,
        carryForward: true,
        maxCarryForward: 5,
        encashable: false,
        minNoticeDays: 1,
        requiresApproval: true,
        probationPeriod: 0,
        isActive: true,
        description: `Default ${policy.policyName} policy`,
      });
      await queryRunner.manager.save(leavePolicy);
    }
  }
}

export default new OnboardingWizardService();
