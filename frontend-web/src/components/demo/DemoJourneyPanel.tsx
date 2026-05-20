import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { DemoJourneyStep, demoJourneySteps } from '../../data/demoJourneys';
import onboardingService from '../../services/onboardingService';
import probationService from '../../services/probationService';
import leaveService from '../../services/leaveService';
import performanceService from '../../services/performanceService';
import exitService from '../../services/exitService';
import attendanceService from '../../services/attendanceService';

interface DemoJourneyPanelProps {
  currentPath: string;
  onNavigate: (route: string) => void;
}

const STORAGE_KEY = 'auroraDemoJourneyState';

interface DemoRecordLink {
  route: string;
  label: string;
  detail: string;
}

type DemoRecordLinks = Partial<Record<string, DemoRecordLink>>;

const readVisitedSteps = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const formatPersonName = (record: any): string => {
  const firstName = record?.firstName || record?.employee?.firstName || record?.candidate?.firstName;
  const lastName = record?.lastName || record?.employee?.lastName || record?.candidate?.lastName;
  return [firstName, lastName].filter(Boolean).join(' ') || 'sample record';
};

const stateLabel = (value?: string): string =>
  value ? value.replace(/_/g, ' ') : 'in progress';

const extractList = (response: any, nestedKey?: string): any[] => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (nestedKey && Array.isArray(data?.[nestedKey])) return data[nestedKey];
  return [];
};

export const DemoJourneyPanel = ({ currentPath, onNavigate }: DemoJourneyPanelProps) => {
  const [visitedSteps, setVisitedSteps] = useState<string[]>(() => readVisitedSteps());
  const [expanded, setExpanded] = useState(
    () => currentPath === '/dashboard' && window.matchMedia('(min-width: 768px)').matches
  );
  const [recordLinks, setRecordLinks] = useState<DemoRecordLinks>({});

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

  useEffect(() => {
    let cancelled = false;

    const loadRecordLinks = async () => {
      const nextLinks: DemoRecordLinks = {};

      const [
        candidatesResult,
        attendanceResult,
        leaveResult,
        probationResult,
        performanceResult,
        exitResult,
      ] = await Promise.allSettled([
        onboardingService.getAllCandidates({}),
        attendanceService.getStatistics(),
        leaveService.getAllRequests(),
        probationService.getAllProbationCases(),
        performanceService.getAllReviews(),
        exitService.getAllExitCases(),
      ]);

      if (candidatesResult.status === 'fulfilled') {
        const candidates = extractList(candidatesResult.value);
        const candidate = candidates.find((item) => item.currentState !== 'onboarding_complete') || candidates[0];
        if (candidate?.candidateId) {
          nextLinks.onboarding = {
            route: `/onboarding/candidate/${candidate.candidateId}`,
            label: formatPersonName(candidate),
            detail: `Candidate is ${stateLabel(candidate.currentState)}`,
          };
        }
      }

      if (attendanceResult.status === 'fulfilled') {
        const stats = attendanceResult.value?.data;
        nextLinks.attendance = {
          route: '/attendance',
          label: `${stats?.totalRecords || 0} attendance records`,
          detail: `${stats?.late || 0} late arrivals and ${stats?.halfDay || 0} half-days`,
        };
      }

      if (leaveResult.status === 'fulfilled') {
        const requests = extractList(leaveResult.value);
        const pendingRequest = requests.find((item) => item.status === 'pending') || requests[0];
        nextLinks.leave = {
          route: '/leave',
          label: pendingRequest ? `${formatPersonName(pendingRequest)} leave request` : 'Leave requests',
          detail: pendingRequest
            ? `${stateLabel(pendingRequest.leaveType)} leave is ${stateLabel(pendingRequest.status)}`
            : 'Balances and approvals dashboard',
        };
      }

      if (probationResult.status === 'fulfilled') {
        const cases = extractList(probationResult.value);
        const probationCase =
          cases.find((item) => item.isAtRisk || !item.finalReviewCompleted) || cases[0];
        if (probationCase?.probationId) {
          nextLinks.probation = {
            route: `/probation/case/${probationCase.probationId}`,
            label: formatPersonName(probationCase),
            detail: `Probation is ${stateLabel(probationCase.currentState)}`,
          };
        }
      }

      if (performanceResult.status === 'fulfilled') {
        const reviews = extractList(performanceResult.value, 'reviews');
        const review = reviews.find((item) => item.currentState !== 'completed') || reviews[0];
        if (review?.reviewId) {
          nextLinks.performance = {
            route: `/performance/${review.reviewId}`,
            label: formatPersonName(review),
            detail: `${review.reviewCycle || 'Current'} cycle is ${stateLabel(review.currentState)}`,
          };
        }
      }

      if (exitResult.status === 'fulfilled') {
        const cases = extractList(exitResult.value);
        const exitCase = cases.find((item) => item.currentState !== 'exit_completed') || cases[0];
        if (exitCase?.exitId) {
          nextLinks.exit = {
            route: `/exit/${exitCase.exitId}`,
            label: formatPersonName(exitCase),
            detail: `Exit is ${stateLabel(exitCase.currentState)}`,
          };
        }
      }

      if (!cancelled) {
        setRecordLinks(nextLinks);
      }
    };

    loadRecordLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  const completedCount = visitedSteps.length;
  const nextStep =
    demoJourneySteps.find((step) => !visitedSteps.includes(step.id)) || demoJourneySteps[0];
  const activeRecordLink = activeStep ? recordLinks[activeStep.id] : undefined;

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
        onClick={() => onNavigate(recordLinks[step.id]?.route || step.route)}
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
          {recordLinks[step.id] ? 'Open highlighted record' : 'Open module'}
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
            onClick={() => onNavigate(recordLinks[nextStep.id]?.route || nextStep.route)}
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
        <>
          {activeStep && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary-50 p-2 text-primary-700">
                    <ClipboardDocumentCheckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Scripted scenario
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-gray-900">{activeStep.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-700">{activeStep.storyline}</p>
                    <p className="mt-2 text-sm font-medium text-gray-900">{activeStep.presenterPrompt}</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(activeRecordLink?.route || activeStep.route)}
                  className="flex-shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  {activeRecordLink?.label || activeStep.fallbackRecordLabel}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {activeStep.proofPoints.map((point) => (
                  <div key={point} className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                    {point}
                  </div>
                ))}
              </div>

              {activeRecordLink && (
                <p className="mt-3 text-xs font-medium text-gray-600">{activeRecordLink.detail}</p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {demoJourneySteps.map(renderStep)}
          </div>
        </>
      )}
    </section>
  );
};

export default DemoJourneyPanel;
