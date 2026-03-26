import React from 'react';

interface PerformanceStatusChipProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  goal_setting: { label: 'Goal Setting', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  goals_submitted: { label: 'Goals Submitted', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  goals_approved: { label: 'Goals Approved', className: 'bg-green-100 text-green-800 border-green-200' },
  mid_year_pending: { label: 'Mid-Year Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  mid_year_submitted: { label: 'Mid-Year Submitted', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  mid_year_completed: { label: 'Mid-Year Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  annual_review_pending: { label: 'Annual Review Pending', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  annual_review_submitted: { label: 'Annual Review Submitted', className: 'bg-teal-100 text-teal-800 border-teal-200' },
  annual_review_completed: { label: 'Annual Review Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  rating_pending: { label: 'Rating Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  rating_submitted: { label: 'Rating Submitted', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  rating_approved: { label: 'Rating Approved', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  development_plan: { label: 'Development Plan', className: 'bg-violet-100 text-violet-800 border-violet-200' },
  cycle_complete: { label: 'Cycle Complete', className: 'bg-green-100 text-green-800 border-green-200' },
};

export default function PerformanceStatusChip({ status }: PerformanceStatusChipProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}
