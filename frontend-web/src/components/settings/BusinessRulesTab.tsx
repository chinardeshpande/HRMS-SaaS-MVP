import { useState, useEffect } from 'react';
import settingsService, { BusinessRule } from '../../services/settingsService';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function BusinessRulesTab() {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null);
  type RuleFormData = {
    category: 'leave' | 'attendance' | 'payroll' | 'performance' | 'onboarding' | 'exit' | 'general';
    ruleName: string;
    description: string;
    isActive: boolean;
    priority: number;
    leaveRules?: Record<string, any>;
    attendanceRules?: Record<string, any>;
    payrollRules?: Record<string, any>;
  };

  const defaultFormData: RuleFormData = {
    category: 'leave',
    ruleName: '',
    description: '',
    isActive: true,
    priority: 0,
    leaveRules: {
      annualLeaveQuota: 20,
      sickLeaveQuota: 10,
      casualLeaveQuota: 5,
      carryForwardAllowed: true,
      maxCarryForwardDays: 5,
    },
    attendanceRules: {
      requireClockIn: true,
      requireClockOut: true,
      lateArrivalGracePeriod: 15,
      overtimeAutoCalculate: true,
    },
    payrollRules: {
      payFrequency: 'monthly',
      payDay: 1,
      overtimeRate: 1.5,
    },
  };

  const [ruleFormData, setRuleFormData] = useState<RuleFormData>(defaultFormData);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, [categoryFilter]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getAllBusinessRules(
        categoryFilter === 'all' ? undefined : categoryFilter
      );
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleFormData.ruleName) {
      alert('Rule name is required');
      return;
    }

    setActionLoading(true);
    try {
      await settingsService.createBusinessRule(ruleFormData);
      await loadRules();
      setShowRuleModal(false);
      setRuleFormData(defaultFormData);
      alert('Rule created successfully!');
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    setActionLoading(true);
    try {
      await settingsService.updateBusinessRule(selectedRule.ruleId, ruleFormData);
      await loadRules();
      setShowRuleModal(false);
      setSelectedRule(null);
      alert('Rule updated successfully!');
    } catch (error) {
      console.error('Error updating rule:', error);
      alert('Failed to update rule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (rule: BusinessRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.ruleName}"?`)) return;

    setActionLoading(true);
    try {
      await settingsService.deleteBusinessRule(rule.ruleId);
      await loadRules();
      alert('Rule deleted successfully!');
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditRule = (rule: BusinessRule) => {
    setSelectedRule(rule);
    setRuleFormData({
      category: rule.category,
      ruleName: rule.ruleName,
      description: rule.description || '',
      isActive: rule.isActive,
      priority: rule.priority,
      leaveRules: rule.leaveRules,
      attendanceRules: rule.attendanceRules,
      payrollRules: rule.payrollRules,
    });
    setShowRuleModal(true);
  };

  const categories = [
    { value: 'leave', label: 'Leave Management' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'performance', label: 'Performance' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'exit', label: 'Exit Management' },
    { value: 'general', label: 'General' },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      leave: 'bg-blue-100 text-blue-800',
      attendance: 'bg-green-100 text-green-800',
      payroll: 'bg-purple-100 text-purple-800',
      performance: 'bg-orange-100 text-orange-800',
      onboarding: 'bg-indigo-100 text-indigo-800',
      exit: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.general;
  };

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
          <h3 className="text-lg font-semibold text-gray-900">Business Rules</h3>
          <p className="text-sm text-gray-500 mt-1">Configure HR policies and automated workflows</p>
        </div>
        <button
          onClick={() => {
            setSelectedRule(null);
            setRuleFormData(defaultFormData);
            setShowRuleModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Rule</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No business rules found</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.ruleId} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(rule.category)}`}>
                        {rule.category.charAt(0).toUpperCase() + rule.category.slice(1)}
                      </span>
                      {rule.isActive ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" title="Active" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" title="Inactive" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900">{rule.ruleName}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditRule(rule)}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule)}
                      disabled={actionLoading}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {rule.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rule.description}</p>
                )}

                <div className="text-xs text-gray-500">
                  Priority: {rule.priority} | Created:{' '}
                  {new Date(rule.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowRuleModal(false)} />
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  {selectedRule ? 'Edit Business Rule' : 'Create New Business Rule'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={ruleFormData.category}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value as any })}
                      className="input w-full"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={ruleFormData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, isActive: e.target.value === 'active' })}
                      className="input w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.ruleName}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, ruleName: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Annual Leave Policy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={ruleFormData.description}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                    rows={4}
                    className="input w-full"
                    placeholder="Describe this business rule..."
                  />
                </div>

                {/* Category-specific configuration */}
                {ruleFormData.category === 'leave' && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Leave Policy Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Annual Leave Quota</label>
                        <input
                          type="number"
                          value={ruleFormData.leaveRules?.annualLeaveQuota || 20}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            leaveRules: { ...ruleFormData.leaveRules, annualLeaveQuota: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sick Leave Quota</label>
                        <input
                          type="number"
                          value={ruleFormData.leaveRules?.sickLeaveQuota || 10}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            leaveRules: { ...ruleFormData.leaveRules, sickLeaveQuota: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Casual Leave Quota</label>
                        <input
                          type="number"
                          value={ruleFormData.leaveRules?.casualLeaveQuota || 5}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            leaveRules: { ...ruleFormData.leaveRules, casualLeaveQuota: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Carry Forward Days</label>
                        <input
                          type="number"
                          value={ruleFormData.leaveRules?.maxCarryForwardDays || 5}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            leaveRules: { ...ruleFormData.leaveRules, maxCarryForwardDays: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={ruleFormData.leaveRules?.carryForwardAllowed !== false}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            leaveRules: { ...ruleFormData.leaveRules, carryForwardAllowed: e.target.checked }
                          })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Allow Carry Forward</span>
                      </label>
                    </div>
                  </div>
                )}

                {ruleFormData.category === 'attendance' && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Attendance Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Late Grace Period (min)</label>
                        <input
                          type="number"
                          value={ruleFormData.attendanceRules?.lateArrivalGracePeriod || 15}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            attendanceRules: { ...ruleFormData.attendanceRules, lateArrivalGracePeriod: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={ruleFormData.attendanceRules?.requireClockIn !== false}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            attendanceRules: { ...ruleFormData.attendanceRules, requireClockIn: e.target.checked }
                          })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Require Clock In</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={ruleFormData.attendanceRules?.requireClockOut !== false}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            attendanceRules: { ...ruleFormData.attendanceRules, requireClockOut: e.target.checked }
                          })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Require Clock Out</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={ruleFormData.attendanceRules?.overtimeAutoCalculate !== false}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            attendanceRules: { ...ruleFormData.attendanceRules, overtimeAutoCalculate: e.target.checked }
                          })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Auto Calculate Overtime</span>
                      </label>
                    </div>
                  </div>
                )}

                {ruleFormData.category === 'payroll' && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Payroll Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Pay Frequency</label>
                        <select
                          value={ruleFormData.payrollRules?.payFrequency || 'monthly'}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            payrollRules: { ...ruleFormData.payrollRules, payFrequency: e.target.value }
                          })}
                          className="input w-full text-sm"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="semi-monthly">Semi-Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Pay Day</label>
                        <input
                          type="number"
                          value={ruleFormData.payrollRules?.payDay || 1}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            payrollRules: { ...ruleFormData.payrollRules, payDay: parseInt(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="1"
                          max="31"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Overtime Rate (multiplier)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={ruleFormData.payrollRules?.overtimeRate || 1.5}
                          onChange={(e) => setRuleFormData({
                            ...ruleFormData,
                            payrollRules: { ...ruleFormData.payrollRules, overtimeRate: parseFloat(e.target.value) }
                          })}
                          className="input w-full text-sm"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button onClick={() => setShowRuleModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={selectedRule ? handleUpdateRule : handleCreateRule}
                    disabled={actionLoading}
                    className="btn btn-primary"
                  >
                    {actionLoading ? 'Saving...' : selectedRule ? 'Update Rule' : 'Create Rule'}
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
