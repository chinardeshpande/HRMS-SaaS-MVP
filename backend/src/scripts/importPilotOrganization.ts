import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { Employee } from '../models/Employee';
import { Role } from '../models/Role';
import { User } from '../models/User';
import subscriptionEnforcementService from '../services/subscriptionEnforcementService';
import { EmploymentStatus, UserRole } from '../../../shared/types';

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  mastersCsv: string;
  employeesCsv: string;
  allowedEmailDomain: string;
  execute: boolean;
  createUsers: boolean;
  allowExistingEmployees: boolean;
  autoManagerRole: boolean;
  defaultPassword?: string;
  credentialsOut?: string;
}

interface MasterRow {
  type: string;
  name: string;
  parent?: string;
  level?: string;
  active?: string;
}

interface EmployeeRow {
  employeeCode: string;
  firstName: string;
  lastName: string;
  officialEmail: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  employmentType?: string;
  managerEmail?: string;
  role?: string;
}

const usage = `
Usage:
  npm --prefix backend run import:pilot-org -- \\
    --company-name="ACV Solutions Pvt Ltd" \\
    --allowed-email-domain=acvsolutions.in \\
    --masters-csv=/private/tmp/acv-onboarding-prep/final/acv-master-data-final.csv \\
    --employees-csv=/private/tmp/acv-onboarding-prep/final/acv-employee-import-final.csv

Dry-run is the default. Add --execute only after backup and cleanliness audit pass.
Add --create-users with PILOT_DEFAULT_PASSWORD or --default-password=... when ready to create login users.
`;

const readArg = (name: string, args: string[]): string | undefined => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const hasFlag = (name: string, args: string[]): boolean => args.includes(`--${name}`);

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  if (hasFlag('help', args) || hasFlag('h', args)) {
    console.log(usage.trim());
    process.exit(0);
  }

  const mastersCsv = readArg('masters-csv', args);
  const employeesCsv = readArg('employees-csv', args);
  const allowedEmailDomain = readArg('allowed-email-domain', args);

  if (!mastersCsv || !employeesCsv || !allowedEmailDomain) {
    throw new Error('Provide --masters-csv, --employees-csv, and --allowed-email-domain');
  }

  if (!readArg('tenant-id', args) && !readArg('company-name', args) && !readArg('subdomain', args)) {
    throw new Error('Provide --tenant-id, --company-name, or --subdomain');
  }

  return {
    tenantId: readArg('tenant-id', args),
    companyName: readArg('company-name', args),
    subdomain: readArg('subdomain', args),
    mastersCsv,
    employeesCsv,
    allowedEmailDomain: allowedEmailDomain.toLowerCase(),
    execute: hasFlag('execute', args),
    createUsers: hasFlag('create-users', args),
    allowExistingEmployees: hasFlag('allow-existing-employees', args),
    autoManagerRole: !hasFlag('no-auto-manager-role', args),
    defaultPassword: readArg('default-password', args) || process.env.PILOT_DEFAULT_PASSWORD,
    credentialsOut: readArg('credentials-out', args),
  };
};

const normalize = (value: unknown): string => String(value ?? '').trim();
const normalizeEmail = (value: unknown): string => normalize(value).toLowerCase();
const isActive = (value: unknown): boolean => ['yes', 'y', 'true', '1', 'active', ''].includes(normalize(value).toLowerCase());

const parseDate = (value: unknown, field: string, rowLabel: string): Date => {
  const raw = normalize(value);
  if (!raw) throw new Error(`${rowLabel}: ${field} is required`);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${rowLabel}: ${field} is not a valid date: ${raw}`);
  }
  return parsed;
};

const parseOptionalDate = (value: unknown, field: string, rowLabel: string): Date | undefined => {
  const raw = normalize(value);
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${rowLabel}: ${field} is not a valid date: ${raw}`);
  }
  return parsed;
};

const readCsv = <T>(filePath: string): T[] => {
  const absolutePath = path.resolve(filePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
};

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const where: FindOptionsWhere<Tenant>[] = [];

  if (options.tenantId) where.push({ tenantId: options.tenantId });
  if (options.companyName) where.push({ companyName: options.companyName });
  if (options.subdomain) where.push({ subdomain: options.subdomain });

  const tenants = await tenantRepo.find({ where });
  const uniqueTenantIds = new Set(tenants.map((tenant) => tenant.tenantId));

  if (uniqueTenantIds.size === 0) {
    throw new Error('No tenant matched the supplied selector. Create the fresh ACV tenant first.');
  }
  if (uniqueTenantIds.size > 1) {
    throw new Error(`Tenant selector matched multiple tenants: ${Array.from(uniqueTenantIds).join(', ')}`);
  }

  return tenants[0];
};

