import React from 'react';

interface ExitStatusChipProps {
  state: string;
}

const stateColors: Record<string, string> = {
  resignation_submitted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  resignation_approved: 'bg-green-100 text-green-800 border-green-300',
  resignation_rejected: 'bg-red-100 text-red-800 border-red-300',
  notice_period_active: 'bg-blue-100 text-blue-800 border-blue-300',
  notice_period_buyout: 'bg-purple-100 text-purple-800 border-purple-300',
  clearance_initiated: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  clearance_in_progress: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  assets_pending: 'bg-orange-100 text-orange-800 border-orange-300',
  assets_returned: 'bg-teal-100 text-teal-800 border-teal-300',
  exit_interview_pending: 'bg-amber-100 text-amber-800 border-amber-300',
  exit_interview_completed: 'bg-lime-100 text-lime-800 border-lime-300',
  settlement_calculated: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  settlement_approved: 'bg-green-200 text-green-900 border-green-400',
  exit_completed: 'bg-gray-200 text-gray-900 border-gray-400',
};

const stateLabels: Record<string, string> = {
  resignation_submitted: 'Resignation Submitted',
  resignation_approved: 'Resignation Approved',
  resignation_rejected: 'Resignation Rejected',
  notice_period_active: 'Notice Period Active',
  notice_period_buyout: 'Notice Period Buyout',
  clearance_initiated: 'Clearance Initiated',
  clearance_in_progress: 'Clearance In Progress',
  assets_pending: 'Assets Pending',
  assets_returned: 'Assets Returned',
  exit_interview_pending: 'Exit Interview Pending',
  exit_interview_completed: 'Exit Interview Completed',
  settlement_calculated: 'Settlement Calculated',
  settlement_approved: 'Settlement Approved',
  exit_completed: 'Exit Completed',
};

export const ExitStatusChip: React.FC<ExitStatusChipProps> = ({ state }) => {
  const colorClass = stateColors[state] || 'bg-gray-100 text-gray-800 border-gray-300';
  const label = stateLabels[state] || state.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
};

export default ExitStatusChip;
