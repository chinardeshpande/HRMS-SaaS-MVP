import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { LeaveRequest, LeaveStatus } from '../models/LeaveRequest';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeaveType } from '../models/LeavePolicy';
import { PerformanceReview } from '../models/PerformanceReview';
import { PerformanceState } from '../models/PerformanceReview';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationState } from '../models/enums/ProbationState';
import { ExitCase } from '../models/ExitCase';
import { ExitState } from '../models/enums/ExitState';
import { ResignationType } from '../models/enums/ResignationType';

async function seedReportingData() {
  try {
    console.log('🌱 Starting reporting data seed...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get first tenant
    const tenantRepo = AppDataSource.getRepository('Tenant');
    const tenant = await tenantRepo.createQueryBuilder('tenant').getOne();

    if (!tenant) {
      console.error('❌ No tenant found. Run: npm run seed');
      process.exit(1);
    }

    const tenantId = tenant.tenantId;
    console.log(`📊 Using tenant: ${tenant.companyName} (${tenantId})\n`);

    // Get or create departments
    const deptRepo = AppDataSource.getRepository(Department);
    let departments = await deptRepo.find({ where: { tenantId } });

    if (departments.length === 0) {
      console.log('📁 Creating departments...');
      const deptNames = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
      for (const name of deptNames) {
        const dept = deptRepo.create({ name, tenantId });
        departments.push(await deptRepo.save(dept));
      }
      console.log(`✅ Created ${departments.length} departments\n`);
    } else {
      console.log(`✅ Found ${departments.length} departments\n`);
    }

    // Create employees
    const empRepo = AppDataSource.getRepository(Employee);
    let employees = await empRepo.find({ where: { tenantId }, take: 30 });

    if (employees.length < 15) {
      console.log('👥 Creating sample employees...');

      const names = [
        'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown',
        'Emily Davis', 'Robert Miller', 'Lisa Wilson', 'James Moore', 'Mary Taylor',
        'Chris Anderson', 'Patricia Thomas', 'Daniel Jackson', 'Jennifer White',
        'Matthew Harris', 'Linda Martin', 'Anthony Garcia', 'Elizabeth Martinez',
        'Mark Rodriguez', 'Nancy Lee'
      ];

      const newEmployees = [];
      for (let i = 0; i < Math.min(names.length, 20); i++) {
        const [firstName, lastName] = names[i].split(' ');
        const dept = departments[i % departments.length];

        const joiningDate = new Date();
        joiningDate.setMonth(joiningDate.getMonth() - Math.floor(Math.random() * 24)); // Joined in last 2 years

        const probationEndDate = new Date(joiningDate);
        probationEndDate.setDate(probationEndDate.getDate() + 90);

        const isActive = i < 17; // 17 active, 3 exited

        const emp = empRepo.create({
          tenantId,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
          employeeCode: `EMP${String(i + 1).padStart(4, '0')}`,
          departmentId: dept.departmentId,
          status: isActive ? 'active' : 'exited',
          employmentType: i % 4 === 0 ? 'contract' : 'full_time',
          dateOfJoining: joiningDate,
          probationEndDate: i < 5 && isActive ? probationEndDate : undefined,
        });

        newEmployees.push(await empRepo.save(emp));
      }

      employees = newEmployees;
      console.log(`✅ Created ${employees.length} employees\n`);
    } else {
      console.log(`✅ Found ${employees.length} employees\n`);
    }

    // Create Attendance Records (last 90 days)
    const attRepo = AppDataSource.getRepository(Attendance);
    const attCount = await attRepo.count({ where: { tenantId } });

    if (attCount < 200) {
      console.log('📅 Creating attendance records (last 90 days)...');

      const activeEmployees = employees.filter(e => e.status === 'active').slice(0, 15);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      let count = 0;
      for (const emp of activeEmployees) {
        for (let day = 0; day < 90; day++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + day);

          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          const isPresent = Math.random() < 0.95; // 95% attendance
          const isLate = isPresent && Math.random() < 0.15; // 15% late when present

          const checkInHour = isLate ? 9 : 8;
          const checkInMinute = isLate ? Math.floor(Math.random() * 45) + 15 : Math.floor(Math.random() * 30);

          const att = attRepo.create({
            tenantId,
            employeeId: emp.employeeId,
            date,
            status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            checkIn: isPresent ? new Date(date.setHours(checkInHour, checkInMinute)) : undefined,
            checkOut: isPresent ? new Date(date.setHours(17, 30 + Math.floor(Math.random() * 60))) : undefined,
            isLate,
            lateMinutes: isLate ? Math.floor(Math.random() * 45) : 0,
            workMinutes: isPresent ? 480 + Math.floor(Math.random() * 60) : 0,
            overtimeMinutes: isPresent && Math.random() < 0.2 ? Math.floor(Math.random() * 120) : 0,
          });

          await attRepo.save(att);
          count++;
        }
      }

      console.log(`✅ Created ${count} attendance records\n`);
    } else {
      console.log(`✅ Found ${attCount} attendance records\n`);
    }

    // Create Leave Balances
    const leaveBalRepo = AppDataSource.getRepository(LeaveBalance);
    const leaveBelCount = await leaveBalRepo.count({ where: { tenantId } });

    if (leaveBelCount < 20) {
      console.log('🏖️  Creating leave balances...');

      const activeEmployees = employees.filter(e => e.status === 'active');
      const currentYear = new Date().getFullYear();

      for (const emp of activeEmployees) {
        // Earned Leave
        await leaveBalRepo.save(leaveBalRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          policyId: tenantId, // Using tenantId as policyId for now
          leaveType: LeaveType.EARNED,
          year: currentYear,
          totalAllocated: 20,
          used: Math.floor(Math.random() * 10),
          pending: Math.floor(Math.random() * 3),
          carriedForward: Math.floor(Math.random() * 5),
        }));

        // Sick Leave
        await leaveBalRepo.save(leaveBalRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          policyId: tenantId,
          leaveType: LeaveType.SICK,
          year: currentYear,
          totalAllocated: 12,
          used: Math.floor(Math.random() * 6),
          pending: 0,
          carriedForward: 0,
        }));

        // Casual Leave
        await leaveBalRepo.save(leaveBalRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          policyId: tenantId,
          leaveType: LeaveType.CASUAL,
          year: currentYear,
          totalAllocated: 10,
          used: Math.floor(Math.random() * 5),
          pending: Math.floor(Math.random() * 2),
          carriedForward: 0,
        }));
      }

      console.log(`✅ Created leave balances for ${activeEmployees.length} employees\n`);
    } else {
      console.log(`✅ Found ${leaveBelCount} leave balances\n`);
    }

    // Create Leave Requests
    const leaveReqRepo = AppDataSource.getRepository(LeaveRequest);
    const leaveReqCount = await leaveReqRepo.count({ where: { tenantId } });

    if (leaveReqCount < 15) {
      console.log('📝 Creating leave requests...');

      const activeEmployees = employees.filter(e => e.status === 'active').slice(0, 10);

      for (const emp of activeEmployees) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30); // +/- 30 days
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 4) + 1);

        await leaveReqRepo.save(leaveReqRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          leaveType: Math.random() < 0.5 ? LeaveType.EARNED : LeaveType.SICK,
          startDate,
          endDate,
          numberOfDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          reason: 'Personal reasons',
          status: Math.random() < 0.7 ? LeaveStatus.APPROVED : LeaveStatus.PENDING,
        }));
      }

      console.log(`✅ Created ${activeEmployees.length} leave requests\n`);
    } else {
      console.log(`✅ Found ${leaveReqCount} leave requests\n`);
    }

    // Create Performance Reviews
    const perfRepo = AppDataSource.getRepository(PerformanceReview);
    const perfCount = await perfRepo.count({ where: { tenantId } });

    if (perfCount < 10) {
      console.log('⭐ Creating performance reviews...');

      const activeEmployees = employees.filter(e => e.status === 'active');
      const reviewer = activeEmployees[0];

      for (const emp of activeEmployees.slice(1, 13)) {
        await perfRepo.save(perfRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          reviewerId: reviewer.employeeId,
          reviewCycle: '2026',
          reviewStartDate: new Date('2026-01-01'),
          reviewEndDate: new Date('2026-12-31'),
          currentState: Math.random() < 0.4 ? PerformanceState.CYCLE_COMPLETE : PerformanceState.ANNUAL_REVIEW_PENDING,
        }));
      }

      console.log(`✅ Created performance reviews\n`);
    } else {
      console.log(`✅ Found ${perfCount} performance reviews\n`);
    }

    // Create Probation Cases
    const probRepo = AppDataSource.getRepository(ProbationCase);
    const probCount = await probRepo.count({ where: { tenantId } });

    if (probCount < 5) {
      console.log('📋 Creating probation cases...');

      const probationEmployees = employees.filter(e => e.probationEndDate).slice(0, 5);

      for (const emp of probationEmployees) {
        const startDate = emp.dateOfJoining;
        const endDate = emp.probationEndDate!;

        await probRepo.save(probRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          currentState: ProbationState.PROBATION_ACTIVE,
          probationStartDate: startDate,
          probationEndDate: endDate,
          probationDurationDays: 90,
        }));
      }

      console.log(`✅ Created ${probationEmployees.length} probation cases\n`);
    } else {
      console.log(`✅ Found ${probCount} probation cases\n`);
    }

    // Create Exit Cases
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const exitCount = await exitRepo.count({ where: { tenantId } });

    if (exitCount < 3) {
      console.log('🚪 Creating exit cases...');

      const exitedEmployees = employees.filter(e => e.status === 'exited').slice(0, 3);

      for (const emp of exitedEmployees) {
        const lastWorkingDate = new Date();
        lastWorkingDate.setMonth(lastWorkingDate.getMonth() - Math.floor(Math.random() * 6) - 1);

        await exitRepo.save(exitRepo.create({
          tenantId,
          employeeId: emp.employeeId,
          currentState: ExitState.EXIT_COMPLETED,
          resignationType: Math.random() < 0.7 ? ResignationType.VOLUNTARY : ResignationType.INVOLUNTARY,
          lastWorkingDate,
          initiatedBy: emp.employeeId,
        }));
      }

      console.log(`✅ Created ${exitedEmployees.length} exit cases\n`);
    } else {
      console.log(`✅ Found ${exitCount} exit cases\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 REPORTING DATA SEEDED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Employees: ${employees.length}`);
    console.log(`   • Attendance records: ${attCount || 'Created'}`);
    console.log(`   • Leave balances: Created`);
    console.log(`   • Leave requests: Created`);
    console.log(`   • Performance reviews: Created`);
    console.log(`   • Probation cases: Created`);
    console.log(`   • Exit cases: Created\n`);
    console.log('✅ All reports now have meaningful data!');
    console.log('🔗 Test at: http://localhost:5174/reports\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedReportingData();
