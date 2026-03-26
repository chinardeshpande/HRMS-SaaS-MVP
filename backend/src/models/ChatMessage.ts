import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employee } from './Employee';
import { ChatConversation } from './ChatConversation';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('chat_messages')
@Index(['tenantId', 'conversationId', 'createdAt'])
@Index(['tenantId', 'senderId'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  messageId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  @Index()
  conversationId!: string;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: ChatConversation;

  @Column('uuid')
  @Index()
  senderId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'senderId' })
  sender!: Employee;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType!: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];

  @Column({ type: 'uuid', nullable: true })
  replyToMessageId?: string;

  @ManyToOne(() => ChatMessage, { nullable: true })
  @JoinColumn({ name: 'replyToMessageId' })
  replyToMessage?: ChatMessage;

  @OneToMany(() => ChatMessage, (message) => message.replyToMessage)
  replies!: ChatMessage[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isEdited!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt?: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
