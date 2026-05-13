import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  allowedEmailDomain?: string;
  maxExistingEmployees: number;
  maxExistingUsers: number;
}

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  const options: Options = {
    maxExistingEmployees: 0,
    maxExistingUsers: 1,
  };

  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (!value) continue;

    if (key === 'tenant-id') options.tenantId = value;
    if (key === 'company-name') options.companyName = value;
    if (key === 'subdomain') options.subdomain = value;
    if (key === 'allowed-email-domain') options.allowedEmailDomain = value.toLowerCase();
    if (key === 'max-existing-employees') options.maxExistingEmployees = Number(value);
    if (key === 'max-existing-users') options.maxExistingUsers = Number(value);
  }

  if (!options.tenantId && !options.companyName && !options.subdomain) {
    throw new Error('Provide --tenant-id, --company-name, or --subdomain');
  }

  return options;
};

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const where: Partial<Tenant>[] = [];

  if (options.tenantId) where.push({ tenantId: options.tenantId });
  if (options.companyName) where.push({ companyName: options.companyName });
  if (options.subdomain) where.push({ subdomain: options.subdomain });

  const tenants = await tenantRepo.find({ where });

  if (tenants.length === 0) {
    throw new Error('No tenant matched the supplied ACV selector');
  }

  const uniqueTenantIds = new Set(tenants.map((tenant) => tenant.tenantId));
  if (uniqueTenantIds.size > 1) {
    throw new Error(`Tenant selector matched multiple tenants: ${Array.from(uniqueTenantIds).join(', ')}`);
  }

  return tenants[0];
};

const countTenantTables = async (tenantId: string): Promise<Array<{ table: string; count: number }>> => {
  const counts: Array<{ table: string; count: number }> = [];

  for (const metadata of AppDataSource.entityMetadatas) {
    const tenantColumn = metadata.columns.find((column) => column.propertyName === 'tenantId');
    if (!tenantColumn) continue;

    const tableName = metadata.tableName;
    const result = await AppDataSource.query(
      `SELECT COUNT(*)::int AS count FROM "${tableName}" WHERE "tenantId" = $1`,
      [tenantId]
    );

    counts.push({ table: tableName, count: Number(result[0]?.count || 0) });
  }

  return counts.sort((a, b) => a.table.localeCompare(b.table));
};

const findSuspiciousRows = async (
  tenantId: string,
  allowedEmailDomain?: string
): Promise<string[]> => {
  const findings: string[] = [];
  const suspiciousPattern = /(demo|test|campuslife|acme|aurora|88824874|89157172|89916215)/i;

  const employees = await AppDataSource.getRepository(Employee).find({ where: { tenantId } });
  for (const employee of employees) {
    const summary = `${employee.employeeCode} ${employee.firstName} ${employee.lastName} ${employee.email}`;
    if (suspiciousPattern.test(summary)) {
      findings.push(`Suspicious employee row: ${summary}`);
    }
    if (allowedEmailDomain && !employee.email.toLowerCase().endsWith(`@${allowedEmailDomain}`)) {
      findings.push(`Employee email outside allowed domain: ${employee.email}`);
    }
  }

  const users = await AppDataSource.getRepository(User).find({ where: { tenantId } });
  for (const user of users) {
    const summary = `${user.fullName || ''} ${user.email}`;
    if (suspiciousPattern.test(summary)) {
      findings.push(`Suspicious user row: ${summary}`);
    }
    if (allowedEmailDomain && !user.email.toLowerCase().endsWith(`@${allowedEmailDomain}`)) {
      findings.push(`User email outside allowed domain: ${user.email}`);
    }
  }

  const departments = await AppDataSource.getRepository(Department).find({ where: { tenantId } });
  for (const department of departments) {
    if (suspiciousPattern.test(department.name)) {
      findings.push(`Suspicious department row: ${department.name}`);
    }
  }

  const designations = await AppDataSource.getRepository(Designation).find({ where: { tenantId } });
  for (const designation of designations) {
    if (suspiciousPattern.test(designation.name)) {
      findings.push(`Suspicious designation row: ${designation.name}`);
    }
  }

  return findings;
};

const run = async () => {
  const options = parseArgs();
  await AppDataSource.initialize();

  try {
    const tenant = await findTenant(options);
    const counts = await countTenantTables(tenant.tenantId);
    const employeesCount = counts.find((item) => item.table === 'employees')?.count || 0;
    const usersCount = counts.find((item) => item.table === 'users')?.count || 0;
    const suspiciousRows = await findSuspiciousRows(tenant.tenantId, options.allowedEmailDomain);
    const failures: string[] = [];

    if (employeesCount > options.maxExistingEmployees) {
      failures.push(
        `Employee count ${employeesCount} exceeds clean-room limit ${options.maxExistingEmployees}`
      );
    }

    if (usersCount > options.maxExistingUsers) {
      failures.push(`User count ${usersCount} exceeds clean-room limit ${options.maxExistingUsers}`);
    }

    failures.push(...suspiciousRows);

    console.log(`Tenant: ${tenant.companyName} (${tenant.tenantId})`);
    console.log(`Subdomain: ${tenant.subdomain || 'not set'}`);
    console.log('Tenant-scoped row counts:');
    for (const item of counts) {
      if (item.count > 0) {
        console.log(`- ${item.table}: ${item.count}`);
      }
    }

    if (failures.length > 0) {
      console.error('\nCleanliness audit failed:');
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log('\nCleanliness audit passed.');
  } finally {
    await AppDataSource.destroy();
  }
};

run().catch(async (error) => {
  console.error(error.message || error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});

