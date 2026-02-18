import api from './api';

export enum LeaveType {
  SICK = 'sick',
  CASUAL = 'casual',
  EARNED = 'earned',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  UNPAID = 'unpaid',
  COMPENSATORY = 'compensatory',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface LeaveRequest {
  leaveRequestId: string;
  employeeId: string;
  tenantId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  approverId?: string;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
    designation?: { name: string };
  };
}

export interface LeaveBalance {
  leaveBalanceId: string;
  employeeId: string;
  tenantId: string;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  carryForwardDays: number;
}

export interface LeaveStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDaysUsed: number;
  byLeaveType: {
    leaveType: string;
    count: number;
    totalDays: number;
  }[];
}

class LeaveService {
  /**
   * Employee: Apply for leave
   */
  async applyLeave(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    emergencyContact?: string;
    attachmentUrl?: string;
  }): Promise<LeaveRequest> {
    const response = await api.post('/leave/apply', data);
    return response.data!;
  }

  /**
   * Employee: Cancel leave request
   */
  async cancelLeave(leaveId: string): Promise<LeaveRequest> {
    const response = await api.put(`/leave/${leaveId}/cancel`, {});
    return response.data!;
  }

  /**
   * Employee: Get my leave requests
   */
  async getMyRequests(status?: string, year?: number): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (year) params.append('year', year.toString());

    const response = await api.get(`/leave/my-requests?${params.toString()}`);
    return response.data || [];
  }

  /**
   * Employee: Get my leave balance
   */
  async getMyBalance(year?: number): Promise<LeaveBalance[]> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/leave/my-balance${params}`);
    return response.data || [];
  }

  /**
   * Manager: Get pending leave approvals for reportees
   */
  async getPendingApprovals(): Promise<LeaveRequest[]> {
    const response = await api.get('/leave/pending-approvals');
    return response.data || [];
  }

  /**
   * Manager/HR: Approve or reject leave
   */
  async approveOrReject(
    leaveId: string,
    status: 'approved' | 'rejected',
    comments?: string
  ): Promise<LeaveRequest> {
    const response = await api.put(`/leave/${leaveId}/approve`, {
      status,
      comments,
    });
    return response.data!;
  }

  /**
   * HR: Get all leave requests for the company
   */
  async getAllRequests(
    status?: string,
    departmentId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (departmentId) params.append('departmentId', departmentId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/leave/all-requests?${params.toString()}`);
    return response.data || [];
  }

  /**
   * HR: Get leave statistics
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<LeaveStatistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/leave/statistics?${params.toString()}`);
    return response.data!;
  }

  /**
   * HR: Initialize leave balance for employee
   */
  async initializeBalance(employeeId: string, year: number): Promise<LeaveBalance[]> {
    const response = await api.post('/leave/initialize-balance', {
      employeeId,
      year,
    });
    return response.data!;
  }
}

export default new LeaveService();
