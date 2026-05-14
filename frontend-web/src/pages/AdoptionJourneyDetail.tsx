import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import BrandedScreenshot from '../components/landing/BrandedScreenshot';
import { getAdoptionJourneyById } from '../data/adoptionJourneys';

export default function AdoptionJourneyDetail() {
  const navigate = useNavigate();
  const { journeyId } = useParams<{ journeyId: string }>();
  const journey = journeyId ? getAdoptionJourneyById(journeyId) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [journeyId]);

  if (!journey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-md border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Journey not found</h1>
          <button onClick={() => navigate('/')} className="mt-6 rounded-md bg-primary-600 px-5 py-3 font-semibold text-white">
            Back to AuroraHR
          </button>
        </div>
      </div>
    );
  }

  const Icon = journey.icon;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/images/AuroraHR_logo.svg?v=20260514b"
              alt="AuroraHR"
              className="h-9 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <button
              onClick={() => navigate('/', { state: { scrollTo: 'journeys' } })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Journeys
            </button>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Register company
          </button>
        </div>
      </nav>

      <header className="relative pt-16">
        <div className="relative h-[380px] overflow-hidden">
          <img src={journey.image} alt={journey.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gray-950/70" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl text-white">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur">
                  <Icon className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">AuroraHR adoption journey</p>
                <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{journey.title}</h1>
                <p className="mt-5 text-lg leading-8 text-gray-100">{journey.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Implementation steps</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">How this stage works</h2>
              <div className="mt-8 space-y-4">
                {journey.steps.map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-primary-50 text-sm font-bold text-primary-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-950 p-4 shadow-lg">
              <BrandedScreenshot
                src={journey.screenshot}
                alt={`${journey.title} screenshot`}
                className="h-full min-h-[360px] w-full rounded-md"
                imageClassName="h-full min-h-[360px] w-full rounded-md object-cover object-left-top"
              />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Expected outcomes</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">What the customer gets</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {journey.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                  <CheckCircleIcon className="h-6 w-6 text-success-600" />
                  <p className="mt-4 text-sm leading-6 text-gray-700">{outcome}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700"
              >
                Start company registration
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:border-primary-300 hover:text-primary-700"
              >
                Login to workspace
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
