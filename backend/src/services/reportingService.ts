import { Repository, Between, In, MoreThan, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { LeaveRequest } from '../models/LeaveRequest';
import { LeaveBalance } from '../models/LeaveBalance';
import { Department } from '../models/Department';
import { ProbationCase } from '../models/ProbationCase';
import { PerformanceReview } from '../models/PerformanceReview';
import { ExitCase } from '../models/ExitCase';
import {
  CompanyDocument,
  CompanyDocumentCategory,
  CompanyDocumentStatus,
  CompanyDocumentVerificationStatus,
} from '../models/CompanyDocument';
import {
  EmployeeDocument,
  EmployeeDocumentCategory,
  EmployeeDocumentStatus,
  EmployeeDocumentVerificationStatus,
} from '../models/EmployeeDocument';
import { SalaryStructure, SalaryStructureStatus } from '../models/SalaryStructure';
import { Payslip } from '../models/Payslip';
import { SavedReport, ReportType } from '../models/SavedReport';
import logger from '../utils/logger';
import { UserRole } from '../../../shared/types';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  departmentIds?: string[];
  employmentTypes?: string[];
  status?: string[];
  locations?: string[];
}

export interface ReportAccessContext {
  tenantId: string;
  userRole: UserRole;
  employeeId?: string;
}

export interface AttendanceSummaryData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  onLeaveDays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}

export interface LeaveBalanceData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  totalEntitlement: number;
  used: number;
  pending: number;
  available: number;
  carriedForward?: number;
}

const normalizeGender = (gender?: string | null): string | undefined => {
  const normalized = gender?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['m', 'male'].includes(normalized)) return 'male';
  if (['f', 'female'].includes(normalized)) return 'female';
  return normalized;
};

const requiredGenderForLeaveType = (leaveType?: string | null): 'male' | 'female' | undefined => {
  if (leaveType === 'maternity') return 'female';
  if (leaveType === 'paternity') return 'male';
  return undefined;
};

const isGenderEligibleForLeaveType = (leaveType?: string | null, gender?: string | null): boolean => {
  const requiredGender = requiredGenderForLeaveType(leaveType);
  if (!requiredGender) return true;
  return normalizeGender(gender) === requiredGender;
};

export interface HeadcountData {
  department: string;
  employmentType: string;
  status: string;
  count: number;
  percentage: number;
}

export interface JoinersLeaversData {
  month: string;
  joiners: number;
  leavers: number;
  netChange: number;
  openingHeadcount: number;
  closingHeadcount: number;
}

export interface ConfirmationDueData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  dateOfJoining: Date;
  probationEndDate: Date;
  daysRemaining: number;
  status: string;
  reviewStatus?: string;
}

export interface AttritionData {
  month: string;
  department: string;
  totalEmployees: number;
  exits: number;
  attritionRate: number;
  voluntaryExits: number;
  involuntaryExits: number;
}

export interface PMSCompletionData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  manager: string;
  reviewCycle: string;
  status: string;
  dueDate: Date;
  completedDate?: Date;
  overdueDays?: number;
}

export interface MissingDocumentsData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  missingDocuments: string[];
  missingInformation: string[];
  documentCount: number;
  informationGapCount: number;
  totalGapCount: number;
  criticality: 'high' | 'medium' | 'low';
}

export interface MemoryReadinessData {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  missingMasterFields: string;
  missingRequiredDocuments: string;
  recommendedDocumentGaps: string;
  unverifiedDocuments: number;
  salaryStructureStatus: 'present' | 'missing';
  payslipStatus: 'present' | 'missing';
  payslipRecords: number;
  payslipRecordsMissingAttachments: number;
  payslipAttachmentStatus: 'complete' | 'missing_attachments' | 'not_applicable';
  employeeStatus: string;
  readinessStatus: 'complete' | 'needs_review' | 'critical';
}

export interface MemoryReadinessReport {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    exitedEmployees: number;
    inactiveEmployeesNeedingExitClassification: number;
    readinessScore: number;
    completeEmployees: number;
    needsReviewEmployees: number;
    criticalEmployees: number;
    employeesWithMissingMasterData: number;
    employeesMissingRequiredDocuments: number;
    unverifiedEmployeeDocuments: number;
    companyDocuments: number;
    unverifiedCompanyDocuments: number;
    expiringCompanyDocuments60Days: number;
    employeesWithoutSalaryStructure: number;
    employeesWithoutPayslip: number;
    payslipRecords: number;
    payslipRecordsWithAttachments: number;
    payslipRecordsMissingAttachments: number;
    employeesWithPayslipRecordsMissingAttachments: number;
  };
  results: MemoryReadinessData[];
  companyDocumentFindings: Array<{
    category: string;
    status: 'present' | 'missing';
    activeDocuments: number;
    verifiedDocuments: number;
  }>;
}

