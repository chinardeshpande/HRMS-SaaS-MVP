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
import { OnboardingDocument } from '../models/OnboardingDocument';
import { SavedReport, ReportType } from '../models/SavedReport';
import logger from '../utils/logger';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  departmentIds?: string[];
  employmentTypes?: string[];
  status?: string[];
  locations?: string[];
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
  documentCount: number;
  criticality: 'high' | 'medium' | 'low';
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
  private documentRepo: Repository<OnboardingDocument>;
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
    this.documentRepo = AppDataSource.getRepository(OnboardingDocument);
    this.savedReportRepo = AppDataSource.getRepository(SavedReport);
  }

  /**
   * Report 1: Attendance Summary
   */
  async getAttendanceSummary(
    tenantId: string,
    filters: ReportFilters
  ): Promise<AttendanceSummaryData[]> {
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
    tenantId: string,
    filters: ReportFilters
  ): Promise<LeaveBalanceData[]> {
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
        'department.name as "department"',
        'policy.policyName as "leaveType"',
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

    return query.getRawMany();
  }

  /**
   * Report 3: Headcount Report
   */
  async getHeadcountReport(
    tenantId: string,
    filters: ReportFilters
  ): Promise<HeadcountData[]> {
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
    tenantId: string,
    filters: ReportFilters
  ): Promise<JoinersLeaversData[]> {
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
    tenantId: string,
    filters: ReportFilters
  ): Promise<ConfirmationDueData[]> {
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

    return query.getRawMany();
  }

  /**
   * Report 6: Attrition Report
   */
  async getAttritionReport(
    tenantId: string,
    filters: ReportFilters
  ): Promise<AttritionData[]> {
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
    tenantId: string,
    filters: ReportFilters
  ): Promise<PMSCompletionData[]> {
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

    return query.getRawMany();
  }

  /**
   * Report 8: Missing Documents Report
   */
  async getMissingDocumentsReport(
    tenantId: string,
    filters: ReportFilters
  ): Promise<MissingDocumentsData[]> {
    // Define mandatory documents
    const mandatoryDocuments = [
      'aadhar_card',
      'pan_card',
      'education_certificate',
      'bank_details',
      'photo',
    ];

    const employees = await this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.status = :status', { status: 'active' })
      .select([
        'employee.employeeId',
        'employee.firstName',
        'employee.lastName',
        'employee.employeeCode',
        'employee.email',
        'department.name as departmentName',
      ])
      .getRawMany();

    const results: MissingDocumentsData[] = [];

    for (const emp of employees) {
      // Get uploaded documents for this employee
      const uploadedDocs = await this.documentRepo
        .createQueryBuilder('doc')
        .where('doc.tenantId = :tenantId', { tenantId })
        .andWhere('doc."candidateId" IN (SELECT "candidateId" FROM candidates WHERE email = :email AND "tenantId" = :tenantId)', {
          email: emp.employee_email,
          tenantId,
        })
        .andWhere('doc.verificationStatus != :status', { status: 'missing' })
        .select('doc.documentType')
        .getRawMany();

      const uploadedTypes = uploadedDocs.map((d) => d.documentType);
      const missingDocuments = mandatoryDocuments.filter(
        (doc) => !uploadedTypes.includes(doc)
      );

      if (missingDocuments.length > 0) {
        results.push({
          employeeId: emp.employee_employeeId,
          employeeName: `${emp.employee_firstName} ${emp.employee_lastName}`,
          employeeCode: emp.employee_employeeCode,
          department: emp.departmentName || 'Unassigned',
          missingDocuments,
          documentCount: missingDocuments.length,
          criticality: missingDocuments.length >= 3 ? 'high' : missingDocuments.length >= 2 ? 'medium' : 'low',
        });
      }
    }

    return results;
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

  /**
   * Execute a saved report
   */
  async executeSavedReport(reportId: string, tenantId: string): Promise<any> {
    const report = await this.savedReportRepo.findOne({
      where: { reportId, tenantId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Update execution count and timestamp
    report.executionCount += 1;
    report.lastExecutedAt = new Date();
    await this.savedReportRepo.save(report);

    // Execute the appropriate report based on type
    const filters: ReportFilters = {
      startDate: report.filterConfig.dateRange?.startDate ? new Date(report.filterConfig.dateRange.startDate) : undefined,
      endDate: report.filterConfig.dateRange?.endDate ? new Date(report.filterConfig.dateRange.endDate) : undefined,
      departmentIds: report.filterConfig.departments,
      employmentTypes: report.filterConfig.employmentTypes,
      status: report.filterConfig.status,
    };

    switch (report.reportType) {
      case ReportType.ATTENDANCE_SUMMARY:
        return await this.getAttendanceSummary(tenantId, filters);
      case ReportType.LEAVE_BALANCE:
        return await this.getLeaveBalanceReport(tenantId, filters);
      case ReportType.HEADCOUNT:
        return await this.getHeadcountReport(tenantId, filters);
      case ReportType.JOINERS_LEAVERS:
        return await this.getJoinersLeaversReport(tenantId, filters);
      case ReportType.CONFIRMATION_DUE:
        return await this.getConfirmationDueReport(tenantId, filters);
      case ReportType.ATTRITION:
        return await this.getAttritionReport(tenantId, filters);
      case ReportType.REVIEW_COMPLETION:
        return await this.getPMSCompletionReport(tenantId, filters);
      case ReportType.MISSING_DOCUMENTS:
        return await this.getMissingDocumentsReport(tenantId, filters);
      default:
        throw new Error(`Unsupported report type: ${report.reportType}`);
    }
  }
}

export default new ReportingService();
