import { Repository, QueryRunner } from 'typeorm';
import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { DocumentType } from '../models/enums/DocumentEnums';
import { Role } from '../models/Role';
import logger from '../utils/logger';

/**
 * Service to initialize a new tenant with default data:
 * - Document templates
 * - Leave policies
 * - Attendance policies
 */
export class TenantInitializationService {
  /**
   * Initialize a new tenant with all required default data
   */
  async initializeTenant(tenantId: string, queryRunner?: QueryRunner): Promise<void> {
    try {
      logger.info(`🚀 Initializing tenant ${tenantId}...`);

      const useQueryRunner = queryRunner || AppDataSource.createQueryRunner();
      const shouldManageTransaction = !queryRunner;

      if (shouldManageTransaction) {
        await useQueryRunner.connect();
        await useQueryRunner.startTransaction();
      }

      try {
        // Initialize all tenant data
        await this.seedDocumentTemplates(tenantId, useQueryRunner);
        await this.seedLeavePolicies(tenantId, useQueryRunner);
        await this.seedAttendancePolicy(tenantId, useQueryRunner);
        await this.seedRoles(tenantId, useQueryRunner);

        if (shouldManageTransaction) {
          await useQueryRunner.commitTransaction();
        }

        logger.info(`✅ Tenant ${tenantId} initialized successfully`);
      } catch (error) {
        if (shouldManageTransaction) {
          await useQueryRunner.rollbackTransaction();
        }
        throw error;
      } finally {
        if (shouldManageTransaction) {
          await useQueryRunner.release();
        }
      }
    } catch (error: any) {
      logger.error(`Error initializing tenant ${tenantId}:`, error);
      throw new Error(`Tenant initialization failed: ${error.message}`);
    }
  }

  /**
   * Seed default roles for tenant admin/user management
   */
  private async seedRoles(tenantId: string, queryRunner: QueryRunner): Promise<void> {
    logger.info(`  🔐 Seeding roles...`);

    const roleRepo = queryRunner.manager.getRepository(Role);
    const existingCount = await roleRepo.count({ where: { tenantId } });

    if (existingCount > 0) {
      logger.info(`  ⏭️  Roles already exist - skipping`);
      return;
    }

    const roles = [
      {
        tenantId,
        roleName: 'System Admin',
        description: 'Full tenant administration access',
        isSystemRole: true,
        isActive: true,
        level: 100,
        employeeCount: 0,
        dataAccessRules: { allData: true },
      },
      {
        tenantId,
        roleName: 'HR Admin',
        description: 'HR operations and employee administration access',
        isSystemRole: true,
        isActive: true,
        level: 80,
        employeeCount: 0,
        dataAccessRules: { allData: true },
      },
      {
        tenantId,
        roleName: 'Manager',
        description: 'Team management access',
        isSystemRole: true,
        isActive: true,
        level: 50,
        employeeCount: 0,
        dataAccessRules: { teamDataOnly: true },
      },
      {
        tenantId,
        roleName: 'Employee',
        description: 'Standard employee self-service access',
        isSystemRole: true,
        isActive: true,
        level: 10,
        employeeCount: 0,
        dataAccessRules: { ownDataOnly: true },
      },
    ];

    for (const role of roles) {
      const newRole = queryRunner.manager.create(Role, role);
      await queryRunner.manager.save(newRole);
    }

    logger.info(`  ✅ Created ${roles.length} roles`);
  }

  /**
   * Seed document templates for tenant
   */
  private async seedDocumentTemplates(tenantId: string, queryRunner: QueryRunner): Promise<void> {
    logger.info(`  📄 Seeding document templates...`);

    const templates = this.getDefaultTemplates(tenantId);

    for (const template of templates) {
      const newTemplate = queryRunner.manager.create(DocumentTemplate, template);
      await queryRunner.manager.save(newTemplate);
    }

    logger.info(`  ✅ Created ${templates.length} document templates`);
  }

