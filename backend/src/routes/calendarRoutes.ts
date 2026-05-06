import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { CalendarEvent, CalendarEventStatus } from '../models/CalendarEvent';
import { OnboardingCase } from '../models/OnboardingCase';
import { ExitCase } from '../models/ExitCase';

const router = Router();

router.use(authenticate);

const eventRepo = () => AppDataSource.getRepository(CalendarEvent);

const toDateOnly = (value: Date | string) => new Date(value).toISOString().split('T')[0];

const normalizeEvent = (event: CalendarEvent) => ({
  ...event,
  organizerName: event.organizer ? `${event.organizer.firstName} ${event.organizer.lastName}` : undefined,
});

const getLifecycleEvents = async (tenantId: string) => {
  const events: any[] = [];

  const onboardingRepo = AppDataSource.getRepository(OnboardingCase);
  const upcomingJoinings = await onboardingRepo
    .createQueryBuilder('onboarding')
    .leftJoinAndSelect('onboarding.candidate', 'candidate')
    .where('onboarding.tenantId = :tenantId', { tenantId })
    .andWhere('candidate.expectedJoinDate >= :today', { today: new Date() })
    .orderBy('candidate.expectedJoinDate', 'ASC')
    .limit(20)
    .getMany();

  upcomingJoinings.forEach((onboarding) => {
    if (!onboarding.candidate) return;

    events.push({
      eventId: `joining-${onboarding.caseId}`,
      title: `New Joinee - ${onboarding.candidate.firstName} ${onboarding.candidate.lastName}`,
      description: `Onboarding for ${onboarding.candidate.firstName} ${onboarding.candidate.lastName}`,
      eventType: 'joining',
      startDate: toDateOnly(onboarding.candidate.expectedJoinDate),
      isAllDay: true,
      status: CalendarEventStatus.SCHEDULED,
      relatedEntityId: onboarding.candidateId,
      relatedEntityType: 'candidate',
      navigationUrl: `/onboarding/candidate/${onboarding.candidateId}`,
    });
  });

  const exitRepo = AppDataSource.getRepository(ExitCase);
  const upcomingExits = await exitRepo
    .createQueryBuilder('exit')
    .leftJoinAndSelect('exit.employee', 'employee')
    .where('exit.tenantId = :tenantId', { tenantId })
    .andWhere('exit.lastWorkingDate >= :today', { today: new Date() })
    .orderBy('exit.lastWorkingDate', 'ASC')
    .limit(20)
    .getMany();

  upcomingExits.forEach((exitCase) => {
    if (!exitCase.employee) return;

    events.push({
      eventId: `exit-${exitCase.exitId}`,
      title: `Exit Meeting - ${exitCase.employee.firstName} ${exitCase.employee.lastName}`,
      description: 'Final exit interview and documentation',
      eventType: 'exit_meeting',
      startDate: toDateOnly(exitCase.lastWorkingDate),
      isAllDay: true,
      status: CalendarEventStatus.SCHEDULED,
      relatedEntityId: exitCase.employeeId,
      relatedEntityType: 'employee',
      navigationUrl: `/exit/${exitCase.exitId}`,
    });
  });

  return events;
};

router.get('/events/upcoming', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;
    const today = toDateOnly(new Date());

    const savedEvents = await eventRepo().find({
      where: { tenantId, status: CalendarEventStatus.SCHEDULED },
      relations: ['organizer'],
      order: { startDate: 'ASC', startTime: 'ASC' },
      take: 50,
    });

    const events = [
      ...savedEvents.filter((event) => event.startDate >= today).map(normalizeEvent),
      ...(await getLifecycleEvents(tenantId)),
    ]
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
      .slice(0, limit);

    res.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch upcoming events' },
    });
  }
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { eventType, startDate, endDate, status } = req.query;

    const query = eventRepo()
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.tenantId = :tenantId', { tenantId })
      .orderBy('event.startDate', 'ASC')
      .addOrderBy('event.startTime', 'ASC');

    if (eventType) query.andWhere('event.eventType = :eventType', { eventType });
    if (status) query.andWhere('event.status = :status', { status });
    if (startDate) query.andWhere('event.startDate >= :startDate', { startDate });
    if (endDate) query.andWhere('event.startDate <= :endDate', { endDate });

    const events = (await query.getMany()).map(normalizeEvent);

    res.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch calendar events' },
    });
  }
});

router.get('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const event = await eventRepo().findOne({
      where: { tenantId: req.user!.tenantId, eventId: req.params.eventId },
      relations: ['organizer'],
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found' },
      });
    }

    res.json({ success: true, data: normalizeEvent(event) });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to fetch event' },
    });
  }
});

router.post('/events', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { title, startDate } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and start date are required' },
      });
    }

    const event = eventRepo().create({
      ...req.body,
      tenantId: user.tenantId,
      organizerId: req.body.organizerId || user.employeeId,
      status: req.body.status || CalendarEventStatus.SCHEDULED,
      eventType: req.body.eventType || 'meeting',
      isAllDay: !!req.body.isAllDay,
    } as Partial<CalendarEvent>);

    const savedEvent = await eventRepo().save(event);
    const fullEvent = await eventRepo().findOne({
      where: { eventId: savedEvent.eventId, tenantId: user.tenantId },
      relations: ['organizer'],
    });

    res.status(201).json({ success: true, data: fullEvent ? normalizeEvent(fullEvent) : savedEvent });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create event' },
    });
  }
});

router.put('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const event = await eventRepo().findOne({
      where: { tenantId, eventId: req.params.eventId },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found' },
      });
    }

    Object.assign(event, req.body, { tenantId });
    const savedEvent = await eventRepo().save(event);
    const fullEvent = await eventRepo().findOne({
      where: { eventId: savedEvent.eventId, tenantId },
      relations: ['organizer'],
    });

    res.json({ success: true, data: fullEvent ? normalizeEvent(fullEvent) : savedEvent });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to update event' },
    });
  }
});

router.delete('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const event = await eventRepo().findOne({
      where: { tenantId, eventId: req.params.eventId },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found' },
      });
    }

    event.status = CalendarEventStatus.CANCELLED;
    await eventRepo().save(event);

    res.json({ success: true, data: { message: 'Event cancelled successfully' } });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to delete event' },
    });
  }
});

export default router;
