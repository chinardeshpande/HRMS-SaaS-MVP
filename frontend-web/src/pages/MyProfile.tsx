import { useAuth } from '../context/AuthContext';
import { ModernLayout } from '../components/layout/ModernLayout';
import ModernEmployeeDetail from './ModernEmployeeDetail';

export default function MyProfile() {
  const { user } = useAuth();

  if (user?.employeeId) {
    return <ModernEmployeeDetail employeeId={user.employeeId} selfService />;
  }

  return (
    <ModernLayout>
      <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-xl font-semibold text-amber-900">Profile not linked yet</h1>
        <p className="mt-2 text-sm text-amber-800">
          Your login is not currently linked to an employee profile. Please contact your HR administrator.
        </p>
      </div>
    </ModernLayout>
  );
}