  /**
   * Seed leave policies for tenant
   */
  private async seedLeavePolicies(tenantId: string, queryRunner: QueryRunner): Promise<void> {
    logger.info(`  🏖️  Seeding leave policies...`);

    const policies = [
      {
        tenantId,
        policyName: 'Casual Leave',
        leaveType: LeaveType.CASUAL,
        totalLeaves: 12,
        maxConsecutiveDays: 3,
        carryForward: false,
        maxCarryForward: 0,
        isActive: true,
        description: 'Casual leave for personal matters',
        requiresApproval: true,
        minNoticeDays: 1,
        encashable: false,
        probationPeriod: 0,
      },
      {
        tenantId,
        policyName: 'Sick Leave',
        leaveType: LeaveType.SICK,
        totalLeaves: 12,
        maxConsecutiveDays: 7,
        carryForward: true,
        maxCarryForward: 6,
        isActive: true,
        description: 'Medical leave for illness',
        requiresApproval: true,
        minNoticeDays: 0,
        encashable: false,
        probationPeriod: 0,
      },
      {
        tenantId,
        policyName: 'Earned Leave',
        leaveType: LeaveType.EARNED,
        totalLeaves: 15,
        maxConsecutiveDays: 15,
        carryForward: true,
        maxCarryForward: 15,
        isActive: true,
        description: 'Earned leave (privilege leave)',
        requiresApproval: true,
        minNoticeDays: 7,
        encashable: true,
        probationPeriod: 3,
      },
      {
        tenantId,
        policyName: 'Maternity Leave',
        leaveType: LeaveType.MATERNITY,
        totalLeaves: 180,
        maxConsecutiveDays: 180,
        carryForward: false,
        maxCarryForward: 0,
        isActive: true,
        description: 'Maternity leave for female employees',
        requiresApproval: true,
        minNoticeDays: 30,
        encashable: false,
        probationPeriod: 0,
        applicableGender: 'female',
      },
      {
        tenantId,
        policyName: 'Paternity Leave',
        leaveType: LeaveType.PATERNITY,
        totalLeaves: 15,
        maxConsecutiveDays: 15,
        carryForward: false,
        maxCarryForward: 0,
        isActive: true,
        description: 'Paternity leave for male employees',
        requiresApproval: true,
        minNoticeDays: 7,
        encashable: false,
        probationPeriod: 0,
        applicableGender: 'male',
      },
    ];

    for (const policy of policies) {
      const newPolicy = queryRunner.manager.create(LeavePolicy, policy);
      await queryRunner.manager.save(newPolicy);
    }

    logger.info(`  ✅ Created ${policies.length} leave policies`);
  }

  /**
   * Seed attendance policy for tenant
   */
  private async seedAttendancePolicy(tenantId: string, queryRunner: QueryRunner): Promise<void> {
    logger.info(`  ⏰ Seeding attendance policy...`);

    const policy = queryRunner.manager.create(AttendancePolicy, {
      tenantId,
      policyName: 'Default Attendance Policy',
      standardCheckIn: '09:00:00',
      standardCheckOut: '18:00:00',
      requiredWorkMinutes: 480, // 8 hours
      lateGraceMinutes: 15,
      earlyGraceMinutes: 15,
      breakMinutes: 60,
      trackBreaks: false,
      allowOvertime: false,
      maxOvertimeMinutes: 120,
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      allowHalfDay: true,
      halfDayMinutes: 240, // 4 hours
      hasShifts: false,
      isActive: true,
      description: 'Standard 9 AM to 6 PM work schedule, Monday to Friday',
    });

    await queryRunner.manager.save(policy);

    logger.info(`  ✅ Created attendance policy`);
  }

