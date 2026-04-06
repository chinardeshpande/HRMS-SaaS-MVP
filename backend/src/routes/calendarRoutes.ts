import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { OnboardingCase } from '../models/OnboardingCase';
import { ExitCase } from '../models/ExitCase';

const router = Router();

// All routes require authentication
router.use(authenticate);

interface CalendarEvent {
  eventId: string;
  title: string;
  description?: string;
  eventType: 'joining' | 'performance_review' | 'exit_meeting' | 'hr_event' | 'training' | 'interview' | 'holiday' | 'meeting' | 'other';
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  relatedEntityId?: string;
  relatedEntityType?: 'employee' | 'candidate' | 'department' | 'position';
  navigationUrl?: string;
}

/**
 * GET /api/v1/calendar/events/upcoming
 * Get upcoming calendar events
 */
router.get('/events/upcoming', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;

    const events: CalendarEvent[] = [];

    // Get upcoming onboarding cases (joining events)
    const onboardingRepo = AppDataSource.getRepository(OnboardingCase);
    const upcomingJoinings = await onboardingRepo
      .createQueryBuilder('onboarding')
      .leftJoinAndSelect('onboarding.candidate', 'candidate')
      .where('onboarding.tenantId = :tenantId', { tenantId })
      .andWhere('candidate.expectedJoinDate >= :today', { today: new Date() })
      .orderBy('candidate.expectedJoinDate', 'ASC')
      .limit(5)
      .getMany();

    upcomingJoinings.forEach((onboarding) => {
      if (onboarding.candidate) {
        events.push({
          eventId: `joining-${onboarding.caseId}`,
          title: `New Joinee - ${onboarding.candidate.firstName} ${onboarding.candidate.lastName}`,
          description: `Onboarding for ${onboarding.candidate.firstName} ${onboarding.candidate.lastName}`,
          eventType: 'joining',
          startDate: new Date(onboarding.candidate.expectedJoinDate).toISOString().split('T')[0],
          isAllDay: true,
          status: 'scheduled',
          relatedEntityId: onboarding.candidateId,
          relatedEntityType: 'candidate',
          navigationUrl: `/onboarding/candidate/${onboarding.candidateId}`,
        });
      }
    });

    // Get upcoming exit meetings
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const upcomingExits = await exitRepo
      .createQueryBuilder('exit')
      .leftJoinAndSelect('exit.employee', 'employee')
      .where('exit.tenantId = :tenantId', { tenantId })
      .andWhere('exit.lastWorkingDate >= :today', { today: new Date() })
      .orderBy('exit.lastWorkingDate', 'ASC')
      .limit(5)
      .getMany();

    upcomingExits.forEach((exitCase) => {
      if (exitCase.employee) {
        events.push({
          eventId: `exit-${exitCase.exitId}`,
          title: `Exit Meeting - ${exitCase.employee.firstName} ${exitCase.employee.lastName}`,
          description: `Final exit interview and documentation`,
          eventType: 'exit_meeting',
          startDate: new Date(exitCase.lastWorkingDate).toISOString().split('T')[0],
          isAllDay: true,
          status: 'scheduled',
          relatedEntityId: exitCase.employeeId,
          relatedEntityType: 'employee',
          navigationUrl: `/exit/${exitCase.exitId}`,
        });
      }
    });

    // Performance reviews - simplified for now
    // Future: Add review cycle relation and details when ReviewCycle model is available

    // Sort by date and limit
    events.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const limitedEvents = events.slice(0, limit);

    res.json({
      success: true,
      data: limitedEvents,
    });
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch upcoming events',
      },
    });
  }
});

/**
 * GET /api/v1/calendar/events
 * Get all calendar events with optional filters
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { eventType, startDate, endDate } = req.query;

    // For now, return upcoming events
    // In a full implementation, this would query a dedicated calendar_events table
    const events: CalendarEvent[] = [];

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch calendar events',
      },
    });
  }
});

export default router;
