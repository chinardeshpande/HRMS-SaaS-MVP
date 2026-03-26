import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Employee } from './Employee';
import { HRConnectComment } from './HRConnectComment';
import { HRConnectReaction } from './HRConnectReaction';
import { HRConnectGroup } from './HRConnectGroup';

export enum PostType {
  ANNOUNCEMENT = 'announcement',
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  POLL = 'poll',
}

export enum PostVisibility {
  PUBLIC = 'public',
  HR_ONLY = 'hr_only',
  GROUP_ONLY = 'group_only',
  DEPARTMENT = 'department',
}

@Entity('hr_connect_posts')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'authorId'])
@Index(['tenantId', 'postType'])
@Index(['tenantId', 'visibility'])
export class HRConnectPost {
  @PrimaryGeneratedColumn('uuid')
  postId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column('uuid')
  @Index()
  authorId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: Employee;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.DISCUSSION,
  })
  postType!: PostType;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility!: PostVisibility;

  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @ManyToOne(() => HRConnectGroup, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group?: HRConnectGroup;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  pollOptions?: {
    optionId: string;
    text: string;
    votes: number;
    voters: string[];
  }[];

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean;

  @Column({ type: 'boolean', default: false })
  isLocked!: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'int', default: 0 })
  reactionCount!: number;

  @OneToMany(() => HRConnectComment, (comment) => comment.post)
  comments!: HRConnectComment[];

  @OneToMany(() => HRConnectReaction, (reaction) => reaction.post)
  reactions!: HRConnectReaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
