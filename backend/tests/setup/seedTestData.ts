import { AppDataSource } from '../../src/config/database';
import { Attendance, AttendanceStatus } from '../../src/models/Attendance';
import { CompanyDocument, CompanyDocumentCategory, CompanyDocumentStatus, CompanyDocumentVerificationStatus } from '../../src/models/CompanyDocument';
import { Department } from '../../src/models/Department';
import { Designation } from '../../src/models/Designation';
import { DocumentCategory } from '../../src/models/DocumentCategory';
import { Employee } from '../../src/models/Employee';
import { EmployeeDocument, EmployeeDocumentCategory, EmployeeDocumentStatus, EmployeeDocumentVerificationStatus } from '../../src/models/EmployeeDocument';
import { LeaveBalance } from '../../src/models/LeaveBalance';
import { LeavePolicy, LeaveType } from '../../src/models/LeavePolicy';
import { LeaveRequest, LeaveStatus } from '../../src/models/LeaveRequest';
import { Payslip, PayslipStatus } from '../../src/models/Payslip';
import { PayslipAttachment } from '../../src/models/PayslipAttachment';
import { PayslipComponent } from '../../src/models/PayslipComponent';
import { SalaryComponent, SalaryComponentType } from '../../src/models/SalaryComponent';
import {
  SalaryApprovalStatus,
  SalaryStructure,
  SalaryStructureStatus,
} from '../../src/models/SalaryStructure';
import { Tenant } from '../../src/models/Tenant';
import { User } from '../../src/models/User';
import { EmploymentStatus, UserRole } from '../../../shared/types';

export const TEST_PASSWORD = 'ACV@2026!';

export const TEST_USERS = {
  SYSTEM_ADMIN: 'system.admin@acv.test',
  HR_ADMIN: 'hr.admin@acv.test',
  MANAGER: 'manager@acv.test',
  EMPLOYEE: 'employee@acv.test',
  SECOND_TENANT_ADMIN: 'admin@orbit.test',
};

const makeDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const saveEmployee = async (
  tenantId: string,
  data: Partial<Employee> & Pick<Employee, 'employeeCode' | 'firstName' | 'lastName' | 'email' | 'dateOfJoining'>
) => {
  const repo = AppDataSource.getRepository(Employee);
  const employee = repo.create({
      tenantId,
      phone: '9999999999',
      gender: 'female',
      employmentType: 'Full-Time',
      workLocation: 'Mira Road, Thane',
      status: EmploymentStatus.ACTIVE,
      ...data,
    }) as Employee;

  return repo.save(employee);
};

const saveUser = async (
  tenantId: string,
  email: string,
  fullName: string,
  role: UserRole,
  employeeId?: string
) => {
  const repo = AppDataSource.getRepository(User);
  const user = repo.create({
    tenantId,
    email,
    fullName,
    role,
    employeeId,
    isActive: true,
  }) as User;
  user.password = TEST_PASSWORD;
  return repo.save(user);
};

const seedTenant = async (companyName: string, subdomain: string) => {
  const repo = AppDataSource.getRepository(Tenant);
  return repo.save(
    repo.create({
      companyName,
      subdomain,
      planType: 'professional',
      status: 'active',
      primaryColor: '#7c3aed',
      isTrialActive: false,
      onboardingCompleted: true,
      employeeCount: 0,
      setupWizardCompleted: true,
    })
  );
};

const seedOrgMasters = async (tenantId: string) => {
  const departmentRepo = AppDataSource.getRepository(Department);
  const designationRepo = AppDataSource.getRepository(Designation);

  const management = await departmentRepo.save(departmentRepo.create({ tenantId, name: 'Management' }));
  const hr = await departmentRepo.save(departmentRepo.create({ tenantId, name: 'HR Operations' }));
  const engineering = await departmentRepo.save(departmentRepo.create({ tenantId, name: 'Technology' }));

  const director = await designationRepo.save(designationRepo.create({ tenantId, name: 'Director', level: 1 }));
  const hrAdmin = await designationRepo.save(designationRepo.create({ tenantId, name: 'HR Admin', level: 2 }));
  const techLead = await designationRepo.save(designationRepo.create({ tenantId, name: 'Technical Lead', level: 3 }));
  const engineer = await designationRepo.save(designationRepo.create({ tenantId, name: 'Software Engineer', level: 4 }));

  return { management, hr, engineering, director, hrAdmin, techLead, engineer };
};

