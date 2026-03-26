import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';

async function check() {
  await AppDataSource.initialize();
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const employeeRepo = AppDataSource.getRepository(Employee);

  const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
  console.log('Tenant:', tenant?.tenantId);

  const employees = await employeeRepo.find({
    where: { tenantId: tenant!.tenantId },
    take: 10
  });

  console.log('Found', employees.length, 'employees:');
  employees.forEach(e => console.log('  -', e.email, '|', e.employeeId));

  await AppDataSource.destroy();
  process.exit(0);
}

check();
