import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutlineIcon } from '@heroicons/react/24/outline';

interface Step {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  states: string[];
}

const exitSteps: Step[] = [
  {
    id: 'resignation',
    name: 'Resignation',
    description: 'Resignation submitted and approval',
    icon: DocumentTextIcon,
    states: ['resignation_submitted', 'resignation_approved', 'resignation_rejected'],
  },
  {
    id: 'notice_period',
    name: 'Notice Period',
    description: 'Serving notice period',
    icon: ClockIcon,
    states: ['notice_period_active', 'notice_period_buyout'],
  },
  {
    id: 'clearance',
    name: 'Clearance',
    description: 'Department clearances',
    icon: ShieldCheckIcon,
    states: ['clearance_initiated', 'clearance_in_progress'],
  },
  {
    id: 'assets',
    name: 'Asset Return',
    description: 'Return of company assets',
    icon: CubeIcon,
    states: ['assets_pending', 'assets_returned'],
  },
  {
    id: 'interview',
    name: 'Exit Interview',
    description: 'Exit interview and feedback',
    icon: ChatBubbleLeftRightIcon,
    states: ['exit_interview_pending', 'exit_interview_completed'],
  },
  {
    id: 'settlement',
    name: 'Settlement',
    description: 'Final settlement and exit completion',
    icon: BanknotesIcon,
    states: ['settlement_calculated', 'settlement_approved', 'exit_completed'],
  },
];

interface ExitProgressTrackerProps {
  currentState: string;
  lastWorkingDate?: string;
}

export default function ExitProgressTracker({ currentState, lastWorkingDate }: ExitProgressTrackerProps) {
  const getCurrentStepIndex = () => {
    return exitSteps.findIndex((step) => step.states.includes(currentState));
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const getStateDisplayName = (state: string) => {
    return state
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateDaysRemaining = (date: string) => {
    const target = new Date(date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = lastWorkingDate ? calculateDaysRemaining(lastWorkingDate) : null;

  return (
    <div className="w-full py-3">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (exitSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {exitSteps.map((step, index) => {
            const status = getStepStatus(index);
            const isActive = step.states.includes(currentState);

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