export class ReportingService {
  private employeeRepo: Repository<Employee>;
  private attendanceRepo: Repository<Attendance>;
  private leaveRequestRepo: Repository<LeaveRequest>;
  private leaveBalanceRepo: Repository<LeaveBalance>;
  private departmentRepo: Repository<Department>;
  private probationRepo: Repository<ProbationCase>;
  private performanceReviewRepo: Repository<PerformanceReview>;
  private exitRepo: Repository<ExitCase>;
  private companyDocumentRepo: Repository<CompanyDocument>;
  private employeeDocumentRepo: Repository<EmployeeDocument>;
  private salaryStructureRepo: Repository<SalaryStructure>;
  private payslipRepo: Repository<Payslip>;
  private savedReportRepo: Repository<SavedReport>;

  constructor() {
    this.employeeRepo = AppDataSource.getRepository(Employee);
    this.attendanceRepo = AppDataSource.getRepository(Attendance);
    this.leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
    this.leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    this.departmentRepo = AppDataSource.getRepository(Department);
    this.probationRepo = AppDataSource.getRepository(ProbationCase);
    this.performanceReviewRepo = AppDataSource.getRepository(PerformanceReview);
    this.exitRepo = AppDataSource.getRepository(ExitCase);
    this.companyDocumentRepo = AppDataSource.getRepository(CompanyDocument);
    this.employeeDocumentRepo = AppDataSource.getRepository(EmployeeDocument);
    this.salaryStructureRepo = AppDataSource.getRepository(SalaryStructure);
    this.payslipRepo = AppDataSource.getRepository(Payslip);
    this.savedReportRepo = AppDataSource.getRepository(SavedReport);
  }

  private getAllowedReportTypes(userRole: UserRole): ReportType[] {
    if (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.HR_ADMIN) {
      return Object.values(ReportType);
    }

    if (userRole === UserRole.MANAGER) {
      return [
        ReportType.ATTENDANCE_SUMMARY,
        ReportType.LEAVE_BALANCE,
        ReportType.HEADCOUNT,
        ReportType.CONFIRMATION_DUE,
        ReportType.REVIEW_COMPLETION,
      ];
    }

    return [];
  }

  canAccessReportType(userRole: UserRole, reportType: ReportType): boolean {
    return this.getAllowedReportTypes(userRole).includes(reportType);
  }

  private applyEmployeeScope(query: any, employeeAlias: string, access: ReportAccessContext): void {
    if (access.userRole !== UserRole.MANAGER) return;

    if (!access.employeeId) {
      query.andWhere('1 = 0');
      return;
    }

    query.andWhere(
      `(${employeeAlias}."employeeId" = :scopeEmployeeId OR ${employeeAlias}."managerId" = :scopeEmployeeId)`,
      { scopeEmployeeId: access.employeeId }
    );
  }

  /**
   * Report 1: Attendance Summary
   */
  async getAttendanceSummary(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<AttendanceSummaryData[]> {
    const { tenantId } = access;
    const { startDate, endDate, departmentIds } = filters;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required for attendance summary');
    }

    const query = this.attendanceRepo
      .createQueryBuilder('attendance')
      .innerJoin('attendance.employee', 'employee')
      .leftJoin('employee.department', 'department')
      .where('attendance.tenantId = :tenantId', { tenantId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'employee.employeeId as "employeeId"',
        'employee.firstName || \' \' || employee.lastName as "employeeName"',
        'employee.employeeCode as "employeeCode"',
        'department.name as "department"',
        'COUNT(CASE WHEN attendance.status = \'present\' THEN 1 END) as "presentDays"',
        'COUNT(CASE WHEN attendance.status = \'absent\' THEN 1 END) as "absentDays"',
        'COUNT(CASE WHEN attendance."isLate" = true THEN 1 END) as "lateDays"',
        'COUNT(CASE WHEN attendance.status = \'half_day\' THEN 1 END) as "halfDays"',
        'COUNT(CASE WHEN attendance.status = \'on_leave\' THEN 1 END) as "onLeaveDays"',
        'COUNT(*) as "totalWorkingDays"',
      ])
      .groupBy('employee.employeeId, employee.firstName, employee.lastName, employee.employeeCode, department.name');

    if (departmentIds && departmentIds.length > 0) {
      query.andWhere('employee.departmentId IN (:...departmentIds)', { departmentIds });
    }

    this.applyEmployeeScope(query, 'employee', access);

    const results = await query.getRawMany();

    return results.map((row) => ({
      ...row,
      attendancePercentage: row.totalWorkingDays > 0
        ? Math.round((row.presentDays / row.totalWorkingDays) * 100 * 10) / 10
        : 0,
    }));
  }

