import { useState, useEffect } from 'react';
import settingsService, { Role, Permission } from '../../services/settingsService';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function RolesPermissionsTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    roleName: '',
    description: '',
    level: 0,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        settingsService.getAllRoles(),
        settingsService.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleFormData.roleName) {
      alert('Role name is required');
      return;
    }

    setActionLoading(true);
    try {
      await settingsService.createRole(roleFormData);
      await loadData();
      setShowRoleModal(false);
      setRoleFormData({ roleName: '', description: '', level: 0 });
      alert('Role created successfully!');
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Failed to create role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setActionLoading(true);
    try {
      await settingsService.updateRole(selectedRole.roleId, roleFormData);
      await loadData();
      setShowRoleModal(false);
      setSelectedRole(null);
      setRoleFormData({ roleName: '', description: '', level: 0 });
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystemRole) {
      alert('Cannot delete system role');
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.roleName}"?`)) return;

    setActionLoading(true);
    try {
      await settingsService.deleteRole(role.roleId);
      await loadData();
      alert('Role deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(error.message || 'Failed to delete role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole) return;

    setActionLoading(true);
    try {
      await settingsService.assignPermissionsToRole(selectedRole.roleId, selectedPermissions);
      await loadData();
      setShowPermissionModal(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
      alert('Permissions assigned successfully!');
    } catch (error) {
      console.error('Error assigning permissions:', error);
      alert('Failed to assign permissions');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      roleName: role.roleName,
      description: role.description || '',
      level: role.level,
    });
    setShowRoleModal(true);
  };

  const openPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.permissionId) || []);
    setShowPermissionModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Roles & Permissions</h3>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => {
            setSelectedRole(null);
            setRoleFormData({ roleName: '', description: '', level: 0 });
            setShowRoleModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.roleId}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{role.roleName}</h4>
                    {role.isSystemRole && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        System
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditRole(role)}
                    className="p-1 text-gray-400 hover:text-purple-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!role.isSystemRole && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      disabled={actionLoading}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Level: {role.level}</span>
                <span>{role.employeeCount} users</span>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  {role.permissions?.length || 0} permissions assigned
                </p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 3).map((permission) => (
                    <span
                      key={permission.permissionId}
                      className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded"
                    >
                      {permission.action}
                    </span>
                  ))}
                  {role.permissions && role.permissions.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => openPermissionsModal(role)}
                className="btn btn-secondary w-full text-sm"
              >
                Manage Permissions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRoleModal(false)} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedRole ? 'Edit Role' : 'Create New Role'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={roleFormData.roleName}
                    onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    rows={3}
                    className="input w-full"
                    placeholder="Brief description of this role..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hierarchy Level
                  </label>
                  <input
                    type="number"
                    value={roleFormData.level}
                    onChange={(e) => setRoleFormData({ ...roleFormData, level: parseInt(e.target.value) })}
                    min="0"
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher level = more privileges</p>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button onClick={() => setShowRoleModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={selectedRole ? handleUpdateRole : handleCreateRole}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Saving...' : selectedRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowPermissionModal(false)} />
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  Manage Permissions - {selectedRole.roleName}
                </h2>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                    <div key={module} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                        {module.replace(/_/g, ' ')}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {modulePermissions.map((permission) => (
                          <label
                            key={permission.permissionId}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.permissionId)}
                              onChange={() => togglePermission(permission.permissionId)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{permission.permissionName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedPermissions.length} of {permissions.length} permissions selected
                </p>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setShowPermissionModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignPermissions}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
