import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import BrandedScreenshot from '../components/landing/BrandedScreenshot';
import MarketingNav from '../components/landing/MarketingNav';
import { getMarketingStoryById, marketingStories } from '../data/marketingStories';
import './MarketingDetail.css';

export default function MarketingStoryDetail() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const story = storyId ? getMarketingStoryById(storyId) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [storyId]);

  if (!story) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">AuraHR story not found</h1>
          <button onClick={() => navigate('/')} className="mt-6 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white">
            Return to AuraHR
          </button>
        </div>
      </div>
    );
  }

  const related = marketingStories
    .filter((item) => item.category === story.category && item.id !== story.id)
    .slice(0, 3);

  return (
    <div className="aura-marketing-detail min-h-screen bg-white text-gray-900">
      <MarketingNav context={story.category} />

      <header className="pt-16">
        <div className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">{story.category}</p>
              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{story.title}</h1>
              <p className="mt-5 text-xl font-medium leading-8 text-gray-700">{story.lead}</p>
              <p className="mt-5 text-base leading-7 text-gray-600">{story.description}</p>
              <button
                onClick={() => navigate('/', { state: { scrollTo: 'contact' } })}
                className="mt-8 inline-flex items-center rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white"
              >
                Discuss this with AuraHR <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
            <BrandedScreenshot
              src={story.image}
              alt={`${story.title} in AuraHR`}
              className="rounded-3xl border border-primary-100 bg-white p-3 shadow-xl"
              imageClassName="max-h-[470px] w-full rounded-2xl object-contain object-left-top"
            />
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">What this unlocks</p>
              <h2 className="mt-3 text-3xl font-bold">Clarity people can act on</h2>
              <div className="mt-8 grid gap-4">
                {story.highlights.map((highlight) => (
                  <article key={highlight} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <CheckCircleIcon className="h-6 w-6 text-teal-500" />
                    <p className="mt-3 text-sm leading-6 text-gray-700">{highlight}</p>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">Connected journey</p>
              <h2 className="mt-3 text-3xl font-bold">How it works inside AuraHR</h2>
              <div className="mt-8 grid gap-4">
                {story.journey.map((step, index) => (
                  <article key={step} className="flex gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">0{index + 1}</span>
                    <p className="self-center text-sm leading-6 text-gray-700">{step}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="px-4 py-16 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">Continue exploring</p>
              <h2 className="mt-3 text-3xl font-bold">More from {story.category.toLowerCase()}</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <button key={item.id} onClick={() => navigate(`/stories/${item.id}`)} className="group rounded-2xl border border-white/15 bg-white/10 p-6 text-left">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-300">Explore</span>
                    <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-300">{item.lead}</p>
                    <span className="mt-6 inline-flex items-center text-sm font-semibold text-white">Open story <ArrowRightIcon className="ml-2 h-4 w-4" /></span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
