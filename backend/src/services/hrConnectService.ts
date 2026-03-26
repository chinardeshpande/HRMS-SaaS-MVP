import { AppDataSource } from '../config/database';
import { HRConnectPost, PostType, PostVisibility } from '../models/HRConnectPost';
import { HRConnectComment } from '../models/HRConnectComment';
import { HRConnectReaction, ReactionType } from '../models/HRConnectReaction';
import { HRConnectGroup, GroupType, GroupPrivacy } from '../models/HRConnectGroup';
import { HRConnectGroupMember, MemberRole } from '../models/HRConnectGroupMember';
import { Employee } from '../models/Employee';
import { In, IsNull } from 'typeorm';
import { socketService } from './socketService';

export class HRConnectService {
  private static instance: HRConnectService;
  private postRepo = AppDataSource.getRepository(HRConnectPost);
  private commentRepo = AppDataSource.getRepository(HRConnectComment);
  private reactionRepo = AppDataSource.getRepository(HRConnectReaction);
  private groupRepo = AppDataSource.getRepository(HRConnectGroup);
  private groupMemberRepo = AppDataSource.getRepository(HRConnectGroupMember);
  private employeeRepo = AppDataSource.getRepository(Employee);

  private constructor() {}

  public static getInstance(): HRConnectService {
    if (!HRConnectService.instance) {
      HRConnectService.instance = new HRConnectService();
    }
    return HRConnectService.instance;
  }

  // ==================== POST OPERATIONS ====================

  async createPost(data: {
    tenantId: string;
    authorId: string;
    title: string;
    content: string;
    postType?: PostType;
    visibility?: PostVisibility;
    groupId?: string;
    departmentId?: string;
    attachments?: any[];
    pollOptions?: any[];
  }): Promise<HRConnectPost> {
    const post = this.postRepo.create({
      ...data,
      postType: data.postType || PostType.DISCUSSION,
      visibility: data.visibility || PostVisibility.PUBLIC,
    });

    const savedPost = await this.postRepo.save(post);

    // Load post with essential relations for WebSocket broadcast
    try {
      const fullPost = await this.postRepo.findOne({
        where: { postId: savedPost.postId, tenantId: data.tenantId },
        relations: ['author', 'author.department', 'author.designation'],
      });

      // Emit real-time event
      const io = socketService.getIO();
      if (io && fullPost) {
        io.emit('new_post', fullPost);
      }
    } catch (error) {
      console.error('Error broadcasting new post:', error);
      // Don't fail the post creation if broadcast fails
    }

    return savedPost;
  }

