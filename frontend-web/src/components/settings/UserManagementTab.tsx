import { useState } from 'react';
import {
  UserGroupIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import UsersTab from './UsersTab';
import InvitationsTab from './InvitationsTab';
import RolesPermissionsTab from './RolesPermissionsTab';

type UserManagementSubTab = 'users' | 'invitations' | 'roles';

export default function UserManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState<UserManagementSubTab>('users');

  const subTabs = [
    {
      id: 'users' as UserManagementSubTab,
      name: 'Users',
      icon: UserGroupIcon,
      description: 'Manage user accounts and access',
      count: null,
    },
    {
      id: 'invitations' as UserManagementSubTab,
      name: 'Invitations',
      icon: EnvelopeIcon,
      description: 'Send and track user invitations',
      count: null,
    },
    {
      id: 'roles' as UserManagementSubTab,
      name: 'Roles & Permissions',
      icon: ShieldCheckIcon,
      description: 'Configure roles and access levels',
      count: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage users, invitations, and role-based access control
        </p>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex overflow-x-auto">
            {subTabs.map((subTab) => {
              const Icon = subTab.icon;
              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeSubTab === subTab.id
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span>{subTab.name}</span>
                      {subTab.count !== null && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {subTab.count}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-normal hidden lg:block">
                      {subTab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-Tab Content */}
        <div className="p-6">
          {activeSubTab === 'users' && <UsersTab />}
          {activeSubTab === 'invitations' && <InvitationsTab />}
          {activeSubTab === 'roles' && <RolesPermissionsTab />}
        </div>
      </div>
    </div>
  );
}
