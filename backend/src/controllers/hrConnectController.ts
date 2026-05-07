import { Request, Response } from 'express';
import { hrConnectService } from '../services/hrConnectService';
import { PostType, PostVisibility } from '../models/HRConnectPost';
import { ReactionType } from '../models/HRConnectReaction';
import { GroupType, GroupPrivacy } from '../models/HRConnectGroup';
import { MemberRole } from '../models/HRConnectGroupMember';

const hrConnectErrorResponse = (res: Response, error: any) => {
  const message = error?.message || 'HR Connect request failed';
  const notFoundMessages = ['Post not found', 'Comment not found', 'Parent comment not found', 'Group not found'];
  const forbiddenMessages = ['Post is locked for comments', 'Group admin access required'];

  if (notFoundMessages.includes(message)) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
  }

  if (forbiddenMessages.includes(message)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};

// ==================== POST CONTROLLERS ====================

export const createPost = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { title, content, postType, visibility, groupId, departmentId, attachments, pollOptions } = req.body;

    // Content is required, title is optional (will default to empty string or content preview)
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required',
        },
      });
    }

    const post = await hrConnectService.createPost({
      tenantId,
      authorId: user.employeeId,
      title: title || '', // Default to empty string if not provided
      content,
      postType: postType as PostType,
      visibility: visibility as PostVisibility,
      groupId,
      departmentId,
      attachments,
      pollOptions,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId, postType, visibility, limit = 20, offset = 0 } = req.query;

    const result = await hrConnectService.getAllPosts(tenantId, {
      employeeId: user?.employeeId,
      groupId: groupId as string,
      postType: postType as PostType,
      visibility: visibility as PostVisibility,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { postId } = req.params;

    const post = await hrConnectService.getPostById(postId, tenantId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { postId } = req.params;
    const { title, content, isPinned, isLocked } = req.body;

    const post = await hrConnectService.updatePost(postId, tenantId, user.employeeId, {
      title,
      content,
      isPinned,
      isLocked,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found or unauthorized',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { postId } = req.params;

    const deleted = await hrConnectService.deletePost(postId, tenantId, user.employeeId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found or unauthorized',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Post deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== COMMENT CONTROLLERS ====================

export const getComments = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { postId } = req.params;
    const { parentCommentId, limit = 50, offset = 0 } = req.query;

    const result = await hrConnectService.getComments(postId, tenantId, {
      parentCommentId: parentCommentId === 'null' ? null : (parentCommentId as string),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required',
        },
      });
    }

    const comment = await hrConnectService.addComment({
      tenantId,
      postId,
      authorId: user.employeeId,
      content,
      parentCommentId,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return hrConnectErrorResponse(res, error);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { commentId } = req.params;

    const deleted = await hrConnectService.deleteComment(commentId, tenantId, user.employeeId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found or unauthorized',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Comment deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== REACTION CONTROLLERS ====================

export const addReaction = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { postId } = req.params;
    const { reactionType, commentId } = req.body;

    if (!reactionType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reaction type is required',
        },
      });
    }

    const reaction = await hrConnectService.addReaction({
      tenantId,
      userId: user.employeeId,
      postId: commentId ? undefined : postId,
      commentId,
      reactionType: reactionType as ReactionType,
    });

    res.status(201).json({
      success: true,
      data: reaction,
    });
  } catch (error: any) {
    console.error('Error adding reaction:', error);
    return hrConnectErrorResponse(res, error);
  }
};

export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { postId } = req.params;
    const { commentId } = req.body;

    const removed = await hrConnectService.removeReaction({
      tenantId,
      userId: user.employeeId,
      postId: commentId ? undefined : postId,
      commentId,
    });

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reaction not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Reaction removed successfully' },
    });
  } catch (error: any) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

// ==================== GROUP CONTROLLERS ====================

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { name, description, groupType, privacy, departmentId } = req.body;

    if (!name || !groupType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and group type are required',
        },
      });
    }

    const group = await hrConnectService.createGroup({
      tenantId,
      createdBy: user.employeeId,
      name,
      description,
      groupType: groupType as GroupType,
      privacy: (privacy as GroupPrivacy) || GroupPrivacy.PUBLIC_ACCESS,
      departmentId,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getGroups = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupType, myGroups, limit = 20, offset = 0 } = req.query;

    const result = await hrConnectService.getGroups(tenantId, {
      employeeId: myGroups === 'true' ? user?.employeeId : undefined,
      groupType: groupType as GroupType,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId } = req.params;
    const { name, description, privacy } = req.body;

    const group = await hrConnectService.updateGroup(
      groupId,
      tenantId,
      user.employeeId,
      {
        name,
        description,
        privacy: privacy as GroupPrivacy,
      }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId } = req.params;

    const deleted = await hrConnectService.deleteGroup(groupId, tenantId, user.employeeId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Group deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const addGroupMembers = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Employee IDs are required',
        },
      });
    }

    const group = await hrConnectService.addGroupMembers({
      tenantId,
      groupId,
      requesterId: user.employeeId,
      employeeIds,
    });

    res.status(200).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error adding group members:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
};

export const removeGroupMember = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId, employeeId } = req.params;

    const group = await hrConnectService.removeGroupMemberWithAuthorization(
      groupId,
      employeeId,
      tenantId,
      user.employeeId
    );

    res.status(200).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error removing group member:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
};

export const updateGroupMemberRole = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId, employeeId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(MemberRole).includes(role as MemberRole)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid role is required',
        },
      });
    }

    const group = await hrConnectService.updateGroupMemberRole(
      groupId,
      employeeId,
      tenantId,
      user.employeeId,
      role as MemberRole
    );

    res.status(200).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error updating group member role:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId } = req.params;

    const group = await hrConnectService.joinGroup(groupId, tenantId, user.employeeId);
    res.status(200).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { groupId } = req.params;

    const group = await hrConnectService.leaveGroup(groupId, tenantId, user.employeeId);
    res.status(200).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
};
