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
  private userSockets: Map<string, Set<string>> = new Map(); // tenantId:employeeId -> socketIds

  private constructor() {}

  private tenantRoom(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  private userSocketKey(tenantId: string, employeeId: string): string {
    return `${tenantId}:${employeeId}`;
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(httpServer: HTTPServer): void {
    const configuredOrigins = config.corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          ...configuredOrigins,
          'https://aurahrms.com',
          'https://www.aurahrms.com',
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

        if (!decoded.userId || !decoded.tenantId) {
          return next(new Error('Authentication token is missing tenant context'));
        }

        socket.userId = decoded.userId;
        socket.tenantId = decoded.tenantId;
        socket.employeeId = decoded.employeeId;
        socket.email = decoded.email;

        logger.info('Socket authenticated');
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
      if (!socket.tenantId) {
        socket.disconnect(true);
        return;
      }

      socket.join(this.tenantRoom(socket.tenantId));
      logger.info('Socket connected to tenant room');

      // Track user's socket
      if (socket.employeeId) {
        const userSocketKey = this.userSocketKey(socket.tenantId, socket.employeeId);
        if (!this.userSockets.has(userSocketKey)) {
          this.userSockets.set(userSocketKey, new Set());
        }
        this.userSockets.get(userSocketKey)!.add(socket.id);

        // Notify online status
        this.broadcastUserStatus(socket.tenantId, socket.employeeId, 'online');
      }

      // Join conversation rooms
      socket.on('join_conversation', async (conversationId: string) => {
        try {
          if (!socket.employeeId || !socket.tenantId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const isParticipant = await chatService.isParticipant(
            conversationId,
            socket.tenantId,
            socket.employeeId
          );

          if (!isParticipant) {
            socket.emit('error', { message: 'Conversation access denied' });
            return;
          }

          socket.join(`conversation:${conversationId}`);
          logger.info('Socket joined authorized conversation room');

          // Mark messages as read
          await chatService.markMessagesAsRead(conversationId, socket.employeeId, socket.tenantId);

          // Notify read status to conversation
          this.io!.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            employeeId: socket.employeeId,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('❌ Error joining conversation:', error);
          logger.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Leave conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info('Socket left conversation room');
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
          if (this.io) {
            this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);
          }

          // Send notification to offline users
          const participants = await chatService.getParticipants(data.conversationId, socket.tenantId);
          for (const participant of participants) {
            if (participant.employeeId !== socket.employeeId) {
              this.sendNotification(socket.tenantId, participant.employeeId, {
                type: 'new_message',
                conversationId: data.conversationId,
                message,
              });
            }
          }

          logger.info('Message sent in authorized conversation');
        } catch (error) {
          console.error('❌ Error sending message:', error);
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on('typing_start', (conversationId: string) => {
        if (!socket.employeeId || !socket.tenantId) return;
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          employeeId: socket.employeeId,
          email: socket.email,
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        if (!socket.employeeId || !socket.tenantId) return;
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
          logger.info('Call initiation requested');

          if (!socket.employeeId || !socket.tenantId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const [callerAllowed, targetAllowed] = await Promise.all([
            chatService.isParticipant(data.conversationId, socket.tenantId, socket.employeeId),
            chatService.isParticipant(data.conversationId, socket.tenantId, data.targetEmployeeId),
          ]);

          if (!callerAllowed || !targetAllowed) {
            socket.emit('error', { message: 'Call participant is not part of this conversation' });
            return;
          }

          // Send call offer to target user
          const targetSocketIds = this.userSockets.get(
            this.userSocketKey(socket.tenantId, data.targetEmployeeId)
          );
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
        logger.info('Call answered');
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
        logger.info('Call rejected');
        this.io?.to(data.callerSocketId).emit('call_rejected', {
          rejecterId: socket.employeeId,
        });
      });

      socket.on('call_end', (data: {
        targetSocketId?: string;
        conversationId?: string;
      }) => {
        logger.info('Call ended');
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
        logger.info('WebRTC offer forwarded');
        this.io?.to(data.targetSocketId).emit('webrtc_offer', {
          offer: data.offer,
          senderSocketId: socket.id,
        });
      });

      socket.on('webrtc_answer', (data: {
        targetSocketId: string;
        answer: any;
      }) => {
        logger.info('WebRTC answer forwarded');
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
        logger.info('Socket disconnected');

        // Remove from user sockets
        if (socket.employeeId && socket.tenantId) {
          const userSocketKey = this.userSocketKey(socket.tenantId, socket.employeeId);
          const userSocketSet = this.userSockets.get(userSocketKey);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(userSocketKey);
              // Notify offline status
              this.broadcastUserStatus(socket.tenantId, socket.employeeId, 'offline');
            }
          }
        }
      });
    });
  }

  private broadcastUserStatus(tenantId: string, employeeId: string, status: 'online' | 'offline'): void {
    this.emitToTenant(tenantId, 'user_status_change', {
      employeeId,
      status,
      timestamp: new Date(),
    });
  }

  private sendNotification(tenantId: string, employeeId: string, notification: any): void {
    const socketIds = this.userSockets.get(this.userSocketKey(tenantId, employeeId));
    if (socketIds && this.io) {
      for (const socketId of socketIds) {
        this.io.to(socketId).emit('notification', notification);
      }
    }
  }

  public getIO(): SocketIOServer | null {
    return this.io;
  }

  public emitToTenant(tenantId: string, event: string, payload: unknown): void {
    this.io?.to(this.tenantRoom(tenantId)).emit(event, payload);
  }

  public isUserOnline(tenantId: string, employeeId: string): boolean {
    return this.userSockets.has(this.userSocketKey(tenantId, employeeId));
  }

  public getOnlineUsers(tenantId: string): string[] {
    const prefix = `${tenantId}:`;
    return Array.from(this.userSockets.keys())
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  }
}

export const socketService = SocketService.getInstance();
