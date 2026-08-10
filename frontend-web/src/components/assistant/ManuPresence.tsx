import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PresenceStory {
  match: RegExp;
  eyebrow: string;
  title: string;
  note: string;
  image: string;
  imagePosition: string;
}

const stories: PresenceStory[] = [
  {
    match: /attendance/i,
    eyebrow: 'Manu watches the clock with you',
    title: 'Every attendance moment stays explainable.',
    note: 'Mark today, review exceptions, and keep corrections visible to the right approver.',
    image: '/images/assistant/contextual/manu-attendance.png',
    imagePosition: '72% center',
  },
  {
    match: /document|compensation|payroll|payslip|exit/i,
    eyebrow: 'Manu keeps the paper trail close',
    title: 'Documents, approvals and hand-offs stay connected.',
    note: 'A calm visual guide—not an invisible automation. You remain in control of every action.',
    image: '/images/assistant/contextual/manu-documents-payroll.png',
    imagePosition: '28% center',
  },
  {
    match: /report|readiness|employee|dashboard|settings/i,
    eyebrow: 'Manu notices what needs attention',
    title: 'See the gaps before they become surprises.',
    note: 'Use the visible records and reports below; Manu adds context without changing the underlying workflow.',
    image: '/images/assistant/contextual/manu-insights.png',
    imagePosition: '78% center',
  },
  {
    match: /leave|onboarding|probation|performance/i,
    eyebrow: 'Manu stays beside the journey',
    title: 'Human decisions deserve clear context.',
    note: 'Follow the workflow below and keep approvals, evidence and ownership explicit.',
    image: '/images/assistant/contextual/manu-attendance.png',
    imagePosition: '72% center',
  },
];

export default function ManuPresence() {
  const location = useLocation();
  const story = useMemo(
    () => stories.find((candidate) => candidate.match.test(location.pathname)),
    [location.pathname]
  );
  const [dismissedPath, setDismissedPath] = useState<string | null>(null);

  useEffect(() => {
    setDismissedPath(null);
  }, [location.pathname]);

  if (!story || dismissedPath === location.pathname) return null;

  return (
    <aside
      aria-label="Context from Manu"
      className="pointer-events-none fixed right-5 top-28 z-30 hidden w-[330px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(84,65,160,0.24)] backdrop-blur-xl 2xl:block"
    >
      <div
        className="relative h-44 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${story.image})`, backgroundPosition: story.imagePosition }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/50 to-transparent" />
        <div className="absolute left-5 top-5 max-w-[175px]">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-violet-700 shadow-sm">
            <SparklesIcon className="h-3.5 w-3.5" />
            Manu is here
          </div>
          <p className="text-sm font-extrabold leading-snug text-slate-900">{story.eyebrow}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissedPath(location.pathname)}
          className="pointer-events-auto absolute right-3 top-3 rounded-full bg-white/85 p-1.5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
          aria-label="Hide Manu on this screen"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 py-4">
        <h2 className="text-base font-extrabold leading-snug text-slate-900">{story.title}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{story.note}</p>
      </div>
    </aside>
  );
}
