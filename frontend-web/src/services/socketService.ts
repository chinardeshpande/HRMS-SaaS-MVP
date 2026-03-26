import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.token = token;
    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

    console.log('🔌 Connecting to WebSocket server:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  joinConversation(conversationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log(`📥 Joining conversation: ${conversationId}`);
    this.socket.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string): void {
    if (!this.socket) return;
    console.log(`📤 Leaving conversation: ${conversationId}`);
    this.socket.emit('leave_conversation', conversationId);
  }

  // ==================== MESSAGING ====================

  sendMessage(data: {
    conversationId: string;
    content: string;
    replyToMessageId?: string;
    attachments?: any[];
  }): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    console.log('💬 Sending message via WebSocket:', data);
    this.socket.emit('send_message', data);
  }

  editMessage(data: { messageId: string; content: string }): void {
    if (!this.socket) return;
    this.socket.emit('edit_message', data);
  }

  deleteMessage(data: { messageId: string; conversationId: string }): void {
    if (!this.socket) return;
    this.socket.emit('delete_message', data);
  }

  // ==================== TYPING INDICATORS ====================

  startTyping(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing_start', conversationId);
  }

  stopTyping(conversationId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing_stop', conversationId);
  }

  // ==================== EVENT LISTENERS ====================

  onNewMessage(callback: (message: any) => void): void {
    if (!this.socket) return;
    this.socket.on('new_message', callback);
  }

  onMessageEdited(callback: (message: any) => void): void {
    if (!this.socket) return;
    this.socket.on('message_edited', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; conversationId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('message_deleted', callback);
  }

  onMessagesRead(callback: (data: { conversationId: string; employeeId: string; timestamp: Date }) => void): void {
    if (!this.socket) return;
    this.socket.on('messages_read', callback);
  }

  onUserTyping(callback: (data: { conversationId: string; employeeId: string; email: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (data: { conversationId: string; employeeId: string }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_stopped_typing', callback);
  }

  onUserStatusChange(callback: (data: { employeeId: string; status: 'online' | 'offline'; timestamp: Date }) => void): void {
    if (!this.socket) return;
    this.socket.on('user_status_change', callback);
  }

  onNotification(callback: (notification: any) => void): void {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }

  // ==================== CLEANUP ====================

  removeAllListeners(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
