import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import bcrypt from 'bcrypt';
import { UserRole } from '../../../shared/types';

async function createAdminUser() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);

    // Find tenant
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant "acme" not found!');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@acme.com' } });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email: admin@acme.com');
      console.log('   Password: password123');
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = userRepo.create({
      tenantId: tenant.tenantId,
      email: 'admin@acme.com',
      passwordHash: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.SYSTEM_ADMIN,
    });

    await userRepo.save(adminUser);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n=====================================');
    console.log('LOGIN CREDENTIALS');
    console.log('=====================================');
    console.log('Email:    admin@acme.com');
    console.log('Password: password123');
    console.log('=====================================\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
