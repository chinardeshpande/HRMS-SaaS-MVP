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
import { ChatMessage } from './ChatMessage';
import { ChatParticipant } from './ChatParticipant';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('chat_conversations')
@Index(['tenantId', 'conversationType'])
@Index(['tenantId', 'createdAt'])
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  conversationId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  conversationType!: ConversationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string; // For group chats

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: Employee;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'text', nullable: true })
  lastMessageText?: string;

  @Column({ type: 'uuid', nullable: true })
  lastMessageBy?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'lastMessageBy' })
  lastMessageSender?: Employee;

  @Column({ type: 'int', default: 0 })
  messageCount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages!: ChatMessage[];

  @OneToMany(() => ChatParticipant, (participant) => participant.conversation)
  participants!: ChatParticipant[];
}
