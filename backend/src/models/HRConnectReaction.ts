import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { HRConnectPost } from './HRConnectPost';
import { HRConnectComment } from './HRConnectComment';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HELPFUL = 'helpful',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  SUPPORT = 'support',
}

@Entity('hr_connect_reactions')
@Index(['tenantId', 'postId'])
@Index(['tenantId', 'commentId'])
@Index(['tenantId', 'userId'])
@Unique(['postId', 'userId', 'reactionType'])
@Unique(['commentId', 'userId', 'reactionType'])
export class HRConnectReaction {
  @PrimaryGeneratedColumn('uuid')
  reactionId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column({ type: 'uuid', nullable: true })
  postId?: string;

  @ManyToOne(() => HRConnectPost, (post) => post.reactions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post?: HRConnectPost;

  @Column({ type: 'uuid', nullable: true })
  commentId?: string;

  @ManyToOne(() => HRConnectComment, (comment) => comment.reactions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment?: HRConnectComment;

  @Column('uuid')
  @Index()
  userId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Employee;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
  })
  reactionType!: ReactionType;

  @CreateDateColumn()
  createdAt!: Date;
}
