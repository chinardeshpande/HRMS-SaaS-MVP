import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const links = [
  ['Product tour', 'modules'],
  ['Platform', 'platform'],
  ['Why AuraHR', 'unique'],
  ['Adoption', 'adoption'],
  ['Who it’s for', 'people'],
] as const;

interface MarketingNavProps {
  context?: string;
}

export default function MarketingNav({ context }: MarketingNavProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const goHome = (scrollTo?: string) => navigate('/', scrollTo ? { state: { scrollTo } } : undefined);

  const follow = (target?: string) => {
    setMobileOpen(false);
    goHome(target);
  };

  return (
    <nav className="aura-detail-nav fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur" aria-label="Marketing navigation">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <button onClick={() => follow()} aria-label="AuraHR home" className="flex-none">
          <img src="/brand/aura/aura-logo-exact-transparent.png" alt="AuraHR" className="h-9 w-auto" />
        </button>
        {context && <span className="hidden border-l border-gray-200 pl-5 text-xs font-semibold text-gray-500 xl:block">{context}</span>}
        <div className="ml-auto hidden items-center gap-5 lg:flex">
          {links.map(([label, target]) => (
            <button key={target} onClick={() => goHome(target)} className="text-sm font-semibold text-gray-600 transition-colors hover:text-primary-700">
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 lg:ml-2">
          <button onClick={() => navigate('/login')} className="hidden text-sm font-semibold text-gray-600 hover:text-primary-700 sm:block">Sign in</button>
          <button onClick={() => goHome('contact')} className="rounded-xl px-4 py-2 text-sm font-semibold text-white">Book a walkthrough</button>
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            className="rounded-lg border border-gray-200 p-2 text-gray-700 lg:hidden"
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map(([label, target]) => (
              <button key={target} onClick={() => follow(target)} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                {label}
              </button>
            ))}
            <button onClick={() => navigate('/login')} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700 sm:hidden">Sign in</button>
          </div>
        </div>
      )}
    </nav>
  );
}
