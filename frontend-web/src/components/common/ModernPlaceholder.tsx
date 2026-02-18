import { ModernLayout } from '../layout/ModernLayout';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ModernPlaceholderProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const ModernPlaceholder = ({ title, description, icon: Icon }: ModernPlaceholderProps) => {
  return (
    <ModernLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-6">
            {Icon ? (
              <Icon className="h-12 w-12 text-white" />
            ) : (
              <RocketLaunchIcon className="h-12 w-12 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-lg text-gray-600 mb-8">{description}</p>
          <div className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
            <RocketLaunchIcon className="h-5 w-5 mr-2" />
            Coming Soon in Next Release
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};
