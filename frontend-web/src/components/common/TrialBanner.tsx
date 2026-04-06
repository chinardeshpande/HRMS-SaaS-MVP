import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface TrialBannerProps {
  trialEndDate: Date;
  onUpgrade?: () => void;
}

export const TrialBanner = ({ trialEndDate, onUpgrade }: TrialBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const end = new Date(trialEndDate);
      const diff = end.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, days));
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [trialEndDate]);

  if (!isVisible || daysLeft > 7) {
    return null; // Only show when trial has 7 days or less
  }

  const getBannerColor = () => {
    if (daysLeft === 0) return 'bg-red-600';
    if (daysLeft <= 3) return 'bg-orange-600';
    return 'bg-primary-600';
  };

  const getMessage = () => {
    if (daysLeft === 0) {
      return 'Your trial has expired. Upgrade now to continue using AuroraHR.';
    }
    if (daysLeft === 1) {
      return 'Your trial expires tomorrow. Upgrade now to keep your data.';
    }
    return `Your trial expires in ${daysLeft} days. Upgrade now for uninterrupted access.`;
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/settings/subscription');
    }
  };

  return (
    <div className={`${getBannerColor()} relative`}>
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-white/20">
              <SparklesIcon className="h-6 w-6 text-white" />
            </span>
            <p className="ml-3 font-medium text-white truncate">
              <span className="md:hidden">{getMessage()}</span>
              <span className="hidden md:inline">{getMessage()}</span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={handleUpgrade}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="-mr-1 flex p-2 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
