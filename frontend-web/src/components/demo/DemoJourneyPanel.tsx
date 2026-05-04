import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MapIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { DemoJourneyStep, demoJourneySteps } from '../../data/demoJourneys';

interface DemoJourneyPanelProps {
  currentPath: string;
  onNavigate: (route: string) => void;
}

const STORAGE_KEY = 'auroraDemoJourneyState';

const readVisitedSteps = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const DemoJourneyPanel = ({ currentPath, onNavigate }: DemoJourneyPanelProps) => {
  const [visitedSteps, setVisitedSteps] = useState<string[]>(() => readVisitedSteps());
  const [expanded, setExpanded] = useState(() => currentPath === '/dashboard');

  const activeStep = useMemo(
    () => demoJourneySteps.find((step) => currentPath.startsWith(step.route)),
    [currentPath]
  );

  useEffect(() => {
    if (!activeStep || visitedSteps.includes(activeStep.id)) return;

    const nextVisitedSteps = [...visitedSteps, activeStep.id];
    setVisitedSteps(nextVisitedSteps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVisitedSteps));
  }, [activeStep, visitedSteps]);

  const completedCount = visitedSteps.length;
  const nextStep =
    demoJourneySteps.find((step) => !visitedSteps.includes(step.id)) || demoJourneySteps[0];

  const resetJourney = () => {
    setVisitedSteps([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderStep = (step: DemoJourneyStep) => {
    const isVisited = visitedSteps.includes(step.id);
    const isActive = activeStep?.id === step.id;

    return (
      <button
        key={step.id}
        onClick={() => onNavigate(step.route)}
        className={`flex h-full min-h-[148px] flex-col rounded-lg border p-4 text-left transition-colors ${
          isActive
            ? 'border-primary-300 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">{step.stage}</p>
          </div>
          {isVisited ? (
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <PlayCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
          )}
        </div>

        <div className="mt-3 space-y-1">
          {step.proofPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
              <span>{point}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center pt-3 text-xs font-semibold text-primary-700">
          Open module
          <ChevronRightIcon className="ml-1 h-4 w-4" />
        </div>
      </button>
    );
  };

  return (
    <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Investor Demo Journey</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                {completedCount}/{demoJourneySteps.length} visited
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Curated sample workspace for the full employee lifecycle.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate(nextStep.route)}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Continue: {nextStep.title}
          </button>
          <button
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            {expanded ? 'Hide map' : 'Show map'}
          </button>
          <button
            onClick={resetJourney}
            className="rounded-lg p-2 text-amber-800 hover:bg-amber-100"
            title="Reset journey"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoJourneySteps.map(renderStep)}
        </div>
      )}
    </section>
  );
};

export default DemoJourneyPanel;
