import React from 'react';

interface ProbationStatusChipProps {
  state: string;
}

const stateColors: Record<string, string> = {
  probation_active: 'bg-blue-100 text-blue-800 border-blue-300',
  review_30_pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  review_30_done: 'bg-green-100 text-green-800 border-green-300',
  review_60_pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  review_60_done: 'bg-green-100 text-green-800 border-green-300',
  final_review_pending: 'bg-orange-100 text-orange-800 border-orange-300',
  decision_pending: 'bg-purple-100 text-purple-800 border-purple-300',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  probation_extended: 'bg-amber-100 text-amber-800 border-amber-300',
  extended_probation_active: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  probation_termination: 'bg-red-100 text-red-800 border-red-300',
};

const stateLabels: Record<string, string> = {
  probation_active: 'Active',
  review_30_pending: '30-Day Review Pending',
  review_30_done: '30-Day Review Done',
  review_60_pending: '60-Day Review Pending',
  review_60_done: '60-Day Review Done',
  final_review_pending: 'Final Review Pending',
  decision_pending: 'Decision Pending',
  confirmed: 'Confirmed',
  probation_extended: 'Extended',
  extended_probation_active: 'Extended - Active',
  probation_termination: 'Terminated',
};

export const ProbationStatusChip: React.FC<ProbationStatusChipProps> = ({ state }) => {
  const colorClass = stateColors[state] || 'bg-gray-100 text-gray-800 border-gray-300';
  const label = stateLabels[state] || state.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
};

export default ProbationStatusChip;
