import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import SimpleLogin from './pages/SimpleLogin';
import ModernLogin from './pages/ModernLogin';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import Employees from './pages/Employees';
import ModernEmployees from './pages/ModernEmployees';
import EmployeeDetail from './pages/EmployeeDetail';
import ModernEmployeeDetail from './pages/ModernEmployeeDetail';
import ModernAttendance from './pages/ModernAttendance';
import ModernLeave from './pages/ModernLeave';
import ModernDepartments from './pages/ModernDepartments';
import ModernDesignations from './pages/ModernDesignations';
import ModernPerformance from './pages/ModernPerformance';
import ModernOnboarding from './pages/ModernOnboarding';
import ModernSettings from './pages/ModernSettings';

// Employee Action Pages
import ModernEditProfile from './pages/ModernEditProfile';
import ModernTransfer from './pages/ModernTransfer';
import ModernPromote from './pages/ModernPromote';
import ModernCompensation from './pages/ModernCompensation';
import ModernPerformanceReview from './pages/ModernPerformanceReview';
import ModernEmployeeAttendance from './pages/ModernEmployeeAttendance';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
              {/* Public routes */}
              <Route path="/login" element={<ModernLogin />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ModernDashboard />} />
              <Route path="/employees" element={<ModernEmployees />} />
              <Route path="/employees/:id" element={<ModernEmployeeDetail />} />
              <Route path="/departments" element={<ModernDepartments />} />
              <Route path="/designations" element={<ModernDesignations />} />
              <Route path="/attendance" element={<ModernAttendance />} />
              <Route path="/leave" element={<ModernLeave />} />
              <Route path="/performance" element={<ModernPerformance />} />
              <Route path="/onboarding" element={<ModernOnboarding />} />
              <Route path="/settings" element={<ModernSettings />} />

              {/* Employee Action routes */}
              <Route path="/edit-profile" element={<ModernEditProfile />} />
              <Route path="/transfer" element={<ModernTransfer />} />
              <Route path="/promote" element={<ModernPromote />} />
              <Route path="/compensation" element={<ModernCompensation />} />
              <Route path="/performance-review" element={<ModernPerformanceReview />} />
              <Route path="/employee-attendance" element={<ModernEmployeeAttendance />} />

              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* 404 route */}
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