const seedDocumentCategories = async (tenantId: string) => {
  const repo = AppDataSource.getRepository(DocumentCategory);
  await repo.save(
    [
      { tenantId, name: 'Identity', description: 'Employee identity documents', color: '#ede9fe', icon: 'id-card', isDefault: true },
      { tenantId, name: 'Employment Letters', description: 'Generated and uploaded HR letters', color: '#e0f2fe', icon: 'file-text', isDefault: true },
      { tenantId, name: 'Payslips', description: 'Compensation documents', color: '#dcfce7', icon: 'wallet', isDefault: true },
      { tenantId, name: 'Company Compliance', description: 'Company statutory and HR compliance documents', color: '#fef3c7', icon: 'building', isDefault: true },
    ].map((category) => repo.create(category))
  );
};

const seedLeave = async (
  tenantId: string,
  employee: Employee,
  manager: Employee,
  hrAdminUser: User
) => {
  const policyRepo = AppDataSource.getRepository(LeavePolicy);
  const balanceRepo = AppDataSource.getRepository(LeaveBalance);
  const requestRepo = AppDataSource.getRepository(LeaveRequest);
  const currentYear = new Date().getFullYear();

  const policies = await policyRepo.save(
    [
      { policyName: 'Sick Leave', leaveType: LeaveType.SICK, totalLeaves: 12, applicableGender: 'all' },
      { policyName: 'Casual Leave', leaveType: LeaveType.CASUAL, totalLeaves: 12, applicableGender: 'all' },
      { policyName: 'Earned Leave', leaveType: LeaveType.EARNED, totalLeaves: 21, applicableGender: 'all' },
      { policyName: 'Maternity Leave', leaveType: LeaveType.MATERNITY, totalLeaves: 182, applicableGender: 'female', minNoticeDays: 30 },
      { policyName: 'Paternity Leave', leaveType: LeaveType.PATERNITY, totalLeaves: 15, applicableGender: 'male', minNoticeDays: 7 },
    ].map((policy) =>
      policyRepo.create({
        tenantId,
        maxConsecutiveDays: policy.totalLeaves,
        carryForward: false,
        maxCarryForward: 0,
        encashable: false,
        requiresApproval: true,
        probationPeriod: 0,
        isActive: true,
        description: `${policy.policyName} test policy`,
        ...policy,
      })
    )
  );

  await balanceRepo.save(
    policies.map((policy) =>
      balanceRepo.create({
        tenantId,
        employeeId: employee.employeeId,
        policyId: policy.policyId,
        leaveType: policy.leaveType,
        year: currentYear,
        totalAllocated: policy.applicableGender === 'male' ? 0 : policy.totalLeaves,
        used: policy.leaveType === LeaveType.SICK ? 1 : 0,
        pending: 0,
        carriedForward: 0,
        encashed: 0,
      })
    )
  );

  await requestRepo.save(
    requestRepo.create({
      tenantId,
      employeeId: employee.employeeId,
      leaveType: LeaveType.SICK,
      startDate: makeDate(`${currentYear}-01-10`),
      endDate: makeDate(`${currentYear}-01-10`),
      numberOfDays: 1,
      reason: 'QA seed sick leave',
      status: LeaveStatus.APPROVED,
      approverId: manager.employeeId,
      approvedAt: makeDate(`${currentYear}-01-09`),
      approverComments: `Approved by ${hrAdminUser.fullName}`,
    })
  );
};

const seedAttendance = async (tenantId: string, employees: Employee[]) => {
  const repo = AppDataSource.getRepository(Attendance);
  const today = new Date();
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);

  const rows = employees.flatMap((employee, index) => [
    repo.create({
      tenantId,
      employeeId: employee.employeeId,
      date: todayDate,
      checkIn: new Date(`${todayDate.toISOString().slice(0, 10)}T09:30:00.000Z`),
      checkOut: new Date(`${todayDate.toISOString().slice(0, 10)}T18:15:00.000Z`),
      workMinutes: 525,
      status: AttendanceStatus.PRESENT,
      location: index % 2 === 0 ? 'Office' : 'WFH',
    }),
    repo.create({
      tenantId,
      employeeId: employee.employeeId,
      date: yesterdayDate,
      checkIn: new Date(`${yesterdayDate.toISOString().slice(0, 10)}T09:45:00.000Z`),
      checkOut: new Date(`${yesterdayDate.toISOString().slice(0, 10)}T18:00:00.000Z`),
      workMinutes: 495,
      status: AttendanceStatus.PRESENT,
      location: 'Office',
    }),
  ]);

  await repo.save(rows);
};

