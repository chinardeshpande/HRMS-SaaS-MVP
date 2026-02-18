import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  ChartBarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  StarIcon,
  UserIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  FlagIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

// Interfaces
interface Goal {
  goalId: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'pending_approval';
  category: 'individual' | 'team' | 'organizational';
  createdAt: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

interface Feedback {
  feedbackId: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  type: 'positive' | 'constructive' | 'recognition';
  message: string;
  createdAt: string;
  isAnonymous: boolean;
}

interface PerformanceReview {
  reviewId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  reviewerId: string;
  reviewerName: string;
  period: string;
  cycleId: string;
  technicalRating: number;
  communicationRating: number;
  leadershipRating: number;
  teamworkRating: number;
  overallRating: number;
  strengths: string;
  areasForImprovement: string;
  comments: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed';
  submittedAt?: string;
  completedAt?: string;
  employeeComments?: string;
}

interface TeamMember {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  position: string;
  goalsCompleted: number;
  totalGoals: number;
  avgRating: number;
  lastReviewDate: string;
  reviewStatus: 'pending' | 'completed' | 'not_started';
  pendingGoals: number;
}

interface ReviewCycle {
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  participantsCount: number;
  completedCount: number;
  description: string;
}

interface MyPerformanceStats {
  goalsCompleted: number;
  goalsInProgress: number;
  feedbackReceived: number;
  avgRating: number;
  pendingReviews: number;
  completedReviews: number;
}

interface TeamStats {
  totalMembers: number;
  avgTeamRating: number;
  goalsCompleted: number;
  pendingReviews: number;
  completedReviews: number;
  pendingGoalApprovals: number;
}

interface CompanyStats {
  totalEmployees: number;
  avgCompanyRating: number;
  activeReviewCycles: number;
  completionRate: number;
  totalGoals: number;
  totalFeedback: number;
}

type ViewType = 'my-performance' | 'team-performance' | 'company-performance';

export default function ModernPerformance() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('my-performance');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewCycleModal, setShowReviewCycleModal] = useState(false);
  const [showSelfAssessmentModal, setShowSelfAssessmentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.HR_ADMIN || user?.role === UserRole.SYSTEM_ADMIN;
  const isHR = user?.role === UserRole.HR_ADMIN || user?.role === UserRole.SYSTEM_ADMIN;

  // Mock data - My Performance (Employee View)
  const myStats: MyPerformanceStats = {
    goalsCompleted: 8,
    goalsInProgress: 3,
    feedbackReceived: 12,
    avgRating: 4.2,
    pendingReviews: 1,
    completedReviews: 4,
  };

  const myGoals: Goal[] = [
    {
      goalId: '1',
      employeeId: user?.employeeId || '',
      employeeName: user?.fullName || '',
      title: 'Complete React TypeScript Migration',
      description: 'Migrate all legacy JavaScript components to TypeScript',
      targetDate: '2025-03-15',
      progress: 75,
      status: 'in_progress',
      category: 'individual',
      createdAt: '2025-01-01',
      approvalStatus: 'approved',
      approvedBy: 'Sarah Johnson',
    },
    {
      goalId: '2',
      employeeId: user?.employeeId || '',
      employeeName: user?.fullName || '',
      title: 'Improve Code Review Turnaround',
      description: 'Reduce average code review time to under 4 hours',
      targetDate: '2025-02-28',
      progress: 100,
      status: 'completed',
      category: 'individual',
      createdAt: '2025-01-01',
      approvalStatus: 'approved',
      approvedBy: 'Sarah Johnson',
    },
    {
      goalId: '3',
      employeeId: user?.employeeId || '',
      employeeName: user?.fullName || '',
      title: 'Lead Team Workshop on Testing Best Practices',
      description: 'Conduct monthly workshops for team on unit testing and TDD',
      targetDate: '2025-04-30',
      progress: 30,
      status: 'in_progress',
      category: 'team',
      createdAt: '2025-01-15',
      approvalStatus: 'approved',
      approvedBy: 'Sarah Johnson',
    },
    {
      goalId: '4',
      employeeId: user?.employeeId || '',
      employeeName: user?.fullName || '',
      title: 'Achieve 95% Code Coverage',
      description: 'Improve test coverage across all modules',
      targetDate: '2025-05-30',
      progress: 0,
      status: 'pending_approval',
      category: 'individual',
      createdAt: '2025-02-08',
      approvalStatus: 'pending',
    },
  ];

  const myFeedback: Feedback[] = [
    {
      feedbackId: '1',
      fromEmployeeId: '2',
      fromEmployeeName: 'Sarah Johnson',
      toEmployeeId: user?.employeeId || '',
      toEmployeeName: user?.fullName || '',
      type: 'positive',
      message: 'Excellent work on the new dashboard feature. The UI is intuitive and the performance improvements are noticeable.',
      createdAt: '2025-02-08',
      isAnonymous: false,
    },
    {
      feedbackId: '2',
      fromEmployeeId: '3',
      fromEmployeeName: 'Michael Chen',
      toEmployeeId: user?.employeeId || '',
      toEmployeeName: user?.fullName || '',
      type: 'constructive',
      message: 'Consider adding more inline comments for complex algorithms. It would help the team understand the logic faster.',
      createdAt: '2025-02-05',
      isAnonymous: false,
    },
    {
      feedbackId: '3',
      fromEmployeeId: '4',
      fromEmployeeName: 'Anonymous',
      toEmployeeId: user?.employeeId || '',
      toEmployeeName: user?.fullName || '',
      type: 'recognition',
      message: 'Your mentoring has been invaluable to the junior developers. Thank you for your patience and guidance!',
      createdAt: '2025-02-01',
      isAnonymous: true,
    },
  ];

  const myReviews: PerformanceReview[] = [
    {
      reviewId: '1',
      employeeId: user?.employeeId || '',
      employeeName: user?.fullName || '',
      employeeCode: 'EMP001',
      department: 'Engineering',
      position: 'Senior Developer',
      reviewerId: '2',
      reviewerName: 'Sarah Johnson',
      period: 'Q4 2024',
      cycleId: '1',
      technicalRating: 4,
      communicationRating: 5,
      leadershipRating: 4,
      teamworkRating: 5,
      overallRating: 4.5,
      strengths: 'Strong technical skills, excellent mentor, proactive problem solver',
      areasForImprovement: 'Could improve documentation practices',
      comments: 'Outstanding performance this quarter. Keep up the great work!',
      status: 'completed',
      completedAt: '2025-01-15',
      employeeComments: 'Thank you for the feedback. Will focus on improving documentation.',
    },
  ];

  // Mock data - Team Performance (Manager View)
  const teamStats: TeamStats = {
    totalMembers: 8,
    avgTeamRating: 4.1,
    goalsCompleted: 45,
    pendingReviews: 3,
    completedReviews: 5,
    pendingGoalApprovals: 2,
  };

  const teamMembers: TeamMember[] = [
    {
      employeeId: '1',
      employeeCode: 'EMP001',
      employeeName: 'Alice Williams',
      department: 'Engineering',
      position: 'Senior Developer',
      goalsCompleted: 7,
      totalGoals: 9,
      avgRating: 4.5,
      lastReviewDate: '2025-01-15',
      reviewStatus: 'completed',
      pendingGoals: 0,
    },
    {
      employeeId: '2',
      employeeCode: 'EMP002',
      employeeName: 'Bob Anderson',
      department: 'Engineering',
      position: 'Developer',
      goalsCompleted: 5,
      totalGoals: 8,
      avgRating: 4.0,
      lastReviewDate: '2025-01-20',
      reviewStatus: 'completed',
      pendingGoals: 1,
    },
    {
      employeeId: '3',
      employeeCode: 'EMP003',
      employeeName: 'Carol Martinez',
      department: 'Engineering',
      position: 'Junior Developer',
      goalsCompleted: 4,
      totalGoals: 6,
      avgRating: 0,
      lastReviewDate: '-',
      reviewStatus: 'pending',
      pendingGoals: 0,
    },
    {
      employeeId: '4',
      employeeCode: 'EMP004',
      employeeName: 'David Lee',
      department: 'Engineering',
      position: 'Senior Developer',
      goalsCompleted: 8,
      totalGoals: 10,
      avgRating: 4.3,
      lastReviewDate: '2025-01-22',
      reviewStatus: 'completed',
      pendingGoals: 1,
    },
    {
      employeeId: '5',
      employeeCode: 'EMP005',
      employeeName: 'Emma Brown',
      department: 'Engineering',
      position: 'Developer',
      goalsCompleted: 6,
      totalGoals: 8,
      avgRating: 0,
      lastReviewDate: '-',
      reviewStatus: 'not_started',
      pendingGoals: 0,
    },
  ];

  // Mock data - Company Performance (HR View)
  const companyStats: CompanyStats = {
    totalEmployees: 150,
    avgCompanyRating: 4.0,
    activeReviewCycles: 1,
    completionRate: 85,
    totalGoals: 450,
    totalFeedback: 1250,
  };

  const reviewCycles: ReviewCycle[] = [
    {
      cycleId: '1',
      name: 'Q1 2025 Performance Review',
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      status: 'active',
      participantsCount: 150,
      completedCount: 127,
      description: 'Quarterly performance review for all employees',
    },
    {
      cycleId: '2',
      name: 'Q4 2024 Performance Review',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      status: 'completed',
      participantsCount: 145,
      completedCount: 145,
      description: 'End of year performance review',
    },
    {
      cycleId: '3',
      name: 'Mid-Year 2025 Review',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      status: 'upcoming',
      participantsCount: 0,
      completedCount: 0,
      description: 'Mid-year performance assessment',
    },
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getFeedbackColor = (type: string) => {
    const colors = {
      positive: 'bg-green-50 border-green-200',
      constructive: 'bg-blue-50 border-blue-200',
      recognition: 'bg-orange-50 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const getFeedbackIcon = (type: string) => {
    const icons = {
      positive: '👍',
      constructive: '💡',
      recognition: '🏆',
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const formatDate = (dateStr: string) => {
    if (dateStr === '-') return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleExportCSV = () => {
    console.log('Exporting performance data...');
  };

  const handleConductReview = (member: TeamMember) => {
    setSelectedEmployee(member);
    setShowReviewModal(true);
  };

  const handleApproveGoal = (goalId: string) => {
    console.log('Approving goal:', goalId);
  };

  const handleRejectGoal = (goalId: string) => {
    console.log('Rejecting goal:', goalId);
  };

  // View tabs
  const renderViewTabs = () => {
    return (
      <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        <button
          onClick={() => setActiveView('my-performance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
            activeView === 'my-performance'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>My Performance</span>
        </button>
        {isManager && (
          <button
            onClick={() => setActiveView('team-performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
              activeView === 'team-performance'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <UserGroupIcon className="h-4 w-4" />
            <span>Team Performance</span>
          </button>
        )}
        {isHR && (
          <button
            onClick={() => setActiveView('company-performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
              activeView === 'company-performance'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BuildingOfficeIcon className="h-4 w-4" />
            <span>Company Performance</span>
          </button>
        )}
      </div>
    );
  };

  // My Performance View (Employee)
  const renderMyPerformance = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Goals Completed
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myStats.goalsCompleted}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myStats.goalsInProgress}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Feedback Received
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myStats.feedbackReceived}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{myStats.avgRating}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">My Goals</h3>
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-500/30 flex items-center space-x-1.5 text-xs font-medium"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add Goal</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {myGoals.map((goal) => (
            <div
              key={goal.goalId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{goal.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(
                      goal.status
                    )}`}
                  >
                    {goal.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {goal.approvalStatus && (
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-medium ${getStatusColor(
                        goal.approvalStatus
                      )}`}
                    >
                      {goal.approvalStatus.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{goal.category} Goal</span>
                  <span>Due: {formatDate(goal.targetDate)}</span>
                </div>
                {goal.approvedBy && (
                  <p className="text-xs text-gray-500">Approved by: {goal.approvedBy}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Reviews Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">My Performance Reviews</h3>
        </div>
        <div className="p-6 space-y-3">
          {myReviews.map((review) => (
            <div
              key={review.reviewId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{review.period}</h4>
                  <p className="text-xs text-gray-600">Reviewed by: {review.reviewerName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.round(review.overallRating))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{review.overallRating}/5.0</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Technical</p>
                  <p className="font-semibold text-sm">{review.technicalRating}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Communication</p>
                  <p className="font-semibold text-sm">{review.communicationRating}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Leadership</p>
                  <p className="font-semibold text-sm">{review.leadershipRating}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Teamwork</p>
                  <p className="font-semibold text-sm">{review.teamworkRating}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Strengths:</p>
                  <p className="text-xs text-gray-600">{review.strengths}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Areas for Improvement:</p>
                  <p className="text-xs text-gray-600">{review.areasForImprovement}</p>
                </div>
                {review.employeeComments && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">My Comments:</p>
                    <p className="text-xs text-gray-600">{review.employeeComments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
        </div>
        <div className="p-6 space-y-3">
          {myFeedback.map((feedback) => (
            <div
              key={feedback.feedbackId}
              className={`border rounded-lg p-4 ${getFeedbackColor(feedback.type)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getFeedbackIcon(feedback.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {feedback.isAnonymous ? 'Anonymous' : feedback.fromEmployeeName}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      {formatDate(feedback.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">{feedback.message}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-gray-600 capitalize">
                    {feedback.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Team Performance View (Manager)
  const renderTeamPerformance = () => (
    <div className="space-y-6">
      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Team Members
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teamStats.totalMembers}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Team Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teamStats.avgTeamRating}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pending Reviews
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teamStats.pendingReviews}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pending Goal Approvals
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{teamStats.pendingGoalApprovals}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3">
              <FlagIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Team Members Performance</h3>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 flex items-center space-x-1.5 text-xs font-medium"
            >
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              <span>Give Feedback</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goals Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.employeeId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {member.employeeName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{member.employeeName}</p>
                        <p className="text-xs text-gray-500">{member.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{member.position}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                          style={{
                            width: `${(member.goalsCompleted / member.totalGoals) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {member.goalsCompleted}/{member.totalGoals}
                      </span>
                    </div>
                    {member.pendingGoals > 0 && (
                      <span className="text-xs text-yellow-600">
                        {member.pendingGoals} pending approval
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.avgRating > 0 ? (
                      <div className="flex items-center space-x-1">
                        {renderStars(Math.round(member.avgRating))}
                        <span className="text-xs text-gray-600 ml-1">({member.avgRating})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No rating yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        member.reviewStatus
                      )}`}
                    >
                      {member.reviewStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleConductReview(member)}
                        className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5 inline mr-1" />
                        Review
                      </button>
                      {member.pendingGoals > 0 && (
                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          <CheckIcon className="h-3.5 w-3.5 inline mr-1" />
                          Approve Goals
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Company Performance View (HR)
  const renderCompanyPerformance = () => (
    <div className="space-y-6">
      {/* Company Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Employees
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{companyStats.totalEmployees}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Company Avg Rating
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companyStats.avgCompanyRating}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companyStats.completionRate}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active Cycles
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companyStats.activeReviewCycles}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Goals
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companyStats.totalGoals}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-3">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Feedback
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {companyStats.totalFeedback}
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-3">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Review Cycles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Review Cycles</h3>
            <button
              onClick={() => setShowReviewCycleModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg shadow-orange-500/30 flex items-center space-x-1.5 text-xs font-medium"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Create Cycle</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {reviewCycles.map((cycle) => (
            <div
              key={cycle.cycleId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{cycle.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
                        cycle.status
                      )}`}
                    >
                      {cycle.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{cycle.description}</p>
                  <p className="text-xs text-gray-600">
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                  </p>
                  {cycle.status === 'active' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Completion Progress</span>
                        <span className="font-medium">
                          {cycle.completedCount}/{cycle.participantsCount} (
                          {Math.round((cycle.completedCount / cycle.participantsCount) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                          style={{
                            width: `${(cycle.completedCount / cycle.participantsCount) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <button className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Modals (simplified - keeping existing structure)
  const renderAddGoalModal = () => {
    if (!showAddGoalModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add New Goal</h3>
            <button
              onClick={() => setShowAddGoalModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Goal Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter goal title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Describe your goal"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option>Individual</option>
                  <option>Team</option>
                  <option>Organizational</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              onClick={() => setShowAddGoalModal(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowAddGoalModal(false)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 text-xs font-medium"
            >
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFeedbackModal = () => {
    if (!showFeedbackModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Give Feedback</h3>
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To Employee</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option>Select employee</option>
                {teamMembers.map(member => (
                  <option key={member.employeeId}>{member.employeeName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Feedback Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option>Positive</option>
                <option>Constructive</option>
                <option>Recognition</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                placeholder="Write your feedback..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-xs text-gray-700">Send anonymously</label>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 text-xs font-medium"
            >
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderConductReviewModal = () => {
    if (!showReviewModal || !selectedEmployee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[95vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Conduct Performance Review</h3>
              <p className="text-xs text-gray-600">{selectedEmployee.employeeName} - {selectedEmployee.position}</p>
            </div>
            <button
              onClick={() => {
                setShowReviewModal(false);
                setSelectedEmployee(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Review Period</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                <option>Q1 2025 Performance Review</option>
                <option>Q4 2024 Performance Review</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Technical Skills (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Communication (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Leadership (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teamwork (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Strengths</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="List employee's key strengths..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Areas for Improvement</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Suggest areas where employee can improve..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Additional Comments</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                placeholder="Any additional comments..."
              />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowReviewModal(false);
                setSelectedEmployee(null);
              }}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowReviewModal(false);
                setSelectedEmployee(null);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 text-xs font-medium"
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReviewCycleModal = () => {
    if (!showReviewCycleModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create Review Cycle</h3>
            <button
              onClick={() => setShowReviewCycleModal(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cycle Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Q2 2025 Performance Review"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={2}
                placeholder="Brief description of this review cycle"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Participants
              </label>
              <select
                multiple
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                size={5}
              >
                <option>All Employees</option>
                <option>Engineering Department</option>
                <option>Sales Department</option>
                <option>HR Department</option>
                <option>Custom Selection</option>
              </select>
              <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              onClick={() => setShowReviewCycleModal(false)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowReviewCycleModal(false)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 text-xs font-medium"
            >
              Create Cycle
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              {activeView === 'my-performance' && 'Track your goals, reviews, and feedback'}
              {activeView === 'team-performance' && 'Assess and manage team member performance'}
              {activeView === 'company-performance' && 'Company-wide performance analytics and workflows'}
            </p>
          </div>
          {isHR && activeView === 'company-performance' && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-1.5 text-xs font-medium"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>

        {/* View Tabs */}
        {renderViewTabs()}

        {/* Content based on active view */}
        {activeView === 'my-performance' && renderMyPerformance()}
        {activeView === 'team-performance' && renderTeamPerformance()}
        {activeView === 'company-performance' && renderCompanyPerformance()}

        {/* Modals */}
        {renderAddGoalModal()}
        {renderFeedbackModal()}
        {renderConductReviewModal()}
        {renderReviewCycleModal()}
      </div>
    </ModernLayout>
  );
}
