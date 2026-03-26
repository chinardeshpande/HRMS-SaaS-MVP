import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';
import { ConversationType } from '../models/ChatConversation';
import { MessageType } from '../models/ChatMessage';

// ==================== CONVERSATION CONTROLLERS ====================

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { conversationType, name, description, participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Participant IDs are required',
        },
      });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([user.employeeId, ...participantIds])];

    const conversation = await chatService.createConversation({
      tenantId,
      createdBy: user.employeeId,
      conversationType: conversationType as ConversationType,
      name,
      description,
      participantIds: allParticipants,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getAllConversations = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { conversationType, limit = 50, offset = 0 } = req.query;

    const result = await chatService.getConversations(tenantId, user.employeeId, {
      conversationType: conversationType as ConversationType,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId } = req.params;

    const conversation = await chatService.getConversationById(conversationId, tenantId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateConversation = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId } = req.params;
    const { name, description, avatarUrl } = req.body;

    const conversation = await chatService.updateConversation(conversationId, tenantId, {
      name,
      description,
      avatarUrl,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== MESSAGE CONTROLLERS ====================

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0, beforeMessageId } = req.query;

    const result = await chatService.getMessages(conversationId, tenantId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      beforeMessageId: beforeMessageId as string,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { conversationId } = req.params;
    const { content, messageType, attachments, replyToMessageId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message content is required',
        },
      });
    }

    const message = await chatService.sendMessage({
      tenantId,
      conversationId,
      senderId: user.employeeId,
      content,
      messageType: messageType as MessageType,
      attachments,
      replyToMessageId,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { conversationId } = req.params;

    await chatService.markMessagesAsRead(conversationId, user.employeeId, tenantId);

    res.status(200).json({
      success: true,
      data: { message: 'Messages marked as read' },
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const editMessage = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required',
        },
      });
    }

    const message = await chatService.editMessage(messageId, tenantId, user.employeeId, content);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or unauthorized',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { messageId } = req.params;

    const deleted = await chatService.deleteMessage(messageId, tenantId, user.employeeId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or unauthorized',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Message deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== PARTICIPANT CONTROLLERS ====================

export const getParticipants = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId } = req.params;

    const participants = await chatService.getParticipants(conversationId, tenantId);

    res.status(200).json({
      success: true,
      data: participants,
    });
  } catch (error: any) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Employee ID is required',
        },
      });
    }

    const participant = await chatService.addParticipant({
      tenantId,
      conversationId,
      employeeId,
    });

    res.status(201).json({
      success: true,
      data: participant,
    });
  } catch (error: any) {
    console.error('Error adding participant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { conversationId, employeeId } = req.params;

    const removed = await chatService.removeParticipant(conversationId, employeeId, tenantId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Participant not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Participant removed successfully' },
    });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;

    const unreadCount = await chatService.getUnreadCount(user.employeeId, tenantId);

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== FILE UPLOAD CONTROLLER ====================

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { conversationId } = req.params;
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded',
        },
      });
    }

    const file = req.file;
    const fileUrl = `/uploads/documents/${file.filename}`;

    // Determine message type based on file mime type
    let messageType: MessageType = MessageType.FILE;
    if (file.mimetype.startsWith('image/')) {
      messageType = MessageType.IMAGE;
    }

    // Create attachment metadata
    const attachment = {
      fileName: file.originalname,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
    };

    // Send message with attachment
    const message = await chatService.sendMessage({
      tenantId,
      conversationId,
      senderId: user.employeeId,
      content: caption || `Sent a file: ${file.originalname}`,
      messageType,
      attachments: [attachment],
    });

    // Broadcast the message via WebSocket
    const io = socketService.getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new_message', message);
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};
