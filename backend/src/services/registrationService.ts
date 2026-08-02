import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CompanyRegistration, RegistrationStatus, PlanType } from '../models/CompanyRegistration';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Subscription, SubscriptionPlan, SubscriptionStatus, BillingCycle } from '../models/Subscription';
import { OnboardingProgress } from '../models/OnboardingProgress';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { UserRole } from '../../../shared/types';
import { config } from '../config/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { signRefreshToken } from './tokenService';
import tenantInitializationService from './tenantInitializationService';
import logger from '../utils/logger';

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
        nextBillingDate: this.calculateTrialEndDate(14),
        billingCycle: BillingCycle.MONTHLY,
        price: this.getPlanPrice(this.mapPlanType(registration.selectedPlan)),
        maxUsers: this.getMaxUsersByPlan(this.mapPlanType(registration.selectedPlan)),
        maxStorageGB: this.getMaxStorageByPlan(this.mapPlanType(registration.selectedPlan)),
        features: this.getFeaturesByPlan(this.mapPlanType(registration.selectedPlan)),
      });

      await queryRunner.manager.save(subscription);

      // 4. Create Organization Settings baseline
      const organizationSettings = queryRunner.manager.create(OrganizationSettings, {
        tenantId: savedTenant.tenantId,
        companyName: savedTenant.companyName,
        email: registration.adminEmail,
        phone: registration.phone,
        industry: registration.industry,
        timezone: 'Asia/Kolkata',
        defaultLanguage: 'en',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        fiscalYearStartMonth: 4,
        weekStartDay: 1,
        workingHours: this.getDefaultWorkingHours(),
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          slackIntegration: false,
          teamsIntegration: false,
        },
        smtpConfig: {
          enabled: false,
          host: '',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromEmail: '',
          fromName: '',
        },
        twoFactorAuthRequired: false,
        passwordExpiryDays: 90,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        ipWhitelistEnabled: false,
        branding: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#10b981',
          logoUrl: '',
          faviconUrl: '',
        },
        customFields: {},
      });

      await queryRunner.manager.save(organizationSettings);

      // 5. Create Onboarding Progress
      const onboardingProgress = queryRunner.manager.create(OnboardingProgress, {
        tenantId: savedTenant.tenantId,
        currentStep: 1,
        completedSteps: [],
        stepData: {},
        isComplete: false,
      });

      await queryRunner.manager.save(onboardingProgress);

      // 6. Initialize tenant with default data (templates, policies, roles)
      logger.info('Initializing tenant with default data...');
      await tenantInitializationService.initializeTenant(savedTenant.tenantId, queryRunner);

      // 7. Update Registration Status
      registration.status = RegistrationStatus.COMPLETED;
      registration.tenantId = savedTenant.tenantId;
      registration.completedAt = new Date();
      await queryRunner.manager.save(registration);

      await queryRunner.commitTransaction();
      logger.info('Registration completed successfully');

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

      const refreshToken = signRefreshToken(savedUser.userId, savedTenant.tenantId);

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

  private getPlanPrice(plan: SubscriptionPlan): number {
    const prices: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.STARTER]: 29,
      [SubscriptionPlan.PROFESSIONAL]: 79,
      [SubscriptionPlan.ENTERPRISE]: 0,
    };
    return prices[plan];
  }

  private getMaxUsersByPlan(plan: SubscriptionPlan): number {
    const limits: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 10,
      [SubscriptionPlan.STARTER]: 50,
      [SubscriptionPlan.PROFESSIONAL]: 200,
      [SubscriptionPlan.ENTERPRISE]: 999999,
    };
    return limits[plan];
  }

  private getMaxStorageByPlan(plan: SubscriptionPlan): number {
    const limits: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 5,
      [SubscriptionPlan.STARTER]: 50,
      [SubscriptionPlan.PROFESSIONAL]: 200,
      [SubscriptionPlan.ENTERPRISE]: 1000,
    };
    return limits[plan];
  }

  private getFeaturesByPlan(plan: SubscriptionPlan) {
    const features: Record<SubscriptionPlan, Record<string, boolean>> = {
      [SubscriptionPlan.FREE]: {
        advancedReporting: false,
        apiAccess: false,
        customBranding: false,
        ssoIntegration: false,
        prioritySupport: false,
        customWorkflows: false,
        aiInsights: false,
        multiCurrency: false,
      },
      [SubscriptionPlan.STARTER]: {
        advancedReporting: true,
        apiAccess: false,
        customBranding: false,
        ssoIntegration: false,
        prioritySupport: false,
        customWorkflows: false,
        aiInsights: false,
        multiCurrency: false,
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        advancedReporting: true,
        apiAccess: true,
        customBranding: true,
        ssoIntegration: false,
        prioritySupport: true,
        customWorkflows: true,
        aiInsights: true,
        multiCurrency: true,
      },
      [SubscriptionPlan.ENTERPRISE]: {
        advancedReporting: true,
        apiAccess: true,
        customBranding: true,
        ssoIntegration: true,
        prioritySupport: true,
        customWorkflows: true,
        aiInsights: true,
        multiCurrency: true,
      },
    };
    return features[plan];
  }

  private getDefaultWorkingHours() {
    const weekday = { enabled: true, start: '09:00', end: '18:00' };
    const weekend = { enabled: false, start: '09:00', end: '18:00' };

    return {
      monday: weekday,
      tuesday: weekday,
      wednesday: weekday,
      thursday: weekday,
      friday: weekday,
      saturday: weekend,
      sunday: weekend,
    };
  }
}

export default new RegistrationService();
