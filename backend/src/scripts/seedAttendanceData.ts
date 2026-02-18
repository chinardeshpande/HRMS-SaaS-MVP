import { AppDataSource } from '../config/database';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';

interface AttendancePattern {
  absentRate: number;
  leaveRate: number;
  lateRate: number;
  checkInVarianceMin: number;
  checkInVarianceMax: number;
  minWorkMinutes: number;
  maxWorkMinutes: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(h =>
    h.getDate() === date.getDate() &&
    h.getMonth() === date.getMonth() &&
    h.getFullYear() === date.getFullYear()
  );
}

function getEmployeePattern(employee: Employee): AttendancePattern {
  const index = parseInt(employee.employeeCode.replace('EMP', ''));

  // 70% punctual employees
  if (index % 10 < 7) {
    return {
      absentRate: 0.02,
      leaveRate: 0.03,
      lateRate: 0.05,
      checkInVarianceMin: -15,
      checkInVarianceMax: 10,
      minWorkMinutes: 470,
      maxWorkMinutes: 520,
    };
  }
  // 20% occasionally late
  else if (index % 10 < 9) {
    return {
      absentRate: 0.03,
      leaveRate: 0.05,
      lateRate: 0.20,
      checkInVarianceMin: -5,
      checkInVarianceMax: 30,
      minWorkMinutes: 450,
      maxWorkMinutes: 510,
    };
  }
  // 10% problematic
  else {
    return {
      absentRate: 0.10,
      leaveRate: 0.05,
      lateRate: 0.40,
      checkInVarianceMin: 0,
      checkInVarianceMax: 60,
      minWorkMinutes: 420,
      maxWorkMinutes: 490,
    };
  }
}

function generateWorkingDayRecord(
  employee: Employee,
  date: Date,
  policy: AttendancePolicy,
  pattern: AttendancePattern
): Partial<Attendance> {
  const [stdHour, stdMin] = policy.standardCheckIn.split(':').map(Number);
  const variance = randomInt(pattern.checkInVarianceMin, pattern.checkInVarianceMax);

  const checkIn = new Date(date);
  checkIn.setHours(stdHour, stdMin + variance, 0, 0);

  const workMinutes = randomInt(pattern.minWorkMinutes, pattern.maxWorkMinutes);
  const checkOut = new Date(checkIn);
  checkOut.setMinutes(checkOut.getMinutes() + workMinutes);

  const stdMinutes = stdHour * 60 + stdMin;
  const actualMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
  const isLate = actualMinutes > stdMinutes + policy.lateGraceMinutes;
  const lateMinutes = isLate ? actualMinutes - stdMinutes : 0;

  const overtimeMinutes = Math.max(0, workMinutes - policy.requiredWorkMinutes);
  const status = workMinutes < policy.halfDayMinutes
    ? AttendanceStatus.HALF_DAY
    : AttendanceStatus.PRESENT;

  return {
    employeeId: employee.employeeId,
    tenantId: employee.tenantId,
    date: date,
    checkIn: checkIn,
    checkOut: checkOut,
    workMinutes: workMinutes,
    status: status,
    isLate: isLate,
    lateMinutes: lateMinutes,
    overtimeMinutes: overtimeMinutes,
    isManualOverride: false,
  };
}

function generateDailyAttendance(
  employee: Employee,
  date: Date,
  policy: AttendancePolicy,
  pattern: AttendancePattern,
  holidays: Date[]
): Partial<Attendance> {
  const dayOfWeek = date.getDay();

  // Weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      employeeId: employee.employeeId,
      tenantId: employee.tenantId,
      date: date,
      status: AttendanceStatus.WEEKEND,
      workMinutes: 0,
    };
  }

  // Holiday
  if (isHoliday(date, holidays)) {
    return {
      employeeId: employee.employeeId,
      tenantId: employee.tenantId,
      date: date,
      status: AttendanceStatus.HOLIDAY,
      workMinutes: 0,
      notes: 'Company Holiday',
    };
  }

  const random = Math.random();

  // Absent
  if (random < pattern.absentRate) {
    return {
      employeeId: employee.employeeId,
      tenantId: employee.tenantId,
      date: date,
      status: AttendanceStatus.ABSENT,
      workMinutes: 0,
    };
  }

  // On Leave
  if (random < pattern.absentRate + pattern.leaveRate) {
    return {
      employeeId: employee.employeeId,
      tenantId: employee.tenantId,
      date: date,
      status: AttendanceStatus.ON_LEAVE,
      workMinutes: 0,
    };
  }

  // Working day
  return generateWorkingDayRecord(employee, date, policy, pattern);
}

