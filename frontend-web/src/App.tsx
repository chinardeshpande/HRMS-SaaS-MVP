import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeatureDetail = lazy(() => import('./pages/FeatureDetail'));
const ModernLogin = lazy(() => import('./pages/ModernLogin'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CompanySignup = lazy(() => import('./pages/CompanySignup'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));
const EmailVerificationPending = lazy(() => import('./pages/EmailVerificationPending'));
const CreatePassword = lazy(() => import('./pages/CreatePassword'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const OnboardingWizard = lazy(() => import('./components/onboarding/OnboardingWizard'));

// New Registration Flow Pages
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const Welcome = lazy(() => import('./pages/Welcome'));
const ModernDashboard = lazy(() => import('./pages/ModernDashboard'));
const ModernEmployees = lazy(() => import('./pages/ModernEmployees'));
const ModernEmployeeDetail = lazy(() => import('./pages/ModernEmployeeDetail'));
const ModernAttendance = lazy(() => import('./pages/ModernAttendance'));
const ModernLeave = lazy(() => import('./pages/ModernLeave'));
const ModernDepartments = lazy(() => import('./pages/ModernDepartments'));
const ModernDesignations = lazy(() => import('./pages/ModernDesignations'));
const ModernPerformanceDashboard = lazy(() => import('./pages/ModernPerformanceDashboard'));
const PerformanceReviewDetails = lazy(() => import('./pages/PerformanceReviewDetails'));
const CandidateDetails = lazy(() => import('./pages/CandidateDetails'));
const ProbationCaseDetails = lazy(() => import('./pages/ProbationCaseDetails'));
const ModernOnboardingDashboard = lazy(() => import('./pages/ModernOnboardingDashboard'));
const ModernProbationTracker = lazy(() => import('./pages/ModernProbationTracker'));
const ModernExitDashboard = lazy(() => import('./pages/ModernExitDashboard'));
const ExitCaseDetails = lazy(() => import('./pages/ExitCaseDetails'));
const ModernCalendar = lazy(() => import('./pages/ModernCalendar'));
const ModernHRConnect = lazy(() => import('./pages/ModernHRConnect'));
const ChatConversation = lazy(() => import('./pages/ChatConversation'));
const TicketDetails = lazy(() => import('./pages/TicketDetails'));
const GroupManagement = lazy(() => import('./pages/GroupManagement'));
const ModernSettings = lazy(() => import('./pages/ModernSettings'));
const ModernReports = lazy(() => import('./pages/ModernReports'));
const ModernDocuments = lazy(() => import('./pages/ModernDocuments'));
const ModernOrgChart = lazy(() => import('./pages/ModernOrgChart'));
const MyHRDocuments = lazy(() => import('./pages/MyHRDocuments'));

// Employee Action Pages
const ModernEditProfile = lazy(() => import('./pages/ModernEditProfile'));
const ModernTransfer = lazy(() => import('./pages/ModernTransfer'));
const ModernPromote = lazy(() => import('./pages/ModernPromote'));
const ModernCompensation = lazy(() => import('./pages/ModernCompensation'));
const ModernPerformanceReview = lazy(() => import('./pages/ModernPerformanceReview'));
const ModernEmployeeAttendance = lazy(() => import('./pages/ModernEmployeeAttendance'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
              {/* Public routes */}
              <Route path="/login" element={<ModernLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
