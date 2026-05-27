import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import leaveService from '../../services/leaveService';
import type { LeaveBalance, LeavePolicy } from '../../services/leaveService';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveBalances?: LeaveBalance[];
  leavePolicies?: LeavePolicy[];
}

const defaultLeaveTypes = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Annual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'compensatory', label: 'Compensatory Off' },
];

const toTitle = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const calculateWorkingDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days += 1;
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const ApplyLeaveModal = ({
  isOpen,
  onClose,
  onSuccess,
  leaveBalances = [],
  leavePolicies = [],
}: ApplyLeaveModalProps) => {
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leaveTypeOptions = useMemo(() => {
    const policiesByType = new Map(leavePolicies.map((policy) => [policy.leaveType, policy]));
    const balancesByType = new Map(leaveBalances.map((balance) => [balance.leaveType, balance]));
    const sourceTypes = new Set([
      ...leavePolicies.map((policy) => policy.leaveType),
      ...leaveBalances.map((balance) => balance.leaveType),
    ]);

    const base = sourceTypes.size > 0
      ? Array.from(sourceTypes).map((value) => ({
          value,
          label: policiesByType.get(value)?.policyName || `${toTitle(value)} Leave`,
        }))
      : defaultLeaveTypes;

    return base.map((option) => {
      const balance = balancesByType.get(option.value);
      const totalAllocated = Number(balance?.totalAllocated) || 0;
      const available =
        balance?.available !== undefined
          ? Number(balance.available)
          : totalAllocated + (Number(balance?.carriedForward) || 0) - (Number(balance?.used) || 0) - (Number(balance?.pending) || 0);

      return {
        ...option,
        available,
        hasBalance: Boolean(balance),
        isPolicyActive: policiesByType.has(option.value),
      };
    });
  }, [leaveBalances, leavePolicies]);

  const selectedOption = leaveTypeOptions.find((option) => option.value === formData.leaveType);
  const requestedDays = calculateWorkingDays(formData.startDate, formData.endDate);
  const hasConfiguredLeave = leaveTypeOptions.length > 0 && leavePolicies.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    const preferredOption =
      leaveTypeOptions.find((option) => option.hasBalance && option.available > 0) ||
      leaveTypeOptions.find((option) => option.hasBalance) ||
      leaveTypeOptions[0];

    if (preferredOption && preferredOption.value !== formData.leaveType) {
      setFormData((current) => ({ ...current, leaveType: preferredOption.value }));
    }
  }, [isOpen, leaveTypeOptions, formData.leaveType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!hasConfiguredLeave || !selectedOption?.hasBalance) {
      setError('Your leave balance is not initialized for this leave type. Please contact HR.');
      return;
    }

    if (requestedDays <= 0) {
      setError('The selected date range must include at least one working day.');
      return;
    }

    if (selectedOption.available < requestedDays) {
      setError(`Insufficient balance. Available: ${selectedOption.available}, requested: ${requestedDays}.`);
      return;
    }

    try {
      setLoading(true);

      await leaveService.applyLeave({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        emergencyContact: formData.emergencyContact || undefined,
      });

      // Reset form
      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error applying for leave:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: '',
      });
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              required
            >
              {leaveTypeOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={!option.hasBalance}>
                  {option.label}
                  {option.hasBalance ? ` · ${option.available} days available` : ' · balance not initialized'}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Only active policies with initialized employee balances can be used for leave applications.
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Available</p>
                <p className="mt-1 font-bold text-gray-900">
                  {selectedOption?.hasBalance ? `${selectedOption.available} days` : 'Not initialized'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Requested</p>
                <p className="mt-1 font-bold text-gray-900">{requestedDays || '-'} working day{requestedDays === 1 ? '' : 's'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Policy</p>
                <p className="mt-1 font-bold text-gray-900">{selectedOption?.isPolicyActive ? 'Active' : 'Not active'}</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              placeholder="Please provide a brief reason for your leave..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
          </div>

          {/* Emergency Contact (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact (Optional)
            </label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="Phone number or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end sm:space-x-3 sm:gap-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
