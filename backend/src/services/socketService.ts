import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { chatService } from './chatService';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { runWithTenant } from '../middleware/tenantContext';

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
    const configuredOrigins = config.corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          ...configuredOrigins,
          'https://aurorahr.in',
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

        // Mission 2 (A1): same provenance checks as the HTTP `authenticate`
        // middleware — a signed JWT alone is not enough; the user must still
        // be active and the tenant must still be active. The lookups run
        // inside the tenant context of the signature-verified JWT so they are
        // themselves tenant-scoped.
        const user = await runWithTenant(
          decoded.tenantId,
          () =>
            AppDataSource.getRepository(User).findOne({
              where: {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                isActive: true,
              },
            }),
          { userId: decoded.userId, source: 'socket' }
        );
        if (!user) {
          return next(new Error('Authentication failed'));
        }
        const tenant = await runWithTenant(
          decoded.tenantId,
          () =>
            AppDataSource.getRepository(Tenant).findOne({
              where: { tenantId: decoded.tenantId },
            }),
          { userId: decoded.userId, source: 'socket' }
        );
        if (!tenant || tenant.status !== 'active') {
          return next(new Error('Authentication failed'));
        }

        socket.userId = user.userId;
        socket.tenantId = user.tenantId;
        socket.employeeId = user.employeeId;
        socket.email = user.email;

        logger.info(`🔐 Socket authenticated: ${user.email} (${socket.id})`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Mission 2 (A1): socket event handlers run outside the Express middleware
   * chain, so they must enter the AsyncLocalStorage tenant context themselves
   * — the scoped-repository and RLS session-var layers read from it.
   */
  private withTenantContext<T extends unknown[]>(
    socket: AuthenticatedSocket,
    handler: (...args: T) => void | Promise<void>
  ): (...args: T) => void {
    return (...args: T) => {
      if (!socket.tenantId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      void runWithTenant(socket.tenantId, () => handler(...args), {
        userId: socket.userId,
        source: 'socket',
      });
    };
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('🔌 [WEBSOCKET] Client connected:', {
        socketId: socket.id,
        email: socket.email,
        employeeId: socket.employeeId,
        tenantId: socket.tenantId,
      });
      logger.info(`🔌 Client connected: ${socket.id} (${socket.email})`);

      // Mission 2 (A1): every socket joins its tenant room so broadcasts
      // (presence etc.) never cross tenant boundaries.
      if (socket.tenantId) {
        socket.join(`tenant:${socket.tenantId}`);
      }

      // Track user's socket
      if (socket.employeeId) {
        if (!this.userSockets.has(socket.employeeId)) {
          this.userSockets.set(socket.employeeId, new Set());
        }
        this.userSockets.get(socket.employeeId)!.add(socket.id);
        console.log('👤 User sockets updated:', {
          employeeId: socket.employeeId,
          socketCount: this.userSockets.get(socket.employeeId)!.size,
        });

        // Notify online status
        this.broadcastUserStatus(socket.employeeId, 'online', socket.tenantId);
      }

      // Join conversation rooms
      socket.on('join_conversation', this.withTenantContext(socket, async (conversationId: string) => {
        try {
          console.log('📥 [WEBSOCKET] Join conversation request:', {
            conversationId,
            email: socket.email,
            socketId: socket.id,
          });

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
          logger.info(`📥 ${socket.email} joined conversation: ${conversationId}`);

          // Verify room membership
          const room = this.io?.sockets.adapter.rooms.get(`conversation:${conversationId}`);
          console.log('✅ Room joined. Members:', room ? Array.from(room) : 'none');

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
      }));

      // Leave conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`📤 ${socket.email} left conversation: ${conversationId}`);
      });

      // Send message
      socket.on('send_message', this.withTenantContext(socket, async (data: {
        conversationId: string;
        content: string;
        replyToMessageId?: string;
        attachments?: any[];
      }) => {
        try {
          console.log('📨 [WEBSOCKET] Received send_message event:', {
            conversationId: data.conversationId,
            content: data.content,
            from: socket.email,
            socketId: socket.id,
          });

          if (!socket.employeeId || !socket.tenantId) {
            console.error('❌ Socket not authenticated');
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          console.log('💾 Saving message to database...');
          const message = await chatService.sendMessage({
            tenantId: socket.tenantId,
            conversationId: data.conversationId,
            senderId: socket.employeeId,
            content: data.content,
            replyToMessageId: data.replyToMessageId,
            attachments: data.attachments,
          });
          console.log('✅ Message saved:', message.messageId);

          // BROADCAST TO ENTIRE ROOM (including sender)
          console.log('📡 Broadcasting to ENTIRE room:', `conversation:${data.conversationId}`);

          if (this.io) {
            // Emit to ALL sockets in the room
            this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);
            console.log('✅ Message broadcast to entire room');
          } else {
            console.error('❌ Socket.IO instance not available!');
          }

          // Log room members
          const room = this.io?.sockets.adapter.rooms.get(`conversation:${data.conversationId}`);
          if (room) {
            console.log('👥 Room members count:', room.size);
            console.log('👥 Room socket IDs:', Array.from(room));
          } else {
            console.warn('⚠️ No room found for conversation:', data.conversationId);
          }

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
          console.error('❌ Error sending message:', error);
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }));

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
      socket.on('edit_message', this.withTenantContext(socket, async (data: {
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
      }));

      // Delete message
      socket.on('delete_message', this.withTenantContext(socket, async (data: {
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
      }));

      // WebRTC Call Signaling
      socket.on('call_initiate', this.withTenantContext(socket, async (data: {
        conversationId: string;
        targetEmployeeId: string;
        callType: 'audio' | 'video';
      }) => {
        try {
          logger.info(`📞 Call initiated by ${socket.email} to ${data.targetEmployeeId}`);

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
      }));

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
              this.broadcastUserStatus(socket.employeeId, 'offline', socket.tenantId);
            }
          }
        }
      });
    });
  }

  /**
   * Mission 2 (A1): presence is tenant-scoped. The previous implementation
   * used `io.emit(...)` which broadcast employee ids + presence to every
   * connected client of every tenant — a cross-tenant information leak.
   */
  private broadcastUserStatus(
    employeeId: string,
    status: 'online' | 'offline',
    tenantId?: string
  ): void {
    if (!this.io) return;
    if (!tenantId) {
      logger.warn('broadcastUserStatus called without tenantId — dropping broadcast');
      return;
    }

    this.io.to(`tenant:${tenantId}`).emit('user_status_change', {
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
