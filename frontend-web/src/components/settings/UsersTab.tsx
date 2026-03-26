import { useState, useEffect } from 'react';
import settingsService, { User, Role } from '../../services/settingsService';
import api from '../../services/api';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    departmentId: '',
    designationId: '',
    roleId: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, roleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        settingsService.getAllUsers({
          status: statusFilter === 'all' ? undefined : statusFilter,
          roleId: roleFilter === 'all' ? undefined : roleFilter,
        }),
        settingsService.getAllRoles(),
      ]);
      setUsers(usersData.users);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setActionLoading(true);
    try {
      await settingsService.assignRoleToUser(selectedUser.employeeId, selectedRole);
      await loadData();
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole('');
      alert('Role assigned successfully!');
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateUser = async (user: User) => {
    if (!confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}?`)) return;

    setActionLoading(true);
    try {
      await settingsService.deactivateUser(user.employeeId);
      await loadData();
      alert('User deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (user: User) => {
    if (!confirm(`Are you sure you want to reactivate ${user.firstName} ${user.lastName}?`)) return;

    setActionLoading(true);
    try {
      await settingsService.reactivateUser(user.employeeId);
      await loadData();
      alert('User reactivated successfully!');
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      employeeCode: user.employeeCode,
      departmentId: user.department?.departmentId || '',
      designationId: user.designation?.designationId || '',
      roleId: user.roleId || '',
      dateOfJoining: user.dateOfJoining,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.email) {
      alert('First name, last name, and email are required');
      return;
    }

    setActionLoading(true);
    try {
      if (editingUser) {
        // Update user via employee API
        await api.put(`/employees/${editingUser.employeeId}`, userFormData);
        alert('User updated successfully!');
      } else {
        // Create new user via employee API
        await api.post('/employees', userFormData);
        alert('User created successfully!');
      }
      await loadData();
      setShowUserModal(false);
      setEditingUser(null);
      setUserFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeCode: '',
        departmentId: '',
        designationId: '',
        roleId: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.employeeCode.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      exited: { color: 'bg-red-100 text-red-800', text: 'Exited' },
    };
    const badge = badges[status] || badges.active;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingUser(null);
              setUserFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                employeeCode: '',
                departmentId: '',
                designationId: '',
                roleId: '',
                dateOfJoining: new Date().toISOString().split('T')[0],
              });
              setShowUserModal(true);
            }}
            className="btn btn-primary flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Roles</option>
          {roles.map((role) => (
            <option key={role.roleId} value={role.roleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Inactive Users</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {users.filter((u) => u.status === 'inactive').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Roles</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{roles.length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserPlusIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.employeeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.employeeCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.department?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.role?.roleName || 'No Role'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(user.roleId || '');
                              setShowRoleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Assign Role"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivateUser(user)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-900"
                              title="Deactivate"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateUser(user)}
                              disabled={actionLoading}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivate"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRoleModal(false)} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Assign Role</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Assign a role to {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button onClick={() => setShowRoleModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleAssignRole} disabled={actionLoading} className="btn btn-primary">
                    {actionLoading ? 'Assigning...' : 'Assign Role'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowUserModal(false)} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={userFormData.firstName}
                      onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={userFormData.lastName}
                      onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code *</label>
                    <input
                      type="text"
                      value={userFormData.employeeCode}
                      onChange={(e) => setUserFormData({ ...userFormData, employeeCode: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
                    <input
                      type="date"
                      value={userFormData.dateOfJoining}
                      onChange={(e) => setUserFormData({ ...userFormData, dateOfJoining: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={userFormData.roleId}
                      onChange={(e) => setUserFormData({ ...userFormData, roleId: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
                <button onClick={() => setShowUserModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveUser} disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
