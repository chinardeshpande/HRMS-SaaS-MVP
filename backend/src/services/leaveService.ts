import { AppDataSource } from '../config/database';
import { LeaveRequest, LeaveStatus } from '../models/LeaveRequest';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { Employee } from '../models/Employee';
import { Between, In } from 'typeorm';

export class LeaveService {
  private leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);
  private leaveBalanceRepository = AppDataSource.getRepository(LeaveBalance);
  private leavePolicyRepository = AppDataSource.getRepository(LeavePolicy);
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * Employee: Apply for leave
   */
  async applyLeave(
    employeeId: string,
    tenantId: string,
    leaveType: LeaveType,
    startDate: Date,
    endDate: Date,
    reason: string,
    emergencyContact?: string,
    attachmentUrl?: string
  ) {
    if (!employeeId) {
      throw new Error('Employee profile is required to apply for leave');
    }

    if (!Object.values(LeaveType).includes(leaveType)) {
      throw new Error('Invalid leave type');
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Valid start and end dates are required');
    }

    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    const employee = await this.employeeRepository.findOne({
      where: { employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate number of days (excluding weekends)
    const numberOfDays = this.calculateLeaveDays(startDate, endDate);

    if (numberOfDays <= 0) {
      throw new Error('Leave request must include at least one working day');
    }

    // Check if employee has sufficient leave balance
    const year = startDate.getFullYear();
    const balance = await this.leaveBalanceRepository.findOne({
      where: {
        employeeId,
        tenantId,
        leaveType,
        year,
      },
    });

    if (!balance) {
      throw new Error('Leave balance not found for this leave type');
    }

    if (balance.available < numberOfDays) {
      throw new Error(
        `Insufficient leave balance. Available: ${balance.available}, Requested: ${numberOfDays}`
      );
    }

    // Check for overlapping leave requests
    const overlapping = await this.leaveRequestRepository
      .createQueryBuilder('leave')
      .where('leave.employeeId = :employeeId', { employeeId })
      .andWhere('leave.tenantId = :tenantId', { tenantId })
      .andWhere('leave.status != :cancelled', {
        cancelled: LeaveStatus.CANCELLED,
      })
      .andWhere(
        '((leave.startDate BETWEEN :startDate AND :endDate) OR (leave.endDate BETWEEN :startDate AND :endDate) OR (:startDate BETWEEN leave.startDate AND leave.endDate))',
        { startDate, endDate }
      )
      .getOne();

    if (overlapping) {
      throw new Error('You already have a leave request for this period');
    }

    // Create leave request
    const leaveRequest = this.leaveRequestRepository.create({
      employeeId,
      tenantId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      emergencyContact,
      attachmentUrl,
      status: LeaveStatus.PENDING,
      approverId: employee.managerId, // Auto-assign to manager
    });

    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // Update pending leave balance
    balance.pending = Number(balance.pending) + numberOfDays;
    await this.leaveBalanceRepository.save(balance);

    return saved;
  }

  /**
   * Employee/Manager: Approve or reject leave
   */
  async approveOrRejectLeave(
    leaveId: string,
    approverId: string | undefined,
    tenantId: string,
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
    comments?: string,
    allowedEmployeeIds?: string[]
  ) {
    if (![LeaveStatus.APPROVED, LeaveStatus.REJECTED].includes(status)) {
      throw new Error('Invalid leave approval status');
    }

    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { leaveId, tenantId },
      relations: ['employee'],
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new Error('Leave request is not pending');
    }

    if (allowedEmployeeIds && !allowedEmployeeIds.includes(leaveRequest.employeeId)) {
      throw new Error('You are not authorized to process this leave request');
    }

    // Prevent self-approval
    if (approverId && approverId === leaveRequest.employeeId) {
      throw new Error('Employee cannot approve their own leave request');
    }

    // Update leave request status
    leaveRequest.status = status;
    leaveRequest.approverId = approverId;
    leaveRequest.approvedAt = new Date();
    leaveRequest.approverComments = comments;

    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // Update leave balance
    const year = new Date(leaveRequest.startDate).getFullYear();
    const balance = await this.leaveBalanceRepository.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        tenantId,
        leaveType: leaveRequest.leaveType,
        year,
      },
    });

    if (balance) {
      const numberOfDays = Number(leaveRequest.numberOfDays);
      balance.pending = Number(balance.pending) - numberOfDays;

      if (status === LeaveStatus.APPROVED) {
        balance.used = Number(balance.used) + numberOfDays;
      }

      await this.leaveBalanceRepository.save(balance);
    }

    return saved;
  }

  /**
   * Employee: Cancel leave request
   */
  async cancelLeave(leaveId: string, employeeId: string, tenantId: string) {
    if (!employeeId) {
      throw new Error('Employee profile is required to cancel leave');
    }

    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { leaveId, employeeId, tenantId },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status === LeaveStatus.CANCELLED) {
      throw new Error('Leave request is already cancelled');
    }

    if (leaveRequest.status === LeaveStatus.APPROVED) {
      // Check if leave has already started
      if (new Date() >= leaveRequest.startDate) {
        throw new Error('Cannot cancel leave that has already started');
      }
    }

    const previousStatus = leaveRequest.status;
    leaveRequest.status = LeaveStatus.CANCELLED;
    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // Update leave balance
    const year = new Date(leaveRequest.startDate).getFullYear();
    const balance = await this.leaveBalanceRepository.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        tenantId,
        leaveType: leaveRequest.leaveType,
        year,
      },
    });

    if (balance) {
      const numberOfDays = Number(leaveRequest.numberOfDays);
      if (previousStatus === LeaveStatus.PENDING) {
        balance.pending = Number(balance.pending) - numberOfDays;
      } else if (previousStatus === LeaveStatus.APPROVED) {
        balance.used = Number(balance.used) - numberOfDays;
      }

      await this.leaveBalanceRepository.save(balance);
    }

    return saved;
  }

  /**
   * Employee: Get my leave requests
   */
  async getMyLeaveRequests(
    employeeId: string,
    tenantId: string,
    status?: LeaveStatus,
    year?: number
  ) {
    // Return empty array if no employeeId (admin users without employee records)
    if (!employeeId) {
      return [];
    }

    const where: any = { employeeId, tenantId };

    if (status) {
      where.status = status;
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      where.startDate = Between(startOfYear, endOfYear);
    }

    return await this.leaveRequestRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['approver'],
    });
  }

  /**
   * Employee: Get leave balance
   */
  async getMyLeaveBalance(employeeId: string, tenantId: string, year?: number) {
    // Return empty array if no employeeId (admin users without employee records)
    if (!employeeId) {
      return [];
    }

    const currentYear = year || new Date().getFullYear();

    return await this.leaveBalanceRepository.find({
      where: {
        employeeId,
        tenantId,
        year: currentYear,
      },
      relations: ['policy'],
    });
  }

  /**
   * Employee/Manager/HR: Get active tenant leave policies
   */
  async getActiveLeavePolicies(tenantId: string) {
    return await this.leavePolicyRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: { leaveType: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * Manager: Get pending leave approvals for reportees
   */
  async getPendingApprovals(managerId: string, tenantId: string) {
    if (!managerId) {
      return [];
    }
    // Get all reportees
    const reportees = await this.employeeRepository.find({
      where: { managerId, tenantId },
    });

    const reporteeIds = reportees.map((e) => e.employeeId);

    if (reporteeIds.length === 0) {
      return [];
    }

    return await this.leaveRequestRepository.find({
      where: {
        employeeId: In(reporteeIds),
        tenantId,
        status: LeaveStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
      relations: ['employee', 'employee.department', 'employee.designation'],
    });
  }

  /**
   * HR: Get all leave requests for the company
   */
  async getAllLeaveRequests(
    tenantId: string,
    status?: LeaveStatus,
    departmentId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const queryBuilder = this.leaveRequestRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .leftJoinAndSelect('leave.approver', 'approver')
      .where('leave.tenantId = :tenantId', { tenantId });

    if (status) {
      queryBuilder.andWhere('leave.status = :status', { status });
    }

    if (departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', {
        departmentId,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('leave.startDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return await queryBuilder.orderBy('leave.createdAt', 'DESC').getMany();
  }

  /**
   * HR: Get leave statistics
   */
  async getLeaveStatistics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const leaves = await this.leaveRequestRepository.find({
      where: {
        tenantId,
        startDate: Between(startDate, endDate),
      },
    });

    const stats = {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === LeaveStatus.APPROVED).length,
      pending: leaves.filter((l) => l.status === LeaveStatus.PENDING).length,
      rejected: leaves.filter((l) => l.status === LeaveStatus.REJECTED).length,
      cancelled: leaves.filter((l) => l.status === LeaveStatus.CANCELLED)
        .length,
      byType: {} as Record<LeaveType, number>,
      totalDays: leaves.reduce((sum, l) => sum + l.numberOfDays, 0),
    };

    // Group by leave type
    Object.values(LeaveType).forEach((type) => {
      const typeLeaves = leaves.filter((l) => l.leaveType === type);
      stats.byType[type] = typeLeaves.reduce(
        (sum, l) => sum + l.numberOfDays,
        0
      );
    });

    return stats;
  }

  /**
   * HR: Initialize leave balance for employee
   */
  async initializeLeaveBalance(employeeId: string, tenantId: string, year: number) {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get all active leave policies for the tenant
    const policies = await this.leavePolicyRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const balances = [];

    for (const policy of policies) {
      // Check if balance already exists
      const existing = await this.leaveBalanceRepository.findOne({
        where: {
          employeeId,
          tenantId,
          leaveType: policy.leaveType,
          year,
        },
      });

      if (!existing) {
        const balance = this.leaveBalanceRepository.create({
          employeeId,
          tenantId: employee.tenantId,
          policyId: policy.policyId,
          leaveType: policy.leaveType,
          year,
          totalAllocated: policy.totalLeaves,
          used: 0,
          pending: 0,
          carriedForward: 0,
          encashed: 0,
        });

        balances.push(await this.leaveBalanceRepository.save(balance));
      }
    }

    return balances;
  }

  /**
   * Helper: Calculate leave days (excluding weekends)
   */
  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export default new LeaveService();
