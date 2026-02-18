import { AppDataSource } from '../config/database';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { Employee } from '../models/Employee';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { Between, In } from 'typeorm';

export class AttendanceService {
  private attendanceRepository = AppDataSource.getRepository(Attendance);
  private employeeRepository = AppDataSource.getRepository(Employee);
  private policyRepository = AppDataSource.getRepository(AttendancePolicy);

  /**
   * Employee: Clock In
   */
  async clockIn(employeeId: string, ipAddress?: string, location?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing && existing.checkIn) {
      throw new Error('Already clocked in today');
    }

    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const now = new Date();

    if (existing) {
      existing.checkIn = now;
      existing.ipAddress = ipAddress;
      existing.location = location;
      existing.status = AttendanceStatus.PRESENT;
      return await this.attendanceRepository.save(existing);
    }

    const attendance = this.attendanceRepository.create({
      employeeId,
      tenantId: employee.tenantId,
      date: today,
      checkIn: now,
      status: AttendanceStatus.PRESENT,
      ipAddress,
      location,
    });

    return await this.attendanceRepository.save(attendance);
  }

  /**
   * Employee: Clock Out
   */
  async clockOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date: today,
      },
    });

    if (!attendance) {
      throw new Error('No clock-in record found for today');
    }

    if (attendance.checkOut) {
      throw new Error('Already clocked out today');
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate work minutes
    if (attendance.checkIn) {
      const workMs = now.getTime() - attendance.checkIn.getTime();
      attendance.workMinutes = Math.floor(workMs / 60000); // Convert to minutes
    }

    // Get policy to determine if it's a half day
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
    });

    if (employee) {
      const policy = await this.policyRepository.findOne({
        where: { tenantId: employee.tenantId, isActive: true },
      });

      if (policy) {
        // Check if late
        if (attendance.checkIn) {
          const checkInTime = attendance.checkIn.getHours() * 60 + attendance.checkIn.getMinutes();
          const standardCheckInParts = policy.standardCheckIn.split(':');
          const standardMinutes = parseInt(standardCheckInParts[0]) * 60 + parseInt(standardCheckInParts[1]);

          if (checkInTime > standardMinutes + policy.lateGraceMinutes) {
            attendance.isLate = true;
            attendance.lateMinutes = checkInTime - standardMinutes;
          }
        }

        // Check if early out
        const checkOutTime = now.getHours() * 60 + now.getMinutes();
        const standardCheckOutParts = policy.standardCheckOut.split(':');
        const standardOutMinutes = parseInt(standardCheckOutParts[0]) * 60 + parseInt(standardCheckOutParts[1]);

        if (checkOutTime < standardOutMinutes - policy.earlyGraceMinutes) {
          attendance.isEarlyOut = true;
          attendance.earlyMinutes = standardOutMinutes - checkOutTime;
        }

        // Determine status based on work minutes
        if (attendance.workMinutes < policy.halfDayMinutes) {
          attendance.status = AttendanceStatus.HALF_DAY;
        } else if (attendance.workMinutes > policy.requiredWorkMinutes) {
          attendance.overtimeMinutes = attendance.workMinutes - policy.requiredWorkMinutes;
        }
      }
    }

    return await this.attendanceRepository.save(attendance);
  }

  /**
   * Employee: Get my attendance history
   */
  async getMyAttendance(employeeId: string, startDate: Date, endDate: Date) {
    return await this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: {
        date: 'DESC',
      },
    });
  }

  /**
   * HR: Bulk update attendance
   */
  async bulkUpdateAttendance(
    attendanceUpdates: Array<{
      attendanceId: string;
      status?: AttendanceStatus;
      checkIn?: Date;
      checkOut?: Date;
      notes?: string;
    }>,
    overriddenBy: string,
    overrideReason: string
  ) {
    const results = [];

    for (const update of attendanceUpdates) {
      const attendance = await this.attendanceRepository.findOne({
        where: { attendanceId: update.attendanceId },
      });

      if (attendance) {
        if (update.status) attendance.status = update.status;
        if (update.checkIn) attendance.checkIn = update.checkIn;
        if (update.checkOut) attendance.checkOut = update.checkOut;
        if (update.notes) attendance.notes = update.notes;

        attendance.isManualOverride = true;
        attendance.overriddenBy = overriddenBy;
        attendance.overriddenAt = new Date();
        attendance.overrideReason = overrideReason;

        // Recalculate work minutes if both check-in and check-out are present
        if (attendance.checkIn && attendance.checkOut) {
          const workMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
          attendance.workMinutes = Math.floor(workMs / 60000);
        }

        const saved = await this.attendanceRepository.save(attendance);
        results.push(saved);
      }
    }

    return results;
  }

  /**
   * HR: Override attendance status
   */
  async overrideAttendance(
    attendanceId: string,
    updates: Partial<Attendance>,
    overriddenBy: string,
    overrideReason: string
  ) {
    const attendance = await this.attendanceRepository.findOne({
      where: { attendanceId },
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    Object.assign(attendance, updates);
    attendance.isManualOverride = true;
    attendance.overriddenBy = overriddenBy;
    attendance.overriddenAt = new Date();
    attendance.overrideReason = overrideReason;

    // Recalculate work minutes if both check-in and check-out are present
    if (attendance.checkIn && attendance.checkOut) {
      const workMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
      attendance.workMinutes = Math.floor(workMs / 60000);
    }

    return await this.attendanceRepository.save(attendance);
  }

  /**
   * HR: Get company-wide attendance for a date range
   */
  async getCompanyWideAttendance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ) {
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .where('attendance.tenantId = :tenantId', { tenantId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', {
        departmentId,
      });
    }

    return await queryBuilder.orderBy('attendance.date', 'DESC').getMany();
  }

  /**
   * HR: Get attendance statistics
   */
  async getAttendanceStatistics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const attendance = await this.attendanceRepository.find({
      where: {
        tenantId,
        date: Between(startDate, endDate),
      },
    });

    const stats = {
      totalRecords: attendance.length,
      present: attendance.filter((a) => a.status === AttendanceStatus.PRESENT)
        .length,
      absent: attendance.filter((a) => a.status === AttendanceStatus.ABSENT)
        .length,
      halfDay: attendance.filter((a) => a.status === AttendanceStatus.HALF_DAY)
        .length,
      onLeave: attendance.filter((a) => a.status === AttendanceStatus.ON_LEAVE)
        .length,
      late: attendance.filter((a) => a.isLate).length,
      earlyOut: attendance.filter((a) => a.isEarlyOut).length,
      totalWorkMinutes: attendance.reduce(
        (sum, a) => sum + (a.workMinutes || 0),
        0
      ),
      totalOvertimeMinutes: attendance.reduce(
        (sum, a) => sum + (a.overtimeMinutes || 0),
        0
      ),
      averageWorkMinutes:
        attendance.length > 0
          ? attendance.reduce((sum, a) => sum + (a.workMinutes || 0), 0) /
            attendance.length
          : 0,
    };

    return stats;
  }

  /**
   * HR: Get attendance by department
   */
  async getAttendanceByDepartment(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.employee', 'employee')
      .leftJoin('employee.department', 'department')
      .select('department.departmentId', 'departmentId')
      .addSelect('department.departmentName', 'departmentName')
      .addSelect('COUNT(*)', 'totalRecords')
      .addSelect(
        "SUM(CASE WHEN attendance.status = 'present' THEN 1 ELSE 0 END)",
        'presentCount'
      )
      .addSelect(
        "SUM(CASE WHEN attendance.status = 'absent' THEN 1 ELSE 0 END)",
        'absentCount'
      )
      .addSelect('SUM(attendance.workMinutes)', 'totalWorkMinutes')
      .where('attendance.tenantId = :tenantId', { tenantId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('department.departmentId')
      .addGroupBy('department.departmentName')
      .getRawMany();

    return result;
  }
}

export default new AttendanceService();
