import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';

export type IdentityMappingStatus =
  | 'linked'
  | 'auto_linked'
  | 'unmapped'
  | 'invalid_existing_link'
  | 'employee_already_linked';

export interface IdentityMappingResult {
  status: IdentityMappingStatus;
  userId: string;
  userEmail: string;
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  reason: string;
}

class IdentityMappingService {
  private userRepo = AppDataSource.getRepository(User);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async resolveUser(user: User, persistExactMatch = true): Promise<IdentityMappingResult> {
    if (user.employeeId) {
      const employee = await this.employeeRepo.findOne({
        where: { tenantId: user.tenantId, employeeId: user.employeeId },
      });

      if (employee) {
        return this.toResult('linked', user, employee, 'Existing tenant-local employee link is valid.');
      }

      return {
        status: 'invalid_existing_link',
        userId: user.userId,
        userEmail: user.email,
        employeeId: user.employeeId,
        reason: 'The existing employee link does not resolve inside this tenant.',
      };
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    const exactMatches = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('LOWER(TRIM(employee.email)) = :email', { email: normalizedEmail })
      .getMany();

    if (exactMatches.length !== 1) {
      return {
        status: 'unmapped',
        userId: user.userId,
        userEmail: user.email,
        reason:
          exactMatches.length > 1
            ? 'Multiple tenant-local employees share this email; automatic mapping is unsafe.'
            : 'No tenant-local employee has the same normalized email.',
      };
    }

    const employee = exactMatches[0];
    const alreadyLinked = await this.userRepo.findOne({
      where: { tenantId: user.tenantId, employeeId: employee.employeeId },
    });

    if (alreadyLinked && alreadyLinked.userId !== user.userId) {
      return this.toResult(
        'employee_already_linked',
        user,
        employee,
        `Employee is already linked to ${alreadyLinked.email}.`
      );
    }

    if (!persistExactMatch) {
      return this.toResult(
        'unmapped',
        user,
        employee,
        'A unique exact email match is available for automatic repair.'
      );
    }

    user.employeeId = employee.employeeId;
    await this.userRepo.save(user);
    return this.toResult(
      'auto_linked',
      user,
      employee,
      'Linked automatically from a unique exact normalized email match inside the tenant.'
    );
  }

  async auditTenant(tenantId: string): Promise<IdentityMappingResult[]> {
    const users = await this.userRepo.find({
      where: { tenantId },
      order: { email: 'ASC' },
    });

    return Promise.all(users.map((user) => this.resolveUser(user, false)));
  }

  async assignExplicitMapping(
    tenantId: string,
    userId: string,
    employeeId: string
  ): Promise<IdentityMappingResult> {
    const [user, employee, existingOwner] = await Promise.all([
      this.userRepo.findOne({ where: { tenantId, userId } }),
      this.employeeRepo.findOne({ where: { tenantId, employeeId } }),
      this.userRepo.findOne({ where: { tenantId, employeeId } }),
    ]);

    if (!user) throw new Error('User not found in this tenant.');
    if (!employee) throw new Error('Employee not found in this tenant.');
    if (existingOwner && existingOwner.userId !== user.userId) {
      throw new Error(`Employee is already linked to ${existingOwner.email}.`);
    }

    user.employeeId = employee.employeeId;
    await this.userRepo.save(user);
    return this.toResult(
      'linked',
      user,
      employee,
      'Explicitly linked by an authorized tenant administrator.'
    );
  }

  private toResult(
    status: IdentityMappingStatus,
    user: User,
    employee: Employee,
    reason: string
  ): IdentityMappingResult {
    return {
      status,
      userId: user.userId,
      userEmail: user.email,
      employeeId: employee.employeeId,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      reason,
    };
  }
}

export const identityMappingService = new IdentityMappingService();
export default identityMappingService;
