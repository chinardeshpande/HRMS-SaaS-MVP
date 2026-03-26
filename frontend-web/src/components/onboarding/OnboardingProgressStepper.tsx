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
    <div className="w-full py-3">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
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