function generateAttendanceRecords(
  employees: Employee[],
  policy: AttendancePolicy,
  startDate: Date,
  endDate: Date
): Partial<Attendance>[] {
  const records: Partial<Attendance>[] = [];

  // Define holidays
  const holidays: Date[] = [
    new Date('2024-12-25'), // Christmas
    new Date('2025-01-01'), // New Year
  ];

  for (const employee of employees) {
    const pattern = getEmployeePattern(employee);
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const record = generateDailyAttendance(
        employee,
        new Date(currentDate),
        policy,
        pattern,
        holidays
      );
      records.push(record);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return records;
}

async function seedAttendanceData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const policyRepo = AppDataSource.getRepository(AttendancePolicy);

    console.log('📊 Fetching tenant and employees...');
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });

    if (!tenant) {
      console.error('❌ Tenant not found! Please run seedTestData.ts first.');
      process.exit(1);
    }

    const employees = await employeeRepo.find({ where: { tenantId: tenant.tenantId } });

    if (employees.length === 0) {
      console.error('❌ No employees found! Please run seedTestData.ts first.');
      process.exit(1);
    }

    console.log(`✅ Found ${employees.length} employees`);

    const policy = await policyRepo.findOne({ where: { tenantId: tenant.tenantId } });

    if (!policy) {
      console.error('❌ Attendance policy not found! Please run seedTestData.ts first.');
      process.exit(1);
    }

    console.log('✅ Found attendance policy');

    // Generate 60 days of attendance data (ending today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    console.log(`📅 Generating attendance records from ${startDate.toDateString()} to ${endDate.toDateString()}...`);

    const records = generateAttendanceRecords(employees, policy, startDate, endDate);

    console.log(`💾 Saving ${records.length} attendance records...`);

    // Save in batches for better performance
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await attendanceRepo.save(batch);
      console.log(`   Saved ${Math.min(i + batchSize, records.length)}/${records.length} records`);
    }

    console.log('\n✅ Attendance data seeded successfully!');

    // Show statistics
    const totalRecords = await attendanceRepo.count();
    const presentRecords = await attendanceRepo.count({ where: { status: AttendanceStatus.PRESENT } });
    const lateRecords = await attendanceRepo.count({ where: { isLate: true } });
    const absentRecords = await attendanceRepo.count({ where: { status: AttendanceStatus.ABSENT } });
    const leaveRecords = await attendanceRepo.count({ where: { status: AttendanceStatus.ON_LEAVE } });
    const weekendRecords = await attendanceRepo.count({ where: { status: AttendanceStatus.WEEKEND } });
    const holidayRecords = await attendanceRepo.count({ where: { status: AttendanceStatus.HOLIDAY } });

    console.log('\n=====================================');
    console.log('ATTENDANCE DATA STATISTICS');
    console.log('=====================================');
    console.log(`Total Records:    ${totalRecords}`);
    console.log(`Present:          ${presentRecords}`);
    console.log(`Late Arrivals:    ${lateRecords}`);
    console.log(`Absent:           ${absentRecords}`);
    console.log(`On Leave:         ${leaveRecords}`);
    console.log(`Weekends:         ${weekendRecords}`);
    console.log(`Holidays:         ${holidayRecords}`);
    console.log('=====================================\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding attendance data:', error);
    process.exit(1);
  }
}

seedAttendanceData();
