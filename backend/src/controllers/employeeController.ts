import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import { Like } from 'typeorm';
import bcrypt from 'bcrypt';
import { EmploymentStatus, UserRole } from '../../../shared/types';
import professionalHistoryService from '../services/professionalHistoryService';
import managerTeamService from '../services/managerTeamService';
import logger from '../utils/logger';
import subscriptionEnforcementService from '../services/subscriptionEnforcementService';

/**
 * Get all employees with optional filters
 * Query params: search, departmentId, designationId, status
 *
 * ROLE-BASED FILTERING:
 * - EMPLOYEE: Can only see their own data
 * - MANAGER: Can see their direct reports + themselves
 * - HR_ADMIN/SYSTEM_ADMIN: Can see all employees
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const userRole = req.user?.role as UserRole;
    const employeeId = req.user?.employeeId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    if (!userId || !userRole) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'User information not found' }, 401);
    }

    const { search, departmentId, designationId, status } = req.query;

    const employeeRepo = AppDataSource.getRepository(Employee);
    const queryBuilder = employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .leftJoinAndSelect('employee.manager', 'manager')
      .where('employee.tenantId = :tenantId', { tenantId })
      .orderBy('employee.createdAt', 'DESC');

    // Apply search filter
    if (search && typeof search === 'string') {
      queryBuilder.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search OR employee.employeeCode ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply department filter
    if (departmentId && typeof departmentId === 'string') {
      queryBuilder.andWhere('employee.departmentId = :departmentId', { departmentId });
    }

    // Apply designation filter
    if (designationId && typeof designationId === 'string') {
      queryBuilder.andWhere('employee.designationId = :designationId', { designationId });
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      queryBuilder.andWhere('employee.status = :status', { status });
    }

    // Get all employees matching the query
    const allEmployees = await queryBuilder.getMany();

    // Apply role-based filtering
    const filteredEmployees = await managerTeamService.filterEmployeesByRole(
      userId,
      userRole,
      employeeId || null,
      tenantId,
      allEmployees
    );

    logger.info(
      `Employee list filtered by role: ${userRole}. Total: ${allEmployees.length}, Filtered: ${filteredEmployees.length}`
    );

    return sendSuccess(res, filteredEmployees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch employees' }, 500);
  }
};

/**
 * Get employee by ID
 *
 * ROLE-BASED ACCESS:
 * - EMPLOYEE: Can only view their own profile
 * - MANAGER: Can view their direct reports + themselves
 * - HR_ADMIN/SYSTEM_ADMIN: Can view any employee
 */
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role as UserRole;
    const employeeId = req.user?.employeeId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({
      where: { employeeId: id, tenantId },
      relations: ['department', 'designation', 'manager', 'subordinates'],
    });

    if (!employee) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Employee not found' }, 404);
    }

    // Check role-based access permission
    let hasAccess = false;

    switch (userRole) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.HR_ADMIN:
        // HR and System Admins can view any employee
        hasAccess = true;
        break;

      case UserRole.MANAGER:
        // Managers can view themselves or their direct reports
        if (employeeId) {
          hasAccess =
            employeeId === id ||
            (await managerTeamService.canAccessEmployee(employeeId, id, tenantId));
        }
        break;

      case UserRole.EMPLOYEE:
        // Employees can only view their own profile
        hasAccess = employeeId === id;
        break;

      default:
        hasAccess = false;
    }

    if (!hasAccess) {
      logger.warn(
        `Access denied: User role ${userRole} attempted to access employee ${id}`
      );
      return sendError(
        res,
        {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this employee',
        },
        403
      );
    }

    return sendSuccess(res, employee);
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch employee' }, 500);
  }
};

