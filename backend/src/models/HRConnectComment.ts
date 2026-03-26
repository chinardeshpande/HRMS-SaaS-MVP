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
import { HRConnectPost } from './HRConnectPost';
import { HRConnectReaction } from './HRConnectReaction';

@Entity('hr_connect_comments')
@Index(['tenantId', 'postId', 'createdAt'])
@Index(['tenantId', 'authorId'])
export class HRConnectComment {
  @PrimaryGeneratedColumn('uuid')
  commentId!: string;

  @Column('uuid')
  @Index()
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: Tenant;

  @Column('uuid')
  @Index()
  postId!: string;

  @ManyToOne(() => HRConnectPost, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: HRConnectPost;

  @Column('uuid')
  @Index()
  authorId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: Employee;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;

  @ManyToOne(() => HRConnectComment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment?: HRConnectComment;

  @OneToMany(() => HRConnectComment, (comment) => comment.parentComment)
  replies!: HRConnectComment[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];

  @Column({ type: 'boolean', default: false })
  isEdited!: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'int', default: 0 })
  reactionCount!: number;

  @OneToMany(() => HRConnectReaction, (reaction) => reaction.comment)
  reactions!: HRConnectReaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
