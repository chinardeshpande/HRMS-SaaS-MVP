import { In, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { LeaveRequest, LeaveStatus } from '../models/LeaveRequest';
import { OnboardingCase } from '../models/OnboardingCase';
import { ExitCase } from '../models/ExitCase';
import { Candidate } from '../models/Candidate';
import { ProbationCase } from '../models/ProbationCase';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { EmploymentStatus, UserRole } from '../../../shared/types';
import { ProbationState } from '../models/enums/ProbationState';
import { ExitState } from '../models/enums/ExitState';
import managerTeamService from './managerTeamService';
import logger from '../utils/logger';

export interface DashboardStats {
  // Employee stats
  totalEmployees: number;
  activeEmployees: number;
  employeeTrend: number; // % change from last month

  // Attendance stats (today)
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendanceTrend: number; // % change from yesterday

  // Onboarding & Probation
  upcomingOnboarding: number; // Candidates expected to join
  activeProbation: number;
  probationEndingSoon: number; // Ending in next 30 days

  // Exit Management
  upcomingExits: number; // Resignations in notice period
  exitThisMonth: number;

  // Approvals & Actions
  pendingLeaveApprovals: number;
  pendingApprovals: number; // Total pending actions

  // Quick stats
  departmentCount: number;
  designationCount: number;
}

export class DashboardService {
  private employeeRepo: Repository<Employee>;
  private attendanceRepo: Repository<Attendance>;
  private leaveRepo: Repository<LeaveRequest>;
  private onboardingRepo: Repository<OnboardingCase>;
  private candidateRepo: Repository<Candidate>;
  private probationRepo: Repository<ProbationCase>;
  private exitRepo: Repository<ExitCase>;

  constructor() {
    this.employeeRepo = AppDataSource.getRepository(Employee);
    this.attendanceRepo = AppDataSource.getRepository(Attendance);
    this.leaveRepo = AppDataSource.getRepository(LeaveRequest);
    this.onboardingRepo = AppDataSource.getRepository(OnboardingCase);
    this.candidateRepo = AppDataSource.getRepository(Candidate);
    this.probationRepo = AppDataSource.getRepository(ProbationCase);
    this.exitRepo = AppDataSource.getRepository(ExitCase);
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    // Get all stats in parallel for performance
    const [
      employeeStats,
      attendanceStats,
      onboardingStats,
      exitStats,
      approvalStats,
      quickStats,
    ] = await Promise.all([
      this.getEmployeeStats(tenantId),
      this.getAttendanceStats(tenantId),
      this.getOnboardingStats(tenantId),
      this.getExitStats(tenantId),
      this.getApprovalStats(tenantId),
      this.getQuickStats(tenantId),
    ]);

    return {
      ...employeeStats,
      ...attendanceStats,
      ...onboardingStats,
      ...exitStats,
      ...approvalStats,
      ...quickStats,
    };
  }

  /**
   * Get dashboard statistics filtered by user role
   *
   * ROLE-BASED STATS:
   * - EMPLOYEE: Personal stats only (own attendance, own leave balance)
   * - MANAGER: Team stats (team attendance, team leave requests, direct reports)
   * - HR_ADMIN/SYSTEM_ADMIN: Organization-wide stats
   */
  async getDashboardStatsByRole(
    tenantId: string,
    userRole: UserRole,
    employeeId: string | null
  ): Promise<DashboardStats> {
    logger.info(`Getting dashboard stats for role: ${userRole}`);

    switch (userRole) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.HR_ADMIN:
        // HR and System Admins get full organization stats
        return this.getDashboardStats(tenantId);

      case UserRole.MANAGER:
        // Managers get team-specific stats
        if (!employeeId) {
          logger.warn('Manager has no employeeId, returning empty stats');
          return this.getEmptyStats();
        }
        return this.getManagerDashboardStats(tenantId, employeeId);

      case UserRole.EMPLOYEE:
        // Employees get personal stats only
        if (!employeeId) {
          logger.warn('Employee has no employeeId, returning empty stats');
          return this.getEmptyStats();
        }
        return this.getEmployeeDashboardStats(tenantId, employeeId);

      default:
        logger.warn(`Unknown role: ${userRole}, returning empty stats`);
        return this.getEmptyStats();
    }
  }

  /**
   * Get dashboard stats for a manager (team-specific)
   */
  private async getManagerDashboardStats(
    tenantId: string,
    managerId: string
  ): Promise<DashboardStats> {
    // Get manager's direct reports
    const teamEmployeeIds = await managerTeamService.getTeamEmployeeIds(
      managerId,
      tenantId
    );

    if (teamEmployeeIds.length === 0) {
      logger.info(`Manager ${managerId} has no direct reports`);
      return this.getEmptyStats();
    }

    // Get team employee stats
    const totalEmployees = teamEmployeeIds.length;
    const activeEmployees = teamEmployeeIds.length; // All in team are active

    // Get team attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [presentToday, onLeaveToday] = await Promise.all([
      this.attendanceRepo.count({
        where: {
          tenantId,
          date: today,
          status: AttendanceStatus.PRESENT,
          employeeId: In(teamEmployeeIds),
        },
      }),
      this.attendanceRepo.count({
        where: {
          tenantId,
          date: today,
          status: AttendanceStatus.ON_LEAVE,
          employeeId: In(teamEmployeeIds),
        },
      }),
    ]);

    const absentToday = totalEmployees - presentToday - onLeaveToday;

    // Get pending leave approvals for team
    const pendingLeaveApprovals = await this.leaveRepo
      .createQueryBuilder('leave')
      .where('leave.tenantId = :tenantId', { tenantId })
      .andWhere('leave.status = :status', { status: LeaveStatus.PENDING })
      .andWhere('leave.employeeId IN (:...employeeIds)', {
        employeeIds: teamEmployeeIds,
      })
      .getCount();

    // Get probation cases for team
    const activeProbation = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.employeeId IN (:...employeeIds)', {
        employeeIds: teamEmployeeIds,
      })
      .andWhere('employee.probationEndDate IS NOT NULL')
      .andWhere('employee.probationEndDate >= :today', { today: new Date() })
      .getCount();

    return {
      totalEmployees,
      activeEmployees,
      employeeTrend: 0,
      presentToday,
      absentToday,
      onLeaveToday,
      attendanceTrend: 0,
      upcomingOnboarding: 0,
      activeProbation,
      probationEndingSoon: 0,
      upcomingExits: 0,
      exitThisMonth: 0,
      pendingLeaveApprovals,
      pendingApprovals: pendingLeaveApprovals,
      departmentCount: 0,
      designationCount: 0,
    };
  }

  /**
   * Get dashboard stats for an employee (personal stats)
   */
  private async getEmployeeDashboardStats(
    tenantId: string,
    employeeId: string
  ): Promise<DashboardStats> {
    // Get employee data
    const employee = await this.employeeRepo.findOne({
      where: { employeeId, tenantId },
    });

    if (!employee) {
      return this.getEmptyStats();
    }

    // Check attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceToday = await this.attendanceRepo.findOne({
      where: {
        employeeId,
        tenantId,
        date: today,
      },
    });

    const presentToday = attendanceToday?.status === AttendanceStatus.PRESENT ? 1 : 0;
    const onLeaveToday = attendanceToday?.status === AttendanceStatus.ON_LEAVE ? 1 : 0;
    const absentToday = attendanceToday ? 0 : 1;

    // Check if on probation
    const isOnProbation =
      employee.probationEndDate && new Date(employee.probationEndDate) > new Date()
        ? 1
        : 0;

    // Get pending leave requests
    const pendingLeaveApprovals = await this.leaveRepo.count({
      where: {
        employeeId,
        tenantId,
        status: LeaveStatus.PENDING,
      },
    });

    return {
      totalEmployees: 1,
      activeEmployees: 1,
      employeeTrend: 0,
      presentToday,
      absentToday,
      onLeaveToday,
      attendanceTrend: 0,
      upcomingOnboarding: 0,
      activeProbation: isOnProbation,
      probationEndingSoon: 0,
      upcomingExits: 0,
      exitThisMonth: 0,
      pendingLeaveApprovals,
      pendingApprovals: pendingLeaveApprovals,
      departmentCount: 0,
      designationCount: 0,
    };
  }

  /**
   * Return empty stats structure
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      employeeTrend: 0,
      presentToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      attendanceTrend: 0,
      upcomingOnboarding: 0,
      activeProbation: 0,
      probationEndingSoon: 0,
      upcomingExits: 0,
      exitThisMonth: 0,
      pendingLeaveApprovals: 0,
      pendingApprovals: 0,
      departmentCount: 0,
      designationCount: 0,
    };
  }

  private async getEmployeeStats(tenantId: string) {
    const totalEmployees = await this.employeeRepo.count({
      where: { tenantId, status: EmploymentStatus.ACTIVE },
    });

    const activeEmployees = await this.employeeRepo.count({
      where: { tenantId, status: EmploymentStatus.ACTIVE },
    });

    // Get last month's count for trend
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthEmployees = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.createdAt <= :lastMonth', { lastMonth })
      .getCount();

    const employeeTrend = lastMonthEmployees > 0
      ? ((totalEmployees - lastMonthEmployees) / lastMonthEmployees) * 100
      : 0;

    return {
      totalEmployees,
      activeEmployees,
      employeeTrend: Math.round(employeeTrend * 10) / 10, // Round to 1 decimal
    };
  }

  private async getAttendanceStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count attendance for today
    const [presentToday, onLeaveToday] = await Promise.all([
      this.attendanceRepo.count({
        where: {
          tenantId,
          date: today,
          status: AttendanceStatus.PRESENT,
        },
      }),
      this.attendanceRepo.count({
        where: {
          tenantId,
          date: today,
          status: AttendanceStatus.ON_LEAVE,
        },
      }),
    ]);

    const totalEmployees = await this.employeeRepo.count({
      where: { tenantId, status: EmploymentStatus.ACTIVE },
    });

    const absentToday = totalEmployees - presentToday - onLeaveToday;

    // Get yesterday's attendance for trend
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const presentYesterday = await this.attendanceRepo.count({
      where: {
        tenantId,
        date: yesterday,
        status: AttendanceStatus.PRESENT,
      },
    });

    const attendanceTrend = presentYesterday > 0
      ? ((presentToday - presentYesterday) / presentYesterday) * 100
      : 0;

    return {
      presentToday,
      absentToday,
      onLeaveToday,
      attendanceTrend: Math.round(attendanceTrend * 10) / 10,
    };
  }

  private async getOnboardingStats(tenantId: string) {
    // Candidates expected to join (offer sent, docs pending, pre-joining)
    const upcomingOnboarding = await this.candidateRepo
      .createQueryBuilder('candidate')
      .where('candidate.tenantId = :tenantId', { tenantId })
      .andWhere('candidate.currentState IN (:...statuses)', {
        statuses: ['offer_sent', 'offer_accepted', 'docs_pending', 'docs_submitted', 'bgv_in_progress', 'pre_joining_setup'],
      })
      .getCount();

    // Active probation cases
    const activeProbation = await this.probationRepo.count({
      where: {
        tenantId,
        currentState: ProbationState.PROBATION_ACTIVE,
      },
    });

    // Probation ending in next 30 days
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const probationEndingSoon = await this.employeeRepo
      .createQueryBuilder('employee')
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.probationEndDate IS NOT NULL')
      .andWhere('employee.probationEndDate <= :thirtyDaysLater', { thirtyDaysLater })
      .andWhere('employee.probationEndDate >= :today', { today: new Date() })
      .getCount();

    return {
      upcomingOnboarding,
      activeProbation,
      probationEndingSoon,
    };
  }

  private async getExitStats(tenantId: string) {
    // Exits in notice period (active resignations)
    const upcomingExits = await this.exitRepo.count({
      where: {
        tenantId,
        currentState: ExitState.NOTICE_PERIOD_ACTIVE,
      },
    });

    // Exits this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const exitThisMonth = await this.exitRepo
      .createQueryBuilder('exit')
      .where('exit.tenantId = :tenantId', { tenantId })
      .andWhere('exit.actualExitDate >= :startOfMonth', { startOfMonth })
      .getCount();

    return {
      upcomingExits,
      exitThisMonth,
    };
  }

  private async getApprovalStats(tenantId: string) {
    // Pending leave approvals
    const pendingLeaveApprovals = await this.leaveRepo.count({
      where: {
        tenantId,
        status: LeaveStatus.PENDING,
      },
    });

    // Total pending approvals (for now, just leave approvals)
    // In future, add probation approvals, exit approvals, etc.
    const pendingApprovals = pendingLeaveApprovals;

    return {
      pendingLeaveApprovals,
      pendingApprovals,
    };
  }

  private async getQuickStats(tenantId: string) {
    const [departmentCount, designationCount] = await Promise.all([
      AppDataSource.getRepository(Department).count({ where: { tenantId } }),
      AppDataSource.getRepository(Designation).count({ where: { tenantId } }),
    ]);

    return {
      departmentCount,
      designationCount,
    };
  }
}

export default new DashboardService();
