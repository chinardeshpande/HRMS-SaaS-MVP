import { Request, Response } from 'express';
import attendanceService from '../services/attendanceService';
import { AttendanceStatus } from '../models/Attendance';

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
      const { location } = req.body;
      const ipAddress = req.ip;

      const attendance = await attendanceService.clockIn(
        employeeId,
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

      const attendance = await attendanceService.clockOut(employeeId);

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
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const attendance = await attendanceService.getMyAttendance(
        employeeId,
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

      const result = await attendanceService.bulkUpdateAttendance(
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

      const result = await attendanceService.overrideAttendance(
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
   *     summary: Get company-wide attendance (HR only)
   *     tags: [Attendance]
   *     responses:
   *       200:
   *         description: Company-wide attendance retrieved
   */
  async getCompanyWide(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, departmentId } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const attendance = await attendanceService.getCompanyWideAttendance(
        tenantId,
        start,
        end,
        departmentId as string
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
}

export default new AttendanceController();