  async getAllPosts(
    tenantId: string,
    options: {
      employeeId?: string;
      groupId?: string;
      postType?: PostType;
      visibility?: PostVisibility;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ posts: HRConnectPost[]; total: number }> {
    const query = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('author.department', 'department')
      .leftJoinAndSelect('author.designation', 'designation')
      .leftJoinAndSelect('post.group', 'group')
      .leftJoinAndSelect('post.reactions', 'reactions')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .where('post.tenantId = :tenantId', { tenantId })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(comments.isDeleted = :commentNotDeleted OR comments.commentId IS NULL)', { commentNotDeleted: false })
      .orderBy('post.isPinned', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .addOrderBy('comments.createdAt', 'ASC');

    if (options.groupId) {
      query.andWhere('post.groupId = :groupId', { groupId: options.groupId });
    }

    if (options.postType) {
      query.andWhere('post.postType = :postType', { postType: options.postType });
    }

    if (options.visibility) {
      query.andWhere('post.visibility = :visibility', { visibility: options.visibility });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [posts, total] = await query.getManyAndCount();

    return { posts, total };
  }

  async getPostById(postId: string, tenantId: string): Promise<HRConnectPost | null> {
    const post = await this.postRepo.findOne({
      where: { postId, tenantId, isDeleted: false },
      relations: ['author', 'group', 'reactions', 'reactions.user'],
    });

    if (post) {
      // Increment view count
      await this.postRepo.increment({ postId }, 'viewCount', 1);
    }

    return post;
  }

  async updatePost(
    postId: string,
    tenantId: string,
    authorId: string,
    updates: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isLocked?: boolean;
    }
  ): Promise<HRConnectPost | null> {
    const post = await this.postRepo.findOne({
      where: { postId, tenantId, authorId, isDeleted: false },
    });

    if (!post) {
      return null;
    }

    Object.assign(post, updates);
    const updatedPost = await this.postRepo.save(post);

    // Load full post with relations for WebSocket broadcast
    const fullPost = await this.getPostById(postId, tenantId);

    // Emit real-time event
    const io = socketService.getIO();
    if (io && fullPost) {
      io.emit('post_updated', fullPost);
    }

    return updatedPost;
  }

  async deletePost(postId: string, tenantId: string, authorId: string): Promise<boolean> {
    const post = await this.postRepo.findOne({
      where: { postId, tenantId, authorId },
    });

    if (!post) {
      return false;
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await this.postRepo.save(post);

    // Emit real-time event
    const io = socketService.getIO();
    if (io) {
      io.emit('post_deleted', { postId });
    }

    return true;
  }

  // ==================== COMMENT OPERATIONS ====================

  async addComment(data: {
    tenantId: string;
    postId: string;
    authorId: string;
    content: string;
    parentCommentId?: string;
  }): Promise<HRConnectComment> {
    const comment = this.commentRepo.create(data);
    const savedComment = await this.commentRepo.save(comment);

    // Increment comment count on post
    await this.postRepo.increment({ postId: data.postId }, 'commentCount', 1);

    // Load comment with author details
    const fullComment = await this.commentRepo.findOne({
      where: { commentId: savedComment.commentId },
      relations: ['author'],
    });

    // Emit real-time event
    const io = socketService.getIO();
    if (io && fullComment) {
      io.emit('new_comment', {
        postId: data.postId,
        comment: fullComment,
      });
    }

    return savedComment;
  }

  async getComments(
    postId: string,
    tenantId: string,
    options: {
      parentCommentId?: string | null;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ comments: HRConnectComment[]; total: number }> {
    const whereCondition: any = {
      postId,
      tenantId,
      isDeleted: false,
    };

    if (options.parentCommentId === null) {
      whereCondition.parentCommentId = IsNull();
    } else if (options.parentCommentId) {
      whereCondition.parentCommentId = options.parentCommentId;
    }

    const [comments, total] = await this.commentRepo.findAndCount({
      where: whereCondition,
      relations: ['author', 'reactions', 'reactions.user', 'replies'],
      order: { createdAt: 'ASC' },
      take: options.limit,
      skip: options.offset,
    });

    return { comments, total };
  }

  async deleteComment(commentId: string, tenantId: string, authorId: string): Promise<boolean> {
    const comment = await this.commentRepo.findOne({
      where: { commentId, tenantId, authorId },
    });

    if (!comment) {
      return false;
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await this.commentRepo.save(comment);

    // Decrement comment count on post
    await this.postRepo.decrement({ postId: comment.postId }, 'commentCount', 1);

    return true;
  }

  // ==================== REACTION OPERATIONS ====================

  async addReaction(data: {
    tenantId: string;
    userId: string;
    postId?: string;
    commentId?: string;
    reactionType: ReactionType;
  }): Promise<HRConnectReaction> {
    // Check if reaction already exists
    const existingReaction = await this.reactionRepo.findOne({
      where: {
        tenantId: data.tenantId,
        userId: data.userId,
        postId: data.postId,
        commentId: data.commentId,
        reactionType: data.reactionType,
      },
    });

    if (existingReaction) {
      return existingReaction;
    }

    const reaction = this.reactionRepo.create(data);
    const savedReaction = await this.reactionRepo.save(reaction);

    // Increment reaction count
    if (data.postId) {
      await this.postRepo.increment({ postId: data.postId }, 'reactionCount', 1);
    }
    if (data.commentId) {
      await this.commentRepo.increment({ commentId: data.commentId }, 'reactionCount', 1);
    }

    // Load reaction with user details
    const fullReaction = await this.reactionRepo.findOne({
      where: { reactionId: savedReaction.reactionId },
      relations: ['user'],
    });

    // Emit real-time event
    const io = socketService.getIO();
    if (io && fullReaction && data.postId) {
      io.emit('new_reaction', {
        postId: data.postId,
        reaction: fullReaction,
      });
    }

    return savedReaction;
  }

  async removeReaction(data: {
    tenantId: string;
    userId: string;
    postId?: string;
    commentId?: string;
  }): Promise<boolean> {
    const reaction = await this.reactionRepo.findOne({
      where: {
        tenantId: data.tenantId,
        userId: data.userId,
        postId: data.postId,
        commentId: data.commentId,
      },
    });

    if (!reaction) {
      return false;
    }

    await this.reactionRepo.remove(reaction);

    // Decrement reaction count
    if (data.postId) {
      await this.postRepo.decrement({ postId: data.postId }, 'reactionCount', 1);
    }
    if (data.commentId) {
      await this.commentRepo.decrement({ commentId: data.commentId }, 'reactionCount', 1);
    }

    // Emit real-time event
    const io = socketService.getIO();
    if (io && data.postId) {
      io.emit('reaction_removed', {
        postId: data.postId,
        userId: data.userId,
      });
    }

    return true;
  }

  // ==================== GROUP OPERATIONS ====================

  async createGroup(data: {
    tenantId: string;
    createdBy: string;
    name: string;
    description?: string;
    groupType: GroupType;
    privacy: GroupPrivacy;
    departmentId?: string;
  }): Promise<HRConnectGroup> {
    const group = this.groupRepo.create(data);
    const savedGroup = await this.groupRepo.save(group);

    // Add creator as admin
    await this.addGroupMember({
      tenantId: data.tenantId,
      groupId: savedGroup.groupId,
      employeeId: data.createdBy,
      role: MemberRole.ADMIN,
    });

    return savedGroup;
  }

  async getGroups(
    tenantId: string,
    options: {
      employeeId?: string;
      groupType?: GroupType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ groups: HRConnectGroup[]; total: number }> {
    const query = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.creator', 'creator')
      .leftJoinAndSelect('group.department', 'department')
      .leftJoinAndSelect('group.members', 'members')
      .leftJoinAndSelect('members.employee', 'employee')
      .where('group.tenantId = :tenantId', { tenantId })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .orderBy('group.createdAt', 'DESC');

    if (options.groupType) {
      query.andWhere('group.groupType = :groupType', { groupType: options.groupType });
    }

    if (options.employeeId) {
      query.andWhere('members.employeeId = :employeeId', { employeeId: options.employeeId });
    }

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [groups, total] = await query.getManyAndCount();

    return { groups, total };
  }

  async updateGroup(
    groupId: string,
    tenantId: string,
    updates: {
      name?: string;
      description?: string;
      privacy?: GroupPrivacy;
    }
  ): Promise<HRConnectGroup | null> {
    const group = await this.groupRepo.findOne({
      where: { groupId, tenantId },
    });

    if (!group) {
      return null;
    }

    Object.assign(group, updates);
    return await this.groupRepo.save(group);
  }

  async deleteGroup(groupId: string, tenantId: string): Promise<boolean> {
    const group = await this.groupRepo.findOne({
      where: { groupId, tenantId },
    });

    if (!group) {
      return false;
    }

    group.isActive = false;
    await this.groupRepo.save(group);

    return true;
  }

  async addGroupMember(data: {
    tenantId: string;
    groupId: string;
    employeeId: string;
    role?: MemberRole;
  }): Promise<HRConnectGroupMember> {
    const member = this.groupMemberRepo.create({
      ...data,
      role: data.role || MemberRole.MEMBER,
    });

    const savedMember = await this.groupMemberRepo.save(member);

    // Increment member count
    await this.groupRepo.increment({ groupId: data.groupId }, 'memberCount', 1);

    return savedMember;
  }

  async removeGroupMember(groupId: string, employeeId: string, tenantId: string): Promise<boolean> {
    const member = await this.groupMemberRepo.findOne({
      where: { groupId, employeeId, tenantId },
    });

    if (!member) {
      return false;
    }

    await this.groupMemberRepo.remove(member);

    // Decrement member count
    await this.groupRepo.decrement({ groupId }, 'memberCount', 1);

    return true;
  }

  async getGroupMembers(
    groupId: string,
    tenantId: string
  ): Promise<HRConnectGroupMember[]> {
    return await this.groupMemberRepo.find({
      where: { groupId, tenantId },
      relations: ['employee'],
      order: { joinedAt: 'ASC' },
    });
  }
}

export const hrConnectService = HRConnectService.getInstance();
