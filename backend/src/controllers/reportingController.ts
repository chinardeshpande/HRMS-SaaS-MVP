import { Request, Response } from 'express';
import reportingService, { ReportFilters } from '../services/reportingService';
import logger from '../utils/logger';

export class ReportingController {
  /**
   * GET /api/reports/attendance-summary
   */
  async getAttendanceSummary(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate, departmentIds, employmentTypes } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' },
        });
      }

      const filters: ReportFilters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
        employmentTypes: employmentTypes ? (employmentTypes as string).split(',') : undefined,
      };

      const data = await reportingService.getAttendanceSummary(tenantId, filters);

      res.json({
        success: true,
        data: {
          report: 'Attendance Summary',
          filters,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching attendance summary:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch attendance summary' },
      });
    }
  }

  /**
   * GET /api/reports/leave-balance
   */
  async getLeaveBalance(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { departmentIds, employmentTypes } = req.query;

      const filters: ReportFilters = {
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
        employmentTypes: employmentTypes ? (employmentTypes as string).split(',') : undefined,
      };

      const data = await reportingService.getLeaveBalanceReport(tenantId, filters);

      res.json({
        success: true,
        data: {
          report: 'Leave Balance & Usage',
          filters,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching leave balance report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch leave balance report' },
      });
    }
  }

  /**
   * GET /api/reports/headcount
   */
  async getHeadcount(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { departmentIds, employmentTypes, status } = req.query;

      const filters: ReportFilters = {
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
        employmentTypes: employmentTypes ? (employmentTypes as string).split(',') : undefined,
        status: status ? (status as string).split(',') : undefined,
      };

      const data = await reportingService.getHeadcountReport(tenantId, filters);

      const summary = {
        totalHeadcount: data.reduce((sum, row) => sum + row.count, 0),
        byDepartment: this.groupBy(data, 'department'),
        byEmploymentType: this.groupBy(data, 'employmentType'),
        byStatus: this.groupBy(data, 'status'),
      };

      res.json({
        success: true,
        data: {
          report: 'Headcount Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching headcount report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch headcount report' },
      });
    }
  }

  /**
   * GET /api/reports/joiners-leavers
   */
  async getJoinersLeavers(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' },
        });
      }

      const filters: ReportFilters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const data = await reportingService.getJoinersLeaversReport(tenantId, filters);

      const summary = {
        totalJoiners: data.reduce((sum, row) => sum + row.joiners, 0),
        totalLeavers: data.reduce((sum, row) => sum + row.leavers, 0),
        netChange: data.reduce((sum, row) => sum + row.netChange, 0),
        averageMonthlyJoiners: data.length > 0
          ? Math.round((data.reduce((sum, row) => sum + row.joiners, 0) / data.length) * 10) / 10
          : 0,
        averageMonthlyLeavers: data.length > 0
          ? Math.round((data.reduce((sum, row) => sum + row.leavers, 0) / data.length) * 10) / 10
          : 0,
      };

      res.json({
        success: true,
        data: {
          report: 'Joiners & Leavers Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching joiners/leavers report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch joiners/leavers report' },
      });
    }
  }

  /**
   * GET /api/reports/confirmation-due
   */
  async getConfirmationDue(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { departmentIds } = req.query;

      const filters: ReportFilters = {
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
      };

      const data = await reportingService.getConfirmationDueReport(tenantId, filters);

      const summary = {
        totalPending: data.length,
        overdue: data.filter((r) => r.daysRemaining < 0).length,
        dueSoon: data.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 30).length,
        future: data.filter((r) => r.daysRemaining > 30).length,
      };

      res.json({
        success: true,
        data: {
          report: 'Confirmation Due Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching confirmation due report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch confirmation due report' },
      });
    }
  }

  /**
   * GET /api/reports/attrition
   */
  async getAttrition(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate, departmentIds } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' },
        });
      }

      const filters: ReportFilters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
      };

      const data = await reportingService.getAttritionReport(tenantId, filters);

      const summary = {
        totalExits: data.reduce((sum, row) => sum + row.exits, 0),
        averageAttritionRate: data.length > 0
          ? Math.round((data.reduce((sum, row) => sum + row.attritionRate, 0) / data.length) * 10) / 10
          : 0,
        voluntaryExits: data.reduce((sum, row) => sum + row.voluntaryExits, 0),
        involuntaryExits: data.reduce((sum, row) => sum + row.involuntaryExits, 0),
        highestAttritionDept: data.length > 0
          ? data.reduce((max, row) => row.attritionRate > max.attritionRate ? row : max).department
          : null,
      };

      res.json({
        success: true,
        data: {
          report: 'Attrition Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching attrition report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch attrition report' },
      });
    }
  }

  /**
   * GET /api/reports/pms-completion
   */
  async getPMSCompletion(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { startDate, endDate, departmentIds } = req.query;

      const filters: ReportFilters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
      };

      const data = await reportingService.getPMSCompletionReport(tenantId, filters);

      const summary = {
        totalReviews: data.length,
        completed: data.filter((r) => r.status === 'completed').length,
        pending: data.filter((r) => r.status === 'pending').length,
        overdue: data.filter((r) => r.overdueDays && r.overdueDays > 0).length,
        completionRate: data.length > 0
          ? Math.round((data.filter((r) => r.status === 'completed').length / data.length) * 100 * 10) / 10
          : 0,
      };

      res.json({
        success: true,
        data: {
          report: 'PMS Completion Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching PMS completion report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch PMS completion report' },
      });
    }
  }

  /**
   * GET /api/reports/missing-documents
   */
  async getMissingDocuments(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { departmentIds } = req.query;

      const filters: ReportFilters = {
        departmentIds: departmentIds ? (departmentIds as string).split(',') : undefined,
      };

      const data = await reportingService.getMissingDocumentsReport(tenantId, filters);

      const summary = {
        totalEmployees: data.length,
        highCriticality: data.filter((r) => r.criticality === 'high').length,
        mediumCriticality: data.filter((r) => r.criticality === 'medium').length,
        lowCriticality: data.filter((r) => r.criticality === 'low').length,
        mostMissingDocument: this.getMostMissingDocument(data),
      };

      res.json({
        success: true,
        data: {
          report: 'Missing Documents Report',
          filters,
          summary,
          results: data,
          totalRecords: data.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching missing documents report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch missing documents report' },
      });
    }
  }

  /**
   * GET /api/reports/memory-readiness
   */
  async getMemoryReadiness(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const data = await reportingService.getMemoryReadinessReport(tenantId);

      res.json({
        success: true,
        data: {
          report: 'Memory Readiness Report',
          summary: data.summary,
          results: data.results,
          companyDocumentFindings: data.companyDocumentFindings,
          totalRecords: data.results.length,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching memory readiness report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch memory readiness report' },
      });
    }
  }

  /**
   * GET /api/reports/saved
   */
  async getSavedReports(req: Request, res: Response) {
    try {
      const { tenantId, userId } = req.user!;

      const reports = await reportingService.getSavedReports(tenantId, userId);

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      logger.error('Error fetching saved reports:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch saved reports' },
      });
    }
  }

  /**
   * POST /api/reports/saved
   */
  async saveReport(req: Request, res: Response) {
    try {
      const { tenantId, userId } = req.user!;
      const reportData = {
        ...req.body,
        tenantId,
        createdBy: userId,
      };

      const report = await reportingService.saveReport(reportData);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      logger.error('Error saving report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to save report' },
      });
    }
  }

  /**
   * POST /api/reports/saved/:reportId/execute
   */
  async executeSavedReport(req: Request, res: Response) {
    try {
      const { tenantId } = req.user!;
      const { reportId } = req.params;

      const data = await reportingService.executeSavedReport(reportId, tenantId);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      logger.error('Error executing saved report:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to execute saved report' },
      });
    }
  }

  /**
   * Helper: Group data by field
   */
  private groupBy(data: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    data.forEach((row) => {
      const key = row[field] || 'Unknown';
      result[key] = (result[key] || 0) + row.count;
    });
    return result;
  }

  /**
   * Helper: Get most missing document
   */
  private getMostMissingDocument(data: any[]): string | null {
    const docCounts: Record<string, number> = {};
    data.forEach((row) => {
      row.missingDocuments.forEach((doc: string) => {
        docCounts[doc] = (docCounts[doc] || 0) + 1;
      });
    });

    if (Object.keys(docCounts).length === 0) return null;

    return Object.entries(docCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
}

export default new ReportingController();
