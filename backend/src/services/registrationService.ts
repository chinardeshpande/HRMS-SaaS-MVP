import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CompanyRegistration, RegistrationStatus, PlanType } from '../models/CompanyRegistration';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Subscription, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '../models/Subscription';
import { OnboardingProgress } from '../models/OnboardingProgress';
import { UserRole } from '../../../shared/types';
import { config } from '../config/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

export class RegistrationService {
  private registrationRepo: Repository<CompanyRegistration>;
  private tenantRepo: Repository<Tenant>;
  private userRepo: Repository<User>;
  private subscriptionRepo: Repository<Subscription>;
  private onboardingRepo: Repository<OnboardingProgress>;

  constructor() {
    this.registrationRepo = AppDataSource.getRepository(CompanyRegistration);
    this.tenantRepo = AppDataSource.getRepository(Tenant);
    this.userRepo = AppDataSource.getRepository(User);
    this.subscriptionRepo = AppDataSource.getRepository(Subscription);
    this.onboardingRepo = AppDataSource.getRepository(OnboardingProgress);
  }

  /**
   * Initiate company signup - Step 1
   */
  async initiateSignup(data: {
    companyName: string;
    adminEmail: string;
    adminFullName: string;
    phone?: string;
    industry?: string;
    companySize?: string;
    selectedPlan?: PlanType;
    utmSource?: string;
    utmCampaign?: string;
  }): Promise<{ registrationId: string; message: string }> {
    // Check if email already exists
    const existingRegistration = await this.registrationRepo.findOne({
      where: { adminEmail: data.adminEmail.toLowerCase() },
    });

    if (existingRegistration && existingRegistration.status === RegistrationStatus.COMPLETED) {
      throw new Error('This email is already registered');
    }

    // Check if email exists in users table
    const existingUser = await this.userRepo.findOne({
      where: { email: data.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('This email is already registered');
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours validity

    // Create or update registration
    let registration: CompanyRegistration;

    if (existingRegistration) {
      // Update existing pending registration
      registration = existingRegistration;
      registration.companyName = data.companyName;
      registration.adminFullName = data.adminFullName;
      registration.phone = data.phone;
      registration.industry = data.industry;
      registration.companySize = data.companySize;
      registration.selectedPlan = data.selectedPlan || PlanType.FREE;
      registration.registrationToken = token;
      registration.tokenExpiry = tokenExpiry;
      registration.utmSource = data.utmSource;
      registration.utmCampaign = data.utmCampaign;
    } else {
      // Create new registration
      registration = this.registrationRepo.create({
        companyName: data.companyName,
        adminEmail: data.adminEmail.toLowerCase(),
        adminFullName: data.adminFullName,
        phone: data.phone,
        industry: data.industry,
        companySize: data.companySize,
        selectedPlan: data.selectedPlan || PlanType.FREE,
        registrationToken: token,
        tokenExpiry,
        utmSource: data.utmSource,
        utmCampaign: data.utmCampaign,
      });
    }

    await this.registrationRepo.save(registration);

    // TODO: Send verification email
    // await this.emailService.sendVerificationEmail(data.adminEmail, token);

    // In development, return the verification link for easy testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const verificationUrl = isDevelopment
      ? `${process.env.FRONTEND_URL}/verify-email/${token}`
      : undefined;

    return {
      registrationId: registration.registrationId,
      message: 'Verification email sent. Please check your inbox.',
      ...(isDevelopment && {
        verificationToken: token,
        verificationUrl,
        devNote: 'Email not configured. Use the link below to verify.'
      }),
    };
  }

  /**
   * Verify email token - Step 2
   */
  async verifyEmail(token: string): Promise<{ registrationId: string; email: string; companyName: string }> {
    const registration = await this.registrationRepo.findOne({
      where: { registrationToken: token },
    });

    if (!registration) {
      throw new Error('Invalid verification token');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new Error('This registration has already been completed');
    }

    if (new Date() > registration.tokenExpiry) {
      registration.status = RegistrationStatus.EXPIRED;
      await this.registrationRepo.save(registration);
      throw new Error('Verification token has expired');
    }

    // Mark email as verified
    registration.isEmailVerified = true;
    registration.status = RegistrationStatus.VERIFIED;
    await this.registrationRepo.save(registration);

    return {
      registrationId: registration.registrationId,
      email: registration.adminEmail,
      companyName: registration.companyName,
    };
  }

  /**
   * Complete registration - Create tenant, admin user, subscription - Step 3
   */
  async completeRegistration(
    registrationId: string,
    password: string
  ): Promise<{
    tenantId: string;
    userId: string;
    token: string;
    refreshToken: string;
  }> {
    const registration = await this.registrationRepo.findOne({
      where: { registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new Error('Registration already completed');
    }

    if (registration.status !== RegistrationStatus.VERIFIED) {
      throw new Error('Email verification required');
    }

    // Start transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Tenant
      const tenant = queryRunner.manager.create(Tenant, {
        companyName: registration.companyName,
        planType: registration.selectedPlan || 'free',
        status: 'active',
        isTrialActive: true,
        trialStartDate: new Date(),
        trialEndDate: this.calculateTrialEndDate(14), // 14 days trial
        onboardingCompleted: false,
        setupWizardCompleted: false,
        employeeCount: 0,
      });

      const savedTenant = await queryRunner.manager.save(tenant);

      // 2. Create Admin User
      // Note: @BeforeInsert hooks don't fire with QueryRunner, so we hash manually
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const adminUser = queryRunner.manager.create(User, {
        tenantId: savedTenant.tenantId,
        email: registration.adminEmail,
        passwordHash: passwordHash, // Set passwordHash directly
        fullName: registration.adminFullName,
        role: UserRole.SYSTEM_ADMIN,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(adminUser);

      // 3. Create Subscription
      const subscription = queryRunner.manager.create(Subscription, {
        tenantId: savedTenant.tenantId,
        plan: this.mapPlanType(registration.selectedPlan),
        status: SubscriptionStatus.TRIAL,
        startDate: new Date(),
        trialEndDate: this.calculateTrialEndDate(14),
        billingCycle: BillingCycle.MONTHLY,
      });

      await queryRunner.manager.save(subscription);

      // 4. Create Onboarding Progress
      const onboardingProgress = queryRunner.manager.create(OnboardingProgress, {
        tenantId: savedTenant.tenantId,
        currentStep: 1,
        completedSteps: [],
        stepData: {},
        isComplete: false,
      });

      await queryRunner.manager.save(onboardingProgress);

      // 5. Update Registration Status
      registration.status = RegistrationStatus.COMPLETED;
      registration.tenantId = savedTenant.tenantId;
      registration.completedAt = new Date();
      await queryRunner.manager.save(registration);

      await queryRunner.commitTransaction();

      // Generate JWT tokens
      const tokenPayload = {
        userId: savedUser.userId,
        tenantId: savedTenant.tenantId,
        email: savedUser.email,
        role: savedUser.role,
      };

      const token = jwt.sign(
        tokenPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.expiry } as SignOptions
      );

      const refreshTokenPayload = {
        userId: savedUser.userId,
        tenantId: savedTenant.tenantId,
      };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiry } as SignOptions
      );

      return {
        tenantId: savedTenant.tenantId,
        userId: savedUser.userId,
        token,
        refreshToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const registration = await this.registrationRepo.findOne({
      where: { adminEmail: email.toLowerCase() },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new Error('Registration already completed');
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);

    registration.registrationToken = token;
    registration.tokenExpiry = tokenExpiry;
    registration.status = RegistrationStatus.PENDING;

    await this.registrationRepo.save(registration);

    // TODO: Send verification email
    // await this.emailService.sendVerificationEmail(email, token);

    return {
      message: 'Verification email sent',
    };
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const registration = await this.registrationRepo.findOne({
      where: { adminEmail: email.toLowerCase() },
    });

    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });

    const isAvailable = !registration && !user;

    return { available: isAvailable };
  }

  /**
   * Get registration by ID
   */
  async getRegistration(registrationId: string): Promise<CompanyRegistration> {
    const registration = await this.registrationRepo.findOne({
      where: { registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    return registration;
  }

  /**
   * Helper: Calculate trial end date
   */
  private calculateTrialEndDate(days: number): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate;
  }

  /**
   * Helper: Map PlanType to SubscriptionPlan
   */
  private mapPlanType(planType?: PlanType): SubscriptionPlan {
    if (!planType) return SubscriptionPlan.FREE;

    switch (planType) {
      case PlanType.FREE:
        return SubscriptionPlan.FREE;
      case PlanType.STARTER:
        return SubscriptionPlan.STARTER;
      case PlanType.PROFESSIONAL:
        return SubscriptionPlan.PROFESSIONAL;
      case PlanType.ENTERPRISE:
        return SubscriptionPlan.ENTERPRISE;
      default:
        return SubscriptionPlan.FREE;
    }
  }
}

export default new RegistrationService();
