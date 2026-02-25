import api from './api';

export interface Attendance {
  attendanceId: string;
  employeeId: string;
  tenantId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day' | 'on-leave';
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

class AttendanceService {
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
      attendanceId: string;
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
}

export default new AttendanceService();
