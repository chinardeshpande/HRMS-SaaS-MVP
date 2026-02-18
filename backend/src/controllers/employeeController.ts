import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';
import { Like } from 'typeorm';
import bcrypt from 'bcrypt';
import { EmploymentStatus } from '../../../shared/types';

/**
 * Get all employees with optional filters
 * Query params: search, departmentId, designationId, status
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
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

    const employees = await queryBuilder.getMany();

    return sendSuccess(res, employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch employees' }, 500);
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

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

    // Create user account if requested
    if (createUser && userRole && password) {
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
    }

    // Fetch the created employee with relations
    const createdEmployee = await employeeRepo.findOne({
      where: { employeeId: employee.employeeId },
      relations: ['department', 'designation', 'manager'],
    });

    return sendCreated(res, createdEmployee);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return sendError(res, { code: 'CREATE_ERROR', message: error.message || 'Failed to create employee' }, 500);
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

    // Update employee fields
    Object.assign(employee, req.body);
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

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    const employeeRepo = AppDataSource.getRepository(Employee);

    const [totalEmployees, activeEmployees, inactiveEmployees, exitedEmployees] = await Promise.all([
      employeeRepo.count({ where: { tenantId } }),
      employeeRepo.count({ where: { tenantId, status: EmploymentStatus.ACTIVE } }),
      employeeRepo.count({ where: { tenantId, status: EmploymentStatus.INACTIVE } }),
      employeeRepo.count({ where: { tenantId, status: EmploymentStatus.EXITED } }),
    ]);

    // Get department-wise count
    const departmentStats = await employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .select('department.name', 'departmentName')
      .addSelect('COUNT(employee.employeeId)', 'count')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.status = :status', { status: EmploymentStatus.ACTIVE })
      .groupBy('department.departmentId')
      .addGroupBy('department.name')
      .getRawMany();

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