  /**
   * Report 2: Leave Balance & Usage
   */
  async getLeaveBalanceReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<LeaveBalanceData[]> {
    const { tenantId } = access;
    const query = this.leaveBalanceRepo
      .createQueryBuilder('balance')
      .innerJoin('balance.employee', 'employee')
      .leftJoin('employee.department', 'department')
      .leftJoin('balance.policy', 'policy')
      .where('balance.tenantId = :tenantId', { tenantId })
      .select([
        'employee.employeeId as "employeeId"',
        'employee.firstName || \' \' || employee.lastName as "employeeName"',
        'employee.employeeCode as "employeeCode"',
        'employee.gender as "employeeGender"',
        'department.name as "department"',
        'policy.policyName as "leaveType"',
        'policy.leaveType as "policyLeaveType"',
        'balance.totalAllocated as "totalEntitlement"',
        'balance.used as "used"',
        'balance.pending as "pending"',
        '(balance.totalAllocated + balance.carriedForward - balance.used - balance.pending) as "available"',
        'balance.carriedForward as "carriedForward"',
      ]);

    if (filters.departmentIds && filters.departmentIds.length > 0) {
      query.andWhere('employee.departmentId IN (:...departmentIds)', {
        departmentIds: filters.departmentIds,
      });
    }

    this.applyEmployeeScope(query, 'employee', access);

    const rows = await query.getRawMany();

    return rows.map((row) => {
      const genderEligible = isGenderEligibleForLeaveType(row.policyLeaveType, row.employeeGender);
      const totalEntitlement = genderEligible ? Number(row.totalEntitlement) || 0 : 0;
      const carriedForward = genderEligible ? Number(row.carriedForward) || 0 : 0;
      const used = Number(row.used) || 0;
      const pending = Number(row.pending) || 0;

      return {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        department: row.department,
        leaveType: row.leaveType,
        totalEntitlement,
        used,
        pending,
        available: Math.max(0, totalEntitlement + carriedForward - used - pending),
        carriedForward,
      };
    });
  }

