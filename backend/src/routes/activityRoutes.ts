import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { AppDataSource } from '../config/database';
import { OnboardingCase } from '../models/OnboardingCase';
import { ExitCase } from '../models/ExitCase';
import { LeaveRequest } from '../models/LeaveRequest';
import { HRConnectPost } from '../models/HRConnectPost';
import { CompensationHistory } from '../models/CompensationHistory';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

interface Activity {
  activityId: string;
  type: 'onboarding' | 'leave_approval' | 'performance_review' | 'promotion' | 'transfer' | 'increment' | 'bonus' | 'exit' | 'training' | 'new_post' | 'new_chat_message' | 'new_ticket' | 'ticket_update' | 'other';
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  message: string;
  description?: string;
  timestamp: string;
  performedBy?: string;
  navigationUrl?: string;
}

/**
 * GET /api/v1/activities/recent
 * Get recent activities across the organization
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string) || 20;

    const activities: Activity[] = [];

    // Get recent onboardings
    const onboardingRepo = AppDataSource.getRepository(OnboardingCase);
    const recentOnboarding = await onboardingRepo
      .createQueryBuilder('onboarding')
      .leftJoinAndSelect('onboarding.candidate', 'candidate')
      .leftJoinAndSelect('candidate.department', 'department')
      .where('onboarding.tenantId = :tenantId', { tenantId })
      .orderBy('onboarding.createdAt', 'DESC')
      .limit(5)
      .getMany();

    recentOnboarding.forEach((onboarding) => {
      if (onboarding.candidate) {
        activities.push({
          activityId: `onboarding-${onboarding.caseId}`,
          type: 'onboarding',
          employeeId: onboarding.candidateId,
          employeeName: `${onboarding.candidate.firstName} ${onboarding.candidate.lastName}`,
          departmentName: onboarding.candidate.department?.name,
          message: `${onboarding.candidate.firstName} ${onboarding.candidate.lastName} is joining`,
          timestamp: onboarding.createdAt.toISOString(),
          navigationUrl: `/onboarding/candidate/${onboarding.candidateId}`,
        });
      }
    });

    // Get recent leave approvals
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);
    const recentLeaves = await leaveRepo
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('leave.tenantId = :tenantId', { tenantId })
      .andWhere('leave.status IN (:...statuses)', { statuses: ['approved', 'rejected'] })
      .orderBy('leave.updatedAt', 'DESC')
      .limit(5)
      .getMany();

    recentLeaves.forEach((leave) => {
      if (leave.employee) {
        activities.push({
          activityId: `leave-${leave.leaveId}`,
          type: 'leave_approval',
          employeeId: leave.employeeId,
          employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
          departmentName: leave.employee.department?.name,
          message: `Leave request ${leave.status} for ${leave.employee.firstName} ${leave.employee.lastName}`,
          timestamp: leave.updatedAt.toISOString(),
          navigationUrl: '/leave',
        });
      }
    });

    // Get recent exits
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const recentExits = await exitRepo
      .createQueryBuilder('exit')
      .leftJoinAndSelect('exit.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('exit.tenantId = :tenantId', { tenantId })
      .orderBy('exit.createdAt', 'DESC')
      .limit(5)
      .getMany();

    recentExits.forEach((exitCase) => {
      if (exitCase.employee) {
        activities.push({
          activityId: `exit-${exitCase.exitId}`,
          type: 'exit',
          employeeId: exitCase.employeeId,
          employeeName: `${exitCase.employee.firstName} ${exitCase.employee.lastName}`,
          departmentName: exitCase.employee.department?.name,
          message: `${exitCase.employee.firstName} ${exitCase.employee.lastName} submitted resignation`,
          timestamp: exitCase.createdAt.toISOString(),
          navigationUrl: `/exit/${exitCase.exitId}`,
        });
      }
    });

    // Get recent HR Connect posts
    const postRepo = AppDataSource.getRepository(HRConnectPost);
    const recentPosts = await postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.department', 'department')
      .where('post.tenantId = :tenantId', { tenantId })
      .orderBy('post.createdAt', 'DESC')
      .limit(5)
      .getMany();

    recentPosts.forEach((post) => {
      if (post.author) {
        activities.push({
          activityId: `post-${post.postId}`,
          type: 'new_post',
          employeeId: post.authorId,
          employeeName: `${post.author.firstName} ${post.author.lastName}`,
          departmentName: post.author.department?.name,
          message: `${post.author.firstName} ${post.author.lastName} posted: ${post.title || post.content.substring(0, 50)}`,
          timestamp: post.createdAt.toISOString(),
          navigationUrl: '/hr-connect',
        });
      }
    });

    // Tickets - simplified for now (Ticket model path needs verification)
    // Future: Add when Ticket model is available

    // Get recent promotions/increments
    const compensationRepo = AppDataSource.getRepository(CompensationHistory);
    const recentCompensation = await compensationRepo
      .createQueryBuilder('comp')
      .leftJoinAndSelect('comp.employee', 'employee')
      .leftJoinAndSelect('employee.department', 'department')
      .where('comp.tenantId = :tenantId', { tenantId })
      .andWhere('comp.changeType IN (:...types)', { types: ['promotion', 'increment', 'bonus'] })
      .orderBy('comp.effectiveDate', 'DESC')
      .limit(5)
      .getMany();

    recentCompensation.forEach((comp) => {
      if (comp.employee) {
        const type = comp.changeType === 'promotion' ? 'promotion' : comp.changeType === 'increment' ? 'increment' : 'bonus';
        activities.push({
          activityId: `comp-${comp.historyId}`,
          type: type as any,
          employeeId: comp.employeeId,
          employeeName: `${comp.employee.firstName} ${comp.employee.lastName}`,
          departmentName: comp.employee.department?.name,
          message: `${comp.employee.firstName} ${comp.employee.lastName} ${comp.changeType}: Compensation updated`,
          timestamp: comp.effectiveDate.toISOString(),
          navigationUrl: `/employees/${comp.employeeId}`,
        });
      }
    });

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities,
    });
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch recent activities',
      },
    });
  }
});

/**
 * GET /api/v1/activities/user/:userId
 * Get activities for a specific user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const tenantId = req.user!.tenantId;

    // For now, return empty array
    // In a full implementation, this would filter activities by user
    res.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch user activities',
      },
    });
  }
});

/**
 * GET /api/v1/activities/department/:departmentId
 * Get activities for a specific department
 */
router.get('/department/:departmentId', async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const tenantId = req.user!.tenantId;

    // For now, return empty array
    // In a full implementation, this would filter activities by department
    res.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    console.error('Error fetching department activities:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch department activities',
      },
    });
  }
});

export default router;
