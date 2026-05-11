import { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoles, AccessRule } from '../../config/accessControl';
import { ModernLayout } from '../layout/ModernLayout';

interface ProtectedRouteProps {
  children: ReactNode;
  access: AccessRule;
}

export default function ProtectedRoute({ children, access }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
          <p className="text-sm text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessRoles(user?.role, access.roles)) {
    return (
      <ModernLayout>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <LockClosedIcon className="h-6 w-6 text-gray-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {access.deniedTitle || 'This workspace is not available for your role'}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              {access.deniedMessage ||
                'Your current role does not include access to this page. Use the main workspace modules available in your navigation.'}
            </p>
            <div className="mt-6">
              <Link to="/dashboard" className="btn btn-primary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return <>{children}</>;
}

