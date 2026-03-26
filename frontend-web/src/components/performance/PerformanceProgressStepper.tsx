import React from 'react';
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  TrophyIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/solid';

interface Step {
  id: string;
  name: string;
  states: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const performanceSteps: Step[] = [
  {
    id: 'goal_setting',
    name: 'Goal Setting',
    states: ['goal_setting', 'goals_submitted', 'goals_approved'],
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'mid_year',
    name: 'Mid-Year Review',
    states: ['mid_year_pending', 'mid_year_submitted', 'mid_year_completed'],
    icon: ChartBarIcon,
  },
  {
    id: 'annual_review',
    name: 'Annual Review',
    states: ['annual_review_pending', 'annual_review_submitted', 'annual_review_completed'],
    icon: TrophyIcon,
  },
  {
    id: 'rating',
    name: 'Performance Rating',
    states: ['rating_pending', 'rating_submitted', 'rating_approved'],
    icon: CheckCircleIcon,
  },
  {
    id: 'development',
    name: 'Development Plan',
    states: ['development_plan', 'cycle_complete'],
    icon: AcademicCapIcon,
  },
];

interface PerformanceProgressStepperProps {
  currentState: string;
}

export default function PerformanceProgressStepper({ currentState }: PerformanceProgressStepperProps) {
  const getCurrentStepIndex = () => {
    return performanceSteps.findIndex((step) => step.states.includes(currentState));
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-3">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (performanceSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {performanceSteps.map((step, index) => {
            const status = getStepStatus(index);

            return (
              <div key={step.id} className="flex flex-col items-center" style={{ width: '120px' }}>
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    status === 'completed'
                      ? 'border-blue-600 bg-blue-600'
                      : status === 'current'
                      ? 'border-blue-600 bg-white shadow-lg ring-2 ring-blue-100'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircleIcon className="h-4 w-4 text-white" />
                  ) : status === 'current' ? (
                    <step.icon className="h-4 w-4 text-blue-600" />
                  ) : (
                    <step.icon className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* Step Name */}
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-semibold ${
                      status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
