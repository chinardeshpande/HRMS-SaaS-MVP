import { Request, Response } from 'express';
import leaveService from '../services/leaveService';
import { LeaveStatus } from '../models/LeaveRequest';
import { LeaveType } from '../models/LeavePolicy';

/**
 * @swagger
 * tags:
 *   name: Leave
 *   description: Leave management endpoints
 */

export class LeaveController {
  /**
   * @swagger
   * /leave/apply:
   *   post:
   *     summary: Apply for leave
   *     tags: [Leave]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - leaveType
   *               - startDate
   *               - endDate
   *               - reason
   *             properties:
   *               leaveType:
   *                 type: string
   *                 enum: [sick, casual, earned, maternity, paternity, unpaid, compensatory]
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *               reason:
   *                 type: string
   *               emergencyContact:
   *                 type: string
   *               attachmentUrl:
   *                 type: string
   *     responses:
   *       200:
   *         description: Leave applied successfully
   */
  async applyLeave(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const {
        leaveType,
        startDate,
        endDate,
        reason,
        emergencyContact,
        attachmentUrl,
      } = req.body;

      const leave = await leaveService.applyLeave(
        employeeId,
        leaveType as LeaveType,
        new Date(startDate),
        new Date(endDate),
        reason,
        emergencyContact,
        attachmentUrl
      );

      res.json({
        success: true,
        data: leave,
        message: 'Leave request submitted successfully',
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
   * /leave/{leaveId}/approve:
   *   put:
   *     summary: Approve or reject leave request
   *     tags: [Leave]
   *     parameters:
   *       - in: path
   *         name: leaveId
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
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               comments:
   *                 type: string
   *     responses:
   *       200:
   *         description: Leave request processed
   */
  async approveOrReject(req: Request, res: Response) {
    try {
      const { leaveId } = req.params;
      const { status, comments } = req.body;
      const approverId = (req as any).user.employeeId;

      const leave = await leaveService.approveOrRejectLeave(
        leaveId,
        approverId,
        status as LeaveStatus.APPROVED | LeaveStatus.REJECTED,
        comments
      );

      res.json({
        success: true,
        data: leave,
        message: `Leave request ${status} successfully`,
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
   * /leave/{leaveId}/cancel:
   *   put:
   *     summary: Cancel leave request
   *     tags: [Leave]
   *     parameters:
   *       - in: path
   *         name: leaveId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Leave cancelled successfully
   */
  async cancelLeave(req: Request, res: Response) {
    try {
      const { leaveId } = req.params;
      const employeeId = (req as any).user.employeeId;

      const leave = await leaveService.cancelLeave(leaveId, employeeId);

      res.json({
        success: true,
        data: leave,
        message: 'Leave request cancelled successfully',
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
   * /leave/my-requests:
   *   get:
   *     summary: Get my leave requests
   *     tags: [Leave]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected, cancelled]
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Leave requests retrieved
   */
  async getMyRequests(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const { status, year } = req.query;

      const leaves = await leaveService.getMyLeaveRequests(
        employeeId,
        status as LeaveStatus,
        year ? parseInt(year as string) : undefined
      );

      res.json({
        success: true,
        data: leaves,
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
   * /leave/my-balance:
   *   get:
   *     summary: Get my leave balance
   *     tags: [Leave]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Leave balance retrieved
   */
  async getMyBalance(req: Request, res: Response) {
    try {
      const employeeId = (req as any).user.employeeId;
      const { year } = req.query;

      const balances = await leaveService.getMyLeaveBalance(
        employeeId,
        year ? parseInt(year as string) : undefined
      );

      res.json({
        success: true,
        data: balances,
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
   * /leave/pending-approvals:
   *   get:
   *     summary: Get pending leave approvals for my team
   *     tags: [Leave]
   *     responses:
   *       200:
   *         description: Pending approvals retrieved
   */
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const managerId = (req as any).user.employeeId;

      const leaves = await leaveService.getPendingApprovals(managerId);

      res.json({
        success: true,
        data: leaves,
        count: leaves.length,
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
   * /leave/all-requests:
   *   get:
   *     summary: Get all leave requests (HR only)
   *     tags: [Leave]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: departmentId
   *         schema:
   *           type: string
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
   *         description: All leave requests retrieved
   */
  async getAllRequests(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { status, departmentId, startDate, endDate } = req.query;

      const leaves = await leaveService.getAllLeaveRequests(
        tenantId,
        status as LeaveStatus,
        departmentId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: leaves,
        count: leaves.length,
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
   * /leave/statistics:
   *   get:
   *     summary: Get leave statistics (HR only)
   *     tags: [Leave]
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
   *         description: Leave statistics retrieved
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().setDate(1));
      const end = endDate ? new Date(endDate as string) : new Date();

      const stats = await leaveService.getLeaveStatistics(
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
   * /leave/initialize-balance:
   *   post:
   *     summary: Initialize leave balance for employee (HR only)
   *     tags: [Leave]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - employeeId
   *               - year
   *             properties:
   *               employeeId:
   *                 type: string
   *               year:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Leave balance initialized
   */
  async initializeBalance(req: Request, res: Response) {
    try {
      const { employeeId, year } = req.body;

      const balances = await leaveService.initializeLeaveBalance(
        employeeId,
        year
      );

      res.json({
        success: true,
        data: balances,
        message: 'Leave balance initialized successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new LeaveController();