const validateInput = (
  masters: MasterRow[],
  employees: EmployeeRow[],
  allowedEmailDomain: string
): void => {
  const errors: string[] = [];
  const employeeCodes = new Map<string, number>();
  const officialEmails = new Map<string, number>();
  const activeDepartments = new Set<string>();
  const activeDesignations = new Set<string>();

  masters.forEach((row) => {
    const type = normalize(row.type || (row as any).masterType).toLowerCase();
    const name = normalize(row.name);
    if (!type || !name || !isActive(row.active)) return;
    if (type === 'department') activeDepartments.add(name);
    if (type === 'designation') activeDesignations.add(name);
  });

  employees.forEach((row, index) => {
    const rowLabel = `employees CSV row ${index + 2}`;
    const employeeCode = normalize(row.employeeCode);
    const officialEmail = normalizeEmail(row.officialEmail);
    const managerEmail = normalizeEmail(row.managerEmail);

    if (!employeeCode) errors.push(`${rowLabel}: employeeCode is required`);
    if (!normalize(row.firstName)) errors.push(`${rowLabel}: firstName is required`);
    if (!normalize(row.lastName)) errors.push(`${rowLabel}: lastName is required`);
    if (!officialEmail) errors.push(`${rowLabel}: officialEmail is required`);
    if (officialEmail && !officialEmail.endsWith(`@${allowedEmailDomain}`)) {
      errors.push(`${rowLabel}: officialEmail is outside ${allowedEmailDomain}`);
    }
    if (managerEmail && !managerEmail.endsWith(`@${allowedEmailDomain}`)) {
      errors.push(`${rowLabel}: managerEmail is outside ${allowedEmailDomain}`);
    }
    if (employeeCode && employeeCodes.has(employeeCode)) {
      errors.push(`${rowLabel}: duplicate employeeCode also appears on row ${employeeCodes.get(employeeCode)}`);
    }
    if (officialEmail && officialEmails.has(officialEmail)) {
      errors.push(`${rowLabel}: duplicate officialEmail also appears on row ${officialEmails.get(officialEmail)}`);
    }

    employeeCodes.set(employeeCode, index + 2);
    officialEmails.set(officialEmail, index + 2);

    const department = normalize(row.department);
    const designation = normalize(row.designation);
    if (department && !activeDepartments.has(department)) {
      errors.push(`${rowLabel}: department not found in masters: ${department}`);
    }
    if (designation && !activeDesignations.has(designation)) {
      errors.push(`${rowLabel}: designation not found in masters: ${designation}`);
    }
    if (managerEmail && !officialEmails.has(managerEmail) && !employees.some((candidate) => normalizeEmail(candidate.officialEmail) === managerEmail)) {
      errors.push(`${rowLabel}: managerEmail does not match another employee officialEmail`);
    }

    try {
      parseDate(row.dateOfJoining, 'dateOfJoining', rowLabel);
      parseOptionalDate(row.dateOfBirth, 'dateOfBirth', rowLabel);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  });

  const rootEmployees = employees.filter((row) => !normalizeEmail(row.managerEmail));
  if (rootEmployees.length !== 1) {
    errors.push(`Expected exactly one top-level employee, found ${rootEmployees.length}`);
  }

  if (errors.length > 0) {
    throw new Error(`Pilot import validation failed:\n- ${errors.join('\n- ')}`);
  }
};

const getRoleName = (rawRole: string, hasSubordinates: boolean, autoManagerRole: boolean): string => {
  const role = normalize(rawRole).toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'system_admin') return 'System Admin';
  if (role === 'hr_admin' || role === 'hr manager') return 'HR Admin';
  if (role === 'manager' || (autoManagerRole && hasSubordinates)) return 'Manager';
  return 'Employee';
};

const getUserRole = (rawRole: string, hasSubordinates: boolean, autoManagerRole: boolean): UserRole => {
  const role = normalize(rawRole).toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'system_admin') return UserRole.SYSTEM_ADMIN;
  if (role === 'hr_admin' || role === 'hr manager') return UserRole.HR_ADMIN;
  if (role === 'manager' || (autoManagerRole && hasSubordinates)) return UserRole.MANAGER;
  return UserRole.EMPLOYEE;
};

