import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  CogIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import SubscriptionTab from '../components/settings/SubscriptionTab';
import OrganizationTab from '../components/settings/OrganizationTab';
import PaymentsTab from '../components/settings/PaymentsTab';
import UserManagementTab from '../components/settings/UserManagementTab';
import BusinessRulesTab from '../components/settings/BusinessRulesTab';
import EmployeeSettingsTab from '../components/settings/EmployeeSettingsTab';
import BiometricAttendanceTab from '../components/settings/BiometricAttendanceTab';

type SettingsTab =
  | 'employee-preferences'
  | 'subscription'
  | 'organization'
  | 'payments'
  | 'user-management'
  | 'business-rules'
  | 'attendance-import';

function ModernSettingsContent() {
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'HR_ADMIN' || userRole === 'SYSTEM_ADMIN';
  const isSystemAdmin = userRole === 'SYSTEM_ADMIN';

  // Default tab based on role
  const getDefaultTab = (): SettingsTab => {
    return isSystemAdmin ? 'subscription' : 'user-management';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getDefaultTab());

  // Update default tab when user changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [userRole]);

  if (!isAdmin) {
    return (
      <ModernLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <CogIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Administrative workspace controls</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CogIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Settings are available to HR administrators</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
              Organization, billing, user management, and policy settings require HR administrator access.
              Your personal HR actions remain available from the main workspace modules.
            </p>
            <div className="mt-6">
              <Link to="/dashboard" className="btn btn-primary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  // Define all possible tabs with roles
  const allTabs = [
    {
      id: 'employee-preferences' as SettingsTab,
      name: 'My Preferences',
      icon: UserCircleIcon,
      description: 'Personal settings and notifications',
      roles: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'subscription' as SettingsTab,
      name: 'Subscription',
      icon: CreditCardIcon,
      description: 'Manage your plan and billing',
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'organization' as SettingsTab,
      name: 'Organization',
      icon: BuildingOfficeIcon,
      description: 'Company details and settings',
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'payments' as SettingsTab,
      name: 'Payments',
      icon: CreditCardIcon,
      description: 'Payment history and invoices',
      roles: [UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'user-management' as SettingsTab,
      name: 'User Management',
      icon: UserGroupIcon,
      description: 'Users, invitations, and permissions',
      roles: [UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'business-rules' as SettingsTab,
      name: 'Business Rules',
      icon: DocumentTextIcon,
      description: 'HR policies and workflows',
      roles: [UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN],
    },
    {
      id: 'attendance-import' as SettingsTab,
      name: 'Attendance Import',
      icon: DocumentTextIcon,
      description: 'Configure biometric file mappings',
      roles: [UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN],
    },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter((tab) => {
    if (!tab.roles) return true;
    const userRoleUpper = String(user?.role).toUpperCase();
    return tab.roles.some((role) => String(role).toUpperCase() === userRoleUpper);
  });

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your account and application settings</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <ErrorBoundary>
              {activeTab === 'employee-preferences' && <EmployeeSettingsTab />}
              {activeTab === 'subscription' && <SubscriptionTab />}
              {activeTab === 'organization' && <OrganizationTab />}
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'user-management' && <UserManagementTab />}
              {activeTab === 'business-rules' && <BusinessRulesTab />}
              {activeTab === 'attendance-import' && <BiometricAttendanceTab />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

export default function ModernSettings() {
  return (
    <ErrorBoundary>
      <ModernSettingsContent />
    </ErrorBoundary>
  );
}