const seedDocuments = async (
  tenantId: string,
  employee: Employee,
  hrAdminUser: User
) => {
  const companyRepo = AppDataSource.getRepository(CompanyDocument);
  const employeeRepo = AppDataSource.getRepository(EmployeeDocument);

  await companyRepo.save(
    companyRepo.create({
      tenantId,
      title: 'ACV Certificate of Incorporation',
      category: CompanyDocumentCategory.INCORPORATION_IDENTITY,
      description: 'Seed company document for QA isolation checks',
      documentNumber: 'QA-COI-001',
      status: CompanyDocumentStatus.ACTIVE,
      verificationStatus: CompanyDocumentVerificationStatus.VERIFIED,
      fileName: 'qa-acv-coi.pdf',
      originalFileName: 'qa-acv-coi.pdf',
      fileUrl: '/uploads/test/qa-acv-coi.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedBy: hrAdminUser.userId,
      verifiedBy: hrAdminUser.userId,
      verifiedAt: new Date(),
      metadata: { source: 'qa-seed' },
    })
  );

  await employeeRepo.save(
    employeeRepo.create({
      tenantId,
      employeeId: employee.employeeId,
      title: 'QA Appointment Letter',
      category: EmployeeDocumentCategory.EMPLOYMENT_LETTER,
      description: 'Seed employee document for QA isolation checks',
      status: EmployeeDocumentStatus.ACTIVE,
      verificationStatus: EmployeeDocumentVerificationStatus.VERIFIED,
      fileName: 'qa-appointment-letter.pdf',
      originalFileName: 'qa-appointment-letter.pdf',
      fileUrl: '/uploads/test/qa-appointment-letter.pdf',
      fileType: 'application/pdf',
      fileSize: 2048,
      uploadedBy: hrAdminUser.userId,
      verifiedBy: hrAdminUser.userId,
      verifiedAt: new Date(),
      metadata: { source: 'qa-seed' },
    })
  );
};

const seedCompensation = async (
  tenantId: string,
  employee: Employee,
  hrAdmin: Employee
) => {
  const structureRepo = AppDataSource.getRepository(SalaryStructure);
  const componentRepo = AppDataSource.getRepository(SalaryComponent);
  const payslipRepo = AppDataSource.getRepository(Payslip);
  const payslipComponentRepo = AppDataSource.getRepository(PayslipComponent);
  const attachmentRepo = AppDataSource.getRepository(PayslipAttachment);

  const structure = await structureRepo.save(
    structureRepo.create({
      tenantId,
      employeeId: employee.employeeId,
      structureName: 'QA Current Salary Structure',
      effectiveFrom: makeDate('2026-01-01'),
      annualCtc: 720000,
      monthlyGross: 60000,
      monthlyNetEstimate: 52000,
      currency: 'INR',
      payFrequency: 'monthly',
      paymentMode: 'bank_transfer',
      status: SalaryStructureStatus.ACTIVE,
      approvalStatus: SalaryApprovalStatus.APPROVED,
      employeeVisible: true,
      createdBy: hrAdmin.employeeId,
      updatedBy: hrAdmin.employeeId,
    })
  );

  await componentRepo.save([
    componentRepo.create({
      tenantId,
      salaryStructureId: structure.structureId,
      componentName: 'Basic',
      componentType: SalaryComponentType.EARNING,
      monthlyAmount: 30000,
      annualAmount: 360000,
      displayOrder: 1,
    }),
    componentRepo.create({
      tenantId,
      salaryStructureId: structure.structureId,
      componentName: 'HRA',
      componentType: SalaryComponentType.EARNING,
      monthlyAmount: 15000,
      annualAmount: 180000,
      displayOrder: 2,
    }),
  ]);

  const payslip = await payslipRepo.save(
    payslipRepo.create({
      tenantId,
      employeeId: employee.employeeId,
      salaryStructureId: structure.structureId,
      month: 5,
      year: 2026,
      grossEarnings: 60000,
      totalDeductions: 8000,
      netPay: 52000,
      paidDays: 30,
      lopDays: 0,
      paymentDate: makeDate('2026-05-31'),
      status: PayslipStatus.FINAL,
      employeeVisible: true,
      generatedBy: hrAdmin.employeeId,
    })
  );

  await payslipComponentRepo.save([
    payslipComponentRepo.create({
      tenantId,
      payslipId: payslip.payslipId,
      componentName: 'Basic',
      componentType: SalaryComponentType.EARNING,
      amount: 30000,
      displayOrder: 1,
    }),
    payslipComponentRepo.create({
      tenantId,
      payslipId: payslip.payslipId,
      componentName: 'Professional Tax',
      componentType: SalaryComponentType.DEDUCTION,
      amount: 200,
      displayOrder: 10,
    }),
  ]);

  await attachmentRepo.save(
    attachmentRepo.create({
      tenantId,
      payslipId: payslip.payslipId,
      fileName: 'qa-may-2026-payslip.pdf',
      fileType: 'application/pdf',
      fileUrl: '/uploads/test/qa-may-2026-payslip.pdf',
      fileSize: 4096,
      uploadedBy: hrAdmin.employeeId,
      isPrimary: true,
      version: 1,
    })
  );
};

