import api from './api';

export interface ChatConversation {
  conversationId: string;
  type: 'one_on_one' | 'group';
  name: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  designation?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
}

class ChatService {
  async getAllConversations(): Promise<ChatConversation[]> {
    console.log('🔵 Fetching conversations from API...');
    const response = await api.get('/chat/conversations');
    console.log('✅ Conversations fetched:', response.data);
    const conversations = response.data?.conversations || [];

    // Transform backend format to frontend format
    return conversations.map((conv: any) => ({
      conversationId: conv.conversationId,
      type: conv.conversationType === 'direct' ? 'one_on_one' : 'group',
      name: this.getConversationName(conv),
      participants: (conv.participants || []).map((p: any) => ({
        userId: p.employeeId,
        userName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unknown',
        avatar: p.employee?.profilePicture,
        designation: p.employee?.designation?.name,
        isOnline: false, // Will be updated by WebSocket
        lastSeen: p.lastReadAt,
      })),
      lastMessage: conv.lastMessageText ? {
        messageId: '',
        conversationId: conv.conversationId,
        senderId: conv.lastMessageBy || '',
        senderName: conv.lastMessageSender ? `${conv.lastMessageSender.firstName} ${conv.lastMessageSender.lastName}` : 'Unknown',
        content: conv.lastMessageText,
        messageType: 'text',
        isRead: true,
        createdAt: conv.lastMessageAt,
      } : undefined,
      unreadCount: 0, // Will be calculated from participants
      isArchived: !conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }

  private getConversationName(conv: any): string {
    if (conv.name) return conv.name;

    // For direct conversations, get the other participant's name
    if (conv.conversationType === 'direct' && conv.participants?.length === 2) {
      const currentUser = localStorage.getItem('user');
      const currentUserId = currentUser ? JSON.parse(currentUser).employeeId : null;
      const otherParticipant = conv.participants.find((p: any) => p.employeeId !== currentUserId);
      if (otherParticipant?.employee) {
        return `${otherParticipant.employee.firstName} ${otherParticipant.employee.lastName}`;
      }
    }

    return 'Conversation';
  }

  async getConversationById(conversationId: string): Promise<ChatConversation> {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    const conv = response.data;
    return {
      conversationId: conv.conversationId,
      type: conv.conversationType === 'direct' ? 'one_on_one' : 'group',
      name: this.getConversationName(conv),
      participants: (conv.participants || []).map((p: any) => ({
        userId: p.employeeId,
        userName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unknown',
        avatar: p.employee?.profilePicture,
        designation: p.employee?.designation?.name,
        isOnline: false,
        lastSeen: p.lastReadAt,
      })),
      unreadCount: 0,
      isArchived: !conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  async createConversation(data: {
    conversationType: 'direct' | 'group';
    name?: string;
    description?: string;
    participantIds: string[];
  }): Promise<ChatConversation> {
    const response = await api.post('/chat/conversations', data);
    return this.transformConversation(response.data);
  }

  private transformConversation(conv: any): ChatConversation {
    return {
      conversationId: conv.conversationId,
      type: conv.conversationType === 'direct' ? 'one_on_one' : 'group',
      name: this.getConversationName(conv),
      participants: (conv.participants || []).map((p: any) => ({
        userId: p.employeeId,
        userName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Unknown',
        avatar: p.employee?.profilePicture,
        designation: p.employee?.designation?.name,
        isOnline: false,
        lastSeen: p.lastReadAt,
      })),
      unreadCount: 0,
      isArchived: !conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
    console.log('🔵 Fetching messages from API for conversation:', conversationId);
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params: { limit } });
    console.log('✅ Messages fetched:', response.data);
    const messages = response.data?.messages || [];

    return messages.map((msg: any) => ({
      messageId: msg.messageId,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.content,
      messageType: msg.messageType || 'text',
      attachments: msg.attachments,
      isRead: msg.status === 'read',
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  }

  async sendMessage(conversationId: string, content: string, messageType: string = 'text'): Promise<ChatMessage> {
    console.log('🔵 Sending message:', conversationId, content);
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, { content, messageType });
    console.log('✅ Message sent:', response.data);
    const msg = response.data;
    return {
      messageId: msg.messageId,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.content,
      messageType: msg.messageType || 'text',
      attachments: msg.attachments,
      isRead: msg.status === 'read',
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  }

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/chat/conversations/${conversationId}/read`);
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/chat/unread-count');
    return response.data?.unreadCount || 0;
  }

  async getEmployees(query?: string): Promise<any[]> {
    const response = await api.get('/employees', { params: { search: query, limit: 50 } });
    return response.data?.employees || [];
  }

}

export default new ChatService();
