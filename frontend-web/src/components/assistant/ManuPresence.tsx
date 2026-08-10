import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type ManuMood = 'welcome' | 'thoughtful' | 'celebrate' | 'review';

interface ManuScene {
  match: RegExp;
  mood: ManuMood;
  label: string;
  placement: 'seam-dashboard' | 'seam-high' | 'seam-mid' | 'seam-low' | 'seam-bottom';
}

const scenes: ManuScene[] = [
  { match: /dashboard/i, mood: 'welcome', label: 'Manu welcoming you into today’s work', placement: 'seam-dashboard' },
  { match: /welcome/i, mood: 'welcome', label: 'Manu welcoming you into today’s work', placement: 'seam-mid' },
  { match: /attendance|leave|calendar/i, mood: 'thoughtful', label: 'Manu thoughtfully reviewing time and attendance', placement: 'seam-low' },
  { match: /document|compensation|payroll|payslip|exit/i, mood: 'review', label: 'Manu gently reminding you to review the details', placement: 'seam-high' },
  { match: /onboarding|probation|performance|promote/i, mood: 'celebrate', label: 'Manu celebrating a people milestone', placement: 'seam-bottom' },
  { match: /report|readiness|employee|master|settings|organization/i, mood: 'thoughtful', label: 'Manu looking closely at workforce insights', placement: 'seam-low' },
  { match: /.*/, mood: 'welcome', label: 'Manu peeking in to accompany your work', placement: 'seam-mid' },
];

const imageByMood: Record<ManuMood, string> = {
  welcome: '/images/assistant/peeks/manu-welcome.png',
  thoughtful: '/images/assistant/peeks/manu-thoughtful.png',
  celebrate: '/images/assistant/peeks/manu-celebrate.png',
  review: '/images/assistant/peeks/manu-review.png',
};

const placementClasses: Record<ManuScene['placement'], string> = {
  // The desktop navigation is 256px wide. Starting Manu at ~216px lets
  // her peek over its right edge while keeping the content-side footprint
  // compact and permanently clear of the assistant launcher.
  'seam-dashboard': 'left-[148px] top-[38%] w-[154px] xl:left-[152px] xl:w-[185px]',
  'seam-high': 'left-[212px] top-[23%] w-[158px] xl:left-[216px] xl:w-[190px]',
  'seam-mid': 'left-[214px] top-[38%] w-[154px] xl:left-[218px] xl:w-[185px]',
  'seam-low': 'left-[216px] top-[55%] w-[150px] xl:left-[220px] xl:w-[180px]',
  'seam-bottom': 'bottom-[38px] left-[214px] w-[154px] xl:left-[218px] xl:w-[185px]',
};

/**
 * A purely visual Manu layer. It never opens the assistant, captures clicks,
 * reads page data, or performs actions. The route only selects her mood.
 */
export default function ManuPresence() {
  const { pathname } = useLocation();
  const scene = useMemo(() => scenes.find((candidate) => candidate.match.test(pathname))!, [pathname]);

  return (
    <div
      className={`pointer-events-none fixed z-20 hidden select-none lg:block ${placementClasses[scene.placement]}`}
      aria-label={scene.label}
      role="img"
    >
      <div className="absolute bottom-2 left-1/2 h-12 w-4/5 -translate-x-1/2 rounded-full bg-violet-300/20 blur-2xl" />
      <img
        key={`${scene.mood}-${scene.placement}`}
        src={imageByMood[scene.mood]}
        alt=""
        aria-hidden="true"
        className="relative h-auto w-full drop-shadow-[0_18px_24px_rgba(76,56,140,0.20)] motion-safe:animate-[manu-peek_520ms_cubic-bezier(0.22,1,0.36,1)]"
      />
      <style>{`
        @keyframes manu-peek {
          from { opacity: 0; transform: translateY(22px) scale(.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label^="Manu"] img { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
