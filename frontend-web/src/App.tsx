import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import FeatureDetail from './pages/FeatureDetail';
import ModernLogin from './pages/ModernLogin';
import ModernDashboard from './pages/ModernDashboard';
import ModernEmployees from './pages/ModernEmployees';
import ModernEmployeeDetail from './pages/ModernEmployeeDetail';
import ModernAttendance from './pages/ModernAttendance';
import ModernLeave from './pages/ModernLeave';
import ModernDepartments from './pages/ModernDepartments';
import ModernDesignations from './pages/ModernDesignations';
import ModernPerformanceDashboard from './pages/ModernPerformanceDashboard';
import PerformanceReviewDetails from './pages/PerformanceReviewDetails';
import CandidateDetails from './pages/CandidateDetails';
import ProbationCaseDetails from './pages/ProbationCaseDetails';
import ModernOnboardingDashboard from './pages/ModernOnboardingDashboard';
import ModernProbationTracker from './pages/ModernProbationTracker';
import ModernExitDashboard from './pages/ModernExitDashboard';
import ExitCaseDetails from './pages/ExitCaseDetails';
import ModernCalendar from './pages/ModernCalendar';
import ModernHRConnect from './pages/ModernHRConnect';
import ChatConversation from './pages/ChatConversation';
import TicketDetails from './pages/TicketDetails';
import GroupManagement from './pages/GroupManagement';
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
              <Route path="/features/:featureId" element={<FeatureDetail />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ModernDashboard />} />
              <Route path="/employees" element={<ModernEmployees />} />
              <Route path="/employees/:id" element={<ModernEmployeeDetail />} />
              <Route path="/departments" element={<ModernDepartments />} />
              <Route path="/designations" element={<ModernDesignations />} />
              <Route path="/attendance" element={<ModernAttendance />} />
              <Route path="/leave" element={<ModernLeave />} />
              <Route path="/performance" element={<ModernPerformanceDashboard />} />
              <Route path="/performance/:reviewId" element={<PerformanceReviewDetails />} />
              <Route path="/onboarding" element={<ModernOnboardingDashboard />} />
              <Route path="/onboarding/candidate/:candidateId" element={<CandidateDetails />} />
              <Route path="/probation/case/:probationId" element={<ProbationCaseDetails />} />
              <Route path="/onboarding-dashboard" element={<ModernOnboardingDashboard />} />
              <Route path="/probation" element={<ModernProbationTracker />} />
              <Route path="/exit" element={<ModernExitDashboard />} />
              <Route path="/exit/:exitId" element={<ExitCaseDetails />} />
              <Route path="/calendar" element={<ModernCalendar />} />
              <Route path="/hr-connect" element={<ModernHRConnect />} />
              <Route path="/chat/:conversationId" element={<ChatConversation />} />
              <Route path="/ticket/:ticketId" element={<TicketDetails />} />
              <Route path="/groups" element={<GroupManagement />} />
              <Route path="/settings" element={<ModernSettings />} />

              {/* Employee Action routes */}
              <Route path="/edit-profile" element={<ModernEditProfile />} />
              <Route path="/transfer" element={<ModernTransfer />} />
              <Route path="/promote" element={<ModernPromote />} />
              <Route path="/compensation" element={<ModernCompensation />} />
              <Route path="/performance-review" element={<ModernPerformanceReview />} />
              <Route path="/employee-attendance" element={<ModernEmployeeAttendance />} />

              {/* Default route */}
              <Route path="/" element={<LandingPage />} />

              {/* 404 route */}
              <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
