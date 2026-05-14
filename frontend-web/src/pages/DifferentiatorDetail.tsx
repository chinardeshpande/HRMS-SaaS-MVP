import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import BrandedScreenshot from '../components/landing/BrandedScreenshot';
import { getDifferentiatorById } from '../data/differentiators';

export default function DifferentiatorDetail() {
  const navigate = useNavigate();
  const { differentiatorId } = useParams<{ differentiatorId: string }>();
  const differentiator = differentiatorId ? getDifferentiatorById(differentiatorId) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [differentiatorId]);

  if (!differentiator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-md border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Differentiator not found</h1>
          <button onClick={() => navigate('/')} className="mt-6 rounded-md bg-primary-600 px-5 py-3 font-semibold text-white">
            Back to AuroraHR
          </button>
        </div>
      </div>
    );
  }

  const Icon = differentiator.icon;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/images/aurorahr-logo-primary.svg"
              alt="AuroraHR"
              className="h-9 w-auto cursor-pointer"
              onClick={() => navigate('/')}
            />
            <button
              onClick={() => navigate('/', { state: { scrollTo: 'unique', uniqueTab: 'differentiators' } })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-primary-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Key Differentiators
            </button>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Sign Up / Register
          </button>
        </div>
      </nav>

      <header className="pt-16">
        <div className="bg-primary-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-white text-primary-700 shadow-sm">
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">AuroraHR differentiator</p>
              <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">{differentiator.title}</h1>
              <p className="mt-5 text-lg leading-8 text-gray-700">{differentiator.capability}</p>
            </div>
            <BrandedScreenshot
              src={differentiator.image}
              alt={`${differentiator.title} screenshot`}
              className="rounded-md border border-gray-200 bg-white p-3 shadow-xl"
              imageClassName="h-[430px] w-full rounded-md object-cover object-left-top"
            />
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Capability description</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Why this matters in a real HR rollout</h2>
              <p className="mt-4 text-base leading-7 text-gray-600">{differentiator.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {differentiator.proofPoints.map((point) => (
                <div key={point} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                  <CheckCircleIcon className="h-6 w-6 text-success-600" />
                  <p className="mt-4 text-sm leading-6 text-gray-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold">See this in a guided AuroraHR demo.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
                Use this differentiator as part of the customer story for GCC launches, SMEs, and startup HR operations.
              </p>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center rounded-md bg-white px-5 py-3 font-semibold text-primary-700 hover:bg-gray-100"
            >
              Register company
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