const importData = async (options: Options): Promise<void> => {
  const masters = readCsv<MasterRow>(options.mastersCsv).filter((row) => normalize(row.name));
  const employees = readCsv<EmployeeRow>(options.employeesCsv).filter((row) => normalize(row.employeeCode) || normalize(row.officialEmail));
  validateInput(masters, employees, options.allowedEmailDomain);

  if (options.createUsers && !options.defaultPassword) {
    throw new Error('User creation requires PILOT_DEFAULT_PASSWORD or --default-password');
  }

  await AppDataSource.initialize();

  try {
    const tenant = await findTenant(options);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const existingEmployeeCount = await employeeRepo.count({ where: { tenantId: tenant.tenantId } });
    if (existingEmployeeCount > 0 && !options.allowExistingEmployees) {
      throw new Error(
        `Tenant already has ${existingEmployeeCount} employees. Re-run only after clean-room review or pass --allow-existing-employees intentionally.`
      );
    }

    console.log(`Tenant: ${tenant.companyName} (${tenant.tenantId})`);
    console.log(`Mode: ${options.execute ? 'EXECUTE' : 'DRY RUN'}`);
    console.log(`Masters: ${masters.length}`);
    console.log(`Employees: ${employees.length}`);
    console.log(`Create users: ${options.createUsers ? 'yes' : 'no'}`);

    if (!options.execute) {
      console.log('Dry run passed. No database writes performed.');
      return;
    }

    await AppDataSource.transaction(async (manager) => {
      const departmentRepo = manager.getRepository(Department);
      const designationRepo = manager.getRepository(Designation);
      const roleRepo = manager.getRepository(Role);
      const userRepo = manager.getRepository(User);
      const transactionalEmployeeRepo = manager.getRepository(Employee);

      const departmentNames = new Set<string>();
      const designationLevels = new Map<string, number | undefined>();

      masters.forEach((row) => {
        const type = normalize(row.type || (row as any).masterType).toLowerCase();
        const name = normalize(row.name);
        if (!name || !isActive(row.active)) return;
        if (type === 'department') departmentNames.add(name);
        if (type === 'designation') {
          const level = normalize(row.level);
          designationLevels.set(name, level ? Number(level) : undefined);
        }
      });

      employees.forEach((row) => {
        if (normalize(row.department)) departmentNames.add(normalize(row.department));
        if (normalize(row.designation) && !designationLevels.has(normalize(row.designation))) {
          designationLevels.set(normalize(row.designation), undefined);
        }
      });

      const departments = new Map<string, Department>();
      for (const name of departmentNames) {
        let department = await departmentRepo.findOne({ where: { tenantId: tenant.tenantId, name } });
        if (!department) {
          department = departmentRepo.create({ tenantId: tenant.tenantId, name });
          department = await departmentRepo.save(department);
        }
        departments.set(name, department);
      }

      const designations = new Map<string, Designation>();
      for (const [name, level] of designationLevels.entries()) {
        let designation = await designationRepo.findOne({ where: { tenantId: tenant.tenantId, name } });
        if (!designation) {
          designation = designationRepo.create({ tenantId: tenant.tenantId, name, level });
        } else if (level !== undefined) {
          designation.level = level;
        }
        designation = await designationRepo.save(designation);
        designations.set(name, designation);
      }

      const subordinateManagerEmails = new Set(
        employees.map((row) => normalizeEmail(row.managerEmail)).filter(Boolean)
      );
      const roleByName = new Map<string, Role>();
      for (const row of employees) {
        const roleName = getRoleName(row.role || '', subordinateManagerEmails.has(normalizeEmail(row.officialEmail)), options.autoManagerRole);
        let role = await roleRepo.findOne({ where: { tenantId: tenant.tenantId, roleName } });
        if (!role) {
          role = roleRepo.create({
            tenantId: tenant.tenantId,
            roleName,
            description: `${roleName} role created by pilot organization import`,
            isSystemRole: ['System Admin', 'HR Admin', 'Manager', 'Employee'].includes(roleName),
            isActive: true,
            level: roleName === 'System Admin' ? 100 : roleName === 'HR Admin' ? 80 : roleName === 'Manager' ? 50 : 10,
          });
          role = await roleRepo.save(role);
        }
        roleByName.set(roleName, role);
      }

      const employeesByEmail = new Map<string, Employee>();
      for (const row of employees) {
        const email = normalizeEmail(row.officialEmail);
        const employeeCode = normalize(row.employeeCode);

        const existingByCode = await transactionalEmployeeRepo.findOne({
          where: { tenantId: tenant.tenantId, employeeCode },
        });
        const existingByEmail = await transactionalEmployeeRepo.findOne({
          where: { tenantId: tenant.tenantId, email },
        });
        if (existingByCode || existingByEmail) {
          throw new Error(`Employee already exists in tenant: ${employeeCode} / ${email}`);
        }

        const hasSubordinates = subordinateManagerEmails.has(email);
        const roleName = getRoleName(row.role || '', hasSubordinates, options.autoManagerRole);
        const employee = transactionalEmployeeRepo.create({
          tenantId: tenant.tenantId,
          employeeCode,
          firstName: normalize(row.firstName),
          lastName: normalize(row.lastName),
          email,
          phone: normalize(row.phone) || undefined,
          dateOfBirth: parseOptionalDate(row.dateOfBirth, 'dateOfBirth', employeeCode),
          gender: normalize(row.gender) || undefined,
          departmentId: departments.get(normalize(row.department))?.departmentId,
          designationId: designations.get(normalize(row.designation))?.designationId,
          roleId: roleByName.get(roleName)?.roleId,
          dateOfJoining: parseDate(row.dateOfJoining, 'dateOfJoining', employeeCode),
          employmentType: normalize(row.employmentType) || undefined,
          status: EmploymentStatus.ACTIVE,
        });
        employeesByEmail.set(email, await transactionalEmployeeRepo.save(employee));
      }

      for (const row of employees) {
        const managerEmail = normalizeEmail(row.managerEmail);
        if (!managerEmail) continue;

        const employee = employeesByEmail.get(normalizeEmail(row.officialEmail));
        const managerEmployee = employeesByEmail.get(managerEmail);
        if (!employee || !managerEmployee) {
          throw new Error(`Manager linkage failed for ${normalize(row.employeeCode)} -> ${managerEmail}`);
        }
        employee.managerId = managerEmployee.employeeId;
        await transactionalEmployeeRepo.save(employee);
      }

      if (options.createUsers) {
        const credentials: Array<{ employeeCode: string; email: string; temporaryPassword: string; role: UserRole }> = [];
        for (const row of employees) {
          const email = normalizeEmail(row.officialEmail);
          const employee = employeesByEmail.get(email);
          if (!employee) continue;

          const hasSubordinates = subordinateManagerEmails.has(email);
          const userRole = getUserRole(row.role || '', hasSubordinates, options.autoManagerRole);
          const fullName = `${normalize(row.firstName)} ${normalize(row.lastName)}`;
          let user = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email } });
          const wasExistingUser = Boolean(user);

          if (user) {
            user.fullName = fullName;
            user.role = userRole;
            user.employeeId = employee.employeeId;
            user.isActive = true;
          } else {
            user = userRepo.create({
              tenantId: tenant.tenantId,
              email,
              fullName,
              role: userRole,
              employeeId: employee.employeeId,
              isActive: true,
              password: options.defaultPassword,
            });
          }

          await userRepo.save(user);

          if (!credentials.some((credential) => credential.email === email)) {
            credentials.push({
              employeeCode: normalize(row.employeeCode),
              email,
              temporaryPassword: wasExistingUser ? 'existing-user-password-unchanged' : options.defaultPassword || '',
              role: userRole,
            });
          }
        }

        if (options.credentialsOut) {
          const header = 'employeeCode,email,temporaryPassword,role\n';
          const lines = credentials.map((row) => `${row.employeeCode},${row.email},${row.temporaryPassword},${row.role}`);
          fs.writeFileSync(path.resolve(options.credentialsOut), `${header}${lines.join('\n')}\n`, 'utf8');
        }
      }
    });

    if (options.createUsers) {
      await subscriptionEnforcementService.syncCurrentUsers(tenant.tenantId);
    }

    const importedCount = await employeeRepo.count({ where: { tenantId: tenant.tenantId } });
    console.log(`Import completed. Tenant employee count: ${importedCount}`);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

importData(parseArgs()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
