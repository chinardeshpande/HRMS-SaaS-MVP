import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Employee } from './Employee';
import { ChatConversation } from './ChatConversation';

export enum ParticipantRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('chat_participants')
@Unique(['conversationId', 'employeeId'])
@Index(['tenantId', 'conversationId'])
@Index(['tenantId', 'employeeId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid')
  participantId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @Column('uuid')
  @Index()
  conversationId!: string;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: ChatConversation;

  @Column('uuid')
  @Index()
  employeeId!: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee!: Employee;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role!: ParticipantRole;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt?: Date;

  @Column({ type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ type: 'boolean', default: false })
  isMuted!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  joinedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
