import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import hrConnectService, { Post, Group } from '../services/hrConnectService';
import chatService, { ChatConversation } from '../services/chatService';
import ticketService, { HRTicket } from '../services/ticketService';
import socketService from '../services/socketService';
import {
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  UserGroupIcon,
  TicketIcon,
  PlusIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  DocumentArrowUpIcon,
  PaperClipIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function ModernHRConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'feed' | 'chat' | 'groups' | 'helpdesk' | null;

  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'groups' | 'helpdesk'>(tabParam || 'feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tickets, setTickets] = useState<HRTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['feed', 'chat', 'groups', 'helpdesk'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Post creation modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'announcement' | 'discussion' | 'question' | 'poll'>('discussion');
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Chat state
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Ticket creation modal
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketFormData, setTicketFormData] = useState({
    title: '',
    description: '',
    category: 'general' as HRTicket['category'],
    priority: 'medium' as HRTicket['priority'],
  });

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      const { token } = JSON.parse(tokens);
      if (!socketService.isConnected()) {
        socketService.connect(token);
      }

      // Listen for real-time feed updates
      const socket = socketService.getSocket();
      if (socket) {
        // New post created
        socket.on('new_post', (post: Post) => {
          console.log('📢 New post received:', post);
          setPosts(prev => [post, ...prev]);
        });

        // Post updated
        socket.on('post_updated', (updatedPost: Post) => {
          console.log('📝 Post updated:', updatedPost);
          setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
        });

        // Post deleted
        socket.on('post_deleted', (data: { postId: string }) => {
          console.log('🗑️ Post deleted:', data.postId);
          setPosts(prev => prev.filter(p => p.postId !== data.postId));
        });

        // New comment on post
        socket.on('new_comment', (data: { postId: string; comment: any }) => {
          console.log('💬 New comment:', data);
          setPosts(prev => prev.map(post => {
            if (post.postId === data.postId) {
              return {
                ...post,
                comments: [...(post.comments || []), data.comment],
              };
            }
            return post;
          }));
        });

        // New reaction on post
        socket.on('new_reaction', (data: { postId: string; reaction: any }) => {
          console.log('❤️ New reaction:', data);
          setPosts(prev => prev.map(post => {
            if (post.postId === data.postId) {
              return {
                ...post,
                reactions: [...(post.reactions || []), data.reaction],
              };
            }
            return post;
          }));
        });

        // Reaction removed
        socket.on('reaction_removed', (data: { postId: string; userId: string }) => {
          console.log('💔 Reaction removed:', data);
          setPosts(prev => prev.map(post => {
            if (post.postId === data.postId) {
              return {
                ...post,
                reactions: (post.reactions || []).filter(r => r.userId !== data.userId),
              };
            }
            return post;
          }));
        });
      }
    }

    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('new_post');
        socket.off('post_updated');
        socket.off('post_deleted');
        socket.off('new_comment');
        socket.off('new_reaction');
        socket.off('reaction_removed');
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchPosts();
    } else if (activeTab === 'chat') {
      fetchConversations();
    } else if (activeTab === 'groups') {
      fetchGroups();
    } else if (activeTab === 'helpdesk') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    console.log('📋 ModernHRConnect: Fetching posts...');
    setLoading(true);
    try {
      const data = await hrConnectService.getAllPosts();
      console.log('📋 ModernHRConnect: Received posts:', data);
      console.log('📋 ModernHRConnect: Number of posts:', data.length);
      setPosts(data);
    } catch (error) {
      console.error('❌ ModernHRConnect: Error fetching posts:', error);
      alert(`Error loading posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await chatService.getAllConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await hrConnectService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postTitle.trim() || !postContent.trim()) {
      alert('Please provide both title and content for your post');
      return;
    }

    try {
      console.log('📝 Creating post:', { title: postTitle, content: postContent, postType });
      const createdPost = await hrConnectService.createPost({
        title: postTitle,
        content: postContent,
        postType,
        visibility: 'public',
        isPinned: false,
      });

      console.log('✅ Post created, response:', createdPost);

      // Clear form and close modal
      setPostTitle('');
      setPostContent('');
      setShowPostModal(false);

      console.log('🔄 Refreshing posts list...');
      // Refresh posts list
      await fetchPosts();

      console.log('✅ Post created successfully and list refreshed');
    } catch (error) {
      console.error('❌ Error creating post:', error);
      alert(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReaction = async (postId: string, hasReacted: boolean) => {
    console.log(`👍 ModernHRConnect: Handling reaction for post ${postId}, hasReacted: ${hasReacted}`);
    try {
      if (hasReacted) {
        await hrConnectService.removeReaction(postId);
        console.log('✅ Reaction removed, refreshing posts...');
      } else {
        await hrConnectService.addReaction(postId, 'like');
        console.log('✅ Reaction added, refreshing posts...');
      }
      await fetchPosts();
    } catch (error) {
      console.error('❌ Error handling reaction:', error);
      alert(`Error adding reaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId];
    console.log(`💬 ModernHRConnect: Adding comment to post ${postId}: "${content}"`);
    if (!content?.trim()) {
      console.log('⚠️  Comment is empty, skipping');
      return;
    }

    try {
      const result = await hrConnectService.addComment(postId, content);
      console.log('✅ Comment added, result:', result);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await fetchPosts();
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      alert(`Error adding comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketService.createTicket(ticketFormData);
      setTicketFormData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      setShowTicketModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const getStatusColor = (status: HRTicket['status']) => {
    const colors: Record<HRTicket['status'], string> = {
      open: 'badge-primary',
      in_progress: 'badge-warning',
      waiting_response: 'badge-info',
      resolved: 'badge-success',
      closed: 'badge-gray',
    };
    return colors[status] || 'badge-gray';
  };

  const getPriorityColor = (priority: HRTicket['priority']) => {
    const colors: Record<HRTicket['priority'], string> = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HR Connect</h1>
                <p className="text-sm text-gray-500">Stay connected with your team</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'feed' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MegaphoneIcon className="h-4 w-4" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'chat' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>Chat</span>
                {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                  <span className="badge badge-danger text-xs">{conversations.filter(c => c.unreadCount > 0).length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'groups' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Groups</span>
              </button>
              <button
                onClick={() => setActiveTab('helpdesk')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'helpdesk' ? 'bg-white text-pink-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TicketIcon className="h-4 w-4" />
                <span>Helpdesk</span>
              </button>
            </div>

            {/* Action Button */}
            <div>
              {activeTab === 'feed' && (
                <button onClick={() => setShowPostModal(true)} className="btn btn-primary flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  New Post
                </button>
              )}
              {activeTab === 'chat' && (
                <button onClick={() => setShowNewChatModal(true)} className="btn btn-primary flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  New Chat
                </button>
              )}
              {activeTab === 'helpdesk' && (
                <button onClick={() => setShowTicketModal(true)} className="btn btn-primary flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  New Ticket
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {loading ? (
                  <div className="card p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="card p-12 text-center">
                    <MegaphoneIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No posts yet</p>
                  </div>
                ) : (
                  posts.map(post => {
                    const isExpanded = expandedPosts.has(post.postId);
                    return (
                      <div key={post.postId} className="card hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {post.authorName.split(' ').map(n => n.charAt(0)).join('')}
                                </div>
                                {post.postType === 'announcement' && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                    <MegaphoneIcon className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
                                <p className="text-xs text-gray-500">
                                  {post.authorDesignation}
                                  {post.authorDepartment && ` • ${post.authorDepartment}`}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(post.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {post.isPinned && (
                                <span className="badge badge-primary text-xs flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78.27 1.566 1.085 1.647l.215.014a3.002 3.002 0 002.963-3.373l-.092-.552a1 1 0 00-.98-.822H6z" />
                                  </svg>
                                  Pinned
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            {post.title && (
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                            )}
                            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          </div>

                          {/* Attachments */}
                          {post.attachments && post.attachments.length > 0 && (
                            <div className="mb-4 space-y-2">
                              {post.attachments.map(attachment => (
                                <div
                                  key={attachment.attachmentId}
                                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors cursor-pointer"
                                >
                                  <div className="p-2 bg-white rounded-lg">
                                    <PaperClipIcon className="h-5 w-5 text-pink-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                                    {attachment.fileSize && (
                                      <p className="text-xs text-gray-500">{attachment.fileSize}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reactions Summary */}
                          {post.reactions && post.reactions.length > 0 && (
                            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                              <div className="flex -space-x-1">
                                {post.reactions.slice(0, 3).map((reaction, idx) => (
                                  <div
                                    key={idx}
                                    className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white border border-white"
                                    title={reaction.userName}
                                  >
                                    ❤️
                                  </div>
                                ))}
                              </div>
                              <span>
                                {post.reactions.length} {post.reactions.length === 1 ? 'reaction' : 'reactions'}
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleReaction(post.postId, false)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-colors group"
                              >
                                <HeartIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">{post.reactions?.length || 0}</span>
                              </button>
                              <button
                                onClick={() => toggleComments(post.postId)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                              >
                                <ChatBubbleOvalLeftIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                              </button>
                            </div>
                          </div>

                          {/* Comments Section */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              {/* Existing Comments */}
                              {post.comments && post.comments.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  {post.comments.map(comment => (
                                    <div key={comment.commentId} className="flex items-start space-x-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                        {comment.authorName.charAt(0)}
                                      </div>
                                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-gray-900">{comment.authorName}</p>
                                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                        <p className="text-xs text-gray-400 mt-1">{getRelativeTime(comment.createdAt)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Comment Input */}
                              <div className="flex items-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                  U
                                </div>
                                <div className="flex-1 flex items-end space-x-2">
                                  <input
                                    type="text"
                                    value={commentInputs[post.postId] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handleAddComment(post.postId);
                                      }
                                    }}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                  />
                                  <button
                                    onClick={() => handleAddComment(post.postId)}
                                    className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full text-white hover:shadow-lg transition-shadow"
                                  >
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="card-body space-y-2">
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="btn btn-secondary w-full justify-start"
                  >
                    <MegaphoneIcon className="h-5 w-5 mr-2" />
                    Create Post
                  </button>
                  <button className="btn btn-secondary w-full justify-start">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Share Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Message
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-12 text-center">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No conversations yet</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="btn btn-primary mt-4"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map(conv => {
                    const otherParticipant = conv.participants.find(p => p.userId !== 'current');
                    return (
                      <div
                        key={conv.conversationId}
                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/chat/${conv.conversationId}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
                                {conv.name.charAt(0)}
                              </div>
                              {conv.type === 'one_on_one' && otherParticipant?.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{conv.name}</p>
                              {conv.type === 'group' && (
                                <span className="badge badge-gray text-xs">Group</span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conv.lastMessage.senderName}: {conv.lastMessage.content}
                              </p>
                            )}
                          </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500">{getRelativeTime(conv.lastMessage.createdAt)}</p>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="badge badge-danger text-xs mt-1">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Groups</h2>
                <button
                  onClick={() => navigate('/groups')}
                  className="btn btn-primary btn-sm"
                >
                  Manage All Groups
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="p-12 text-center">
                  <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You're not in any groups yet</p>
                  <button
                    onClick={() => navigate('/groups')}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create a Group
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {groups.map((group) => {
                    const getGroupTypeIcon = (type: string) => {
                      switch (type) {
                        case 'department':
                          return (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          );
                        case 'project':
                          return (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                          );
                        case 'interest':
                          return (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          );
                        case 'team':
                          return (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          );
                        default:
                          return (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                              <UserGroupIcon className="h-7 w-7 text-white" />
                            </div>
                          );
                      }
                    };

                    const getGroupTypeColor = (type: string) => {
                      const colors: Record<string, string> = {
                        department: 'bg-blue-100 text-blue-800',
                        project: 'bg-purple-100 text-purple-800',
                        interest: 'bg-pink-100 text-pink-800',
                        team: 'bg-green-100 text-green-800',
                      };
                      return colors[type] || 'bg-gray-100 text-gray-800';
                    };

                    return (
                      <div
                        key={group.groupId}
                        onClick={() => navigate('/groups')}
                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {getGroupTypeIcon(group.type || 'team')}
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(group.type || 'team')}`}>
                                  {group.type || 'team'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {groups.length > 0 && (
              <div className="card-footer">
                <button
                  onClick={() => navigate('/groups')}
                  className="btn btn-outline-primary w-full"
                >
                  View All Groups
                </button>
              </div>
            )}
          </div>
        )}

        {/* Helpdesk Tab */}
        {activeTab === 'helpdesk' && (
          <div className="card">
            <div className="card-body p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center">
                  <TicketIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets yet</p>
                  <button
                    onClick={() => setShowTicketModal(true)}
                    className="btn btn-primary mt-4"
                  >
                    Create a Ticket
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.ticketId}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ticket/${ticket.ticketId}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                            <span className={`badge ${getStatusColor(ticket.status)} text-xs`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900">{ticket.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className={`text-xs font-medium ${getPriorityColor(ticket.priority)} uppercase`}>
                            {ticket.priority}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{getRelativeTime(ticket.createdAt)}</p>
                        </div>
                      </div>
                      {ticket.assignedToName && (
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Assigned to: {ticket.assignedToName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowPostModal(false)} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Create Post</h2>
                  <button onClick={() => setShowPostModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreatePost} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as 'announcement' | 'discussion' | 'question' | 'poll')}
                      className="input w-full"
                    >
                      <option value="discussion">Discussion</option>
                      <option value="announcement">Announcement</option>
                      <option value="question">Question</option>
                      <option value="poll">Poll</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Give your post a title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={6}
                      required
                      className="input w-full"
                      placeholder="Share something with your team..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => {
                    setShowPostModal(false);
                    setPostTitle('');
                    setPostContent('');
                  }} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowTicketModal(false)} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Create HR Ticket</h2>
                  <button onClick={() => setShowTicketModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateTicket} className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={ticketFormData.category}
                        onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value as HRTicket['category'] })}
                        className="input w-full"
                      >
                        <option value="general">General</option>
                        <option value="leave">Leave</option>
                        <option value="payroll">Payroll</option>
                        <option value="benefits">Benefits</option>
                        <option value="policy">Policy</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="exit">Exit</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={ticketFormData.priority}
                        onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value as HRTicket['priority'] })}
                        className="input w-full"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={ticketFormData.title}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                      required
                      className="input w-full"
                      placeholder="Brief summary of your issue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={ticketFormData.description}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                      rows={5}
                      required
                      className="input w-full"
                      placeholder="Provide detailed information about your request or issue"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowTicketModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowNewChatModal(false)} />
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">New Message</h2>
                  <button onClick={() => setShowNewChatModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search for people</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="input w-full pl-10"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Suggested contacts</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {[
                      { id: '1', name: 'Sarah Williams', role: 'HR Manager', email: 'sarah.w@company.com', online: true },
                      { id: '2', name: 'John Smith', role: 'Engineering Lead', email: 'john.s@company.com', online: false },
                      { id: '3', name: 'Emma Johnson', role: 'Product Manager', email: 'emma.j@company.com', online: true },
                      { id: '4', name: 'Michael Brown', role: 'Sales Director', email: 'michael.b@company.com', online: false },
                      { id: '5', name: 'Lisa Davis', role: 'Marketing Manager', email: 'lisa.d@company.com', online: true },
                    ].map((contact) => (
                      <button
                        key={contact.id}
                        onClick={async () => {
                          try {
                            const newConv = await chatService.createConversation({
                              conversationType: 'direct',
                              name: contact.name,
                              participantIds: ['current', contact.id],
                            });
                            setShowNewChatModal(false);
                            navigate(`/chat/${newConv.conversationId}`);
                          } catch (error) {
                            console.error('Error creating conversation:', error);
                          }
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {contact.name.charAt(0)}
                          </div>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.role}</p>
                        </div>
                        {contact.online && (
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate('/groups')}
                    className="btn btn-primary"
                  >
                    Create Group Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
