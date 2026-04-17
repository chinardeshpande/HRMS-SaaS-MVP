import { AppDataSource } from '../config/database';

async function seedReportingData() {
  try {
    console.log('🌱 Starting reporting data seed...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Get tenant
    const tenant = await queryRunner.query('SELECT * FROM tenants LIMIT 1');
    if (!tenant || tenant.length === 0) {
      console.error('❌ No tenant found. Run: npm run seed');
      process.exit(1);
    }

    const tenantId = tenant[0].tenantId;
    console.log(`📊 Using tenant: ${tenant[0].companyName}\n`);

    // Check/Create departments
    let depts = await queryRunner.query(`SELECT * FROM departments WHERE "tenantId" = $1`, [tenantId]);

    if (depts.length === 0) {
      console.log('📁 Creating departments...');
      const deptNames = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
      for (const name of deptNames) {
        await queryRunner.query(
          `INSERT INTO departments (name, "tenantId") VALUES ($1, $2)`,
          [name, tenantId]
        );
      }
      depts = await queryRunner.query(`SELECT * FROM departments WHERE "tenantId" = $1`, [tenantId]);
      console.log(`✅ Created ${depts.length} departments\n`);
    } else {
      console.log(`✅ Found ${depts.length} departments\n`);
    }

    // Check/Create employees
    let emps = await queryRunner.query(
      `SELECT * FROM employees WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
      [tenantId]
    );

    if (emps.length < 15) {
      console.log('👥 Creating sample employees...');

      const names = [
        'John,Smith', 'Jane,Doe', 'Mike,Johnson', 'Sarah,Williams', 'David,Brown',
        'Emily,Davis', 'Robert,Miller', 'Lisa,Wilson', 'James,Moore', 'Mary,Taylor',
        'Chris,Anderson', 'Patricia,Thomas', 'Daniel,Jackson', 'Jennifer,White',
        'Matthew,Harris', 'Linda,Martin', 'Anthony,Garcia', 'Elizabeth,Martinez',
        'Mark,Rodriguez', 'Nancy,Lee'
      ];

      for (let i = 0; i < Math.min(names.length, 20); i++) {
        const [firstName, lastName] = names[i].split(',');
        const dept = depts[i % depts.length];

        const joiningDate = new Date();
        joiningDate.setMonth(joiningDate.getMonth() - Math.floor(Math.random() * 24));

        const probationEndDate = new Date(joiningDate);
        probationEndDate.setDate(probationEndDate.getDate() + 90);

        const isActive = i < 17;
        const needsProbation = i < 5 && isActive;

        await queryRunner.query(
          `INSERT INTO employees (
            "tenantId", "firstName", "lastName", "email", "employeeCode",
            "departmentId", "status", "employmentType", "dateOfJoining", "probationEndDate"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            tenantId,
            firstName,
            lastName,
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
            `EMP${String(i + 1).padStart(4, '0')}`,
            dept.departmentId,
            isActive ? 'active' : 'exited',
            i % 4 === 0 ? 'contract' : 'full_time',
            joiningDate,
            needsProbation ? probationEndDate : null
          ]
        );
      }

      emps = await queryRunner.query(
        `SELECT * FROM employees WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
        [tenantId]
      );
      console.log(`✅ Created ${Math.min(names.length, 20)} employees\n`);
    } else {
      console.log(`✅ Found ${emps.length} employees\n`);
    }

    // Create Attendance (last 60 days)
    const attCount = await queryRunner.query(
      `SELECT COUNT(*) FROM attendance WHERE "tenantId" = $1`,
      [tenantId]
    );

    if (parseInt(attCount[0].count) < 200) {
      console.log('📅 Creating attendance records...');

      const activeEmps = emps.filter((e: any) => e.status === 'active').slice(0, 15);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      let count = 0;
      for (const emp of activeEmps) {
        for (let day = 0; day < 60; day++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + day);

          if (date.getDay() === 0 || date.getDay() === 6) continue;

          const isPresent = Math.random() < 0.95;
          const isLate = isPresent && Math.random() < 0.15;

          await queryRunner.query(
            `INSERT INTO attendance (
              "tenantId", "employeeId", "date", "status", "isLate", "lateMinutes",
              "workMinutes", "overtimeMinutes"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              tenantId,
              emp.employeeId,
              date,
              isPresent ? 'present' : 'absent',
              isLate,
              isLate ? Math.floor(Math.random() * 45) : 0,
              isPresent ? 480 + Math.floor(Math.random() * 60) : 0,
              isPresent && Math.random() < 0.2 ? Math.floor(Math.random() * 120) : 0
            ]
          );
          count++;
        }
      }

      console.log(`✅ Created ${count} attendance records\n`);
    } else {
      console.log(`✅ Found ${attCount[0].count} attendance records\n`);
    }

    // Create Leave Balances
    const leaveBalCount = await queryRunner.query(
      `SELECT COUNT(*) FROM leave_balances WHERE "tenantId" = $1`,
      [tenantId]
    );

    if (parseInt(leaveBalCount[0].count) < 20) {
      console.log('🏖️  Creating leave balances...');

      const activeEmps = emps.filter((e: any) => e.status === 'active');
      const currentYear = new Date().getFullYear();

      for (const emp of activeEmps) {
        // Earned Leave
        await queryRunner.query(
          `INSERT INTO leave_balances (
            "tenantId", "employeeId", "policyId", "leaveType", "year",
            "totalAllocated", "used", "pending", "carriedForward"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [tenantId, emp.employeeId, tenantId, 'earned', currentYear, 20, Math.floor(Math.random() * 10), Math.floor(Math.random() * 3), Math.floor(Math.random() * 5)]
        );

        // Sick Leave
        await queryRunner.query(
          `INSERT INTO leave_balances (
            "tenantId", "employeeId", "policyId", "leaveType", "year",
            "totalAllocated", "used", "pending", "carriedForward"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [tenantId, emp.employeeId, tenantId, 'sick', currentYear, 12, Math.floor(Math.random() * 6), 0, 0]
        );
      }

      console.log(`✅ Created leave balances\n`);
    } else {
      console.log(`✅ Found ${leaveBalCount[0].count} leave balances\n`);
    }

    await queryRunner.release();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 REPORTING DATA SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ All reports now have meaningful data!');
    console.log('🔗 Test at: http://localhost:5174/reports\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedReportingData();
