import React from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ProbationProgressBarProps {
  probationStartDate: Date;
  probationEndDate: Date;
  review30Completed: boolean;
  review60Completed: boolean;
  finalReviewCompleted: boolean;
  currentState: string;
  isAtRisk?: boolean;
}

export const ProbationProgressBar: React.FC<ProbationProgressBarProps> = ({
  probationStartDate,
  probationEndDate,
  review30Completed,
  review60Completed,
  finalReviewCompleted,
  currentState,
  isAtRisk = false,
}) => {
  const startDate = new Date(probationStartDate);
  const endDate = new Date(probationEndDate);
  const today = new Date();

  // Calculate progress percentage
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = today.getTime() - startDate.getTime();
  const progressPercentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

  // Milestone dates
  const day30 = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const day60 = new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000);
  const day85 = new Date(startDate.getTime() + 85 * 24 * 60 * 60 * 1000);

  const milestones = [
    {
      day: 30,
      label: '30-Day Review',
      date: day30,
      completed: review30Completed,
      position: 33,
    },
    {
      day: 60,
      label: '60-Day Review',
      date: day60,
      completed: review60Completed,
      position: 67,
    },
    {
      day: 85,
      label: 'Final Review',
      date: day85,
      completed: finalReviewCompleted,
      position: 95,
    },
  ];

  const getStatusColor = () => {
    if (isAtRisk) return 'bg-red-600';
    if (currentState === 'confirmed') return 'bg-green-600';
    if (currentState === 'probation_termination') return 'bg-red-600';
    if (currentState === 'probation_extended') return 'bg-orange-600';
    return 'bg-blue-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Probation Progress</h4>
          <p className="text-xs text-gray-500 mt-1">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
        {isAtRisk && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            At Risk
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className={`h-full ${getStatusColor()} transition-all duration-500`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Milestones */}
        {milestones.map((milestone) => (
          <div
            key={milestone.day}
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left: `${milestone.position}%` }}
          >
            {/* Milestone marker */}
            <div className="relative flex flex-col items-center">
              {/* Icon */}
              <div className="-mt-1">
                {milestone.completed ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 bg-white rounded-full" />
                ) : today > milestone.date ? (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 bg-white rounded-full" />
                ) : (
                  <ClockIcon className="h-5 w-5 text-gray-400 bg-white rounded-full" />
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center whitespace-nowrap">
                <p className={`text-xs font-medium ${milestone.completed ? 'text-green-600' : today > milestone.date ? 'text-red-600' : 'text-gray-600'}`}>
                  Day {milestone.day}
                </p>
                <p className="text-xs text-gray-500">{milestone.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-12">
        <span>Start</span>
        <span className="font-medium">
          {Math.round(progressPercentage)}% Complete
        </span>
        <span>End</span>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className={`p-2 rounded-md ${review30Completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
          <p className="text-xs font-medium text-gray-700">30-Day</p>
          <p className={`text-xs ${review30Completed ? 'text-green-600' : 'text-gray-500'}`}>
            {review30Completed ? '✓ Done' : 'Pending'}
          </p>
        </div>
        <div className={`p-2 rounded-md ${review60Completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
          <p className="text-xs font-medium text-gray-700">60-Day</p>
          <p className={`text-xs ${review60Completed ? 'text-green-600' : 'text-gray-500'}`}>
            {review60Completed ? '✓ Done' : 'Pending'}
          </p>
        </div>
        <div className={`p-2 rounded-md ${finalReviewCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
          <p className="text-xs font-medium text-gray-700">Final</p>
          <p className={`text-xs ${finalReviewCompleted ? 'text-green-600' : 'text-gray-500'}`}>
            {finalReviewCompleted ? '✓ Done' : 'Pending'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProbationProgressBar;
