import { lazy, Suspense, ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { routeAccessRules, AccessRule } from './config/accessControl';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeatureDetail = lazy(() => import('./pages/FeatureDetail'));
const DifferentiatorDetail = lazy(() => import('./pages/DifferentiatorDetail'));
const AdoptionJourneyDetail = lazy(() => import('./pages/AdoptionJourneyDetail'));
const PlatformPillarDetail = lazy(() => import('./pages/PlatformPillarDetail'));
const MarketingStoryDetail = lazy(() => import('./pages/MarketingStoryDetail'));
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
const ACVReadinessDashboard = lazy(() => import('./pages/ACVReadinessDashboard'));
const ModernEmployees = lazy(() => import('./pages/ModernEmployees'));
const ModernEmployeeDetail = lazy(() => import('./pages/ModernEmployeeDetail'));
const ModernAttendance = lazy(() => import('./pages/ModernAttendance'));
const ModernLeave = lazy(() => import('./pages/ModernLeave'));
const ModernMasterData = lazy(() => import('./pages/ModernMasterData'));
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
const PayrollOperations = lazy(() => import('./pages/PayrollOperations'));

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
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
        <p className="text-sm text-gray-600">Loading workspace...</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  const hasSession = Boolean(localStorage.getItem('tokens'));
  const safePath = hasSession ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-lg w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-semibold">
          404
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The page you opened is not available in this workspace.
        </p>
        <Link to={safePath} className="btn-primary mt-6 inline-flex">
          Go to {hasSession ? 'dashboard' : 'login'}
        </Link>
      </div>
    </div>
  );
}

const routeAccessByPath = routeAccessRules.reduce<Record<string, AccessRule>>((acc, rule) => {
  acc[rule.path] = rule;
  return acc;
}, {});

function protectedElement(path: string, element: ReactElement) {
  const access = routeAccessByPath[path];

  if (!access) {
    throw new Error(`Missing route access rule for ${path}`);
  }

  return <ProtectedRoute access={access}>{element}</ProtectedRoute>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
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
                <Route path="/differentiators/:differentiatorId" element={<DifferentiatorDetail />} />
                <Route path="/platform/:pillarId" element={<PlatformPillarDetail />} />
                <Route path="/journeys/:journeyId" element={<AdoptionJourneyDetail />} />
                <Route path="/stories/:storyId" element={<MarketingStoryDetail />} />

                {/* Onboarding route (requires verified admin session) */}
                <Route path="/onboarding-wizard" element={protectedElement('/onboarding-wizard', <OnboardingWizard />)} />

                {/* Protected routes */}
                <Route path="/dashboard" element={protectedElement('/dashboard', <ModernDashboard />)} />
                <Route path="/acv-readiness" element={protectedElement('/acv-readiness', <ACVReadinessDashboard />)} />
                <Route path="/employees" element={protectedElement('/employees', <ModernEmployees />)} />
                <Route path="/employees/:id" element={protectedElement('/employees/:id', <ModernEmployeeDetail />)} />
                <Route path="/master-data" element={protectedElement('/master-data', <ModernMasterData />)} />
                <Route path="/departments" element={protectedElement('/departments', <ModernDepartments />)} />
                <Route path="/designations" element={protectedElement('/designations', <ModernDesignations />)} />
                <Route path="/attendance" element={protectedElement('/attendance', <ModernAttendance />)} />
                <Route path="/leave" element={protectedElement('/leave', <ModernLeave />)} />
                <Route path="/performance" element={protectedElement('/performance', <ModernPerformanceDashboard />)} />
                <Route path="/performance/:reviewId" element={protectedElement('/performance/:reviewId', <PerformanceReviewDetails />)} />
                <Route path="/onboarding" element={protectedElement('/onboarding', <ModernOnboardingDashboard />)} />
                <Route path="/onboarding/candidate/:candidateId" element={protectedElement('/onboarding/candidate/:candidateId', <CandidateDetails />)} />
                <Route path="/probation/case/:probationId" element={protectedElement('/probation/case/:probationId', <ProbationCaseDetails />)} />
                <Route path="/onboarding-dashboard" element={protectedElement('/onboarding-dashboard', <ModernOnboardingDashboard />)} />
                <Route path="/probation" element={protectedElement('/probation', <ModernProbationTracker />)} />
                <Route path="/exit" element={protectedElement('/exit', <ModernExitDashboard />)} />
                <Route path="/exit/:exitId" element={protectedElement('/exit/:exitId', <ExitCaseDetails />)} />
                <Route path="/calendar" element={protectedElement('/calendar', <ModernCalendar />)} />
                <Route path="/hr-connect" element={protectedElement('/hr-connect', <ModernHRConnect />)} />
                <Route path="/chat/:conversationId" element={protectedElement('/chat/:conversationId', <ChatConversation />)} />
                <Route path="/ticket/:ticketId" element={protectedElement('/ticket/:ticketId', <TicketDetails />)} />
                <Route path="/groups" element={protectedElement('/groups', <GroupManagement />)} />
                <Route path="/reports" element={protectedElement('/reports', <ModernReports />)} />
                <Route path="/documents" element={protectedElement('/documents', <ModernDocuments />)} />
                <Route path="/my-hr-documents" element={protectedElement('/my-hr-documents', <MyHRDocuments />)} />
                <Route path="/org-chart" element={protectedElement('/org-chart', <ModernOrgChart />)} />
                <Route path="/payroll-operations" element={protectedElement('/payroll-operations', <PayrollOperations />)} />
                <Route path="/settings" element={protectedElement('/settings', <ModernSettings />)} />

                {/* Employee Action routes */}
                <Route path="/edit-profile" element={protectedElement('/edit-profile', <ModernEditProfile />)} />
                <Route path="/transfer" element={protectedElement('/transfer', <ModernTransfer />)} />
                <Route path="/promote" element={protectedElement('/promote', <ModernPromote />)} />
                <Route path="/compensation" element={protectedElement('/compensation', <ModernCompensation />)} />
                <Route path="/performance-review" element={protectedElement('/performance-review', <ModernPerformanceReview />)} />
                <Route path="/employee-attendance" element={protectedElement('/employee-attendance', <ModernEmployeeAttendance />)} />

                {/* Default route */}
                <Route path="/" element={<LandingPage />} />

                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
