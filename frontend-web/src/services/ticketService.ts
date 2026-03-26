import api from './api';

export interface HRTicket {
  ticketId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'leave' | 'payroll' | 'benefits' | 'policy' | 'onboarding' | 'exit' | 'general' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  attachments?: TicketAttachment[];
  comments?: TicketComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TicketComment {
  commentId: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingResponse: number;
  resolved: number;
  closed: number;
}

class TicketService {
  async getAllTickets(filters?: { status?: string; category?: string }): Promise<HRTicket[]> {
    try {
      const response = await api.get('/helpdesk/tickets', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return this.getMockTickets();
    }
  }

  async getMyTickets(): Promise<HRTicket[]> {
    try {
      const response = await api.get('/helpdesk/tickets/my');
      return response.data;
    } catch (error) {
      return this.getMockTickets().slice(0, 3);
    }
  }

  async getTicketById(ticketId: string): Promise<HRTicket> {
    const response = await api.get(`/helpdesk/tickets/${ticketId}`);
    return response.data;
  }

  async createTicket(ticketData: Partial<HRTicket>): Promise<HRTicket> {
    const response = await api.post('/helpdesk/tickets', ticketData);
    return response.data;
  }

  async updateTicket(ticketId: string, ticketData: Partial<HRTicket>): Promise<HRTicket> {
    const response = await api.put(`/helpdesk/tickets/${ticketId}`, ticketData);
    return response.data;
  }

  async addComment(ticketId: string, content: string, isInternal: boolean = false): Promise<TicketComment> {
    const response = await api.post(`/helpdesk/tickets/${ticketId}/comments`, { comment: content, isInternal });
    return response.data;
  }

  async uploadAttachment(ticketId: string, file: File): Promise<TicketAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/helpdesk/tickets/${ticketId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getTicketStats(): Promise<TicketStats> {
    try {
      const response = await api.get('/helpdesk/tickets/stats');
      return response.data;
    } catch (error) {
      return {
        total: 15,
        open: 5,
        inProgress: 4,
        waitingResponse: 2,
        resolved: 3,
        closed: 1,
      };
    }
  }

  private getMockTickets(): HRTicket[] {
    return [
      {
        ticketId: 't1',
        ticketNumber: 'TKT-2026-001',
        title: 'Leave Balance Discrepancy',
        description: 'My leave balance shows 10 days but I believe it should be 15 days based on my calculation. Can you please verify?',
        category: 'leave',
        priority: 'medium',
        status: 'in_progress',
        createdBy: 'emp1',
        createdByName: 'John Doe',
        assignedTo: 'hr1',
        assignedToName: 'Sarah Johnson',
        comments: [
          {
            commentId: 'tc1',
            ticketId: 't1',
            content: 'Thank you for reporting this. I\'m reviewing your leave history now.',
            authorId: 'hr1',
            authorName: 'Sarah Johnson',
            isInternal: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        ticketId: 't2',
        ticketNumber: 'TKT-2026-002',
        title: 'Health Insurance Enrollment',
        description: 'I would like to add my spouse to my health insurance plan. What documents do I need to provide?',
        category: 'benefits',
        priority: 'low',
        status: 'resolved',
        createdBy: 'emp2',
        createdByName: 'Emily Davis',
        assignedTo: 'hr1',
        assignedToName: 'Sarah Johnson',
        comments: [
          {
            commentId: 'tc2',
            ticketId: 't2',
            content: 'Please provide a copy of your marriage certificate and spouse\'s ID. You can upload them here or email to benefits@company.com',
            authorId: 'hr1',
            authorName: 'Sarah Johnson',
            isInternal: false,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
          {
            commentId: 'tc3',
            ticketId: 't2',
            content: 'Thank you! Documents uploaded.',
            authorId: 'emp2',
            authorName: 'Emily Davis',
            isInternal: false,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        ticketId: 't3',
        ticketNumber: 'TKT-2026-003',
        title: 'Salary Slip Not Received',
        description: 'I haven\'t received my salary slip for February 2026. Can you please resend it?',
        category: 'payroll',
        priority: 'high',
        status: 'open',
        createdBy: 'emp3',
        createdByName: 'Michael Brown',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        ticketId: 't4',
        ticketNumber: 'TKT-2026-004',
        title: 'Work From Home Policy Clarification',
        description: 'Can you clarify the new WFH policy regarding the number of days allowed per week?',
        category: 'policy',
        priority: 'low',
        status: 'waiting_response',
        createdBy: 'emp4',
        createdByName: 'David Wilson',
        assignedTo: 'hr2',
        assignedToName: 'HR Team',
        comments: [
          {
            commentId: 'tc4',
            ticketId: 't4',
            content: 'The new policy allows up to 3 days per week of remote work. Please get approval from your manager for your WFH schedule.',
            authorId: 'hr2',
            authorName: 'HR Team',
            isInternal: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

export default new TicketService();
