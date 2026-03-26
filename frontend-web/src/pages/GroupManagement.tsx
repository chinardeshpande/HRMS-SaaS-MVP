import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import hrConnectService, { Group, GroupMember } from '../services/hrConnectService';
import chatService from '../services/chatService';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UsersIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface GroupMemberWithActions extends GroupMember {
  canRemove: boolean;
  canPromote: boolean;
}

export default function GroupManagement() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupType, setGroupType] = useState<'department' | 'project' | 'topic' | 'social'>('project');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await hrConnectService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGroup = await hrConnectService.createGroup({
        name: groupName,
        description: groupDescription,
        groupType,
      });
      setGroups([...groups, newGroup]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const updatedGroup = await hrConnectService.updateGroup(selectedGroup.groupId, {
        name: groupName,
        description: groupDescription,
      });
      setGroups(groups.map(g => g.groupId === updatedGroup.groupId ? updatedGroup : g));
      setSelectedGroup(updatedGroup);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await hrConnectService.deleteGroup(groupId);
      setGroups(groups.filter(g => g.groupId !== groupId));
      if (selectedGroup?.groupId === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;

    try {
      // In a real app, this would call the API
      const newMembers: GroupMember[] = selectedUsers.map(userId => {
        const user = availableUsers.find(u => u.userId === userId);
        return {
          userId: user.userId,
          userName: user.userName,
          userEmail: user.email,
          role: 'member',
          joinedAt: new Date().toISOString(),
        };
      });

      const updatedGroup = {
        ...selectedGroup,
        members: [...selectedGroup.members, ...newMembers],
        memberCount: selectedGroup.memberCount + newMembers.length,
      };

      setSelectedGroup(updatedGroup);
      setGroups(groups.map(g => g.groupId === updatedGroup.groupId ? updatedGroup : g));
      setShowAddMemberModal(false);
      setSelectedUsers([]);
      setSearchMemberQuery('');
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const updatedGroup = {
        ...selectedGroup,
        members: selectedGroup.members.filter(m => m.userId !== userId),
        memberCount: selectedGroup.memberCount - 1,
      };

      setSelectedGroup(updatedGroup);
      setGroups(groups.map(g => g.groupId === updatedGroup.groupId ? updatedGroup : g));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const updatedGroup = {
        ...selectedGroup,
        members: selectedGroup.members.map(m =>
          m.userId === userId ? { ...m, role: 'admin' as const } : m
        ),
      };

      setSelectedGroup(updatedGroup);
      setGroups(groups.map(g => g.groupId === updatedGroup.groupId ? updatedGroup : g));
    } catch (error) {
      console.error('Error promoting member:', error);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = () => {
    if (!selectedGroup) return;
    setGroupName(selectedGroup.name);
    setGroupDescription(selectedGroup.description || '');
    setShowEditModal(true);
  };

  const openAddMemberModal = async () => {
    // Fetch available users from chat service
    const users = await chatService.searchUsers('');
    // Filter out existing members
    const existingUserIds = selectedGroup?.members.map(m => m.userId) || [];
    setAvailableUsers(users.filter(u => !existingUserIds.includes(u.userId)));
    setShowAddMemberModal(true);
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupType('project');
  };

  const startGroupChat = async (group: Group) => {
    try {
      console.log('Starting group chat for:', group);
      console.log('Group members:', group.members);

      // Check if members are loaded
      if (!group.members || group.members.length === 0) {
        alert('This group has no members. Please add members first.');
        return;
      }

      // Extract participant IDs - handle both userId and employeeId
      const participantIds = group.members.map(m => {
        const id = (m as any).employeeId || m.userId;
        console.log('Member ID:', id, 'from member:', m);
        return id;
      }).filter(id => id); // Filter out any undefined values

      console.log('Participant IDs:', participantIds);

      if (participantIds.length === 0) {
        alert('Could not extract member IDs from group.');
        return;
      }

      // Create a conversation for this group if it doesn't exist
      const conversation = await chatService.createConversation({
        conversationType: 'group',
        name: group.name,
        description: group.description,
        participantIds,
      });

      console.log('Conversation created:', conversation);
      navigate(`/chat/${conversation.conversationId}`);
    } catch (error: any) {
      console.error('Error starting group chat:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to start group chat: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      department: 'bg-blue-100 text-blue-800',
      project: 'bg-purple-100 text-purple-800',
      topic: 'bg-green-100 text-green-800',
      social: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'department':
        return '🏢';
      case 'project':
        return '📋';
      case 'topic':
        return '💡';
      case 'social':
        return '🎉';
      default:
        return '👥';
    }
  };

  return (
    <ModernLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/hr-connect?tab=groups')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to HR Connect
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
            <p className="text-gray-600 mt-1">Manage teams, projects, and communities</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body">
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="input w-full pl-10"
                />
              </div>

              {/* Groups */}
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No groups found</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.groupId}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedGroup?.groupId === group.groupId
                          ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getGroupTypeIcon(group.groupType)}</span>
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {group.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{group.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(group.groupType)}`}>
                              {group.groupType}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <UsersIcon className="h-3 w-3 mr-1" />
                              {group.memberCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="card">
              {/* Group Header */}
              <div className="card-header bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getGroupTypeIcon(selectedGroup.groupType)}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h2>
                        <p className="text-sm text-gray-600">{selectedGroup.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGroupTypeColor(selectedGroup.groupType)}`}>
                        {selectedGroup.groupType}
                      </span>
                      <span className="text-sm text-gray-600">
                        {selectedGroup.memberCount} {selectedGroup.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        Created {new Date(selectedGroup.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startGroupChat(selectedGroup)}
                      className="btn btn-primary btn-sm"
                      title="Start group chat"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={openEditModal}
                      className="btn btn-secondary btn-sm"
                      title="Edit group"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(selectedGroup.groupId)}
                      className="btn btn-outline-danger btn-sm"
                      title="Delete group"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Members</h3>
                  <button onClick={openAddMemberModal} className="btn btn-primary btn-sm">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Add Member
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedGroup.members.map((member) => {
                    const isAdmin = member.role === 'admin';
                    const isCurrentUser = member.userId === 'current';
                    const canModify = !isCurrentUser && selectedGroup.createdBy === 'current';

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {member.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{member.userName}</p>
                              {isAdmin && (
                                <span className="flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                  Admin
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{member.userEmail}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {canModify && (
                          <div className="flex gap-2">
                            {!isAdmin && (
                              <button
                                onClick={() => handlePromoteMember(member.userId)}
                                className="btn btn-secondary btn-sm"
                                title="Make admin"
                              >
                                <ShieldCheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="btn btn-outline-danger btn-sm"
                              title="Remove member"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a group to view details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Create New Group</h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Engineering Team"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows={3}
                      className="input w-full"
                      placeholder="What's this group about?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Type *</label>
                    <select
                      value={groupType}
                      onChange={(e) => setGroupType(e.target.value as any)}
                      className="input w-full"
                    >
                      <option value="department">Department</option>
                      <option value="project">Project Team</option>
                      <option value="social">Social / Interest</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Edit Group</h2>
                  <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleEditGroup} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      rows={3}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowAddMemberModal(false)} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Members</h2>
                  <button onClick={() => setShowAddMemberModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Search */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchMemberQuery}
                    onChange={(e) => setSearchMemberQuery(e.target.value)}
                    placeholder="Search users..."
                    className="input w-full pl-10"
                  />
                </div>

                {/* User List */}
                <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                  {availableUsers
                    .filter(user =>
                      user.userName.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchMemberQuery.toLowerCase())
                    )
                    .map((user) => (
                      <label
                        key={user.userId}
                        className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.userId]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.userId));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {user.userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </label>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setSelectedUsers([]);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMembers}
                      disabled={selectedUsers.length === 0}
                      className="btn btn-primary"
                    >
                      Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
