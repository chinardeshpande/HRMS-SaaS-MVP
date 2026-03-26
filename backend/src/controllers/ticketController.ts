import { Request, Response } from 'express';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';

// Mock data stores
let tickets: any[] = [
  {
    ticketId: 'TKT-2026-001',
    tenantId: 'tenant-1',
    ticketNumber: 'TKT-2026-001',
    title: 'Leave Balance Discrepancy',
    subject: 'Leave Balance Discrepancy',
    description: 'There seems to be a mismatch in my leave balance. According to my records, I should have 12 days remaining, but the system shows only 8 days.',
    category: 'leave',
    priority: 'medium',
    status: 'open',
    createdBy: 'current',
    createdByName: 'Current User',
    assignedTo: 'HR Team',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    ticketId: 'TKT-2026-002',
    tenantId: 'tenant-1',
    ticketNumber: 'TKT-2026-002',
    title: 'Payslip Download Issue',
    subject: 'Payslip Download Issue',
    description: 'I am unable to download my payslip for January 2026. The download button shows an error.',
    category: 'payroll',
    priority: 'high',
    status: 'in_progress',
    createdBy: 'current',
    createdByName: 'Current User',
    assignedTo: 'IT Team',
    resolvedAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

let ticketComments: any[] = [];

/**
 * Get all tickets
 */
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    const userTickets = tickets.filter(t => t.tenantId === tenantId);
    return sendSuccess(res, userTickets);
  } catch (error: any) {
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 500);
  }
};

/**
 * Get user's tickets
 */
export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || 'current';
    const userTickets = tickets.filter(t => t.createdBy === userId);
    return sendSuccess(res, userTickets);
  } catch (error: any) {
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 500);
  }
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const ticket = tickets.find(t => t.ticketId === ticketId);

    if (!ticket) {
      return sendError(res, { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' }, 404);
    }

    return sendSuccess(res, ticket);
  } catch (error: any) {
    return sendError(res, { code: 'FETCH_FAILED', message: error.message }, 500);
  }
};

/**
 * Create a new ticket
 */
export const createTicket = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    const userId = req.user?.userId || 'current';
    const userName = req.user?.email || 'Current User';
    const { title, description, category, priority } = req.body;

    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;

    const newTicket = {
      ticketId: ticketNumber,
      tenantId,
      ticketNumber,
      title,
      subject: title,
      description,
      category,
      priority: priority || 'medium',
      status: 'open',
      createdBy: userId,
      createdByName: userName,
      assignedTo: 'HR Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    return sendCreated(res, newTicket);
  } catch (error: any) {
    return sendError(res, { code: 'CREATE_FAILED', message: error.message }, 500);
  }
};

/**
 * Update ticket
 */
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    const ticketIndex = tickets.findIndex(t => t.ticketId === ticketId);
    if (ticketIndex === -1) {
      return sendError(res, { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' }, 404);
    }

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      resolvedAt: updates.status === 'resolved' ? new Date().toISOString() : tickets[ticketIndex].resolvedAt,
    };

    return sendSuccess(res, tickets[ticketIndex]);
  } catch (error: any) {
    return sendError(res, { code: 'UPDATE_FAILED', message: error.message }, 500);
  }
};

/**
 * Add comment to ticket
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { comment } = req.body;
    const userId = req.user?.userId || 'current';
    const userName = req.user?.email || 'Current User';

    const ticket = tickets.find(t => t.ticketId === ticketId);
    if (!ticket) {
      return sendError(res, { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' }, 404);
    }

    const newComment = {
      commentId: Date.now().toString(),
      ticketId,
      userId,
      userName,
      comment,
      createdAt: new Date().toISOString(),
    };

    ticketComments.push(newComment);
    ticket.updatedAt = newComment.createdAt;

    return sendCreated(res, newComment);
  } catch (error: any) {
    return sendError(res, { code: 'COMMENT_FAILED', message: error.message }, 500);
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    const tenantTickets = tickets.filter(t => t.tenantId === tenantId);

    const stats = {
      total: tenantTickets.length,
      open: tenantTickets.filter(t => t.status === 'open').length,
      inProgress: tenantTickets.filter(t => t.status === 'in_progress').length,
      resolved: tenantTickets.filter(t => t.status === 'resolved').length,
      closed: tenantTickets.filter(t => t.status === 'closed').length,
      avgResolutionTime: '2.5 days', // Mock value
    };

    return sendSuccess(res, stats);
  } catch (error: any) {
    return sendError(res, { code: 'STATS_FAILED', message: error.message }, 500);
  }
};
