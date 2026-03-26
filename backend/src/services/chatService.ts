import { AppDataSource } from '../config/database';
import { ChatConversation, ConversationType } from '../models/ChatConversation';
import { ChatMessage, MessageType, MessageStatus } from '../models/ChatMessage';
import { ChatParticipant, ParticipantRole } from '../models/ChatParticipant';
import { Employee } from '../models/Employee';
import { In, IsNull, Not } from 'typeorm';

export class ChatService {
  private static instance: ChatService;
  private conversationRepo = AppDataSource.getRepository(ChatConversation);
  private messageRepo = AppDataSource.getRepository(ChatMessage);
  private participantRepo = AppDataSource.getRepository(ChatParticipant);
  private employeeRepo = AppDataSource.getRepository(Employee);

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // ==================== CONVERSATION OPERATIONS ====================

  async createConversation(data: {
    tenantId: string;
    createdBy: string;
    conversationType: ConversationType;
    name?: string;
    description?: string;
    participantIds: string[];
  }): Promise<ChatConversation> {
    // Check if direct conversation already exists between these participants
    if (data.conversationType === ConversationType.DIRECT && data.participantIds.length === 2) {
      const existingConversation = await this.findDirectConversation(
        data.tenantId,
        data.participantIds[0],
        data.participantIds[1]
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    const conversation = this.conversationRepo.create({
      tenantId: data.tenantId,
      createdBy: data.createdBy,
      conversationType: data.conversationType,
      name: data.name,
      description: data.description,
    });

    const savedConversation = await this.conversationRepo.save(conversation);

    // Add participants
    for (const employeeId of data.participantIds) {
      await this.addParticipant({
        tenantId: data.tenantId,
        conversationId: savedConversation.conversationId,
        employeeId,
        role: employeeId === data.createdBy ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
      });
    }

    const savedConversationWithRelations = await this.getConversationById(savedConversation.conversationId, data.tenantId);
    if (!savedConversationWithRelations) {
      throw new Error('Failed to retrieve created conversation');
    }
    return savedConversationWithRelations;
  }

  async findDirectConversation(
    tenantId: string,
    employeeId1: string,
    employeeId2: string
  ): Promise<ChatConversation | null> {
    // Find all conversations where both employees are participants
    const conversations = await this.conversationRepo
      .createQueryBuilder('conv')
      .innerJoin('conv.participants', 'p1', 'p1.employeeId = :employeeId1', { employeeId1 })
      .innerJoin('conv.participants', 'p2', 'p2.employeeId = :employeeId2', { employeeId2 })
      .where('conv.tenantId = :tenantId', { tenantId })
      .andWhere('conv.conversationType = :type', { type: ConversationType.DIRECT })
      .andWhere('conv.isActive = :isActive', { isActive: true })
      .getMany();

    return conversations.length > 0 ? conversations[0] : null;
  }

  async getConversationById(
    conversationId: string,
    tenantId: string
  ): Promise<ChatConversation | null> {
    return await this.conversationRepo.findOne({
      where: { conversationId, tenantId, isActive: true },
      relations: ['creator', 'participants', 'participants.employee', 'lastMessageSender'],
    });
  }

  async getConversations(
    tenantId: string,
    employeeId: string,
    options: {
      conversationType?: ConversationType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ conversations: ChatConversation[]; total: number }> {
    const query = this.conversationRepo
      .createQueryBuilder('conv')
      .leftJoinAndSelect('conv.creator', 'creator')
      .leftJoinAndSelect('conv.lastMessageSender', 'lastMessageSender')
      .leftJoinAndSelect('conv.participants', 'participants')
      .leftJoinAndSelect('participants.employee', 'employee')
      .innerJoin('conv.participants', 'myParticipant', 'myParticipant.employeeId = :employeeId', {
        employeeId,
      })
      .where('conv.tenantId = :tenantId', { tenantId })
      .andWhere('conv.isActive = :isActive', { isActive: true })
      .andWhere('myParticipant.isActive = :isActive', { isActive: true })
      .orderBy('conv.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('conv.createdAt', 'DESC');

    if (options.conversationType) {
      query.andWhere('conv.conversationType = :conversationType', {
        conversationType: options.conversationType,
      });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [conversations, total] = await query.getManyAndCount();

    return { conversations, total };
  }

  async updateConversation(
    conversationId: string,
    tenantId: string,
    updates: {
      name?: string;
      description?: string;
      avatarUrl?: string;
    }
  ): Promise<ChatConversation | null> {
    const conversation = await this.conversationRepo.findOne({
      where: { conversationId, tenantId },
    });

    if (!conversation) {
      return null;
    }

    Object.assign(conversation, updates);
    return await this.conversationRepo.save(conversation);
  }

  // ==================== MESSAGE OPERATIONS ====================

  async sendMessage(data: {
    tenantId: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
    attachments?: any[];
    replyToMessageId?: string;
  }): Promise<ChatMessage> {
    const message = this.messageRepo.create({
      tenantId: data.tenantId,
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      messageType: data.messageType || MessageType.TEXT,
      attachments: data.attachments,
      replyToMessageId: data.replyToMessageId,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Update conversation last message
    await this.conversationRepo.update(
      { conversationId: data.conversationId },
      {
        lastMessageAt: new Date(),
        lastMessageText: data.content,
        lastMessageBy: data.senderId,
        messageCount: () => 'messageCount + 1',
      }
    );

    // Increment unread count for other participants
    await this.participantRepo
      .createQueryBuilder()
      .update()
      .set({ unreadCount: () => 'unreadCount + 1' })
      .where('conversationId = :conversationId', { conversationId: data.conversationId })
      .andWhere('employeeId != :senderId', { senderId: data.senderId })
      .execute();

    // Return message with sender details
    return await this.messageRepo.findOne({
      where: { messageId: savedMessage.messageId },
      relations: ['sender', 'replyToMessage', 'replyToMessage.sender'],
    }) as ChatMessage;
  }

  async getMessages(
    conversationId: string,
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      beforeMessageId?: string;
    } = {}
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const query = this.messageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.replyToMessage', 'replyToMessage')
      .leftJoinAndSelect('replyToMessage.sender', 'replyToSender')
      .where('msg.conversationId = :conversationId', { conversationId })
      .andWhere('msg.tenantId = :tenantId', { tenantId })
      .andWhere('msg.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('msg.createdAt', 'DESC');

    if (options.beforeMessageId) {
      const beforeMessage = await this.messageRepo.findOne({
        where: { messageId: options.beforeMessageId },
      });
      if (beforeMessage) {
        query.andWhere('msg.createdAt < :beforeDate', { beforeDate: beforeMessage.createdAt });
      }
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [messages, total] = await query.getManyAndCount();

    // Reverse to show oldest first
    return { messages: messages.reverse(), total };
  }

  async markMessagesAsRead(
    conversationId: string,
    employeeId: string,
    tenantId: string
  ): Promise<void> {
    // Update participant last read timestamp
    await this.participantRepo.update(
      { conversationId, employeeId, tenantId },
      {
        lastReadAt: new Date(),
        unreadCount: 0,
      }
    );

    // Mark messages as read
    await this.messageRepo
      .createQueryBuilder()
      .update()
      .set({ status: MessageStatus.READ })
      .where('conversationId = :conversationId', { conversationId })
      .andWhere('senderId != :employeeId', { employeeId })
      .andWhere('status != :status', { status: MessageStatus.READ })
      .execute();
  }

  async editMessage(
    messageId: string,
    tenantId: string,
    senderId: string,
    newContent: string
  ): Promise<ChatMessage | null> {
    const message = await this.messageRepo.findOne({
      where: { messageId, tenantId, senderId, isDeleted: false },
    });

    if (!message) {
      return null;
    }

    message.content = newContent;
    message.isEdited = true;
    message.editedAt = new Date();

    return await this.messageRepo.save(message);
  }

  async deleteMessage(
    messageId: string,
    tenantId: string,
    senderId: string
  ): Promise<boolean> {
    const message = await this.messageRepo.findOne({
      where: { messageId, tenantId, senderId },
    });

    if (!message) {
      return false;
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message was deleted';
    await this.messageRepo.save(message);

    return true;
  }

  // ==================== PARTICIPANT OPERATIONS ====================

  async addParticipant(data: {
    tenantId: string;
    conversationId: string;
    employeeId: string;
    role?: ParticipantRole;
  }): Promise<ChatParticipant> {
    const participant = this.participantRepo.create({
      ...data,
      role: data.role || ParticipantRole.MEMBER,
    });

    return await this.participantRepo.save(participant);
  }

  async removeParticipant(
    conversationId: string,
    employeeId: string,
    tenantId: string
  ): Promise<boolean> {
    const participant = await this.participantRepo.findOne({
      where: { conversationId, employeeId, tenantId },
    });

    if (!participant) {
      return false;
    }

    participant.isActive = false;
    await this.participantRepo.save(participant);

    return true;
  }

  async getParticipants(
    conversationId: string,
    tenantId: string
  ): Promise<ChatParticipant[]> {
    return await this.participantRepo.find({
      where: { conversationId, tenantId, isActive: true },
      relations: ['employee'],
      order: { joinedAt: 'ASC' },
    });
  }

  async getUnreadCount(employeeId: string, tenantId: string): Promise<number> {
    const result = await this.participantRepo
      .createQueryBuilder('participant')
      .select('SUM(participant.unreadCount)', 'total')
      .where('participant.employeeId = :employeeId', { employeeId })
      .andWhere('participant.tenantId = :tenantId', { tenantId })
      .andWhere('participant.isActive = :isActive', { isActive: true })
      .getRawOne();

    return parseInt(result?.total || '0');
  }
}

export const chatService = ChatService.getInstance();
