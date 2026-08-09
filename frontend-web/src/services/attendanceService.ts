import api from './api';

export interface Attendance {
  attendanceId: string;
  employeeId: string;
  tenantId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';
  workMinutes?: number;
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyOut?: boolean;
  earlyMinutes?: number;
  overtimeMinutes?: number;
  location?: string;
  ipAddress?: string;
  notes?: string;
  isManualOverride?: boolean;
  overriddenBy?: string;
  overriddenAt?: Date;
  overrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: {
      departmentId: string;
      name: string;
    };
    designation?: {
      name: string;
    };
  };
}

export interface AttendanceStatistics {
  totalRecords: number;
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  late: number;
  earlyOut: number;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
  averageWorkMinutes: number;
}

export interface DepartmentAttendance {
  departmentId: string;
  departmentName: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  totalWorkMinutes: number;
}

export type AttendanceImportAction = 'create' | 'update' | 'unchanged' | 'skip' | 'error';
export type AttendanceImportConflictPolicy = 'skip' | 'overwrite';

export interface AttendanceImportPreview {
  fileName: string;
  conflictPolicy: AttendanceImportConflictPolicy;
  totalRows: number;
  dateRange: { from?: string; to?: string };
  summary: {
    creates: number;
    updates: number;
    unchanged: number;
    skipped: number;
    errors: number;
    ready: number;
  };
  rows: Array<{
    row: number;
    employeeCode: string;
    employeeId?: string;
    employeeName?: string;
    date: string;
    status?: Attendance['status'];
    checkIn?: string;
    checkOut?: string;
    workMinutes?: number;
    location?: string;
    notes?: string;
    action: AttendanceImportAction;
    messages: string[];
  }>;
}

export enum TimeEntryEditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface TimeEntryEdit {
  editId: string;
  employeeId: string;
  tenantId: string;
  attendanceId: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: TimeEntryEditStatus;
  approverId?: string;
  approvedAt?: string;
  approverComments?: string;
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
  attendance?: Attendance;
  approver?: {
    firstName: string;
    lastName: string;
  };
}

class AttendanceService {
  async previewImport(
    file: File,
    conflictPolicy: AttendanceImportConflictPolicy
  ): Promise<AttendanceImportPreview> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conflictPolicy', conflictPolicy);
    const response = await api.post('/attendance/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async commitImport(
    file: File,
    conflictPolicy: AttendanceImportConflictPolicy
  ): Promise<AttendanceImportPreview & { imported: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conflictPolicy', conflictPolicy);
    const response = await api.post('/attendance/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /**
   * Employee: Clock In
   */
  async clockIn(location?: string): Promise<Attendance> {
    const response = await api.post('/attendance/clock-in', { location });
    return response.data;
  }

  /**
   * Employee: Clock Out
   */
  async clockOut(): Promise<Attendance> {
    const response = await api.post('/attendance/clock-out');
    return response.data;
  }

  async reopenToday(reason: string): Promise<Attendance> {
    const response = await api.post('/attendance/reopen-today', { reason });
    return response.data;
  }

  /**
   * Employee: Get my attendance history
   */
  async getMyAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/attendance/my-attendance?${params.toString()}`);
    return response.data || [];
  }

  /**
   * HR: Bulk update attendance
   */
  async bulkUpdate(
    updates: Array<{
      attendanceId?: string;
      employeeId?: string;
      date?: string;
      status?: string;
      checkIn?: string;
      checkOut?: string;
      notes?: string;
    }>,
    overrideReason: string
  ): Promise<Attendance[]> {
    const response = await api.post('/attendance/bulk-update', {
      updates,
      overrideReason,
    });
    return response.data;
  }

  /**
   * HR: Override attendance status
   */
  async overrideAttendance(
    attendanceId: string,
    updates: Partial<Attendance>,
    overrideReason: string
  ): Promise<Attendance> {
    const response = await api.put(`/attendance/override/${attendanceId}`, {
      updates,
      overrideReason,
    });
    return response.data;
  }

  /**
   * HR/Manager: Get company-wide attendance
   */
  async getCompanyWide(
    startDate?: string,
    endDate?: string,
    departmentId?: string
  ): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (departmentId) params.append('departmentId', departmentId);

    const response = await api.get(`/attendance/company-wide?${params.toString()}`);
    return response.data || [];
  }

  /**
   * HR: Get attendance statistics
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<AttendanceStatistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/attendance/statistics?${params.toString()}`);
    return response.data!;
  }

  /**
   * HR: Get attendance by department
   */
  async getByDepartment(startDate?: string, endDate?: string): Promise<DepartmentAttendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/attendance/by-department?${params.toString()}`);
    return response.data || [];
  }

  /**
   * Employee: Request time entry regularization
   */
  async requestRegularization(data: {
    date: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason?: string;
  }): Promise<TimeEntryEdit> {
    const response = await api.post('/attendance/regularization/request', data);
    return response.data!;
  }

  /**
   * Employee: Get my regularization requests
   */
  async getMyRegularizationRequests(): Promise<TimeEntryEdit[]> {
    const response = await api.get('/attendance/regularization/my-requests');
    return response.data || [];
  }

  /**
   * Manager/HR: Get pending regularization requests
   */
  async getPendingRegularizations(): Promise<TimeEntryEdit[]> {
    const response = await api.get('/attendance/regularization/pending');
    return response.data || [];
  }

  /**
   * Manager/HR: Approve regularization request
   */
  async approveRegularization(editId: string, comments?: string): Promise<TimeEntryEdit> {
    const response = await api.put(`/attendance/regularization/${editId}/approve`, {
      comments,
    });
    return response.data!;
  }

  /**
   * Manager/HR: Reject regularization request
   */
  async rejectRegularization(editId: string, comments: string): Promise<TimeEntryEdit> {
    const response = await api.put(`/attendance/regularization/${editId}/reject`, {
      comments,
    });
    return response.data!;
  }

  /**
   * Manager/HR: Get team attendance
   */
  async getTeamAttendance(startDate?: string, endDate?: string): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/attendance/team?${params.toString()}`);
    return response.data || [];
  }
}

export default new AttendanceService();
