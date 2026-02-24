import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid';

interface ProbationProgressTrackerProps {
  currentState: string;
  review30Completed: boolean;
  review60Completed: boolean;
  finalReviewCompleted: boolean;
  review30DueDate?: string;
  review60DueDate?: string;
  finalReviewDueDate?: string;
  probationStartDate: string;
  probationEndDate: string;
  isAtRisk: boolean;
}

export default function ProbationProgressTracker({
  currentState,
  review30Completed,
  review60Completed,
  finalReviewCompleted,
  review30DueDate,
  review60DueDate,
  finalReviewDueDate,
  probationStartDate,
  probationEndDate,
  isAtRisk,
}: ProbationProgressTrackerProps) {
  const milestones = [
    {
      id: 'start',
      name: 'Probation Start',
      date: probationStartDate,
      completed: true,
      icon: UserPlusIcon,
    },
    {
      id: '30day',
      name: '30-Day Review',
      date: review30DueDate,
      completed: review30Completed,
      icon: DocumentTextIcon,
    },
    {
      id: '60day',
      name: '60-Day Review',
      date: review60DueDate,
      completed: review60Completed,
      icon: DocumentTextIcon,
    },
    {
      id: 'final',
      name: 'Final Review',
      date: finalReviewDueDate,
      completed: finalReviewCompleted,
      icon: DocumentTextIcon,
    },
    {
      id: 'decision',
      name: 'Decision',
      date: probationEndDate,
      completed: currentState === 'confirmed' || currentState === 'probation_termination',
      icon: CheckCircleIcon,
    },
  ];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercentage = (completedCount / milestones.length) * 100;

  const calculateDaysRemaining = (date: string) => {
    const target = new Date(date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysRemainingColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days < 7) return 'text-orange-600';
    if (days < 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  const daysRemaining = calculateDaysRemaining(probationEndDate);

  return (
    <div className="w-full py-6">
      {/* Timeline */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 w-full h-2 bg-gray-200 rounded-full">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              isAtRisk ? 'bg-orange-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Milestones */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isCurrent = !milestone.completed && index === completedCount;
            const daysToMilestone = milestone.date ? calculateDaysRemaining(milestone.date) : null;

            return (
              <div key={milestone.id} className="flex flex-col items-center" style={{ width: '140px' }}>
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                    milestone.completed
                      ? 'border-green-600 bg-green-600'
                      : isCurrent
                      ? isAtRisk
                        ? 'border-orange-500 bg-white shadow-lg ring-4 ring-orange-100'
                        : 'border-blue-600 bg-white shadow-lg ring-4 ring-blue-100'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircleIcon className="h-7 w-7 text-white" />
                  ) : isCurrent ? (
                    <Icon className={`h-7 w-7 ${isAtRisk ? 'text-orange-500' : 'text-blue-600'} animate-pulse`} />
                  ) : (
                    <Icon className="h-7 w-7 text-gray-400" />
                  )}
                </div>

                {/* Milestone Name */}
                <div className="mt-3 text-center">
                  <div
                    className={`text-sm font-semibold ${
                      milestone.completed || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {milestone.name}
                  </div>

                  {/* Date */}
                  {milestone.date && (
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}

                  {/* Days Remaining */}
                  {!milestone.completed && daysToMilestone !== null && isCurrent && (
                    <div className={`mt-1 text-xs font-medium ${getDaysRemainingColor(daysToMilestone)}`}>
                      {daysToMilestone > 0
                        ? `${daysToMilestone} days left`
                        : daysToMilestone === 0
                        ? 'Due today'
                        : `${Math.abs(daysToMilestone)} days overdue`}
                    </div>
                  )}

                  {/* Status Badge */}
                  {milestone.completed && (
                    <div className="mt-2 flex justify-center">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        ✓ Complete
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="mt-2 flex justify-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isAtRisk ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isAtRisk ? '⚠ Current' : '→ Current'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {/* Progress Card */}
        <div
          className={`rounded-lg border-2 p-4 ${
            isAtRisk ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-600">Overall Progress</div>
              <div className={`text-2xl font-bold ${isAtRisk ? 'text-orange-600' : 'text-blue-600'}`}>
                {Math.round(progressPercentage)}%
              </div>
            </div>
            <ClockIcon className={`h-10 w-10 ${isAtRisk ? 'text-orange-400' : 'text-blue-400'}`} />
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isAtRisk ? 'bg-orange-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Days Remaining Card */}
        <div
          className={`rounded-lg border-2 p-4 ${
            daysRemaining < 7
              ? 'border-red-200 bg-red-50'
              : daysRemaining < 30
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-600">Days Remaining</div>
              <div className={`text-2xl font-bold ${getDaysRemainingColor(daysRemaining)}`}>{daysRemaining}</div>
            </div>
            <ClockIcon
              className={`h-10 w-10 ${
                daysRemaining < 7 ? 'text-red-400' : daysRemaining < 30 ? 'text-yellow-400' : 'text-green-400'
              }`}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">Until {new Date(probationEndDate).toLocaleDateString()}</div>
        </div>

        {/* Reviews Completed Card */}
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-600">Reviews Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {[review30Completed, review60Completed, finalReviewCompleted].filter(Boolean).length}/3
              </div>
            </div>
            <DocumentTextIcon className="h-10 w-10 text-green-400" />
          </div>
        </div>
      </div>

      {/* At-Risk Warning */}
      {isAtRisk && (
        <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-red-900">Employee At-Risk</h4>
              <p className="mt-1 text-xs text-red-700">
                This employee has been flagged as at-risk. Additional monitoring and support recommended.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
