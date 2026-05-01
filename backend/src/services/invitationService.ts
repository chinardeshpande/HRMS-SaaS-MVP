import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { UserInvitation, InvitationStatus } from '../models/UserInvitation';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { Employee } from '../models/Employee';
import { EmploymentStatus, UserRole } from '../../../shared/types';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { emailService } from './emailService';

export class InvitationService {
  private invitationRepo: Repository<UserInvitation>;
  private userRepo: Repository<User>;
  private tenantRepo: Repository<Tenant>;
  private employeeRepo: Repository<Employee>;

  constructor() {
    this.invitationRepo = AppDataSource.getRepository(UserInvitation);
    this.userRepo = AppDataSource.getRepository(User);
    this.tenantRepo = AppDataSource.getRepository(Tenant);
    this.employeeRepo = AppDataSource.getRepository(Employee);
  }

  /**
   * Send invitation to a user
   */
  async sendInvitation(data: {
    tenantId: string;
    email: string;
    fullName: string;
    role: UserRole;
    departmentId?: string;
    invitedBy: string;
  }): Promise<{ invitationId: string; message: string }> {
    const normalizedEmail = data.email.toLowerCase();

    // Login is email-only, so prevent duplicate identities across tenants.
    const existingGlobalUser = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (existingGlobalUser) {
      throw new Error('User with this email already exists');
    }

    // Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: {
        tenantId: data.tenantId,
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new Error('User with this email already exists in your organization');
    }

