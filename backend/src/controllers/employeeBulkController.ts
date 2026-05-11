import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { sendSuccess, sendError } from '../utils/responses';
import bcrypt from 'bcrypt';
import { UserRole, EmploymentStatus } from '../../../shared/types';
import logger from '../utils/logger';
import subscriptionEnforcementService from '../services/subscriptionEnforcementService';

interface CSVEmployee {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  employmentType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  managerEmail?: string;
}

interface BulkUploadResult {
  totalRows: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    employeeCode?: string;
    email?: string;
    error: string;
  }>;
  createdEmployees: Array<{
    employeeId: string;
    employeeCode: string;
    fullName: string;
    email: string;
  }>;
}

/**
 * Download CSV template for bulk employee upload
 */
export const downloadEmployeeTemplate = async (req: Request, res: Response) => {
  try {
    const csvTemplate = [
      'employeeCode,firstName,lastName,email,phone,dateOfBirth,gender,department,designation,dateOfJoining,employmentType,managerEmail',
      'EMP001,John,Doe,john.doe@company.com,+919876543210,1990-01-15,Male,Engineering,Software Engineer,2024-01-01,Full-Time,manager@company.com',
      'EMP002,Jane,Smith,jane.smith@company.com,+919876543211,1992-03-22,Female,HR,HR Manager,2024-01-15,Full-Time,',
      'EMP003,Bob,Johnson,bob.johnson@company.com,+919876543212,1988-07-10,Male,Sales,Sales Executive,2024-02-01,Full-Time,manager@company.com',
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employee_bulk_upload_template.csv');
    res.send(csvTemplate);
  } catch (error: any) {
    logger.error('Error generating template:', error);
    return sendError(res, { code: 'TEMPLATE_ERROR', message: 'Failed to generate template' }, 500);
  }
};

/**
 * Bulk upload employees via CSV
 */
export const bulkUploadEmployees = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendError(res, { code: 'TENANT_NOT_FOUND', message: 'Tenant ID not found' }, 400);
    }

    if (!req.file) {
      return sendError(res, { code: 'FILE_REQUIRED', message: 'CSV file is required' }, 400);
    }

    // Parse CSV
    const fileContent = req.file.buffer.toString('utf-8');
    let records: CSVEmployee[];

    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CSVEmployee[];
    } catch (parseError: any) {
      return sendError(res, { code: 'PARSE_ERROR', message: `CSV parsing failed: ${parseError.message}` }, 400);
    }

    if (records.length === 0) {
      return sendError(res, { code: 'EMPTY_FILE', message: 'CSV file contains no data rows' }, 400);
    }

    if (records.length > 500) {
      return sendError(res, { code: 'TOO_MANY_ROWS', message: 'Maximum 500 employees can be uploaded at once' }, 400);
    }

    const result: BulkUploadResult = {
      totalRows: records.length,
      successful: 0,
      failed: 0,
      errors: [],
      createdEmployees: [],
    };

    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);
    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);

    // Get all departments and designations for this tenant
    const departments = await departmentRepo.find({ where: { tenantId } });
    const designations = await designationRepo.find({ where: { tenantId } });

    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d.departmentId]));
    const designationMap = new Map(designations.map(d => [d.name.toLowerCase(), d.designationId]));

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because CSV has header row and arrays are 0-indexed

      try {
        // Validation
        if (!record.employeeCode || !record.firstName || !record.lastName || !record.email) {
          result.errors.push({
            row: rowNumber,
            employeeCode: record.employeeCode,
            email: record.email,
            error: 'Missing required fields: employeeCode, firstName, lastName, email',
          });
          result.failed++;
          continue;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(record.email)) {
          result.errors.push({
            row: rowNumber,
            employeeCode: record.employeeCode,
            email: record.email,
            error: 'Invalid email format',
          });
          result.failed++;
          continue;
        }

        // Check if employee code already exists
        const existingEmployee = await employeeRepo.findOne({
          where: { tenantId, employeeCode: record.employeeCode },
        });

        if (existingEmployee) {
          result.errors.push({
            row: rowNumber,
            employeeCode: record.employeeCode,
            email: record.email,
            error: 'Employee code already exists',
          });
          result.failed++;
          continue;
        }

        // Check if email already exists
        const existingUser = await userRepo.findOne({
          where: { tenantId, email: record.email },
        });

        if (existingUser) {
          result.errors.push({
            row: rowNumber,
            employeeCode: record.employeeCode,
            email: record.email,
            error: 'Email already exists',
          });
          result.failed++;
          continue;
        }

        // Map department and designation
        let departmentId: string | undefined;
        let designationId: string | undefined;

        if (record.department) {
          departmentId = departmentMap.get(record.department.toLowerCase());
          if (!departmentId) {
            result.errors.push({
              row: rowNumber,
              employeeCode: record.employeeCode,
              email: record.email,
              error: `Department "${record.department}" not found`,
            });
            result.failed++;
            continue;
          }
        }

        if (record.designation) {
          designationId = designationMap.get(record.designation.toLowerCase());
          if (!designationId) {
            result.errors.push({
              row: rowNumber,
              employeeCode: record.employeeCode,
              email: record.email,
              error: `Designation "${record.designation}" not found`,
            });
            result.failed++;
            continue;
          }
        }

        // Find manager by email if provided
        let managerId: string | undefined;
        if (record.managerEmail && record.managerEmail.trim()) {
          const managerUser = await userRepo.findOne({
            where: { tenantId, email: record.managerEmail },
            relations: ['employee'],
          });

          if (managerUser && managerUser.employee) {
            managerId = managerUser.employee.employeeId;
          } else {
            result.errors.push({
              row: rowNumber,
              employeeCode: record.employeeCode,
              email: record.email,
              error: `Manager with email "${record.managerEmail}" not found`,
            });
            result.failed++;
            continue;
          }
        }

        // Create employee
        const employee = employeeRepo.create({
          tenantId,
          employeeCode: record.employeeCode,
          firstName: record.firstName,
          lastName: record.lastName,
          email: record.email,
          phone: record.phone || undefined,
          dateOfBirth: record.dateOfBirth ? new Date(record.dateOfBirth) : undefined,
          gender: record.gender || undefined,
          departmentId,
          designationId,
          managerId,
          dateOfJoining: record.dateOfJoining ? new Date(record.dateOfJoining) : new Date(),
          employmentType: record.employmentType || 'Full-Time',
          status: EmploymentStatus.ACTIVE,
        });

        await employeeRepo.save(employee);

        // Create user account with temporary password
        const tempPassword = `Welcome@${record.employeeCode}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = userRepo.create({
          tenantId,
          email: record.email,
          passwordHash: hashedPassword,
          fullName: `${record.firstName} ${record.lastName}`,
          role: UserRole.EMPLOYEE,
          employeeId: employee.employeeId,
          isActive: true,
        });

        await userRepo.save(user);

        result.successful++;
        result.createdEmployees.push({
          employeeId: employee.employeeId,
          employeeCode: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
        });

        logger.info(`Created employee ${employee.employeeCode} via bulk upload`);
      } catch (error: any) {
        logger.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          employeeCode: record.employeeCode,
          email: record.email,
          error: error.message || 'Unknown error',
        });
        result.failed++;
      }
    }

    await subscriptionEnforcementService.syncCurrentUsers(tenantId);

    return sendSuccess(res, result);
  } catch (error: any) {
    logger.error('Error in bulk upload:', error);
    return sendError(res, { code: 'UPLOAD_ERROR', message: error.message || 'Bulk upload failed' }, 500);
  }
};
