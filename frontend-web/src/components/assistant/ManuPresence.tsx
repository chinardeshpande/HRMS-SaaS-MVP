import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type ManuMood = 'welcome' | 'thoughtful' | 'celebrate' | 'review';

interface ManuScene {
  match: RegExp;
  mood: ManuMood;
  label: string;
  placement: 'right-edge' | 'bottom-right' | 'bottom-center' | 'upper-right';
}

const scenes: ManuScene[] = [
  { match: /dashboard|welcome/i, mood: 'welcome', label: 'Manu welcoming you into today’s work', placement: 'right-edge' },
  { match: /attendance|leave|calendar/i, mood: 'thoughtful', label: 'Manu thoughtfully reviewing time and attendance', placement: 'bottom-right' },
  { match: /document|compensation|payroll|payslip|exit/i, mood: 'review', label: 'Manu gently reminding you to review the details', placement: 'upper-right' },
  { match: /onboarding|probation|performance|promote/i, mood: 'celebrate', label: 'Manu celebrating a people milestone', placement: 'bottom-center' },
  { match: /report|readiness|employee|master|settings|organization/i, mood: 'thoughtful', label: 'Manu looking closely at workforce insights', placement: 'bottom-right' },
  { match: /.*/, mood: 'welcome', label: 'Manu peeking in to accompany your work', placement: 'right-edge' },
];

const imageByMood: Record<ManuMood, string> = {
  welcome: '/images/assistant/peeks/manu-welcome.png',
  thoughtful: '/images/assistant/peeks/manu-thoughtful.png',
  celebrate: '/images/assistant/peeks/manu-celebrate.png',
  review: '/images/assistant/peeks/manu-review.png',
};

const placementClasses: Record<ManuScene['placement'], string> = {
  'right-edge': 'right-[-38px] top-[34%] w-[170px] xl:w-[205px]',
  'bottom-right': 'bottom-[-28px] right-[86px] w-[155px] xl:w-[190px]',
  'bottom-center': 'bottom-[-34px] right-[22%] w-[160px] xl:w-[200px]',
  'upper-right': 'right-[-44px] top-[22%] w-[165px] xl:w-[205px]',
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
