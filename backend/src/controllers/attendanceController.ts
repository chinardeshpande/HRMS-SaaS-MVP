import { Request, Response } from 'express';
import attendanceService from '../services/attendanceService';
import { AttendanceStatus } from '../models/Attendance';
import managerTeamService from '../services/managerTeamService';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management endpoints
 */

export class AttendanceController {
  /**
   * @swagger
   * /attendance/clock-in:
   *   post:
   *     summary: Clock in for the day
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               location:
   *                 type: string
   *     responses:
   *       200:
   *         description: Successfully clocked in
   */
  async clockIn(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;
      const { location } = req.body;
      const ipAddress = req.ip;

      const attendance = await attendanceService.clockIn(
        employeeId,
        tenantId,
        ipAddress,
        location
      );

      res.json({
        success: true,
        data: attendance,
        message: 'Successfully clocked in',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/clock-out:
   *   post:
   *     summary: Clock out for the day
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Successfully clocked out
   */
  async clockOut(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;

      const attendance = await attendanceService.clockOut(employeeId, tenantId);

      res.json({
        success: true,
        data: attendance,
        message: 'Successfully clocked out',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/my-attendance:
   *   get:
   *     summary: Get my attendance history
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Attendance history retrieved
   */
  async getMyAttendance(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const attendance = await attendanceService.getMyAttendance(
        employeeId,
        tenantId,
        start,
        end
      );

      res.json({
        success: true,
        data: attendance,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/bulk-update:
   *   post:
   *     summary: Bulk update attendance records (HR only)
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               updates:
   *                 type: array
   *               overrideReason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Bulk update successful
   */
  async bulkUpdate(req: Request, res: Response) {
    try {
      const { updates, overrideReason } = req.body;
      const overriddenBy = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;

      const result = await attendanceService.bulkUpdateAttendance(
        tenantId,
        updates,
        overriddenBy,
        overrideReason
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.length} attendance records`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/override/{attendanceId}:
   *   put:
   *     summary: Override attendance record (HR only)
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: attendanceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Attendance overridden successfully
   */
  async overrideAttendance(req: Request, res: Response) {
    try {
      const { attendanceId } = req.params;
      const { updates, overrideReason } = req.body;
      const overriddenBy = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;

      const result = await attendanceService.overrideAttendance(
        tenantId,
        attendanceId,
        updates,
        overriddenBy,
        overrideReason
      );

      res.json({
        success: true,
        data: result,
        message: 'Attendance record overridden successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/company-wide:
   *   get:
   *     summary: Get company-wide attendance (role-based filtering)
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Company-wide attendance retrieved
   *
   * ROLE-BASED FILTERING:
   * - MANAGER: Only see direct reports' attendance
   * - HR_ADMIN/SYSTEM_ADMIN: See all attendance
   */
  async getCompanyWide(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const employeeId = (req as any).user.employeeId;
      const { startDate, endDate, departmentId } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get all attendance records
      const attendance = await attendanceService.getCompanyWideAttendance(
        tenantId,
        start,
        end,
        departmentId as string
      );

      // Filter by role
      let filteredAttendance = attendance;

      if (userRole === UserRole.MANAGER && employeeId) {
        // Managers can only see their team's attendance
        const teamEmployeeIds = await managerTeamService.getTeamEmployeeIds(
          employeeId,
          tenantId
        );

        filteredAttendance = attendance.filter((record: any) =>
          teamEmployeeIds.includes(record.employeeId) || record.employeeId === employeeId
        );

        logger.info(
          `Manager ${employeeId} attendance filtered: ${attendance.length} -> ${filteredAttendance.length}`
        );
      }

      res.json({
        success: true,
        data: filteredAttendance,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/statistics:
   *   get:
   *     summary: Get attendance statistics (HR only)
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Statistics retrieved
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const stats = await attendanceService.getAttendanceStatistics(
        tenantId,
        start,
        end
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/by-department:
   *   get:
   *     summary: Get attendance by department (HR only)
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Department-wise attendance retrieved
   */
  async getByDepartment(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const result = await attendanceService.getAttendanceByDepartment(
        tenantId,
        start,
        end
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/regularization/request:
   *   post:
   *     summary: Request time entry regularization
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 format: date
   *               requestedCheckIn:
   *                 type: string
   *                 format: date-time
   *               requestedCheckOut:
   *                 type: string
   *                 format: date-time
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Regularization request submitted
   */
  async requestRegularization(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;
      const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;

      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);

      const requestedCheckInDate = requestedCheckIn ? new Date(requestedCheckIn) : undefined;
      const requestedCheckOutDate = requestedCheckOut ? new Date(requestedCheckOut) : undefined;

      const regularization = await attendanceService.requestRegularization(
        employeeId,
        tenantId,
        dateObj,
        requestedCheckInDate,
        requestedCheckOutDate,
        reason
      );

      res.json({
        success: true,
        data: regularization,
        message: 'Regularization request submitted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/regularization/my-requests:
   *   get:
   *     summary: Get my regularization requests
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Regularization requests retrieved
   */
  async getMyRegularizationRequests(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;

      const requests = await attendanceService.getMyRegularizationRequests(
        employeeId,
        tenantId
      );

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/regularization/pending:
   *   get:
   *     summary: Get pending regularization requests (Manager/HR)
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Pending regularization requests retrieved
   */
  async getPendingRegularizations(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const employeeId = (req as any).user.employeeId;

      let employeeIds: string[] | undefined;

      if (userRole === UserRole.MANAGER) {
        // Managers can only see their team's regularization requests
        employeeIds = await managerTeamService.getTeamEmployeeIds(
          employeeId,
          tenantId
        );
      }

      const requests = await attendanceService.getPendingRegularizations(
        tenantId,
        employeeIds
      );

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/regularization/{editId}/approve:
   *   put:
   *     summary: Approve regularization request (Manager/HR)
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: editId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Regularization approved
   */
  async approveRegularization(req: Request, res: Response) {
    try {
      const { editId } = req.params;
      const approverId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const { comments } = req.body;
      const employeeIds =
        userRole === UserRole.MANAGER
          ? await managerTeamService.getTeamEmployeeIds(approverId, tenantId)
          : undefined;

      const result = await attendanceService.approveRegularization(
        editId,
        approverId,
        tenantId,
        comments,
        employeeIds
      );

      res.json({
        success: true,
        data: result,
        message: 'Regularization request approved successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/regularization/{editId}/reject:
   *   put:
   *     summary: Reject regularization request (Manager/HR)
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: editId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - comments
   *             properties:
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Regularization rejected
   */
  async rejectRegularization(req: Request, res: Response) {
    try {
      const { editId } = req.params;
      const approverId = (req as any).user.employeeId;
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const { comments } = req.body;

      if (!comments) {
        return res.status(400).json({
          success: false,
          error: 'Comments are required when rejecting a regularization request',
        });
      }

      const employeeIds =
        userRole === UserRole.MANAGER
          ? await managerTeamService.getTeamEmployeeIds(approverId, tenantId)
          : undefined;

      const result = await attendanceService.rejectRegularization(
        editId,
        approverId,
        tenantId,
        comments,
        employeeIds
      );

      res.json({
        success: true,
        data: result,
        message: 'Regularization request rejected',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /attendance/team:
   *   get:
   *     summary: Get team attendance (Manager/HR)
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Team attendance retrieved
   */
  async getTeamAttendance(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const employeeId = (req as any).user.employeeId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      // For managers, filter by team. For HR/Admin, use getCompanyWideAttendance instead
      if (userRole === UserRole.MANAGER) {
        const employeeIds = await managerTeamService.getTeamEmployeeIds(
          employeeId,
          tenantId
        );

        const attendance = await attendanceService.getTeamAttendance(
          tenantId,
          employeeIds,
          start,
          end
        );

        res.json({
          success: true,
          data: attendance,
        });
      } else {
        // HR/Admin: use company-wide attendance endpoint
        const attendance = await attendanceService.getCompanyWideAttendance(
          tenantId,
          start,
          end
        );

        res.json({
          success: true,
          data: attendance,
        });
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new AttendanceController();
