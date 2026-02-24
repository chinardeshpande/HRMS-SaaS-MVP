import React from 'react';

interface OnboardingStatusChipProps {
  state: string;
}

const stateColors: Record<string, string> = {
  offer_approved: 'bg-blue-100 text-blue-800 border-blue-300',
  offer_sent: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  offer_accepted: 'bg-green-100 text-green-800 border-green-300',
  docs_pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  docs_submitted: 'bg-amber-100 text-amber-800 border-amber-300',
  hr_review: 'bg-purple-100 text-purple-800 border-purple-300',
  bgv_in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
  bgv_passed: 'bg-teal-100 text-teal-800 border-teal-300',
  bgv_discrepancy: 'bg-red-100 text-red-800 border-red-300',
  pre_joining_setup: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  joined: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  orientation: 'bg-lime-100 text-lime-800 border-lime-300',
  onboarding_complete: 'bg-green-200 text-green-900 border-green-400',
};

const stateLabels: Record<string, string> = {
  offer_approved: 'Offer Approved',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  docs_pending: 'Docs Pending',
  docs_submitted: 'Docs Submitted',
  hr_review: 'HR Review',
  bgv_in_progress: 'BGV In Progress',
  bgv_passed: 'BGV Passed',
  bgv_discrepancy: 'BGV Discrepancy',
  pre_joining_setup: 'Pre-Joining Setup',
  joined: 'Joined',
  orientation: 'Orientation',
  onboarding_complete: 'Onboarding Complete',
};

export const OnboardingStatusChip: React.FC<OnboardingStatusChipProps> = ({ state }) => {
  const colorClass = stateColors[state] || 'bg-gray-100 text-gray-800 border-gray-300';
  const label = stateLabels[state] || state.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
};

export default OnboardingStatusChip;
