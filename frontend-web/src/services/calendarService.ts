import api from './api';

export interface CalendarEvent {
  eventId: string;
  title: string;
  description?: string;
  eventType: 'joining' | 'performance_review' | 'hr_event' | 'training' | 'interview' | 'exit_meeting' | 'holiday' | 'meeting' | 'other';
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  organizerId?: string;
  organizerName?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  relatedEntityId?: string;
  relatedEntityType?: 'employee' | 'candidate' | 'department' | 'position';
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEventFilters {
  eventType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

class CalendarService {
  async getAllEvents(filters?: CalendarEventFilters): Promise<CalendarEvent[]> {
    try {
      const response = await api.get('/calendar/events', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return this.getMockEvents();
    }
  }

  async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const response = await api.get('/calendar/events/upcoming', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return this.getMockEvents().slice(0, limit);
    }
  }

  async getEventById(eventId: string): Promise<CalendarEvent> {
    const response = await api.get(`/calendar/events/${eventId}`);
    return response.data;
  }

  async createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await api.post('/calendar/events', eventData);
    return response.data;
  }

  async updateEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await api.put(`/calendar/events/${eventId}`, eventData);
    return response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/calendar/events/${eventId}`);
  }

  private getMockEvents(): CalendarEvent[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextTwoWeeks = new Date(today);
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);

    return [
      {
        eventId: '1',
        title: 'New Joinee Orientation - Alex Turner',
        description: 'Welcome and onboarding session for Alex Turner',
        eventType: 'joining',
        startDate: today.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        isAllDay: false,
        location: 'Conference Room A',
        status: 'scheduled',
        relatedEntityType: 'candidate',
      },
      {
        eventId: '2',
        title: 'Q1 Performance Reviews',
        description: 'Annual performance review cycle begins',
        eventType: 'performance_review',
        startDate: tomorrow.toISOString().split('T')[0],
        isAllDay: true,
        status: 'scheduled',
      },
      {
        eventId: '3',
        title: 'Leadership Training Workshop',
        description: 'Leadership skills development program',
        eventType: 'training',
        startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        isAllDay: false,
        location: 'Training Center',
        status: 'scheduled',
      },
      {
        eventId: '4',
        title: 'Exit Interview - Mark Stevens',
        description: 'Final exit interview and documentation',
        eventType: 'exit_meeting',
        startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '15:00',
        isAllDay: false,
        location: 'HR Office',
        status: 'scheduled',
        relatedEntityType: 'employee',
      },
      {
        eventId: '5',
        title: 'Technical Interview - Senior Developer Position',
        description: 'Final round technical interview',
        eventType: 'interview',
        startDate: nextWeek.toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '12:30',
        isAllDay: false,
        location: 'Virtual - Zoom',
        status: 'scheduled',
        relatedEntityType: 'position',
      },
      {
        eventId: '6',
        title: 'Company Town Hall',
        description: 'Quarterly all-hands meeting',
        eventType: 'hr_event',
        startDate: nextWeek.toISOString().split('T')[0],
        startTime: '15:00',
        endTime: '16:30',
        isAllDay: false,
        location: 'Main Auditorium',
        status: 'scheduled',
      },
      {
        eventId: '7',
        title: 'Independence Day',
        description: 'Public Holiday',
        eventType: 'holiday',
        startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isAllDay: true,
        status: 'scheduled',
      },
      {
        eventId: '8',
        title: 'Mid-Year Review - Engineering Team',
        description: 'Mid-year performance review cycle',
        eventType: 'performance_review',
        startDate: nextTwoWeeks.toISOString().split('T')[0],
        isAllDay: true,
        status: 'scheduled',
        relatedEntityType: 'department',
      },
    ];
  }
}

export default new CalendarService();