  /**
   * Report 3: Headcount Report
   */
  async getHeadcountReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<HeadcountData[]> {
    const { tenantId } = access;
    const query = this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .where('employee.tenantId = :tenantId', { tenantId })
      .select([
        'COALESCE(department.name, \'Unassigned\') as "department"',
        'COALESCE(employee.employmentType, \'Not Specified\') as "employmentType"',
        'employee.status as "status"',
        'COUNT(*) as "count"',
      ])
      .groupBy('department.name, employee.employmentType, employee.status');

    if (filters.departmentIds && filters.departmentIds.length > 0) {
      query.andWhere('employee.departmentId IN (:...departmentIds)', {
        departmentIds: filters.departmentIds,
      });
    }

    if (filters.employmentTypes && filters.employmentTypes.length > 0) {
      query.andWhere('employee.employmentType IN (:...employmentTypes)', {
        employmentTypes: filters.employmentTypes,
      });
    }

    if (filters.status && filters.status.length > 0) {
      query.andWhere('employee.status IN (:...status)', {
        status: filters.status,
      });
    }

    this.applyEmployeeScope(query, 'employee', access);

    const results = await query.getRawMany();

    // Calculate total for percentage
    const total = results.reduce((sum, row) => sum + parseInt(row.count), 0);

    return results.map((row) => ({
      ...row,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100 * 10) / 10 : 0,
    }));
  }

  /**
   * Report 4: Joiners/Leavers Report
   */
  async getJoinersLeaversReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<JoinersLeaversData[]> {
    const { tenantId } = access;
    const { startDate, endDate } = filters;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required for joiners/leavers report');
    }

    // Get joiners by month
    const joinersQuery = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.dateOfJoining BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'TO_CHAR(employee.dateOfJoining, \'YYYY-MM\') as "month"',
        'COUNT(*) as "joiners"',
      ])
      .groupBy('TO_CHAR(employee.dateOfJoining, \'YYYY-MM\')')
      .getRawMany();

    // Get leavers by month
    const leaversQuery = await this.exitRepo
      .createQueryBuilder('exit')
      .where('exit.tenantId = :tenantId', { tenantId })
      .andWhere('exit.lastWorkingDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'TO_CHAR(exit.lastWorkingDate, \'YYYY-MM\') as "month"',
        'COUNT(*) as "leavers"',
      ])
      .groupBy('TO_CHAR(exit.lastWorkingDate, \'YYYY-MM\')')
      .getRawMany();

    // Merge data
    const monthsSet = new Set([
      ...joinersQuery.map((j) => j.month),
      ...leaversQuery.map((l) => l.month),
    ]);

    const results: JoinersLeaversData[] = [];
    let runningHeadcount = await this.getHeadcountAtDate(tenantId, startDate);

    for (const month of Array.from(monthsSet).sort()) {
      const joiners = parseInt(joinersQuery.find((j) => j.month === month)?.joiners || '0');
      const leavers = parseInt(leaversQuery.find((l) => l.month === month)?.leavers || '0');
      const netChange = joiners - leavers;
      const openingHeadcount = runningHeadcount;
      const closingHeadcount = openingHeadcount + netChange;

      results.push({
        month,
        joiners,
        leavers,
        netChange,
        openingHeadcount,
        closingHeadcount,
      });

      runningHeadcount = closingHeadcount;
    }

    return results;
  }

  /**
   * Report 5: Confirmation Due Report
   */
  async getConfirmationDueReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<ConfirmationDueData[]> {
    const { tenantId } = access;
    const daysAhead = 60; // Look ahead 60 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const query = this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .leftJoin(
        'probation_cases',
        'probation',
        'probation.employeeId = employee.employeeId AND probation.tenantId = employee.tenantId'
      )
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.status = :status', { status: 'active' })
      .andWhere('employee."probationEndDate" IS NOT NULL')
      .andWhere('employee."probationEndDate" <= :futureDate', { futureDate })
      .select([
        'employee."employeeId" as "employeeId"',
        'employee."firstName" || \' \' || employee."lastName" as "employeeName"',
        'employee."employeeCode" as "employeeCode"',
        'department.name as "department"',
        'employee."dateOfJoining" as "dateOfJoining"',
        'employee."probationEndDate" as "probationEndDate"',
        '(employee."probationEndDate"::date - CURRENT_DATE)::integer as "daysRemaining"',
        'probation."currentState" as "status"',
        'probation."finalReviewCompleted" as "reviewCompleted"',
      ])
      .orderBy('employee."probationEndDate"', 'ASC');

    if (filters.departmentIds && filters.departmentIds.length > 0) {
      query.andWhere('employee.departmentId IN (:...departmentIds)', {
        departmentIds: filters.departmentIds,
      });
    }

    this.applyEmployeeScope(query, 'employee', access);

    return query.getRawMany();
  }

  /**
   * Report 6: Attrition Report
   */
  async getAttritionReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<AttritionData[]> {
    const { tenantId } = access;
    const { startDate, endDate } = filters;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required for attrition report');
    }

    // Get exits by month and department
    const exitsQuery = await this.exitRepo
      .createQueryBuilder('exit')
      .innerJoin('exit.employee', 'employee')
      .leftJoin('employee.department', 'department')
      .where('exit.tenantId = :tenantId', { tenantId })
      .andWhere('exit.lastWorkingDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'TO_CHAR(exit."lastWorkingDate"::timestamp, \'YYYY-MM\') as "month"',
        'COALESCE(department.name, \'Unassigned\') as "department"',
        'COUNT(*) as "exits"',
        'COUNT(CASE WHEN exit."resignationType" = \'voluntary\' THEN 1 END) as "voluntaryExits"',
        'COUNT(CASE WHEN exit."resignationType" = \'involuntary\' THEN 1 END) as "involuntaryExits"',
      ])
      .groupBy('TO_CHAR(exit."lastWorkingDate"::timestamp, \'YYYY-MM\'), department.name')
      .getRawMany();

    // Get headcount by month and department for attrition rate calculation
    const headcountData = await this.getMonthlyHeadcountByDepartment(tenantId, startDate, endDate);

    // Merge and calculate attrition rate
    const results: AttritionData[] = exitsQuery.map((exit) => {
      const headcount = headcountData.find(
        (h) => h.month === exit.month && h.department === exit.department
      );
      const totalEmployees = headcount?.count || 0;
      const exits = parseInt(exit.exits);
      const attritionRate = totalEmployees > 0 ? (exits / totalEmployees) * 100 : 0;

      return {
        month: exit.month,
        department: exit.department,
        totalEmployees,
        exits,
        attritionRate: Math.round(attritionRate * 10) / 10,
        voluntaryExits: parseInt(exit.voluntaryExits),
        involuntaryExits: parseInt(exit.involuntaryExits),
      };
    });

    return results;
  }

  /**
   * Report 7: PMS Completion Report
   */
  async getPMSCompletionReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<PMSCompletionData[]> {
    const { tenantId } = access;
    const query = this.performanceReviewRepo
      .createQueryBuilder('review')
      .innerJoin('review.employee', 'employee')
      .leftJoin('employee.department', 'department')
      .leftJoin('employee.manager', 'manager')
      .where('review.tenantId = :tenantId', { tenantId })
      .select([
        'employee."employeeId" as "employeeId"',
        'employee."firstName" || \' \' || employee."lastName" as "employeeName"',
        'employee."employeeCode" as "employeeCode"',
        'department.name as "department"',
        'manager."firstName" || \' \' || manager."lastName" as "manager"',
        'review."reviewCycle" as "reviewCycle"',
        'review."currentState" as "status"',
        'review."reviewEndDate" as "dueDate"',
        'review."annualCompletedDate" as "completedDate"',
        'CASE WHEN review."reviewEndDate"::date < CURRENT_DATE AND review."currentState" != \'cycle_complete\' THEN (CURRENT_DATE - review."reviewEndDate"::date)::integer ELSE NULL END as "overdueDays"',
      ])
      .orderBy('review."reviewEndDate"', 'ASC');

    if (filters.departmentIds && filters.departmentIds.length > 0) {
      query.andWhere('employee."departmentId" IN (:...departmentIds)', {
        departmentIds: filters.departmentIds,
      });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('review."reviewEndDate" BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    this.applyEmployeeScope(query, 'employee', access);

    return query.getRawMany();
  }

  /**
   * Report 8: Missing Documents Report
   */
  async getMissingDocumentsReport(
    access: ReportAccessContext,
    filters: ReportFilters
  ): Promise<MissingDocumentsData[]> {
    const { tenantId } = access;
    // Define mandatory documents
    const mandatoryDocuments = [
      EmployeeDocumentCategory.IDENTITY,
      EmployeeDocumentCategory.ADDRESS_PROOF,
      EmployeeDocumentCategory.EDUCATION,
      EmployeeDocumentCategory.EMPLOYMENT_LETTER,
    ];

    const employeeWhere: any = { tenantId, status: 'active' };
    if (filters.departmentIds && filters.departmentIds.length > 0) {
      employeeWhere.departmentId = In(filters.departmentIds);
    }

    const employees = await this.employeeRepo.find({
      where: employeeWhere,
      relations: ['department'],
      order: { employeeCode: 'ASC' },
    });
    const scopedEmployees = access.userRole === UserRole.MANAGER
      ? employees.filter((employee) => (
          Boolean(access.employeeId) &&
          (employee.employeeId === access.employeeId || employee.managerId === access.employeeId)
        ))
      : employees;

    const employeeDocuments = await this.employeeDocumentRepo.find({
      where: {
        tenantId,
        status: EmployeeDocumentStatus.ACTIVE,
      },
    });

    const documentsByEmployee = new Map<string, EmployeeDocument[]>();
    for (const document of employeeDocuments) {
      const existing = documentsByEmployee.get(document.employeeId) || [];
      existing.push(document);
      documentsByEmployee.set(document.employeeId, existing);
    }

    const results: MissingDocumentsData[] = [];

    for (const employee of scopedEmployees) {
      const uploadedTypes = (documentsByEmployee.get(employee.employeeId) || []).map((document) => document.category);
      const missingDocuments = mandatoryDocuments.filter(
        (doc) => !uploadedTypes.includes(doc)
      );
      const missingInformation = this.getEmployeeMissingMasterFields(employee);
      const totalGapCount = missingDocuments.length + missingInformation.length;

      if (totalGapCount > 0) {
        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          employeeCode: employee.employeeCode,
          department: employee.department?.name || 'Unassigned',
          missingDocuments,
          missingInformation,
          documentCount: missingDocuments.length,
          informationGapCount: missingInformation.length,
          totalGapCount,
          criticality: totalGapCount >= 4 ? 'high' : totalGapCount >= 2 ? 'medium' : 'low',
        });
      }
    }

    return results;
  }

  /**
   * Report 9: Memory Readiness Report
   *
   * Implementation-grade readiness view for tenant memory: employee master data,
   * employee documents, company HR/compliance records, and compensation history.
   */
  async getMemoryReadinessReport(access: ReportAccessContext): Promise<MemoryReadinessReport> {
    const { tenantId } = access;
    const requiredEmployeeDocuments = [
      EmployeeDocumentCategory.IDENTITY,
      EmployeeDocumentCategory.EMPLOYMENT_LETTER,
    ];

    const recommendedEmployeeDocuments = [
      EmployeeDocumentCategory.ADDRESS_PROOF,
      EmployeeDocumentCategory.EDUCATION,
      EmployeeDocumentCategory.COMPENSATION,
    ];

    const requiredCompanyDocuments = [
      CompanyDocumentCategory.INCORPORATION_IDENTITY,
      CompanyDocumentCategory.TAX_REGISTRATION,
      CompanyDocumentCategory.LABOR_HR_COMPLIANCE,
      CompanyDocumentCategory.HR_POLICY,
    ];

    const allEmployees = await this.employeeRepo.find({
      where: { tenantId },
      relations: ['department', 'designation'],
      order: { employeeCode: 'ASC' },
    });
    const employees = access.userRole === UserRole.MANAGER
      ? allEmployees.filter((employee) => (
          Boolean(access.employeeId) &&
          (employee.employeeId === access.employeeId || employee.managerId === access.employeeId)
        ))
      : allEmployees;

    const [employeeDocuments, companyDocuments, salaryStructures, payslips] = await Promise.all([
      this.employeeDocumentRepo.find({
        where: { tenantId, status: EmployeeDocumentStatus.ACTIVE },
      }),
      this.companyDocumentRepo.find({
        where: { tenantId },
      }),
      this.salaryStructureRepo.find({
        where: {
          tenantId,
          status: In([SalaryStructureStatus.ACTIVE, SalaryStructureStatus.SUPERSEDED]),
        },
      }),
      this.payslipRepo.find({
        where: { tenantId },
        relations: ['attachments'],
      }),
    ]);

    const documentsByEmployee = new Map<string, EmployeeDocument[]>();
    for (const document of employeeDocuments) {
      const existing = documentsByEmployee.get(document.employeeId) || [];
      existing.push(document);
      documentsByEmployee.set(document.employeeId, existing);
    }

    const employeesWithSalaryStructure = new Set(salaryStructures.map((structure) => structure.employeeId));
    const employeesWithPayslip = new Set(payslips.map((payslip) => payslip.employeeId));
    const payslipsByEmployee = new Map<string, Payslip[]>();
    for (const payslip of payslips) {
      const existing = payslipsByEmployee.get(payslip.employeeId) || [];
      existing.push(payslip);
      payslipsByEmployee.set(payslip.employeeId, existing);
    }
    const payslipsMissingAttachments = payslips.filter((payslip) => (payslip.attachments || []).length === 0);

    const companyActiveDocuments = companyDocuments.filter(
      (document) => document.status !== CompanyDocumentStatus.ARCHIVED
    );
    const companyDocumentFindings = requiredCompanyDocuments.map((category) => {
      const matchingDocuments = companyActiveDocuments.filter((document) => document.category === category);
      const verifiedDocuments = matchingDocuments.filter(
        (document) => document.verificationStatus === CompanyDocumentVerificationStatus.VERIFIED
      );

      return {
        category,
        status: matchingDocuments.length > 0 ? 'present' as const : 'missing' as const,
        activeDocuments: matchingDocuments.length,
        verifiedDocuments: verifiedDocuments.length,
      };
    });

    const today = new Date();
    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const results: MemoryReadinessData[] = employees.map((employee) => {
      const employeeDocs = documentsByEmployee.get(employee.employeeId) || [];
      const uploadedCategories = new Set(employeeDocs.map((document) => document.category));
      const missingMasterFields = this.getEmployeeMissingMasterFields(employee);
      const missingRequiredDocuments = requiredEmployeeDocuments.filter(
        (category) => !uploadedCategories.has(category)
      );
      const recommendedDocumentGaps = recommendedEmployeeDocuments.filter(
        (category) => !uploadedCategories.has(category)
      );
      const unverifiedDocuments = employeeDocs.filter(
        (document) => document.verificationStatus !== EmployeeDocumentVerificationStatus.VERIFIED
      ).length;

      const hasSalaryStructure = employeesWithSalaryStructure.has(employee.employeeId);
      const hasPayslip = employeesWithPayslip.has(employee.employeeId);
      const employeePayslips = payslipsByEmployee.get(employee.employeeId) || [];
      const payslipRecordsMissingAttachments = employeePayslips.filter(
        (payslip) => (payslip.attachments || []).length === 0
      ).length;
      const payslipAttachmentStatus = employeePayslips.length === 0
        ? 'not_applicable'
        : payslipRecordsMissingAttachments > 0
          ? 'missing_attachments'
          : 'complete';

      let readinessStatus: MemoryReadinessData['readinessStatus'] = 'complete';
      if (
        missingMasterFields.length > 0 ||
        missingRequiredDocuments.length > 0 ||
        !hasSalaryStructure ||
        !hasPayslip ||
        payslipRecordsMissingAttachments > 0
      ) {
        readinessStatus = missingRequiredDocuments.length > 0 || missingMasterFields.length >= 3
          ? 'critical'
          : 'needs_review';
      } else if (recommendedDocumentGaps.length > 0 || unverifiedDocuments > 0) {
        readinessStatus = 'needs_review';
      }

      return {
        employeeId: employee.employeeId,
        employeeName: employee.fullName,
        employeeCode: employee.employeeCode,
        department: employee.department?.name || 'Unassigned',
        designation: employee.designation?.name || 'Unassigned',
        missingMasterFields: missingMasterFields.join(', ') || 'None',
        missingRequiredDocuments: missingRequiredDocuments.join(', ') || 'None',
        recommendedDocumentGaps: recommendedDocumentGaps.join(', ') || 'None',
        unverifiedDocuments,
        salaryStructureStatus: hasSalaryStructure ? 'present' : 'missing',
        payslipStatus: hasPayslip ? 'present' : 'missing',
        payslipRecords: employeePayslips.length,
        payslipRecordsMissingAttachments,
        payslipAttachmentStatus,
        employeeStatus: employee.status,
        readinessStatus,
      };
    });

    const completeEmployees = results.filter((row) => row.readinessStatus === 'complete').length;
    const needsReviewEmployees = results.filter((row) => row.readinessStatus === 'needs_review').length;
    const criticalEmployees = results.filter((row) => row.readinessStatus === 'critical').length;
    const totalReadinessChecks = employees.length * 4 + requiredCompanyDocuments.length;
    const completedReadinessChecks =
      results.reduce((sum, row) => {
        return sum +
          (row.missingMasterFields === 'None' ? 1 : 0) +
          (row.missingRequiredDocuments === 'None' ? 1 : 0) +
          (row.salaryStructureStatus === 'present' ? 1 : 0) +
          (row.payslipStatus === 'present' ? 1 : 0);
      }, 0) +
      companyDocumentFindings.filter((finding) => finding.status === 'present').length;

    return {
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((employee) => employee.status === 'active').length,
        inactiveEmployees: employees.filter((employee) => employee.status === 'inactive').length,
        exitedEmployees: employees.filter((employee) => employee.status === 'exited').length,
        inactiveEmployeesNeedingExitClassification: employees.filter((employee) => employee.status === 'inactive').length,
        readinessScore: totalReadinessChecks > 0
          ? Math.round((completedReadinessChecks / totalReadinessChecks) * 100)
          : 0,
        completeEmployees,
        needsReviewEmployees,
        criticalEmployees,
        employeesWithMissingMasterData: results.filter((row) => row.missingMasterFields !== 'None').length,
        employeesMissingRequiredDocuments: results.filter((row) => row.missingRequiredDocuments !== 'None').length,
        unverifiedEmployeeDocuments: employeeDocuments.filter(
          (document) => document.verificationStatus !== EmployeeDocumentVerificationStatus.VERIFIED
        ).length,
        companyDocuments: companyActiveDocuments.length,
        unverifiedCompanyDocuments: companyActiveDocuments.filter(
          (document) => document.verificationStatus !== CompanyDocumentVerificationStatus.VERIFIED
        ).length,
        expiringCompanyDocuments60Days: companyActiveDocuments.filter((document) => {
          if (!document.expiryDate) return false;
          const expiryDate = new Date(document.expiryDate);
          return expiryDate >= today && expiryDate <= sixtyDaysFromNow;
        }).length,
        employeesWithoutSalaryStructure: results.filter((row) => row.salaryStructureStatus === 'missing').length,
        employeesWithoutPayslip: results.filter((row) => row.payslipStatus === 'missing').length,
        payslipRecords: payslips.length,
        payslipRecordsWithAttachments: payslips.length - payslipsMissingAttachments.length,
        payslipRecordsMissingAttachments: payslipsMissingAttachments.length,
        employeesWithPayslipRecordsMissingAttachments: results.filter(
          (row) => row.payslipRecordsMissingAttachments > 0
        ).length,
      },
      results,
      companyDocumentFindings,
    };
  }

  /**
   * Helper: Get headcount at a specific date
   */
  private async getHeadcountAtDate(tenantId: string, date: Date): Promise<number> {
    const count = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.dateOfJoining <= :date', { date })
      .andWhere(
        '(employee.status != :exitStatus OR employee.employeeId NOT IN ' +
        '(SELECT "employeeId" FROM exit_cases WHERE "lastWorkingDate" < :date))',
        { exitStatus: 'exited', date }
      )
      .getCount();

    return count;
  }

  private getEmployeeMissingMasterFields(employee: Employee): string[] {
    const missingFields: string[] = [];

    if (!employee.employeeCode) missingFields.push('employeeCode');
    if (!employee.firstName) missingFields.push('firstName');
    if (!employee.lastName) missingFields.push('lastName');
    if (!employee.email) missingFields.push('email');
    if (!employee.dateOfJoining) missingFields.push('dateOfJoining');
    if (!employee.departmentId) missingFields.push('department');
    if (!employee.designationId) missingFields.push('designation');
    if (!employee.employmentType) missingFields.push('employmentType');
    if (!employee.workLocation) missingFields.push('workLocation');
    if (!employee.managerId) missingFields.push('reportingManager');

    return missingFields;
  }

  /**
   * Helper: Get monthly headcount by department
   */
  private async getMonthlyHeadcountByDepartment(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ month: string; department: string; count: number }>> {
    // This is a simplified version - in production, you'd want to calculate this more accurately
    const result = await this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.dateOfJoining <= :endDate', { endDate })
      .select([
        'TO_CHAR(CAST(:startDate AS timestamp), \'YYYY-MM\') as "month"',
        'COALESCE(department.name, \'Unassigned\') as "department"',
        'COUNT(*) as "count"',
      ])
      .setParameter('startDate', startDate)
      .groupBy('department.name')
      .getRawMany();

    return result.map((r) => ({
      ...r,
      count: parseInt(r.count),
    }));
  }

  /**
   * Save a report configuration
   */
  async saveReport(reportData: Partial<SavedReport>): Promise<SavedReport> {
    const report = this.savedReportRepo.create(reportData);
    return await this.savedReportRepo.save(report);
  }

  /**
   * Get saved reports
   */
  async getSavedReports(tenantId: string, userId?: string): Promise<SavedReport[]> {
    const query = this.savedReportRepo
      .createQueryBuilder('report')
      .where('report.tenantId = :tenantId', { tenantId })
      .andWhere('report.isActive = :isActive', { isActive: true });

    if (userId) {
      query.andWhere('(report.createdBy = :userId OR report.isPublic = :isPublic)', {
        userId,
        isPublic: true,
      });
    }

    return await query.orderBy('report.createdAt', 'DESC').getMany();
  }

  async getSavedReportsForAccess(access: ReportAccessContext, userId?: string): Promise<SavedReport[]> {
    const allowedReportTypes = this.getAllowedReportTypes(access.userRole);
    if (allowedReportTypes.length === 0) return [];

    const query = this.savedReportRepo
      .createQueryBuilder('report')
      .where('report.tenantId = :tenantId', { tenantId: access.tenantId })
      .andWhere('report.isActive = :isActive', { isActive: true })
      .andWhere('report.reportType IN (:...allowedReportTypes)', { allowedReportTypes });

    if (userId) {
      query.andWhere('(report.createdBy = :userId OR report.isPublic = :isPublic)', {
        userId,
        isPublic: true,
      });
    }

    return query.orderBy('report.createdAt', 'DESC').getMany();
  }

  /**
   * Execute a saved report
   */
  async executeSavedReport(reportId: string, access: ReportAccessContext): Promise<any> {
    const report = await this.savedReportRepo.findOne({
      where: { reportId, tenantId: access.tenantId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (!this.canAccessReportType(access.userRole, report.reportType)) {
      const error = new Error('Report type is not permitted for current role');
      (error as any).statusCode = 403;
      throw error;
    }

    // Update execution count and timestamp
    report.executionCount += 1;
    report.lastExecutedAt = new Date();
    await this.savedReportRepo.save(report);

    // Execute the appropriate report based on type
    const filters: ReportFilters = {
      startDate: report.filterConfig?.dateRange?.startDate ? new Date(report.filterConfig.dateRange.startDate) : undefined,
      endDate: report.filterConfig?.dateRange?.endDate ? new Date(report.filterConfig.dateRange.endDate) : undefined,
      departmentIds: report.filterConfig?.departments,
      employmentTypes: report.filterConfig?.employmentTypes,
      status: report.filterConfig?.status,
    };

    switch (report.reportType) {
      case ReportType.ATTENDANCE_SUMMARY:
        return await this.getAttendanceSummary(access, filters);
      case ReportType.LEAVE_BALANCE:
        return await this.getLeaveBalanceReport(access, filters);
      case ReportType.HEADCOUNT:
        return await this.getHeadcountReport(access, filters);
      case ReportType.JOINERS_LEAVERS:
        return await this.getJoinersLeaversReport(access, filters);
      case ReportType.CONFIRMATION_DUE:
        return await this.getConfirmationDueReport(access, filters);
      case ReportType.ATTRITION:
        return await this.getAttritionReport(access, filters);
      case ReportType.REVIEW_COMPLETION:
        return await this.getPMSCompletionReport(access, filters);
      case ReportType.MISSING_DOCUMENTS:
        return await this.getMissingDocumentsReport(access, filters);
      default:
        throw new Error(`Unsupported report type: ${report.reportType}`);
    }
  }
}

export default new ReportingService();
