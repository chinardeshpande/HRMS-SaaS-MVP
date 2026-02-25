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
    <div className="w-full py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
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
              <div key={step.id} className="flex flex-col items-center" style={{ width: '150px' }}>
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-300 ${
                    status === 'completed'
                      ? 'border-blue-600 bg-blue-600'
                      : status === 'current'
                      ? 'border-blue-600 bg-white shadow-lg ring-4 ring-blue-100'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  ) : status === 'current' ? (
                    <step.icon className="h-6 w-6 text-blue-600" />
                  ) : (
                    <step.icon className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Step Name */}
                <div className="mt-3 text-center">
                  <div
                    className={`text-sm font-semibold ${
                      status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </div>

                  {/* Current State Badge */}
                  {isActive && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {getStateDisplayName(currentState)}
                      </span>
                    </div>
                  )}

                  {/* Step Description */}
                  <div className="mt-1 text-xs text-gray-500">{step.description}</div>

                  {/* Status Icon */}
                  {status === 'completed' && !isActive && (
                    <div className="mt-2 flex justify-center">
                      <CheckCircleOutlineIcon className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                  {status === 'current' && (
                    <div className="mt-2 flex justify-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed State Information */}
      <div className="mt-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium text-blue-600">{getStateDisplayName(currentState)}</span>
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {currentStepIndex >= 0 && exitSteps[currentStepIndex]?.description}
            </p>

            {/* Progress Percentage */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Exit Progress</span>
                <span className="font-semibold">
                  {Math.round(((currentStepIndex + 1) / exitSteps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / exitSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Days until last working day */}
            {lastWorkingDate && daysRemaining !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Last Working Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(lastWorkingDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-1">
                  <span
                    className={`text-sm font-medium ${
                      daysRemaining < 0
                        ? 'text-red-600'
                        : daysRemaining < 7
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : daysRemaining === 0
                      ? 'Last working day is today'
                      : `${Math.abs(daysRemaining)} days past LWD`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
