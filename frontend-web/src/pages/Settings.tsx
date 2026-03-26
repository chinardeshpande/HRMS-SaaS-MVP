import { useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  CogIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import SubscriptionTab from '../components/settings/SubscriptionTab';
import OrganizationTab from '../components/settings/OrganizationTab';
import PaymentsTab from '../components/settings/PaymentsTab';
import UsersTab from '../components/settings/UsersTab';
import RolesPermissionsTab from '../components/settings/RolesPermissionsTab';
import BusinessRulesTab from '../components/settings/BusinessRulesTab';

type SettingsTab = 'subscription' | 'organization' | 'payments' | 'users' | 'roles' | 'business-rules';

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');

  const tabs = [
    {
      id: 'subscription' as SettingsTab,
      name: 'Subscription',
      icon: CreditCardIcon,
      description: 'Manage your plan and billing',
    },
    {
      id: 'organization' as SettingsTab,
      name: 'Organization',
      icon: BuildingOfficeIcon,
      description: 'Company details and settings',
    },
    {
      id: 'payments' as SettingsTab,
      name: 'Payments',
      icon: CreditCardIcon,
      description: 'Payment history and invoices',
    },
    {
      id: 'users' as SettingsTab,
      name: 'Users',
      icon: UserGroupIcon,
      description: 'Manage users and access',
    },
    {
      id: 'roles' as SettingsTab,
      name: 'Roles & Permissions',
      icon: ShieldCheckIcon,
      description: 'Configure roles and permissions',
    },
    {
      id: 'business-rules' as SettingsTab,
      name: 'Business Rules',
      icon: DocumentTextIcon,
      description: 'HR policies and workflows',
    },
  ];

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
              {activeTab === 'subscription' && <SubscriptionTab />}
              {activeTab === 'organization' && <OrganizationTab />}
              {activeTab === 'payments' && <PaymentsTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'roles' && <RolesPermissionsTab />}
              {activeTab === 'business-rules' && <BusinessRulesTab />}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

export default function Settings() {
  return (
    <ErrorBoundary>
      <SettingsContent />
    </ErrorBoundary>
  );
}
