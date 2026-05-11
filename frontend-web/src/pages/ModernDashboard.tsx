import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChevronDownIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import activityService, { Activity } from '../services/activityService';
import calendarService, { CalendarEvent } from '../services/calendarService';
import attendanceService, { Attendance, TimeEntryEdit } from '../services/attendanceService';
import leaveService, { LeaveBalance, LeaveRequest } from '../services/leaveService';
import hrConnectService, { Post } from '../services/hrConnectService';
import chatService from '../services/chatService';
import api from '../services/api';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  employeeTrend: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendanceTrend: number;
  upcomingOnboarding: number;
  activeProbation: number;
  probationEndingSoon: number;
  upcomingExits: number;
  exitThisMonth: number;
  pendingLeaveApprovals: number;
  pendingApprovals: number;
  departmentCount: number;
  designationCount: number;
}

type PersonaKind = 'owner' | 'hr' | 'manager' | 'employee';

interface PersonaDashboardData {
  leaveBalances: LeaveBalance[];
  myAttendance: Attendance[];
  pendingLeaveApprovals: LeaveRequest[];
  pendingRegularizations: TimeEntryEdit[];
  hrConnectPosts: Post[];
  unreadMessages: number;
}

const emptyPersonaData: PersonaDashboardData = {
  leaveBalances: [],
  myAttendance: [],
  pendingLeaveApprovals: [],
  pendingRegularizations: [],
  hrConnectPosts: [],
  unreadMessages: 0,
};

const emptyDashboardStats: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  employeeTrend: 0,
  presentToday: 0,
  absentToday: 0,
  onLeaveToday: 0,
  attendanceTrend: 0,
  upcomingOnboarding: 0,
  activeProbation: 0,
  probationEndingSoon: 0,
  upcomingExits: 0,
  exitThisMonth: 0,
  pendingLeaveApprovals: 0,
  pendingApprovals: 0,
  departmentCount: 0,
  designationCount: 0,
};

