import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';

async function check() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);

    const tenant = await tenantRepo.findOne({ where: { companyName: 'Campuslife' } });
    if (!tenant) {
      console.log('❌ Campuslife tenant not found');
      process.exit(1);
    }
    console.log(`Found tenant: ${tenant.companyName} (ID: ${tenant.tenantId})\n`);

    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      relations: ['department', 'designation', 'manager'],
      order: { createdAt: 'DESC' },
    });

    console.log(`📊 Total employees: ${employees.length}\n`);

    employees.forEach((emp) => {
      console.log(`${emp.employeeCode} | ${emp.firstName} ${emp.lastName} | ${emp.email}`);
      console.log(`  ID: ${emp.employeeId}`);
      console.log(`  Dept: ${emp.department?.name || 'N/A'} | Desig: ${emp.designation?.name || 'N/A'}`);
      console.log(`  Manager: ${emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName} (${emp.manager.employeeCode})` : 'None'}`);
      console.log('');
    });

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

check();
