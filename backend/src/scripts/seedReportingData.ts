import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { Attendance } from '../models/Attendance';
import { LeaveRequest } from '../models/LeaveRequest';
import { LeaveBalance } from '../models/LeaveBalance';
import { PerformanceReview } from '../models/PerformanceReview';
import { ProbationCase } from '../models/ProbationCase';
import { ExitCase } from '../models/ExitCase';
import { LeaveType } from '../models/LeavePolicy';
import { AttendanceStatus } from '../models/Attendance';
import { LeaveStatus } from '../models/LeaveRequest';
import { PerformanceState } from '../models/PerformanceReview';
import { ProbationState } from '../models/ProbationState';
import { ExitState } from '../models/enums/ExitState';

async function seedReportingData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get first tenant and department
    const tenant = await AppDataSource.getRepository('Tenant').findOne({ where: {} });
    if (!tenant) {
      console.error('❌ No tenant found. Please run seed data first.');
      return;
    }

    const tenantId = tenant.tenantId;
    console.log('📊 Using tenant:', tenantId);

    // Get or create departments
    const deptRepo = AppDataSource.getRepository(Department);
    let departments = await deptRepo.find({ where: { tenantId } });

    if (departments.length === 0) {
      console.log('Creating departments...');
      const deptData = [
        { name: 'Engineering', tenantId },
        { name: 'Sales', tenantId },
        { name: 'Marketing', tenantId },
        { name: 'HR', tenantId },
        { name: 'Finance', tenantId },
      ];
      departments = await deptRepo.save(deptData);
    }

    console.log(`✅ Using ${departments.length} departments`);

    // Get existing employees or create sample ones
    const empRepo = AppDataSource.getRepository(Employee);
    let employees = await empRepo.find({ where: { tenantId }, take: 20 });

    if (employees.length < 10) {
      console.log('Creating sample employees...');
      const sampleEmployees = [];
      const names = [
        'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown',
        'Emily Davis', 'Robert Miller', 'Lisa Wilson', 'James Moore', 'Mary Taylor',
        'Christopher Anderson', 'Patricia Thomas', 'Daniel Jackson', 'Jennifer White',
        'Matthew Harris', 'Linda Martin', 'Anthony Thompson', 'Elizabeth Garcia',
      ];

      for (let i = 0; i < names.length && i < 15; i++) {
        const [firstName, lastName] = names[i].split(' ');
        const dept = departments[i % departments.length];
        const joiningDate = new Date();
        joiningDate.setMonth(joiningDate.getMonth() - Math.floor(Math.random() * 24));

        sampleEmployees.push({
          tenantId,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
          employeeCode: `EMP${String(i + 1).padStart(4, '0')}`,
          departmentId: dept.departmentId,
          status: i < 12 ? 'active' : 'exited',
          employmentType: i % 3 === 0 ? 'contract' : 'full_time',
          dateOfJoining: joiningDate,
          probationEndDate: i < 5 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        });
      }

      employees = await empRepo.save(sampleEmployees);
    }

    console.log(`✅ Using ${employees.length} employees`);

    // Create Attendance Data (last 3 months)
    const attRepo = AppDataSource.getRepository(Attendance);
    const existingAtt = await attRepo.count({ where: { tenantId } });

    if (existingAtt < 100) {
      console.log('Creating attendance data...');
      const attendanceData = [];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      for (const emp of employees.slice(0, 10)) {
        for (let day = 0; day < 60; day++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + day);

          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          const isLate = Math.random() < 0.15;
          attendanceData.push({
            tenantId,
            employeeId: emp.employeeId,
            date,
            status: Math.random() < 0.95 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            checkIn: new Date(date.setHours(9, Math.floor(Math.random() * 30))),
            checkOut: new Date(date.setHours(18, Math.floor(Math.random() * 60))),
            isLate,
            lateMinutes: isLate ? Math.floor(Math.random() * 30) : 0,
            workMinutes: 8 * 60 + Math.floor(Math.random() * 60),
            overtimeMinutes: Math.random() < 0.2 ? Math.floor(Math.random() * 120) : 0,
          });
        }
      }

      await attRepo.save(attendanceData);
      console.log(`✅ Created ${attendanceData.length} attendance records`);
    }

    // Create Leave Balances
    const leaveBalRepo = AppDataSource.getRepository(LeaveBalance);
    const existingLeave = await leaveBalRepo.count({ where: { tenantId } });

    if (existingLeave < 10) {
      console.log('Creating leave balances...');
      const leaveBalances = [];
      const currentYear = new Date().getFullYear();

      for (const emp of employees.slice(0, 10)) {
        leaveBalances.push({
          tenantId,
          employeeId: emp.employeeId,
          policyId: tenant.tenantId, // Using tenantId as dummy policyId
          leaveType: LeaveType.ANNUAL,
          year: currentYear,
          totalAllocated: 20,
          used: Math.floor(Math.random() * 10),
          pending: Math.floor(Math.random() * 3),
          carriedForward: Math.floor(Math.random() * 5),
        });

        leaveBalances.push({
          tenantId,
          employeeId: emp.employeeId,
          policyId: tenant.tenantId,
          leaveType: LeaveType.SICK,
          year: currentYear,
          totalAllocated: 12,
          used: Math.floor(Math.random() * 5),
          pending: 0,
          carriedForward: 0,
        });
      }

      await leaveBalRepo.save(leaveBalances);
      console.log(`✅ Created ${leaveBalances.length} leave balances`);
    }

    // Create Leave Requests
    const leaveReqRepo = AppDataSource.getRepository(LeaveRequest);
    const existingReq = await leaveReqRepo.count({ where: { tenantId } });

    if (existingReq < 10) {
      console.log('Creating leave requests...');
      const leaveRequests = [];

      for (const emp of employees.slice(0, 8)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

        leaveRequests.push({
          tenantId,
          employeeId: emp.employeeId,
          leaveType: Math.random() < 0.7 ? LeaveType.ANNUAL : LeaveType.SICK,
          startDate,
          endDate,
          numberOfDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
          reason: 'Personal reasons',
          status: Math.random() < 0.7 ? LeaveStatus.APPROVED : LeaveStatus.PENDING,
        });
      }

      await leaveReqRepo.save(leaveRequests);
      console.log(`✅ Created ${leaveRequests.length} leave requests`);
    }

    // Create Performance Reviews
    const perfRepo = AppDataSource.getRepository(PerformanceReview);
    const existingPerf = await perfRepo.count({ where: { tenantId } });

    if (existingPerf < 5) {
      console.log('Creating performance reviews...');
      const reviews = [];
      const reviewer = employees[0];

      for (const emp of employees.slice(1, 11)) {
        reviews.push({
          tenantId,
          employeeId: emp.employeeId,
          reviewerId: reviewer.employeeId,
          reviewCycle: '2026',
          reviewStartDate: new Date('2026-01-01'),
          reviewEndDate: new Date('2026-12-31'),
          currentState: Math.random() < 0.5 ? PerformanceState.CYCLE_COMPLETE : PerformanceState.ANNUAL_REVIEW_PENDING,
        });
      }

      await perfRepo.save(reviews);
      console.log(`✅ Created ${reviews.length} performance reviews`);
    }

    // Create Probation Cases
    const probRepo = AppDataSource.getRepository(ProbationCase);
    const existingProb = await probRepo.count({ where: { tenantId } });

    if (existingProb < 5) {
      console.log('Creating probation cases...');
      const probations = [];

      for (const emp of employees.slice(0, 5)) {
        const startDate = emp.dateOfJoining;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 90);

        probations.push({
          tenantId,
          employeeId: emp.employeeId,
          currentState: ProbationState.PROBATION_ACTIVE,
          probationStartDate: startDate,
          probationEndDate: endDate,
          probationDurationDays: 90,
        });
      }

      await probRepo.save(probations);
      console.log(`✅ Created ${probations.length} probation cases`);
    }

    // Create Exit Cases
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const existingExit = await exitRepo.count({ where: { tenantId } });

    if (existingExit < 3) {
      console.log('Creating exit cases...');
      const exits = [];
      const exitedEmployees = employees.filter(e => e.status === 'exited');

      for (const emp of exitedEmployees.slice(0, 3)) {
        const lastWorkingDate = new Date();
        lastWorkingDate.setMonth(lastWorkingDate.getMonth() - Math.floor(Math.random() * 6));

        exits.push({
          tenantId,
          employeeId: emp.employeeId,
          currentState: ExitState.EXIT_COMPLETE,
          resignationType: Math.random() < 0.7 ? 'voluntary' : 'involuntary',
          lastWorkingDate,
          initiatedBy: emp.employeeId,
        });
      }

      await exitRepo.save(exits);
      console.log(`✅ Created ${exits.length} exit cases`);
    }

    console.log('\n🎉 Reporting data seeded successfully!');
    console.log('📊 You can now generate reports with meaningful data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedReportingData();