/**
 * Create new employee
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      departmentId,
      designationId,
      managerId,
      dateOfJoining,
      probationEndDate,
      employmentType,
      status,
      createUser,
      userRole,
      password,
    } = req.body;

    // Validate required fields
    if (!employeeCode || !firstName || !lastName || !email || !dateOfJoining) {
      return sendError(
        res,
        { code: 'VALIDATION_ERROR', message: 'Required fields missing: employeeCode, firstName, lastName, email, dateOfJoining' },
        400
      );
    }

    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);
    const shouldCreateUser = Boolean(createUser && userRole && password);

    if (shouldCreateUser) {
      await subscriptionEnforcementService.assertCanAddUser(tenantId);
    }

    // Check if employee code already exists
    const existingEmployee = await employeeRepo.findOne({
      where: { tenantId, employeeCode },
    });

    if (existingEmployee) {
      return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Employee code already exists' }, 400);
    }

    // Check if email already exists
    const existingEmail = await employeeRepo.findOne({
      where: { tenantId, email },
    });

    if (existingEmail) {
      return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Email already exists' }, 400);
    }

    // Create employee
    const employee = employeeRepo.create({
      tenantId,
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      departmentId,
      designationId,
      managerId,
      dateOfJoining,
      probationEndDate,
      employmentType: employmentType || 'Full-Time',
      status: status || 'active',
    });

    await employeeRepo.save(employee);

    // Create joining record in position history
    try {
      await professionalHistoryService.createJoiningRecord(
        tenantId,
        employee.employeeId,
        departmentId,
        designationId,
        new Date(dateOfJoining),
        `${firstName} ${lastName} joined as employee ${employeeCode}`
      );
    } catch (historyError) {
      console.error('Error creating position history:', historyError);
      // Don't fail employee creation if history fails
    }

    // Create user account if requested
    if (shouldCreateUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = userRepo.create({
        tenantId,
        email: employee.email,
        passwordHash: hashedPassword,
        fullName: `${firstName} ${lastName}`,
        role: userRole,
        employeeId: employee.employeeId,
        isActive: true,
      });
      await userRepo.save(user);
      await subscriptionEnforcementService.syncCurrentUsers(tenantId);
    }

    // Fetch the created employee with relations
    const createdEmployee = await employeeRepo.findOne({
      where: { employeeId: employee.employeeId },
      relations: ['department', 'designation', 'manager'],
    });

    return sendCreated(res, createdEmployee);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return sendError(
      res,
      {
        code: error.code || 'CREATE_ERROR',
        message: error.message || 'Failed to create employee',
        details: error.details,
      },
      error.statusCode || 500
    );
  }
};

/**
 * Update employee
 */
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    logger.info(`Updating employee ${id} with data:`, JSON.stringify(req.body, null, 2));

    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({
      where: { employeeId: id, tenantId },
    });

    if (!employee) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Employee not found' }, 404);
    }

    // Check if employee code is being changed and if it already exists
    if (req.body.employeeCode && req.body.employeeCode !== employee.employeeCode) {
      const existingEmployee = await employeeRepo.findOne({
        where: { tenantId, employeeCode: req.body.employeeCode },
      });

      if (existingEmployee) {
        return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Employee code already exists' }, 400);
      }
    }

    // Check if email is being changed and if it already exists
    if (req.body.email && req.body.email !== employee.email) {
      const existingEmail = await employeeRepo.findOne({
        where: { tenantId, email: req.body.email },
      });

      if (existingEmail) {
        return sendError(res, { code: 'DUPLICATE_ERROR', message: 'Email already exists' }, 400);
      }
    }

    // Clean up data - convert empty strings to null for nullable fields
    const cleanedData = { ...req.body };

    // Convert empty strings to null for date fields
    const dateFields = ['dateOfBirth', 'dateOfJoining', 'probationEndDate'];
    dateFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    // Convert empty strings to null for other nullable fields
    const nullableFields = [
      'phone',
      'address',
      'workLocation',
      'maritalStatus',
      'nationality',
      'emergencyContact',
      'emergencyPhone',
      'managerId',
      'departmentId',
      'designationId',
    ];
    nullableFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    // Validate managerId if being updated
    if (cleanedData.managerId !== undefined && cleanedData.managerId !== null) {
      // Validate that the manager exists
      const managerExists = await employeeRepo.findOne({
        where: { employeeId: cleanedData.managerId, tenantId },
      });

      if (!managerExists) {
        return sendError(
          res,
          { code: 'INVALID_MANAGER', message: 'Selected manager does not exist' },
          400
        );
      }

      // Prevent setting self as manager
      if (cleanedData.managerId === id) {
        return sendError(
          res,
          { code: 'INVALID_MANAGER', message: 'Employee cannot be their own manager' },
          400
        );
      }
    }

    // Update employee fields
    Object.assign(employee, cleanedData);
    await employeeRepo.save(employee);

    // Fetch updated employee with relations
    const updatedEmployee = await employeeRepo.findOne({
      where: { employeeId: id },
      relations: ['department', 'designation', 'manager'],
    });

    return sendSuccess(res, updatedEmployee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message || 'Failed to update employee' }, 500);
  }
};

/**
 * Delete employee (soft delete by setting status to 'exited')
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({
      where: { employeeId: id, tenantId },
    });

    if (!employee) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Employee not found' }, 404);
    }

    // Soft delete: set status to 'exited'
    employee.status = EmploymentStatus.EXITED;
    await employeeRepo.save(employee);

    // Also deactivate associated user account
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { employeeId: id, tenantId },
    });

    if (user) {
      user.isActive = false;
      await userRepo.save(user);
      await subscriptionEnforcementService.syncCurrentUsers(tenantId);
    }

    return sendSuccess(res, { message: 'Employee marked as exited successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message || 'Failed to delete employee' }, 500);
  }
};

/**
 * Get employee statistics
 */
export const getEmployeeStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    const userRole = req.user?.role as UserRole;
    const employeeId = req.user?.employeeId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    if (!userId || !userRole) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'User information not found' }, 401);
    }

    const employeeRepo = AppDataSource.getRepository(Employee);

    // Get all employees for the tenant with relations
    const allEmployees = await employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('employee.tenantId = :tenantId', { tenantId })
      .getMany();

    // Apply role-based filtering using the same service as getEmployees
    const filteredEmployees = await managerTeamService.filterEmployeesByRole(
      userId,
      userRole,
      employeeId || null,
      tenantId,
      allEmployees
    );

    logger.info(
      `Employee stats filtered by role: ${userRole}. Total: ${allEmployees.length}, Filtered: ${filteredEmployees.length}`
    );

    // Calculate stats from filtered employees
    const totalEmployees = filteredEmployees.length;
    const activeEmployees = filteredEmployees.filter(e => e.status === EmploymentStatus.ACTIVE).length;
    const inactiveEmployees = filteredEmployees.filter(e => e.status === EmploymentStatus.INACTIVE).length;
    const exitedEmployees = filteredEmployees.filter(e => e.status === EmploymentStatus.EXITED).length;

    // Get department-wise count from filtered employees
    const departmentMap = new Map<string, number>();
    filteredEmployees
      .filter(e => e.status === EmploymentStatus.ACTIVE && e.department)
      .forEach(e => {
        const deptName = e.department!.name;
        departmentMap.set(deptName, (departmentMap.get(deptName) || 0) + 1);
      });

    const departmentStats = Array.from(departmentMap.entries()).map(([departmentName, count]) => ({
      departmentName,
      count: count.toString(), // Match the format from getRawMany()
    }));

    const stats = {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
      exited: exitedEmployees,
      byDepartment: departmentStats,
    };

    return sendSuccess(res, stats);
  } catch (error: any) {
    console.error('Error fetching employee stats:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch employee statistics' }, 500);
  }
};
