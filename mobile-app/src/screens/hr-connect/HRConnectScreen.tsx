import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuthStore } from '../../context/useAuthStore';
import { endpoints } from '../../api/endpoints';
import { CommonCard } from '../../components/CommonCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { HRPost, Group, Comment } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppTabParamList } from '../../navigation/types';
import { CreatePostModal } from './CreatePostModal';
import { HRConnectChats } from './HRConnectChats';

export const HRConnectScreen: React.FC = () => {
  const { user } = useAuthStore();
  const route = useRoute<RouteProp<AppTabParamList, 'HRConnect'>>();
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'chats'>('feed');

  useEffect(() => {
    if (route?.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route?.params?.activeTab]);
  const [posts, setPosts] = useState<HRPost[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isComposerVisible, setIsComposerVisible] = useState(false);

  // Comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Check if user has manager/admin compose permission
  const canCompose =
    user?.role === 'manager' ||
    user?.role === 'hr_admin' ||
    user?.role === 'system_admin';

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPosts(), fetchGroups()]);
    } catch (err) {
      console.warn('⚠️ HR Connect loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPosts(), fetchGroups()]);
    } catch (err) {
      console.warn('⚠️ HR Connect refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPosts = async () => {
    const res = await endpoints.hrConnect.posts().catch(() => null);
    if (res?.success && res.data) {
      setPosts(res.data);
    }
  };

  const fetchGroups = async () => {
    const res = await endpoints.hrConnect.groups().catch(() => null);
    if (res?.success && res.data) {
      setGroups(res.data);
    }
  };

  // Create Post
  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    postType: any;
    visibility: any;
    groupId?: string;
  }) => {
    if (!user) return false;
    const payload = {
      ...postData,
      authorId: user.employeeId || user.userId,
      authorName: user.fullName,
      authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0A66C2&color=fff`,
      authorDepartment: user.role === 'manager' ? 'Management' : 'Operations',
      authorDesignation: user.role === 'manager' ? 'Manager' : 'Staff'
    };

    const res = await endpoints.hrConnect.createPost(payload).catch(() => null);
    if (res?.success && res.data) {
      // Prepend to posts list for instant local feedback
      setPosts((prev) => [res.data, ...prev]);
      return true;
    }
    return false;
  };

  // Delete Post
  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await endpoints.hrConnect.deletePost(postId).catch(() => null);
            if (res?.success) {
              setPosts((prev) => prev.filter((p) => p.postId !== postId));
            }
          }
        }
      ]
    );
  };

  // Reactions
  const handleToggleReaction = async (postId: string, type: 'like' | 'love' | 'celebrate' | 'insightful') => {
    if (!user) return;
    const post = posts.find((p) => p.postId === postId);
    if (!post) return;

    const existingReaction = post.reactions?.find((r) => r.userId === 'e-current');
    const isSameType = existingReaction?.reactionType === type;

    if (existingReaction && isSameType) {
      // Remove reaction
      setPosts((prev) =>
        prev.map((p) => {
          if (p.postId === postId) {
            return {
              ...p,
              reactions: p.reactions?.filter((r) => r.userId !== 'e-current')
            };
          }
          return p;
        })
      );
      await endpoints.hrConnect.removeReaction(postId).catch(() => null);
    } else {
      // Add or change reaction
      const newReaction = {
        reactionId: `r-local-${Date.now()}`,
        userId: 'e-current',
        userName: user.fullName,
        reactionType: type,
        createdAt: new Date().toISOString()
      };

      setPosts((prev) =>
        prev.map((p) => {
          if (p.postId === postId) {
            const cleaned = p.reactions?.filter((r) => r.userId !== 'e-current') || [];
            return {
              ...p,
              reactions: [...cleaned, newReaction]
            };
          }
          return p;
        })
      );
      await endpoints.hrConnect.addReaction(postId, type, user.fullName).catch(() => null);
    }
  };

  // Comments
  const handleOpenComments = async (postId: string) => {
    setActiveCommentPostId(postId);
    setCommentLoading(true);
    try {
      const res = await endpoints.hrConnect.comments(postId).catch(() => null);
      if (res?.success && res.data) {
        setCommentsList(res.data);
      }
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !activeCommentPostId || !user) return;
    const content = newCommentText.trim();
    setNewCommentText('');
    
    // Add locally for instant visual feedback
    const tempComment: Comment = {
      commentId: `c-local-${Date.now()}`,
      postId: activeCommentPostId,
      authorId: 'e-current',
      authorName: user.fullName,
      content,
      createdAt: new Date().toISOString()
    };
    
    setCommentsList((prev) => [...prev, tempComment]);
    // Also increment comment count on target post
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === activeCommentPostId) {
          return {
            ...p,
            comments: [...(p.comments || []), tempComment]
          };
        }
        return p;
      })
    );

    const res = await endpoints.hrConnect.addComment(activeCommentPostId, content, user.fullName).catch(() => null);
    if (res?.success && res.data) {
      // Replace local temp comment with real backend comment if needed, but since mock works, we keep it simple
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!activeCommentPostId) return;
    Alert.alert('Delete Comment', 'Delete this comment permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setCommentsList((prev) => prev.filter((c) => c.commentId !== commentId));
          setPosts((prev) =>
            prev.map((p) => {
              if (p.postId === activeCommentPostId) {
                return {
                  ...p,
                  comments: p.comments?.filter((c) => c.commentId !== commentId)
                };
              }
              return p;
            })
          );
          await endpoints.hrConnect.deleteComment(commentId, activeCommentPostId).catch(() => null);
        }
      }
    ]);
  };

  // Group Joining / Leaving
  const handleToggleGroupMembership = async (groupId: string, isMember: boolean) => {
    // Optimistic UI updates
    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId === groupId) {
          const delta = isMember ? -1 : 1;
          const memberList = isMember
            ? g.members?.filter((m) => m.userId !== 'e-current') || []
            : [
                ...(g.members || []),
                { userId: 'e-current', userName: user?.fullName || 'Me', role: 'member' as const, joinedAt: new Date().toISOString() }
              ];
          return {
            ...g,
            memberCount: Math.max(0, g.memberCount + delta),
            members: memberList
          };
        }
        return g;
      })
    );

    if (isMember) {
      await endpoints.hrConnect.leaveGroup(groupId).catch(() => null);
    } else {
      await endpoints.hrConnect.joinGroup(groupId).catch(() => null);
    }
  };

  // Helper for reaction types
  const getReactionCount = (post: HRPost, type: 'like' | 'love' | 'celebrate' | 'insightful') => {
    return post.reactions?.filter((r) => r.reactionType === type).length || 0;
  };

  const hasReacted = (post: HRPost, type: 'like' | 'love' | 'celebrate' | 'insightful') => {
    return post.reactions?.some((r) => r.userId === 'e-current' && r.reactionType === type) || false;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'feed' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('feed');
            setActiveCommentPostId(null);
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="forum-outline"
            size={18}
            color={activeTab === 'feed' ? '#0A66C2' : '#6b7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Social Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('groups');
            setActiveCommentPostId(null);
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-group-outline"
            size={18}
            color={activeTab === 'groups' ? '#0A66C2' : '#6b7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups & Hubs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chats' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('chats');
            setActiveCommentPostId(null);
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={18}
            color={activeTab === 'chats' ? '#0A66C2' : '#6b7280'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>Direct Chats</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A66C2" />
          <Text style={styles.loadingText}>Connecting to AuroraHR...</Text>
        </View>
      ) : activeTab === 'feed' ? (
        <View style={styles.contentWrapper}>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.postId}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A66C2']} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="comment-multiple-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No feed activity yet. Be the first to start a conversation!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const group = groups.find((g) => g.groupId === item.groupId);
              const postAuthorId = item.authorId || (item as any).employeeId;
              const isOwnPost = postAuthorId === user?.employeeId || postAuthorId === 'e-current';

              return (
                <CommonCard style={styles.postCard}>
                  {/* Post Header */}
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: item.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.authorName)}&background=f3f4f6&color=0A66C2` }}
                      style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{item.authorName}</Text>
                      <Text style={styles.authorRole}>
                        {item.authorDesignation || 'Team Member'}
                        {item.authorDepartment ? ` • ${item.authorDepartment}` : ''}
                      </Text>
                    </View>
                    <View style={styles.postHeaderRight}>
                      {item.isPinned && (
                        <MaterialCommunityIcons name="pin" size={16} color="#f59e0b" style={styles.pinIcon} />
                      )}
                      {isOwnPost && (
                        <TouchableOpacity onPress={() => handleDeletePost(item.postId)}>
                          <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Group Tag / Post Type badge */}
                  <View style={styles.tagContainer}>
                    <StatusBadge status={item.postType} style={styles.typeBadge} />
                    {group && (
                      <Text style={styles.groupTagText}>
                        in <Text style={styles.boldGroup}>#{group.name}</Text>
                      </Text>
                    )}
                    <Text style={styles.postTime}>{formatDate(item.createdAt, 'MMM dd • h:mm a')}</Text>
                  </View>

                  {/* Body Title & Content */}
                  {item.title ? <Text style={styles.postTitle}>{item.title}</Text> : null}
                  <Text style={styles.postContent}>{item.content}</Text>

                  {/* Border separator */}
                  <View style={styles.cardSeparator} />

                  {/* Reactions Action Bar */}
                  <View style={styles.actionBar}>
                    <View style={styles.reactionsSection}>
                      <TouchableOpacity
                        style={[styles.reactionBtn, hasReacted(item, 'like') && styles.reactionBtnActive]}
                        onPress={() => handleToggleReaction(item.postId, 'like')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>👍</Text>
                        <Text style={[styles.reactionCount, hasReacted(item, 'like') && styles.reactionCountActive]}>
                          {getReactionCount(item, 'like')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.reactionBtn, hasReacted(item, 'love') && styles.reactionBtnActive]}
                        onPress={() => handleToggleReaction(item.postId, 'love')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>❤️</Text>
                        <Text style={[styles.reactionCount, hasReacted(item, 'love') && styles.reactionCountActive]}>
                          {getReactionCount(item, 'love')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.reactionBtn, hasReacted(item, 'celebrate') && styles.reactionBtnActive]}
                        onPress={() => handleToggleReaction(item.postId, 'celebrate')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>🏆</Text>
                        <Text style={[styles.reactionCount, hasReacted(item, 'celebrate') && styles.reactionCountActive]}>
                          {getReactionCount(item, 'celebrate')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Comments Toggle */}
                    <TouchableOpacity
                      style={styles.commentBtn}
                      onPress={() => handleOpenComments(item.postId)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="comment-text-outline" size={16} color="#6b7280" />
                      <Text style={styles.commentBtnText}>
                        {(item.comments?.length || 0) > 0
                          ? `${item.comments?.length} Comments`
                          : 'Comment'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </CommonCard>
              );
            }}
          />

          {/* Inline Comments Sheet (renders directly under flatlist overlay when a post comments are active) */}
          {activeCommentPostId && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              style={styles.commentsOverlay}
            >
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsHeaderTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setActiveCommentPostId(null)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {commentLoading ? (
                <ActivityIndicator size="small" color="#0A66C2" style={styles.commentSpinner} />
              ) : (
                <FlatList
                  data={commentsList}
                  keyExtractor={(c) => c.commentId}
                  contentContainerStyle={styles.commentsListContent}
                  ListEmptyComponent={
                    <Text style={styles.emptyCommentsText}>Be the first to add a comment!</Text>
                  }
                  renderItem={({ item }) => {
                    const isOwnComment = item.authorId === 'e-current' || item.authorName === user?.fullName;
                    return (
                      <View style={styles.commentItem}>
                        <Image
                          source={{ uri: item.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.authorName)}&background=e5e7eb&color=0A66C2` }}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentBubble}>
                          <View style={styles.commentAuthorRow}>
                            <Text style={styles.commentAuthorName}>{item.authorName}</Text>
                            <Text style={styles.commentTime}>{formatDate(item.createdAt, 'h:mm a')}</Text>
                          </View>
                          <Text style={styles.commentText}>{item.content}</Text>
                        </View>
                        {isOwnComment && (
                          <TouchableOpacity 
                            onPress={() => handleDeleteComment(item.commentId)}
                            style={styles.deleteCommentBtn}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              )}

              {/* Compose Comment Input */}
              <View style={styles.commentComposer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#9ca3af"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  maxLength={200}
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, !newCommentText.trim() && styles.commentSendBtnDisabled]}
                  onPress={handleAddComment}
                  disabled={!newCommentText.trim()}
                >
                  <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* Floating Action Button for HR/Admin Compose */}
          {canCompose && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setIsComposerVisible(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      ) : activeTab === 'groups' ? (
        /* GROUPS TAB CONTENT */
        <FlatList
          data={groups}
          keyExtractor={(item) => item.groupId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A66C2']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isMember = item.members?.some((m) => m.userId === 'e-current') || false;
            return (
              <CommonCard style={styles.groupCard}>
                <View style={styles.groupHeaderRow}>
                  <View style={styles.groupAvatarContainer}>
                    <MaterialCommunityIcons
                      name={item.groupType === 'department' ? 'office-building' : item.groupType === 'social' ? 'heart-pulse' : 'pound'}
                      size={24}
                      color="#0A66C2"
                    />
                  </View>
                  <View style={styles.groupMainInfo}>
                    <Text style={styles.groupName}>#{item.name}</Text>
                    <View style={styles.groupStatsRow}>
                      <StatusBadge status={item.groupType} style={styles.groupTypeBadge} />
                      <Text style={styles.memberCountText}>{item.memberCount} Members</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.joinBtn,
                      isMember && styles.leaveBtn
                    ]}
                    onPress={() => handleToggleGroupMembership(item.groupId, isMember)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.joinBtnText, isMember && styles.leaveBtnText]}>
                      {isMember ? 'Joined' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text style={styles.groupDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </CommonCard>
            );
          }}
        />
      ) : (
        <HRConnectChats />
      )}

      {/* Compose Modal */}
      <CreatePostModal
        visible={isComposerVisible}
        onClose={() => setIsComposerVisible(false)}
        onSubmit={handleCreatePost}
        groups={groups}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 48,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0A66C2',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#0A66C2',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  postCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  authorRole: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinIcon: {
    marginRight: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 6,
  },
  typeBadge: {
    paddingVertical: 1.5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  groupTagText: {
    fontSize: 11,
    color: '#4b5563',
  },
  boldGroup: {
    fontWeight: '700',
    color: '#0A66C2',
  },
  postTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  reactionBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  reactionCountActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  commentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#0A66C2',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  /* COMMENTS SHEET STYLES */
  commentsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    paddingTop: 14,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  commentSpinner: {
    marginVertical: 20,
  },
  commentsListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyCommentsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  commentTime: {
    fontSize: 9,
    color: '#9ca3af',
  },
  commentText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  deleteCommentBtn: {
    padding: 6,
    marginLeft: 4,
    alignSelf: 'center',
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 38,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  commentSendBtn: {
    marginLeft: 10,
    backgroundColor: '#0A66C2',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: '#d1d5db',
  },

  /* GROUPS TAB STYLES */
  groupCard: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 102, 194, 0.1)',
  },
  groupMainInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  groupStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  groupTypeBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  memberCountText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#0A66C2',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  leaveBtn: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  leaveBtnText: {
    color: '#4b5563',
  },
  groupDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 10,
    lineHeight: 16,
  },
});
