import { ReactNode } from 'react';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  bulkUploadAction?: {
    label: string;
    onClick: () => void;
  };
  helpLink?: {
    label: string;
    href: string;
  };
}

export const EmptyState = ({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  bulkUploadAction,
  helpLink,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
        {icon || (
          <svg
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {primaryAction.icon || <PlusIcon className="h-5 w-5 mr-2" />}
            {primaryAction.label}
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            {secondaryAction.icon || <DocumentTextIcon className="h-5 w-5 mr-2" />}
            {secondaryAction.label}
          </button>
        )}
      </div>

      {bulkUploadAction && (
        <div className="mt-6">
          <button
            onClick={bulkUploadAction.onClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            {bulkUploadAction.label}
          </button>
        </div>
      )}

      {helpLink && (
        <div className="mt-8">
          <a
            href={helpLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            {helpLink.label} →
          </a>
        </div>
      )}
    </div>
  );
};
