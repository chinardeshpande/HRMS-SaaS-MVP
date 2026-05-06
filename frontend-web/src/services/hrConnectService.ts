import api from './api';

export interface Post {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorDepartment?: string;
  authorDesignation?: string;
  title?: string;
  content: string;
  postType: 'announcement' | 'general' | 'event' | 'poll' | 'document' | 'discussion' | 'question';
  visibility: 'public' | 'department' | 'group' | 'hr_only' | 'group_only';
  groupId?: string;
  attachments?: PostAttachment[];
  reactions?: PostReaction[];
  comments?: Comment[];
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostAttachment {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document' | 'link';
  fileSize?: string;
  thumbnailUrl?: string;
}

export interface PostReaction {
  reactionId: string;
  userId: string;
  userName: string;
  reactionType: 'like' | 'love' | 'celebrate' | 'insightful';
  createdAt: string;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  groupId: string;
  name: string;
  description?: string;
  groupType: 'department' | 'project' | 'topic' | 'social';
  type?: 'department' | 'project' | 'interest' | 'team'; // Legacy field for backward compatibility
  privacy: 'public' | 'private' | 'secret';
  memberCount: number;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  isPrivate?: boolean; // Legacy field
}

export interface GroupMember {
  userId: string;
  userName: string;
  userEmail?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
}

class HRConnectService {
  private transformComment(comment: any): Comment {
    const authorName = comment.authorName
      || (comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : undefined)
      || 'Unknown';

    return {
      ...comment,
      authorName,
      authorAvatar: comment.authorAvatar || comment.author?.profilePicture,
    };
  }

  private transformGroup(group: any): Group {
    return {
      ...group,
      groupType: group.groupType || group.type || 'topic',
      type: group.type || group.groupType,
      members: (group.members || []).map((member: any) => ({
        userId: member.employeeId,
        userName: member.employee ? `${member.employee.firstName} ${member.employee.lastName}` : 'Unknown',
        userEmail: member.employee?.email,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
    };
  }

  // Posts
  async getAllPosts(filters?: { visibility?: string; groupId?: string }): Promise<Post[]> {
    console.log('🔵 Fetching posts from API...');
    const response = await api.get('/hr-connect/posts', { params: filters });
    console.log('✅ Full API Response:', response);
    console.log('📦 Response.data:', response.data);
    console.log('📋 Response.data type:', typeof response.data);

    // API client already unwraps to { success: true, data: { posts: [], total: 0 } }
    // So response.data is { posts: [], total: 0 }
    const posts = response.data?.posts || [];
    console.log('📝 Extracted posts array:', posts);
    console.log('📊 Number of posts:', posts.length);

    // Transform backend post format to frontend format
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      authorName: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Unknown',
      authorDepartment: post.author?.department?.name,
      authorDesignation: post.author?.designation?.name,
      title: post.title || '', // Add title field if missing
      comments: (post.comments || []).map((comment: any) => this.transformComment(comment)),
    }));

    console.log('✨ Transformed posts:', transformedPosts);
    return transformedPosts;
  }

  async getPostById(postId: string): Promise<Post> {
    const response = await api.get(`/hr-connect/posts/${postId}`);
    return response.data;
  }

  async createPost(postData: Partial<Post>): Promise<Post> {
    const response = await api.post('/hr-connect/posts', postData);
    return response.data;
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    const response = await api.put(`/hr-connect/posts/${postId}`, postData);
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/hr-connect/posts/${postId}`);
  }

  // Reactions
  async addReaction(postId: string, reactionType: string): Promise<void> {
    console.log('🔵 Adding reaction:', postId, reactionType);
    await api.post(`/hr-connect/posts/${postId}/reactions`, { reactionType });
    console.log('✅ Reaction added');
  }

  async removeReaction(postId: string): Promise<void> {
    await api.delete(`/hr-connect/posts/${postId}/reactions`);
  }

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get(`/hr-connect/posts/${postId}/comments`);
    return (response.data?.comments || []).map((comment: any) => this.transformComment(comment));
  }

  async addComment(postId: string, content: string): Promise<Comment> {
    console.log('🔵 Adding comment:', postId, content);
    const response = await api.post(`/hr-connect/posts/${postId}/comments`, { content });
    console.log('✅ Comment added:', response.data);
    return this.transformComment(response.data);
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/hr-connect/comments/${commentId}`);
  }

  // Groups
  async getAllGroups(): Promise<Group[]> {
    console.log('🔵 Fetching groups from API...');
    const response = await api.get('/hr-connect/groups');
    console.log('✅ Groups fetched:', response);
    // API client already unwraps to { success: true, data: { groups: [], total: 0 } }
    // So response.data is { groups: [], total: 0 }
    const groups = response.data?.groups || [];

    // Ensure backward compatibility and proper structure
    return groups.map((group: any) => this.transformGroup(group));
  }

  async getGroups(): Promise<Group[]> {
    return this.getAllGroups();
  }

  async updateGroup(groupId: string, data: Partial<Group>): Promise<Group> {
    const response = await api.put(`/hr-connect/groups/${groupId}`, data);
    return this.transformGroup(response.data);
  }

  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/hr-connect/groups/${groupId}`);
  }

  async createGroup(groupData: Partial<Group>): Promise<Group> {
    const response = await api.post('/hr-connect/groups', groupData);
    return this.transformGroup(response.data);
  }

  async joinGroup(groupId: string): Promise<Group> {
    const response = await api.post(`/hr-connect/groups/${groupId}/join`);
    return this.transformGroup(response.data);
  }

  async leaveGroup(groupId: string): Promise<Group> {
    const response = await api.post(`/hr-connect/groups/${groupId}/leave`);
    return this.transformGroup(response.data);
  }

  async addGroupMembers(groupId: string, employeeIds: string[]): Promise<Group> {
    const response = await api.post(`/hr-connect/groups/${groupId}/members`, { employeeIds });
    return this.transformGroup(response.data);
  }

  async removeGroupMember(groupId: string, employeeId: string): Promise<Group> {
    const response = await api.delete(`/hr-connect/groups/${groupId}/members/${employeeId}`);
    return this.transformGroup(response.data);
  }

  async updateGroupMemberRole(groupId: string, employeeId: string, role: 'admin' | 'moderator' | 'member'): Promise<Group> {
    const response = await api.put(`/hr-connect/groups/${groupId}/members/${employeeId}`, { role });
    return this.transformGroup(response.data);
  }
}

export default new HRConnectService();
