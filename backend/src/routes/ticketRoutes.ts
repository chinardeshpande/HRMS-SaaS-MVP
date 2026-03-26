import { Router } from 'express';
import * as ticketController from '../controllers/ticketController';
import { optionalAuth } from '../middleware/optionalAuth';

const router = Router();

// All routes require authentication
router.use(optionalAuth);

// Ticket routes
router.get('/tickets', ticketController.getAllTickets);
router.get('/tickets/my', ticketController.getMyTickets);
router.get('/tickets/stats', ticketController.getTicketStats);
router.get('/tickets/:ticketId', ticketController.getTicketById);
router.post('/tickets', ticketController.createTicket);
router.put('/tickets/:ticketId', ticketController.updateTicket);

// Comment routes
router.post('/tickets/:ticketId/comments', ticketController.addComment);

export default router;
