import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', chatController.getAllConversations);
router.get('/conversations/:conversationId', chatController.getConversationById);
router.post('/conversations', chatController.createConversation);
router.put('/conversations/:conversationId', chatController.updateConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/upload', uploadSingle as any, chatController.uploadFile);
router.post('/conversations/:conversationId/read', chatController.markMessagesAsRead);
router.put('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Participant routes
router.get('/conversations/:conversationId/participants', chatController.getParticipants);
router.post('/conversations/:conversationId/participants', chatController.addParticipant);
router.delete('/conversations/:conversationId/participants/:employeeId', chatController.removeParticipant);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

export default router;
