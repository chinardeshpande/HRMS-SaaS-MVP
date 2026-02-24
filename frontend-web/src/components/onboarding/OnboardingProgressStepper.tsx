import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutlineIcon } from '@heroicons/react/24/outline';

interface Step {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  states: string[];
}

const onboardingSteps: Step[] = [
  {
    id: 'offer',
    name: 'Offer Stage',
    description: 'Offer approved and sent to candidate',
    icon: DocumentTextIcon,
    states: ['offer_approved', 'offer_sent', 'offer_accepted'],
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Document submission and verification',
    icon: DocumentTextIcon,
    states: ['docs_pending', 'docs_submitted', 'hr_review'],
  },
  {
    id: 'verification',
    name: 'Background Verification',
    description: 'BGV process and clearance',
    icon: ShieldCheckIcon,
    states: ['bgv_in_progress', 'bgv_passed', 'bgv_discrepancy'],
  },
  {
    id: 'setup',
    name: 'Pre-Joining Setup',
    description: 'IT assets and access provisioning',
    icon: UserPlusIcon,
    states: ['pre_joining_setup'],
  },
  {
    id: 'joining',
    name: 'Joining',
    description: 'Employee joins the organization',
    icon: UserPlusIcon,
    states: ['joined'],
  },
  {
    id: 'orientation',
    name: 'Orientation',
    description: 'Onboarding training and orientation',
    icon: AcademicCapIcon,
    states: ['orientation', 'onboarding_complete'],
  },
];

interface OnboardingProgressStepperProps {
  currentState: string;
}

export default function OnboardingProgressStepper({ currentState }: OnboardingProgressStepperProps) {
  const getCurrentStepIndex = () => {
    return onboardingSteps.findIndex((step) => step.states.includes(currentState));
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

  return (
    <div className="w-full py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (onboardingSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {onboardingSteps.map((step, index) => {
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
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium text-blue-600">{getStateDisplayName(currentState)}</span>
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {currentStepIndex >= 0 && onboardingSteps[currentStepIndex]?.description}
            </p>

            {/* Progress Percentage */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Overall Progress</span>
                <span className="font-semibold">
                  {Math.round(((currentStepIndex + 1) / onboardingSteps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / onboardingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