  /**
   * Get default document templates
   */
  private getDefaultTemplates(tenantId: string): Partial<DocumentTemplate>[] {
    return [
      {
        tenantId,
        templateName: DocumentType.OFFER_LETTER,
        displayName: 'Offer Letter',
        category: 'offer',
        htmlTemplate: this.getOfferLetterTemplate(),
        availableFields: ['companyName', 'offerDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'employmentType', 'workLocation', 'currency', 'offeredSalary', 'expectedJoinDate', 'offerExpiryDate'],
        isActive: true,
        version: 1,
        description: 'Standard offer letter template for new candidates'
      },
      {
        tenantId,
        templateName: DocumentType.APPOINTMENT_LETTER,
        displayName: 'Appointment Letter',
        category: 'appointment',
        htmlTemplate: this.getAppointmentLetterTemplate(),
        availableFields: ['companyName', 'appointmentDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'reportingManager', 'joinDate', 'employeeCode', 'currency', 'offeredSalary'],
        isActive: true,
        version: 1,
        description: 'Appointment letter issued upon joining'
      },
      {
        tenantId,
        templateName: DocumentType.CONFIRMATION_LETTER,
        displayName: 'Confirmation Letter',
        category: 'confirmation',
        htmlTemplate: this.getConfirmationLetterTemplate(),
        availableFields: ['companyName', 'confirmationDate', 'firstName', 'lastName', 'employeeCode', 'positionOffered', 'departmentName', 'joinDate', 'confirmationDate'],
        isActive: true,
        version: 1,
        description: 'Confirmation letter after probation completion'
      },
      {
        tenantId,
        templateName: DocumentType.PROBATION_EXTENSION_LETTER,
        displayName: 'Probation Extension',
        category: 'probation',
        htmlTemplate: this.getProbationExtensionTemplate(),
        availableFields: ['companyName', 'extensionDate', 'firstName', 'lastName', 'employeeCode', 'positionOffered', 'originalEndDate', 'newEndDate', 'extensionReason'],
        isActive: true,
        version: 1,
        description: 'Letter for probation period extension'
      },
      {
        tenantId,
        templateName: DocumentType.PROMOTION_LETTER,
        displayName: 'Promotion Letter',
        category: 'promotion',
        htmlTemplate: this.getPromotionLetterTemplate(),
        availableFields: ['companyName', 'promotionDate', 'firstName', 'lastName', 'employeeCode', 'currentPosition', 'newPosition', 'currentSalary', 'newSalary', 'effectiveDate'],
        isActive: true,
        version: 1,
        description: 'Letter for employee promotion'
      },
      {
        tenantId,
        templateName: DocumentType.TRANSFER_LETTER,
        displayName: 'Transfer Letter',
        category: 'transfer',
        htmlTemplate: this.getTransferLetterTemplate(),
        availableFields: ['companyName', 'transferDate', 'firstName', 'lastName', 'employeeCode', 'currentDepartment', 'newDepartment', 'currentLocation', 'newLocation', 'effectiveDate'],
        isActive: true,
        version: 1,
        description: 'Letter for employee transfer'
      },
      {
        tenantId,
        templateName: DocumentType.RELIEVING_LETTER,
        displayName: 'Relieving Letter',
        category: 'exit',
        htmlTemplate: this.getRelievingLetterTemplate(),
        availableFields: ['companyName', 'relievingDate', 'firstName', 'lastName', 'employeeCode', 'positionOffered', 'joinDate', 'lastWorkingDay'],
        isActive: true,
        version: 1,
        description: 'Relieving letter for exiting employees'
      },
      {
        tenantId,
        templateName: DocumentType.EXPERIENCE_LETTER,
        displayName: 'Experience Certificate',
        category: 'exit',
        htmlTemplate: this.getExperienceCertificateTemplate(),
        availableFields: ['companyName', 'certificateDate', 'firstName', 'lastName', 'employeeCode', 'positionOffered', 'departmentName', 'joinDate', 'lastWorkingDay', 'yearsOfService'],
        isActive: true,
        version: 1,
        description: 'Experience certificate for former employees'
      },
    ];
  }

  // Template HTML Methods
  private getOfferLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 8px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Offer of Employment</p>
  </div>
  <div class="content">
    <p>Date: {{offerDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>We are pleased to offer you the position of <strong>{{positionOffered}}</strong> in the {{departmentName}} department at {{companyName}}.</p>
    <h3>Position Details:</h3>
    <table>
      <tr><td><strong>Position:</strong></td><td>{{positionOffered}}</td></tr>
      <tr><td><strong>Department:</strong></td><td>{{departmentName}}</td></tr>
      <tr><td><strong>Employment Type:</strong></td><td>{{employmentType}}</td></tr>
      <tr><td><strong>Work Location:</strong></td><td>{{workLocation}}</td></tr>
      <tr><td><strong>Annual Salary:</strong></td><td>{{currency}} {{offeredSalary}}</td></tr>
      <tr><td><strong>Expected Join Date:</strong></td><td>{{expectedJoinDate}}</td></tr>
    </table>
    <p>Please sign and return this offer letter by <strong>{{offerExpiryDate}}</strong> to confirm your acceptance.</p>
    <p>We look forward to welcoming you to our team!</p>
    <div class="signature" style="margin-top: 50px;">
      <p>Sincerely,<br><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getAppointmentLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 8px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Letter of Appointment</p>
  </div>
  <div class="content">
    <p>Date: {{appointmentDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>We are pleased to appoint you as <strong>{{positionOffered}}</strong> in the {{departmentName}} department, effective {{joinDate}}.</p>
    <h3>Terms of Employment:</h3>
    <table>
      <tr><td><strong>Employee Code:</strong></td><td>{{employeeCode}}</td></tr>
      <tr><td><strong>Position:</strong></td><td>{{positionOffered}}</td></tr>
      <tr><td><strong>Department:</strong></td><td>{{departmentName}}</td></tr>
      <tr><td><strong>Reporting Manager:</strong></td><td>{{reportingManager}}</td></tr>
      <tr><td><strong>Date of Joining:</strong></td><td>{{joinDate}}</td></tr>
      <tr><td><strong>Annual CTC:</strong></td><td>{{currency}} {{offeredSalary}}</td></tr>
    </table>
    <p>Welcome to {{companyName}}!</p>
  </div>
</body>
</html>`;
  }

  private getConfirmationLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #16a085; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Confirmation of Employment</p>
  </div>
  <div class="content">
    <p>Date: {{confirmationDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>We are pleased to inform you that your employment with {{companyName}} is now confirmed as <strong>{{positionOffered}}</strong> effective {{confirmationDate}}.</p>
    <p>Congratulations on successfully completing your probation period!</p>
    <p>Sincerely,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }

  private getProbationExtensionTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Probation Extension Letter</p>
  </div>
  <div class="content">
    <p>Date: {{extensionDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>This is to inform you that your probation period, which was scheduled to end on {{originalEndDate}}, has been extended to {{newEndDate}}.</p>
    <p>Reason: {{extensionReason}}</p>
    <p>Sincerely,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }

  private getPromotionLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #9b59b6; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Promotion Letter</p>
  </div>
  <div class="content">
    <p>Date: {{promotionDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>Congratulations! We are pleased to promote you from <strong>{{currentPosition}}</strong> to <strong>{{newPosition}}</strong>, effective {{effectiveDate}}.</p>
    <p>Your new salary will be {{newSalary}}.</p>
    <p>Best regards,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }

  private getTransferLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Transfer Letter</p>
  </div>
  <div class="content">
    <p>Date: {{transferDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>
    <p>This is to inform you that you are being transferred from {{currentDepartment}} to {{newDepartment}}, effective {{effectiveDate}}.</p>
    <p>Your new location will be {{newLocation}}.</p>
    <p>Best regards,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }

  private getRelievingLetterTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Relieving Letter</p>
  </div>
  <div class="content">
    <p>Date: {{relievingDate}}</p>
    <p>To Whom It May Concern,</p>
    <p>This is to certify that {{firstName}} {{lastName}} (Employee Code: {{employeeCode}}) was employed with {{companyName}} as {{positionOffered}} from {{joinDate}} to {{lastWorkingDay}}.</p>
    <p>We wish them all the best in their future endeavors.</p>
    <p>Sincerely,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }

  private getExperienceCertificateTemplate(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #2ecc71; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Experience Certificate</p>
  </div>
  <div class="content">
    <p>Date: {{certificateDate}}</p>
    <p>To Whom It May Concern,</p>
    <p>This is to certify that {{firstName}} {{lastName}} (Employee Code: {{employeeCode}}) worked with {{companyName}} as {{positionOffered}} in the {{departmentName}} department from {{joinDate}} to {{lastWorkingDay}}.</p>
    <p>Total experience: {{yearsOfService}}</p>
    <p>We wish them success in all future endeavors.</p>
    <p>Sincerely,<br><strong>HR Department</strong><br>{{companyName}}</p>
  </div>
</body>
</html>`;
  }
}

export default new TenantInitializationService();
