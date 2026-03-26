import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { chatService } from './chatService';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  employeeId?: string;
  email?: string;
}

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // employeeId -> Set of socketIds

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('✅ WebSocket server initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.employeeId = decoded.employeeId;
        socket.email = decoded.email;

        logger.info(`🔐 Socket authenticated: ${decoded.email} (${socket.id})`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`🔌 Client connected: ${socket.id} (${socket.email})`);

      // Track user's socket
      if (socket.employeeId) {
        if (!this.userSockets.has(socket.employeeId)) {
          this.userSockets.set(socket.employeeId, new Set());
        }
        this.userSockets.get(socket.employeeId)!.add(socket.id);

        // Notify online status
        this.broadcastUserStatus(socket.employeeId, 'online');
      }

      // Join conversation rooms
      socket.on('join_conversation', async (conversationId: string) => {
        try {
          socket.join(`conversation:${conversationId}`);
          logger.info(`📥 ${socket.email} joined conversation: ${conversationId}`);

          // Mark messages as read
          if (socket.employeeId && socket.tenantId) {
            await chatService.markMessagesAsRead(conversationId, socket.employeeId, socket.tenantId);

            // Notify read status to conversation
            this.io!.to(`conversation:${conversationId}`).emit('messages_read', {
              conversationId,
              employeeId: socket.employeeId,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          logger.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Leave conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`📤 ${socket.email} left conversation: ${conversationId}`);
      });

      // Send message
      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        replyToMessageId?: string;
        attachments?: any[];
      }) => {
        try {
          if (!socket.employeeId || !socket.tenantId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const message = await chatService.sendMessage({
            tenantId: socket.tenantId,
            conversationId: data.conversationId,
            senderId: socket.employeeId,
            content: data.content,
            replyToMessageId: data.replyToMessageId,
            attachments: data.attachments,
          });

          // Emit to sender immediately
          socket.emit('new_message', message);

          // Broadcast to other participants in the conversation (excluding sender)
          socket.broadcast.to(`conversation:${data.conversationId}`).emit('new_message', message);

          // Send notification to offline users
          const participants = await chatService.getParticipants(data.conversationId, socket.tenantId);
          for (const participant of participants) {
            if (participant.employeeId !== socket.employeeId) {
              this.sendNotification(participant.employeeId, {
                type: 'new_message',
                conversationId: data.conversationId,
                message,
              });
            }
          }

          logger.info(`💬 Message sent in conversation ${data.conversationId} by ${socket.email}`);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on('typing_start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          employeeId: socket.employeeId,
          email: socket.email,
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          conversationId,
          employeeId: socket.employeeId,
        });
      });

      // Edit message
      socket.on('edit_message', async (data: {
        messageId: string;
        content: string;
      }) => {
        try {
          if (!socket.employeeId || !socket.tenantId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const message = await chatService.editMessage(
            data.messageId,
            socket.tenantId,
            socket.employeeId,
            data.content
          );

          if (message) {
            this.io!.to(`conversation:${message.conversationId}`).emit('message_edited', message);
          }
        } catch (error) {
          logger.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Delete message
      socket.on('delete_message', async (data: {
        messageId: string;
        conversationId: string;
      }) => {
        try {
          if (!socket.employeeId || !socket.tenantId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const success = await chatService.deleteMessage(
            data.messageId,
            socket.tenantId,
            socket.employeeId
          );

          if (success) {
            this.io!.to(`conversation:${data.conversationId}`).emit('message_deleted', {
              messageId: data.messageId,
              conversationId: data.conversationId,
            });
          }
        } catch (error) {
          logger.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // WebRTC Call Signaling
      socket.on('call_initiate', async (data: {
        conversationId: string;
        targetEmployeeId: string;
        callType: 'audio' | 'video';
      }) => {
        try {
          logger.info(`📞 Call initiated by ${socket.email} to ${data.targetEmployeeId}`);

          // Send call offer to target user
          const targetSocketIds = this.userSockets.get(data.targetEmployeeId);
          if (targetSocketIds && this.io) {
            for (const targetSocketId of targetSocketIds) {
              this.io.to(targetSocketId).emit('incoming_call', {
                callerId: socket.employeeId,
                callerName: socket.email,
                conversationId: data.conversationId,
                callType: data.callType,
                socketId: socket.id,
              });
            }
          }
        } catch (error) {
          logger.error('Error initiating call:', error);
          socket.emit('error', { message: 'Failed to initiate call' });
        }
      });

      socket.on('call_answer', (data: {
        callerId: string;
        callerSocketId: string;
      }) => {
        logger.info(`📞 Call answered by ${socket.email}`);
        this.io?.to(data.callerSocketId).emit('call_answered', {
          answererId: socket.employeeId,
          answererName: socket.email,
          socketId: socket.id,
        });
      });

      socket.on('call_reject', (data: {
        callerId: string;
        callerSocketId: string;
      }) => {
        logger.info(`📞 Call rejected by ${socket.email}`);
        this.io?.to(data.callerSocketId).emit('call_rejected', {
          rejecterId: socket.employeeId,
        });
      });

      socket.on('call_end', (data: {
        targetSocketId?: string;
        conversationId?: string;
      }) => {
        logger.info(`📞 Call ended by ${socket.email}`);
        if (data.targetSocketId) {
          this.io?.to(data.targetSocketId).emit('call_ended', {
            endedBy: socket.employeeId,
          });
        }
        if (data.conversationId) {
          socket.broadcast.to(`conversation:${data.conversationId}`).emit('call_ended', {
            endedBy: socket.employeeId,
          });
        }
      });

      // WebRTC Signaling
      socket.on('webrtc_offer', (data: {
        targetSocketId: string;
        offer: any;
      }) => {
        logger.info(`🔗 WebRTC offer from ${socket.email} to ${data.targetSocketId}`);
        this.io?.to(data.targetSocketId).emit('webrtc_offer', {
          offer: data.offer,
          senderSocketId: socket.id,
        });
      });

      socket.on('webrtc_answer', (data: {
        targetSocketId: string;
        answer: any;
      }) => {
        logger.info(`🔗 WebRTC answer from ${socket.email} to ${data.targetSocketId}`);
        this.io?.to(data.targetSocketId).emit('webrtc_answer', {
          answer: data.answer,
          senderSocketId: socket.id,
        });
      });

      socket.on('webrtc_ice_candidate', (data: {
        targetSocketId: string;
        candidate: any;
      }) => {
        this.io?.to(data.targetSocketId).emit('webrtc_ice_candidate', {
          candidate: data.candidate,
          senderSocketId: socket.id,
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id} (${socket.email})`);

        // Remove from user sockets
        if (socket.employeeId) {
          const userSocketSet = this.userSockets.get(socket.employeeId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.employeeId);
              // Notify offline status
              this.broadcastUserStatus(socket.employeeId, 'offline');
            }
          }
        }
      });
    });
  }

  private broadcastUserStatus(employeeId: string, status: 'online' | 'offline'): void {
    if (!this.io) return;

    this.io.emit('user_status_change', {
      employeeId,
      status,
      timestamp: new Date(),
    });
  }

  private sendNotification(employeeId: string, notification: any): void {
    const socketIds = this.userSockets.get(employeeId);
    if (socketIds && this.io) {
      for (const socketId of socketIds) {
        this.io.to(socketId).emit('notification', notification);
      }
    }
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public isUserOnline(employeeId: string): boolean {
    return this.userSockets.has(employeeId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

export const socketService = SocketService.getInstance();