    const existingGlobalInvitation = await this.invitationRepo.findOne({
      where: {
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingGlobalInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationRepo.findOne({
      where: {
        tenantId: data.tenantId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // 7 days validity

    // Create invitation
    const invitation = this.invitationRepo.create({
      tenantId: data.tenantId,
      email: normalizedEmail,
      fullName: data.fullName,
      role: data.role,
      departmentId: data.departmentId,
      invitedBy: data.invitedBy,
      invitationToken: token,
      tokenExpiry,
      status: InvitationStatus.PENDING,
    });

    await this.invitationRepo.save(invitation);

    // Get tenant and inviter information for the email
    const tenant = await this.tenantRepo.findOne({ where: { tenantId: data.tenantId } });
    const inviter = await this.userRepo.findOne({ where: { userId: data.invitedBy } });

    const companyName = tenant?.companyName || 'Our Company';
    const inviterName = inviter?.fullName || 'Your colleague';

    // Send invitation email
    try {
      await emailService.sendInvitationEmail({
        to: data.email,
        fullName: data.fullName,
        inviterName,
        companyName,
        token,
        role: this.getRoleDisplayName(data.role),
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the invitation if email fails - the user can resend
    }

    return {
      invitationId: invitation.invitationId,
      message: 'Invitation sent successfully',
    };
  }

  /**
   * Accept invitation and create user account
   */
  async acceptInvitation(
    token: string,
    password: string
  ): Promise<{
    userId: string;
    token: string;
    refreshToken: string;
  }> {
    const invitation = await this.invitationRepo.findOne({
      where: { invitationToken: token },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('This invitation is no longer valid');
    }

    if (new Date() > invitation.tokenExpiry) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      throw new Error('Invitation has expired');
    }

    // Check if user already exists (race condition check)
    const existingUser = await this.userRepo.findOne({
      where: { email: invitation.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User account already exists');
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const employee = await this.findOrCreateEmployeeForInvitation(
        invitation,
        queryRunner.manager
      );

      const user = queryRunner.manager.create(User, {
        tenantId: invitation.tenantId,
        email: invitation.email,
        passwordHash: hashedPassword,
        fullName: invitation.fullName,
        role: invitation.role,
        employeeId: employee.employeeId,
        isActive: true,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Update invitation status
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await queryRunner.manager.save(invitation);

      await queryRunner.commitTransaction();

      // Generate JWT tokens
      const jwt = require('jsonwebtoken');
      const { config } = require('../config/config');

      const jwtToken = jwt.sign(
        {
          userId: savedUser.userId,
          tenantId: savedUser.tenantId,
          email: savedUser.email,
          role: savedUser.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiry }
      );

      const refreshToken = jwt.sign(
        {
          userId: savedUser.userId,
          tenantId: savedUser.tenantId,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiry }
      );

      return {
        userId: savedUser.userId,
        token: jwtToken,
        refreshToken,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async findOrCreateEmployeeForInvitation(
    invitation: UserInvitation,
    manager: EntityManager
  ): Promise<Employee> {
    const employeeRepo = manager.getRepository(Employee);
    const normalizedEmail = invitation.email.toLowerCase();
    const existingEmployee = await employeeRepo.findOne({
      where: {
        tenantId: invitation.tenantId,
        email: normalizedEmail,
      },
    });

    if (existingEmployee) {
      return existingEmployee;
    }

    const employeeCode = await this.generateEmployeeCode(invitation.tenantId, manager);
    const { firstName, lastName } = this.splitFullName(invitation.fullName);

    const employee = employeeRepo.create({
      tenantId: invitation.tenantId,
      employeeCode,
      firstName,
      lastName,
      email: normalizedEmail,
      departmentId: invitation.departmentId,
      dateOfJoining: new Date(),
      employmentType: 'full-time',
      status: EmploymentStatus.ACTIVE,
    });

    return await employeeRepo.save(employee);
  }

  private async generateEmployeeCode(tenantId: string, manager?: EntityManager): Promise<string> {
    const employeeRepo = manager?.getRepository(Employee) || this.employeeRepo;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const count = await employeeRepo.count({ where: { tenantId } });
      const candidate = `EMP${String(count + attempt + 1).padStart(4, '0')}`;
      const existing = await employeeRepo.findOne({
        where: { tenantId, employeeCode: candidate },
      });

      if (!existing) {
        return candidate;
      }
    }

    return `EMP-${Date.now()}`;
  }

  private splitFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || 'Invited';
    const lastName = parts.length > 0 ? parts.join(' ') : 'User';

    return { firstName, lastName };
  }

  /**
   * Get all invitations for a tenant
   */
  async getInvitations(tenantId: string): Promise<UserInvitation[]> {
    return await this.invitationRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string, tenantId: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepo.findOne({
      where: { invitationId, tenantId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Cannot cancel this invitation');
    }

    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepo.save(invitation);

    return { message: 'Invitation cancelled successfully' };
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string, tenantId: string): Promise<{ message: string }> {
    const invitation = await this.invitationRepo.findOne({
      where: { invitationId, tenantId },
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING && invitation.status !== InvitationStatus.EXPIRED) {
      throw new Error('Cannot resend this invitation');
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);

    invitation.invitationToken = token;
    invitation.tokenExpiry = tokenExpiry;
    invitation.status = InvitationStatus.PENDING;

    await this.invitationRepo.save(invitation);

    // Get tenant and inviter information for the email
    const tenant = await this.tenantRepo.findOne({ where: { tenantId: invitation.tenantId } });
    const inviter = await this.userRepo.findOne({ where: { userId: invitation.invitedBy } });

    const companyName = tenant?.companyName || 'Our Company';
    const inviterName = inviter?.fullName || 'Your colleague';

    // Send invitation email
    try {
      await emailService.sendInvitationEmail({
        to: invitation.email,
        fullName: invitation.fullName,
        inviterName,
        companyName,
        token,
        role: this.getRoleDisplayName(invitation.role),
      });
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError);
    }

    return { message: 'Invitation resent successfully' };
  }

  /**
   * Get user-friendly role display name
   */
  private getRoleDisplayName(role: UserRole): string {
    const roleMap: Record<UserRole, string> = {
      [UserRole.SYSTEM_ADMIN]: 'System Administrator',
      [UserRole.HR_ADMIN]: 'HR Administrator',
      [UserRole.MANAGER]: 'Manager',
      [UserRole.EMPLOYEE]: 'Employee',
    };
    return roleMap[role] || role;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<UserInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { invitationToken: token },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    return invitation;
  }

  /**
   * Bulk invite users
   */
  async bulkInvite(
    tenantId: string,
    invitedBy: string,
    users: Array<{
      email: string;
      fullName: string;
      role: UserRole;
      departmentId?: string;
    }>
  ): Promise<{ successCount: number; failedCount: number; errors: any[] }> {
    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const userData of users) {
      try {
        await this.sendInvitation({
          tenantId,
          ...userData,
          invitedBy,
        });
        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push({
          email: userData.email,
          error: error.message,
        });
      }
    }

    return {
      successCount,
      failedCount,
      errors,
    };
  }
}

export default new InvitationService();