export default function ModernDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [personaData, setPersonaData] = useState<PersonaDashboardData>(emptyPersonaData);
  const [showApprovalsDropdown, setShowApprovalsDropdown] = useState(false);
  const approvalsDropdownRef = useRef<HTMLDivElement>(null);

  const normalizedRole = String(user?.role || '').toLowerCase();
  const persona: PersonaKind =
    normalizedRole === 'system_admin'
      ? 'owner'
      : normalizedRole === 'hr_admin'
        ? 'hr'
        : normalizedRole === 'manager'
          ? 'manager'
          : 'employee';
  const isOwner = persona === 'owner';
  const isHr = persona === 'hr';
  const isManager = persona === 'manager';
  const isEmployee = persona === 'employee';
  const canApprove = isOwner || isHr || isManager;

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
    fetchUpcomingEvents();
    fetchPersonaDashboardData();
  }, [persona]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<DashboardStats>('/dashboard/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setStats(emptyDashboardStats);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (approvalsDropdownRef.current && !approvalsDropdownRef.current.contains(event.target as Node)) {
        setShowApprovalsDropdown(false);
      }
    };

    if (showApprovalsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showApprovalsDropdown]);

  const fetchRecentActivities = async () => {
    try {
      const activities = await activityService.getRecentActivities();
      setRecentActivities(activities.slice(0, 6)); // Show top 6 activities
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const events = await calendarService.getUpcomingEvents(5); // Show next 5 events
      setUpcomingEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchPersonaDashboardData = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const isoDate = (date: Date) => date.toISOString().split('T')[0];

    const [
      leaveBalances,
      myAttendance,
      pendingLeaveApprovals,
      pendingRegularizations,
      hrConnectPosts,
      unreadMessages,
    ] = await Promise.allSettled([
      leaveService.getMyBalance(),
      attendanceService.getMyAttendance(isoDate(startOfMonth), isoDate(today)),
      canApprove ? leaveService.getPendingApprovals() : Promise.resolve([]),
      canApprove ? attendanceService.getPendingRegularizations() : Promise.resolve([]),
      hrConnectService.getAllPosts(),
      chatService.getUnreadCount(),
    ]);

    setPersonaData({
      leaveBalances: leaveBalances.status === 'fulfilled' ? leaveBalances.value : [],
      myAttendance: myAttendance.status === 'fulfilled' ? myAttendance.value : [],
      pendingLeaveApprovals: pendingLeaveApprovals.status === 'fulfilled' ? pendingLeaveApprovals.value : [],
      pendingRegularizations: pendingRegularizations.status === 'fulfilled' ? pendingRegularizations.value : [],
      hrConnectPosts: hrConnectPosts.status === 'fulfilled' ? hrConnectPosts.value.slice(0, 4) : [],
      unreadMessages: unreadMessages.status === 'fulfilled' ? unreadMessages.value : 0,
    });
  };

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      onboarding: { icon: UserPlusIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
      leave_approval: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
      performance_review: { icon: TrophyIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
      promotion: { icon: ArrowTrendingUpIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      transfer: { icon: ArrowPathIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
      increment: { icon: CurrencyDollarIcon, color: 'text-emerald-600', bg: 'bg-emerald-100' },
      bonus: { icon: CurrencyDollarIcon, color: 'text-teal-600', bg: 'bg-teal-100' },
      exit: { icon: ArrowRightOnRectangleIcon, color: 'text-red-600', bg: 'bg-red-100' },
      training: { icon: AcademicCapIcon, color: 'text-cyan-600', bg: 'bg-cyan-100' },
      new_post: { icon: MegaphoneIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
      new_chat_message: { icon: ChatBubbleLeftRightIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
      new_ticket: { icon: TicketIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
      ticket_update: { icon: TicketIcon, color: 'text-green-600', bg: 'bg-green-100' },
      other: { icon: BriefcaseIcon, color: 'text-gray-600', bg: 'bg-gray-100' },
    };
    return iconMap[type] || iconMap.other;
  };

  const getEventBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      joining: 'badge-success',
      performance_review: 'badge-warning',
      hr_event: 'badge-primary',
      training: 'badge-info',
      interview: 'badge-purple',
      exit_meeting: 'badge-danger',
      holiday: 'badge-success',
      meeting: 'badge-gray',
      other: 'badge-gray',
    };
    return colorMap[type] || 'badge-gray';
  };

  const formatEventDate = (event: CalendarEvent) => {
    const eventDate = new Date(event.startDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = eventDate.toDateString() === today.toDateString();
    const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return event.startTime ? `Today, ${event.startTime}` : 'Today';
    } else if (isTomorrow) {
      return event.startTime ? `Tomorrow, ${event.startTime}` : 'Tomorrow';
    } else {
      const formatted = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return event.startTime ? `${formatted}, ${event.startTime}` : formatted;
    }
  };

  const totalAvailableLeave = personaData.leaveBalances.reduce(
    (total, balance) =>
      total + (balance.available ?? Math.max(0, balance.totalAllocated + balance.carriedForward - balance.used - balance.pending)),
    0
  );

  const totalPendingLeaveDays = personaData.leaveBalances.reduce((total, balance) => total + (balance.pending || 0), 0);

  const getAttendanceMinutes = (scope: 'week' | 'month') => {
    const today = new Date();
    const start = scope === 'week'
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);

    return personaData.myAttendance.reduce((total, record) => {
      const recordDate = new Date(record.date);
      if (recordDate < start || recordDate > today) return total;
      return total + (record.workMinutes || 0);
    }, 0);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const dashboardTitle = {
    owner: 'Owner Implementation Console',
    hr: 'HR Operations',
    manager: 'Manager Team Work Queue',
    employee: 'Employee My HR',
  }[persona];

  const dashboardSubtitle = {
    owner: 'Company setup, subscription, master data, and commercial readiness.',
    hr: 'People operations, approvals, lifecycle workflows, and HR service delivery.',
    manager: 'Team availability, approvals, reviews, and exceptions that need action.',
    employee: 'Your attendance, leave, HR updates, documents, and self-service actions.',
  }[persona];

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const approvalOptions = [
    {
      label: 'Leave Approvals',
      icon: CalendarDaysIcon,
      count: personaData.pendingLeaveApprovals.length || stats?.pendingLeaveApprovals || 0,
      path: '/leave?filter=pending',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      label: 'Attendance Approvals',
      icon: ClockIcon,
      count: personaData.pendingRegularizations.length,
      path: '/attendance?filter=pending',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      label: 'Appraisal Reviews',
      icon: TrophyIcon,
      count: 0,
      path: '/performance?filter=pending',
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      label: 'Promotion Requests',
      icon: ArrowTrendingUpIcon,
      count: 0,
      path: '/employees?filter=promotions',
      color: 'text-indigo-600',
      bg: 'bg-indigo-100'
    },
    {
      label: 'Increment Approvals',
      icon: CurrencyDollarIcon,
      count: 0,
      path: '/employees?filter=increments',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100'
    },
  ];

  const handleApprovalNavigation = (path: string) => {
    setShowApprovalsDropdown(false);
    navigate(path);
  };

  const statCards = stats ? {
    owner: [
      {
        title: 'Employees',
        value: stats.totalEmployees,
        changeLabel: 'active workforce',
        icon: UsersIcon,
        iconColor: 'text-primary-600',
        iconBg: 'bg-primary-100',
        trend: stats.employeeTrend > 0 ? 'up' : stats.employeeTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/employees'),
      },
      {
        title: 'Setup Masters',
        value: stats.departmentCount + stats.designationCount,
        changeLabel: `${stats.departmentCount} departments, ${stats.designationCount} designations`,
        icon: Cog6ToothIcon,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        trend: 'neutral',
        onClick: () => navigate('/settings'),
      },
      {
        title: 'Onboarding Pipeline',
        value: stats.upcomingOnboarding,
        changeLabel: 'candidates in motion',
        icon: UserPlusIcon,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        trend: 'neutral',
        onClick: () => navigate('/onboarding'),
      },
      {
        title: 'Exits In Progress',
        value: stats.upcomingExits,
        changeLabel: `${stats.exitThisMonth} this month`,
        icon: ArrowRightOnRectangleIcon,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        trend: 'neutral',
        onClick: () => navigate('/exit'),
      },
      {
        title: 'Owner Settings',
        value: 'Ready',
        changeLabel: 'subscription and billing',
        icon: CreditCardIcon,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        trend: 'neutral',
        onClick: () => navigate('/settings'),
      },
    ],
    hr: [
      {
        title: 'Active Employees',
        value: stats.activeEmployees,
        changeLabel: 'organization-wide',
        icon: UsersIcon,
        iconColor: 'text-primary-600',
        iconBg: 'bg-primary-100',
        trend: stats.employeeTrend > 0 ? 'up' : stats.employeeTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/employees'),
      },
      {
        title: 'Present Today',
        value: stats.presentToday,
        changeLabel: `${stats.absentToday} absent, ${stats.onLeaveToday} on leave`,
        icon: CheckCircleIcon,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-100',
        trend: stats.attendanceTrend > 0 ? 'up' : stats.attendanceTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'Pending Approvals',
        value: stats.pendingApprovals + personaData.pendingRegularizations.length,
        changeLabel: 'leave and attendance',
        icon: BellAlertIcon,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        trend: 'neutral',
        onClick: () => setShowApprovalsDropdown(!showApprovalsDropdown),
        hasDropdown: true,
      },
      {
        title: 'Probation Active',
        value: stats.activeProbation,
        changeLabel: `${stats.probationEndingSoon} ending soon`,
        icon: AcademicCapIcon,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        trend: 'neutral',
        onClick: () => navigate('/probation'),
      },
      {
        title: 'HR Connect',
        value: personaData.hrConnectPosts.length,
        changeLabel: 'latest wall posts',
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'text-pink-600',
        iconBg: 'bg-pink-100',
        trend: 'neutral',
        onClick: () => navigate('/hr-connect'),
      },
    ],
    manager: [
      {
        title: 'Team Members',
        value: stats.totalEmployees,
        changeLabel: 'direct report scope',
        icon: UserGroupIcon,
        iconColor: 'text-primary-600',
        iconBg: 'bg-primary-100',
        trend: 'neutral',
        onClick: () => navigate('/employees'),
      },
      {
        title: 'Team Present',
        value: stats.presentToday,
        changeLabel: `${stats.absentToday} absent, ${stats.onLeaveToday} on leave`,
        icon: CheckCircleIcon,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-100',
        trend: 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'Pending Approvals',
        value: stats.pendingApprovals + personaData.pendingRegularizations.length,
        changeLabel: 'team actions due',
        icon: BellAlertIcon,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        trend: 'neutral',
        onClick: () => setShowApprovalsDropdown(!showApprovalsDropdown),
        hasDropdown: true,
      },
      {
        title: 'Performance',
        value: stats.activeProbation,
        changeLabel: 'probation/review focus',
        icon: TrophyIcon,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        trend: 'neutral',
        onClick: () => navigate('/performance'),
      },
      {
        title: 'Unread Messages',
        value: personaData.unreadMessages,
        changeLabel: 'chat updates',
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        trend: 'neutral',
        onClick: () => navigate('/hr-connect'),
      },
    ],
    employee: [
      {
        title: 'Leave Balance',
        value: totalAvailableLeave,
        changeLabel: `${totalPendingLeaveDays} days pending`,
        icon: ClipboardDocumentCheckIcon,
        iconColor: 'text-primary-600',
        iconBg: 'bg-primary-100',
        trend: 'neutral',
        onClick: () => navigate('/leave'),
      },
      {
        title: 'Week Hours',
        value: formatHours(getAttendanceMinutes('week')),
        changeLabel: 'worked this week',
        icon: ClockIcon,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-100',
        trend: 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'Month Hours',
        value: formatHours(getAttendanceMinutes('month')),
        changeLabel: 'worked this month',
        icon: CalendarDaysIcon,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        trend: 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'My Requests',
        value: stats.pendingApprovals,
        changeLabel: 'pending HR actions',
        icon: BellAlertIcon,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        trend: 'neutral',
        onClick: () => navigate('/leave'),
      },
      {
        title: 'Unread Messages',
        value: personaData.unreadMessages,
        changeLabel: 'chat updates',
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        trend: 'neutral',
        onClick: () => navigate('/hr-connect'),
      },
    ],
  }[persona] : [];

  // Loading state
  if (loading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  // Organization setup prompts are privileged admin/HR work, not employee self-service content.
  const showOrganizationSetupPrompt = (isOwner || isHr) && stats && stats.totalEmployees === 0 && stats.departmentCount === 0;

  return (
    <ModernLayout>
      {/* Page header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          {dashboardTitle}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          {showOrganizationSetupPrompt
            ? "Let's get started by setting up your organization."
            : dashboardSubtitle}
        </p>
      </div>

      {/* Empty State for New Organization */}
      {showOrganizationSetupPrompt && (
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8 mb-6 border border-primary-100">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              🎉 Welcome to AuroraHR!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account is set up and ready. Complete these steps to get started with your HRMS:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/employees/add')}
                className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-primary-100 rounded-lg p-2 mr-3">
                  <UserPlusIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Add Employees</h3>
                  <p className="text-sm text-gray-500 mt-1">Add your first employee or bulk upload</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/settings?tab=organization')}
                className="flex items-start p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Configure Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Set up policies, departments & more</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Narrower cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="relative">
            <div
              onClick={stat.onClick}
              className="stat-card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.iconBg} rounded-lg p-2`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  {stat.hasDropdown ? (
                    <ChevronDownIcon className={`h-4 w-4 text-gray-600 transition-transform ${showApprovalsDropdown ? 'rotate-180' : ''}`} />
                  ) : (
                    <>
                      {stat.trend === 'up' && (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-success-600" />
                      )}
                      {stat.trend === 'down' && (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-danger-600" />
                      )}
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                    {stat.isPercentage && '%'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{stat.changeLabel}</p>
                </div>
              </div>
            </div>

            {/* Approvals Dropdown */}
            {stat.hasDropdown && showApprovalsDropdown && (
              <div
                ref={approvalsDropdownRef}
                className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
              >
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2">Select Approval Type</div>
                  {approvalOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApprovalNavigation(option.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`${option.bg} rounded-md p-1.5`}>
                          <option.icon className={`h-4 w-4 ${option.color}`} />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{option.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Persona workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {isOwner && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Implementation Checklist</h2>
              </div>
              <div className="card-body space-y-3">
                {[
                  { label: 'Company profile and owner settings', done: true, path: '/settings' },
                  { label: 'Departments and designations', done: (stats?.departmentCount || 0) > 0 && (stats?.designationCount || 0) > 0, path: '/departments' },
                  { label: 'Employee data and user invites', done: (stats?.totalEmployees || 0) > 0, path: '/employees' },
                  { label: 'Leave and attendance policies', done: true, path: '/settings' },
                ].map((item) => (
                  <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    {item.done ? <CheckCircleIcon className="h-5 w-5 text-green-600" /> : <ClockIcon className="h-5 w-5 text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Owner Controls</h2>
              </div>
              <div className="card-body grid grid-cols-1 gap-3">
                <button onClick={() => navigate('/settings')} className="btn btn-outline-primary justify-start">Subscription and billing</button>
                <button onClick={() => navigate('/settings')} className="btn btn-outline-primary justify-start">Organization and security settings</button>
                <button onClick={() => navigate('/reports')} className="btn btn-outline-primary justify-start">Executive reports</button>
              </div>
            </div>
          </>
        )}

        {(isHr || isManager) && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">{isHr ? 'HR Action Queue' : 'Team Action Queue'}</h2>
              </div>
              <div className="card-body space-y-3">
                <button onClick={() => navigate('/leave?filter=pending')} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Leave approvals</span>
                  <span className="badge badge-warning">{personaData.pendingLeaveApprovals.length || stats?.pendingLeaveApprovals || 0}</span>
                </button>
                <button onClick={() => navigate('/attendance?filter=pending')} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Attendance regularizations</span>
                  <span className="badge badge-info">{personaData.pendingRegularizations.length}</span>
                </button>
                <button onClick={() => navigate('/performance')} className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Performance reviews</span>
                  <span className="badge badge-gray">Open</span>
                </button>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">{isHr ? 'Operations Focus' : 'Team Health'}</h2>
              </div>
              <div className="card-body space-y-3 text-sm text-gray-600">
                <div className="flex justify-between"><span>Present today</span><strong className="text-gray-900">{stats?.presentToday || 0}</strong></div>
                <div className="flex justify-between"><span>On leave</span><strong className="text-gray-900">{stats?.onLeaveToday || 0}</strong></div>
                <div className="flex justify-between"><span>Absent</span><strong className="text-gray-900">{stats?.absentToday || 0}</strong></div>
                <div className="flex justify-between"><span>Probation active</span><strong className="text-gray-900">{stats?.activeProbation || 0}</strong></div>
              </div>
            </div>
          </>
        )}

        {isEmployee && (
          <>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">My Self-Service</h2>
              </div>
              <div className="card-body grid grid-cols-1 gap-3">
                <button onClick={() => navigate('/attendance')} className="btn btn-outline-primary justify-start">Clock in/out and timesheet</button>
                <button onClick={() => navigate('/leave')} className="btn btn-outline-primary justify-start">Apply for leave</button>
                <button onClick={() => navigate('/my-hr-documents')} className="btn btn-outline-primary justify-start">My HR documents</button>
                <button onClick={() => navigate('/hr-connect')} className="btn btn-outline-primary justify-start">HR Connect</button>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">My Leave Balances</h2>
              </div>
              <div className="card-body space-y-3">
                {personaData.leaveBalances.length === 0 ? (
                  <p className="text-sm text-gray-500">No leave balance data available.</p>
                ) : (
                  personaData.leaveBalances.slice(0, 4).map((balance) => (
                    <div key={balance.balanceId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-sm font-medium capitalize text-gray-700">{balance.leaveType.replace('_', ' ')}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {balance.available ?? Math.max(0, balance.totalAllocated + balance.carriedForward - balance.used - balance.pending)} days
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">HR Connect Wall</h2>
            <button onClick={() => navigate('/hr-connect')} className="text-xs font-medium text-primary-600">Open</button>
          </div>
          <div className="card-body space-y-4">
            {personaData.hrConnectPosts.length === 0 ? (
              <p className="text-sm text-gray-500">No recent wall posts.</p>
            ) : (
              personaData.hrConnectPosts.slice(0, 3).map((post) => (
                <button key={post.postId} onClick={() => navigate('/hr-connect')} className="block w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                  <p className="line-clamp-2 text-sm font-medium text-gray-900">{post.title || post.content}</p>
                  <p className="mt-1 text-xs text-gray-500">{post.authorName}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-500">Based on your role and team</span>
            </div>
            <div className="card-body p-0">
              {recentActivities.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentActivities.map((activity) => {
                    const iconConfig = getActivityIcon(activity.type);
                    const IconComponent = iconConfig.icon;
                    const isClickable = !!activity.navigationUrl;
                    return (
                      <div
                        key={activity.activityId}
                        onClick={() => isClickable && navigate(activity.navigationUrl!)}
                        className={`p-6 hover:bg-gray-50 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`${iconConfig.bg} rounded-lg p-2 flex-shrink-0`}>
                            <IconComponent className={`h-5 w-5 ${iconConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                              {activity.departmentName && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-xs text-gray-500">{activity.departmentName}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {isClickable && (
                            <div className="flex-shrink-0">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400 transform rotate-45" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="card-footer">
              <button className="btn btn-sm btn-outline-primary w-full">View All Activities</button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View Calendar →
              </button>
            </div>
            <div className="card-body p-0">
              {upcomingEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.eventId}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{event.title}</p>
                          <div className="flex items-center mt-2">
                            <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                            <p className="text-xs text-gray-500">{formatEventDate(event)}</p>
                          </div>
                          {event.location && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{event.location}</p>
                          )}
                        </div>
                        <span className={`badge ${getEventBadgeColor(event.eventType)} text-xs flex-shrink-0`}>
                          {event.eventType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer">
              <button
                onClick={() => navigate('/calendar')}
                className="btn btn-sm btn-outline-primary w-full"
              >
                View Full Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
