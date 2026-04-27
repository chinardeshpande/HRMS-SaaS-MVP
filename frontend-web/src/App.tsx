import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import FeatureDetail from './pages/FeatureDetail';
import ModernLogin from './pages/ModernLogin';
import CompanySignup from './pages/CompanySignup';
import EmailVerification from './pages/EmailVerification';
import EmailVerificationPending from './pages/EmailVerificationPending';
import CreatePassword from './pages/CreatePassword';
import AcceptInvitation from './pages/AcceptInvitation';
import OnboardingWizard from './components/onboarding/OnboardingWizard';

// New Registration Flow Pages
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import SetupPassword from './pages/SetupPassword';
import Welcome from './pages/Welcome';
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
import ModernReports from './pages/ModernReports';
import ModernDocuments from './pages/ModernDocuments';
import ModernOrgChart from './pages/ModernOrgChart';
import MyHRDocuments from './pages/MyHRDocuments';

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

              {/* New Registration Flow */}
              <Route path="/register" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/setup-password" element={<SetupPassword />} />
              <Route path="/welcome" element={<Welcome />} />

              {/* Legacy routes (kept for backward compatibility) */}
              <Route path="/signup" element={<CompanySignup />} />
              <Route path="/email-verification-pending" element={<EmailVerificationPending />} />
              <Route path="/verify-email/:token" element={<EmailVerification />} />
              <Route path="/create-password" element={<CreatePassword />} />
              <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
              <Route path="/features/:featureId" element={<FeatureDetail />} />

              {/* Onboarding route (semi-protected - requires verified registration) */}
              <Route path="/onboarding-wizard" element={<OnboardingWizard />} />

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
              <Route path="/reports" element={<ModernReports />} />
              <Route path="/documents" element={<ModernDocuments />} />
              <Route path="/my-hr-documents" element={<MyHRDocuments />} />
              <Route path="/org-chart" element={<ModernOrgChart />} />
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