const seedAcvTenant = async () => {
  const acv = await seedTenant('ACV Solutions Pvt Ltd', 'acv-qa');
  const masters = await seedOrgMasters(acv.tenantId);

  const owner = await saveEmployee(acv.tenantId, {
    employeeCode: 'QA/ACV/0001',
    firstName: 'Chinar',
    lastName: 'Owner',
    email: TEST_USERS.SYSTEM_ADMIN,
    gender: 'male',
    departmentId: masters.management.departmentId,
    designationId: masters.director.designationId,
    dateOfJoining: makeDate('2024-01-01'),
  });
  const hrAdminEmployee = await saveEmployee(acv.tenantId, {
    employeeCode: 'QA/ACV/0002',
    firstName: 'Anupama',
    lastName: 'Bhat',
    email: TEST_USERS.HR_ADMIN,
    gender: 'female',
    departmentId: masters.hr.departmentId,
    designationId: masters.hrAdmin.designationId,
    managerId: owner.employeeId,
    dateOfJoining: makeDate('2024-01-01'),
  });
  const manager = await saveEmployee(acv.tenantId, {
    employeeCode: 'QA/ACV/0003',
    firstName: 'Aniket',
    lastName: 'Manager',
    email: TEST_USERS.MANAGER,
    gender: 'male',
    departmentId: masters.engineering.departmentId,
    designationId: masters.techLead.designationId,
    managerId: hrAdminEmployee.employeeId,
    dateOfJoining: makeDate('2024-03-01'),
  });
  const employee = await saveEmployee(acv.tenantId, {
    employeeCode: 'QA/ACV/0004',
    firstName: 'Surekha',
    lastName: 'Employee',
    email: TEST_USERS.EMPLOYEE,
    gender: 'female',
    departmentId: masters.engineering.departmentId,
    designationId: masters.engineer.designationId,
    managerId: manager.employeeId,
    dateOfJoining: makeDate('2024-06-01'),
  });

  const systemAdminUser = await saveUser(
    acv.tenantId,
    TEST_USERS.SYSTEM_ADMIN,
    'Chinar Owner',
    UserRole.SYSTEM_ADMIN,
    owner.employeeId
  );
  const hrAdminUser = await saveUser(
    acv.tenantId,
    TEST_USERS.HR_ADMIN,
    'Anupama Bhat',
    UserRole.HR_ADMIN,
    hrAdminEmployee.employeeId
  );
  await saveUser(acv.tenantId, TEST_USERS.MANAGER, 'Aniket Manager', UserRole.MANAGER, manager.employeeId);
  await saveUser(acv.tenantId, TEST_USERS.EMPLOYEE, 'Surekha Employee', UserRole.EMPLOYEE, employee.employeeId);

  await seedDocumentCategories(acv.tenantId);
  await seedDocuments(acv.tenantId, employee, hrAdminUser);
  await seedCompensation(acv.tenantId, employee, hrAdminEmployee);
  await seedAttendance(acv.tenantId, [owner, hrAdminEmployee, manager, employee]);
  await seedLeave(acv.tenantId, employee, manager, hrAdminUser);

  return { tenant: acv, systemAdminUser };
};

const seedSecondTenant = async () => {
  const tenant = await seedTenant('Orbit QA Isolation Ltd', 'orbit-qa');
  const masters = await seedOrgMasters(tenant.tenantId);
  const employee = await saveEmployee(tenant.tenantId, {
    employeeCode: 'QA/ORB/0001',
    firstName: 'Orbit',
    lastName: 'Admin',
    email: TEST_USERS.SECOND_TENANT_ADMIN,
    gender: 'male',
    departmentId: masters.management.departmentId,
    designationId: masters.director.designationId,
    dateOfJoining: makeDate('2025-01-01'),
  });
  const user = await saveUser(
    tenant.tenantId,
    TEST_USERS.SECOND_TENANT_ADMIN,
    'Orbit Admin',
    UserRole.SYSTEM_ADMIN,
    employee.employeeId
  );
  await seedDocumentCategories(tenant.tenantId);

  const companyRepo = AppDataSource.getRepository(CompanyDocument);
  await companyRepo.save(
    companyRepo.create({
      tenantId: tenant.tenantId,
      title: 'Orbit Confidential Seed Document',
      category: CompanyDocumentCategory.OTHER,
      status: CompanyDocumentStatus.ACTIVE,
      verificationStatus: CompanyDocumentVerificationStatus.UNVERIFIED,
      fileName: 'orbit-confidential.pdf',
      originalFileName: 'orbit-confidential.pdf',
      fileUrl: '/uploads/test/orbit-confidential.pdf',
      fileType: 'application/pdf',
      fileSize: 512,
      uploadedBy: user.userId,
      metadata: { source: 'qa-seed' },
    })
  );

  return { tenant, user };
};

export async function seedQaFoundationData() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await seedAcvTenant();
  await seedSecondTenant();
}
