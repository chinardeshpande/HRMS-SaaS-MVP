import { Request, Response } from 'express';
import orgStructureService from '../services/orgStructureService';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';

/**
 * @swagger
 * tags:
 *   name: OrgStructure
 *   description: Organizational structure and hierarchy endpoints
 */

export class OrgStructureController {
  /**
   * @swagger
   * /org-structure:
   *   get:
   *     summary: Get organizational structure based on user role
   *     tags: [OrgStructure]
   *     responses:
   *       200:
   *         description: Organizational structure retrieved
   *
   * ROLE-BASED VIEWS:
   * - EMPLOYEE: See their manager and peers
   * - MANAGER: See their manager, themselves, and direct reports
   * - HR_ADMIN/SYSTEM_ADMIN: See the entire organization
   */
  async getOrgStructure(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const userRole = (req as any).user.role as UserRole;
      const employeeId = (req as any).user.employeeId || null;

      const orgStructure = await orgStructureService.getOrgStructure(
        tenantId,
        userRole,
        employeeId
      );

      res.json({
        success: true,
        data: orgStructure,
      });
    } catch (error: any) {
      logger.error('Error fetching org structure:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /org-structure/approval-chain/{employeeId}:
   *   get:
   *     summary: Get approval chain for a specific employee
   *     tags: [OrgStructure]
   *     parameters:
   *       - in: path
   *         name: employeeId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Approval chain retrieved
   */
  async getApprovalChain(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const { employeeId } = req.params;

      const approvalChain = await orgStructureService.getApprovalChain(
        tenantId,
        employeeId
      );

      res.json({
        success: true,
        data: approvalChain,
      });
    } catch (error: any) {
      logger.error('Error fetching approval chain:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export default new OrgStructureController();
