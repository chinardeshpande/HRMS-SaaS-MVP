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
import employeeService, { Employee } from '../services/employeeService';
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

interface OperationsDashboardData {
  todayAttendance: Attendance[];
  activeEmployees: Employee[];
  monthEvents: CalendarEvent[];
}

const emptyOperationsData: OperationsDashboardData = {
  todayAttendance: [],
  activeEmployees: [],
  monthEvents: [],
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
  const [operationsData, setOperationsData] = useState<OperationsDashboardData>(emptyOperationsData);
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
    fetchOperationsDashboardData();
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

  const fetchOperationsDashboardData = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const isoDate = (date: Date) => date.toISOString().split('T')[0];

    const [todayAttendance, activeEmployees, monthEvents] = await Promise.allSettled([
      attendanceService.getCompanyWide(isoDate(today), isoDate(today)),
      employeeService.getAll({ status: 'active' }),
      calendarService.getAllEvents({
        startDate: isoDate(startOfMonth),
        endDate: isoDate(endOfMonth),
        status: 'scheduled',
      }),
    ]);

    setOperationsData({
      todayAttendance: todayAttendance.status === 'fulfilled' ? todayAttendance.value : [],
      activeEmployees: activeEmployees.status === 'fulfilled' ? activeEmployees.value : [],
      monthEvents: monthEvents.status === 'fulfilled' ? monthEvents.value : [],
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

  const todayAttendanceBreakdown = operationsData.todayAttendance.reduce(
    (summary, record) => {
      const status = String(record.status || '').toLowerCase();
      const isPresent = status === 'present' || status === 'half_day';
      if (!isPresent) return summary;

      const location = String(record.location || '').toLowerCase();
      if (location.includes('wfh') || location.includes('work from home') || location.includes('remote')) {
        summary.wfh += 1;
      } else if (location.includes('off-site') || location.includes('offsite') || location.includes('client') || location.includes('site')) {
        summary.offSite += 1;
      } else {
        summary.office += 1;
      }
      return summary;
    },
    { office: 0, wfh: 0, offSite: 0 }
  );

  const newJoinersThisMonth = operationsData.activeEmployees.filter((employee) => {
    if (!employee.dateOfJoining) return false;
    const joiningDate = new Date(employee.dateOfJoining);
    const today = new Date();
    return joiningDate.getFullYear() === today.getFullYear() && joiningDate.getMonth() === today.getMonth();
  }).length;

  const companyHolidaysThisMonth = operationsData.monthEvents.filter((event) => event.eventType === 'holiday').length;

  const salaryDateThisMonth = (() => {
    const today = new Date();
    const salaryDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return salaryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

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
        title: 'Active Employees',
        value: stats.totalEmployees,
        changeLabel: 'active workforce',
        icon: UsersIcon,
        iconColor: 'text-primary-600',
        iconBg: 'bg-primary-100',
        trend: stats.employeeTrend > 0 ? 'up' : stats.employeeTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/employees'),
      },
      {
        title: 'Attendance',
        value: stats.presentToday,
        hideValue: true,
        changeLabel: `Absent ${stats.absentToday}`,
        details: [
          `Present ${stats.presentToday}`,
          `Absent ${stats.absentToday}`,
          `WFH ${todayAttendanceBreakdown.wfh}`,
          `Off-site ${todayAttendanceBreakdown.offSite}`,
        ],
        icon: CheckCircleIcon,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-100',
        trend: stats.attendanceTrend > 0 ? 'up' : stats.attendanceTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'Upcoming Joiners',
        value: newJoinersThisMonth,
        changeLabel: 'this month',
        icon: UserPlusIcon,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        trend: 'neutral',
        onClick: () => navigate('/onboarding'),
      },
      {
        title: 'Holidays This Month',
        value: companyHolidaysThisMonth,
        changeLabel: 'this month',
        icon: CalendarDaysIcon,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        trend: 'neutral',
        onClick: () => navigate('/calendar'),
      },
      {
        title: 'Salary Date',
        value: salaryDateThisMonth,
        changeLabel: 'this month',
        icon: CreditCardIcon,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        trend: 'neutral',
        onClick: () => navigate('/employees'),
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
        title: 'Attendance',
        value: stats.presentToday,
        hideValue: true,
        changeLabel: `Absent ${stats.absentToday}`,
        details: [
          `Present ${stats.presentToday}`,
          `Absent ${stats.absentToday}`,
          `WFH ${todayAttendanceBreakdown.wfh}`,
          `Off-site ${todayAttendanceBreakdown.offSite}`,
        ],
        icon: CheckCircleIcon,
        iconColor: 'text-teal-600',
        iconBg: 'bg-teal-100',
        trend: stats.attendanceTrend > 0 ? 'up' : stats.attendanceTrend < 0 ? 'down' : 'neutral',
        onClick: () => navigate('/attendance'),
      },
      {
        title: 'Upcoming Joiners',
        value: newJoinersThisMonth,
        changeLabel: 'this month',
        icon: UserPlusIcon,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100',
        trend: 'neutral',
        onClick: () => navigate('/onboarding'),
      },
      {
        title: 'Holidays This Month',
        value: companyHolidaysThisMonth,
        changeLabel: 'this month',
        icon: CalendarDaysIcon,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        trend: 'neutral',
        onClick: () => navigate('/calendar'),
      },
      {
        title: 'Salary Date',
        value: salaryDateThisMonth,
        changeLabel: 'this month',
        icon: CreditCardIcon,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        trend: 'neutral',
        onClick: () => navigate('/employees'),
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
      {/* Empty State for New Organization */}
      {showOrganizationSetupPrompt && (
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8 mb-6 border border-primary-100">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              🎉 Welcome to Aura!
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

      <section className="ui-experiment-hero mb-5 p-5 sm:p-6">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="ui-experiment-pill">
                <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                {dashboardTitle}
              </span>
              <span className="ui-experiment-pill">
                <ClockIcon className="h-4 w-4 text-teal-600" />
                Live operations
              </span>
            </div>
            <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              Run HR operations from one focused command surface.
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-600">
              {dashboardSubtitle}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1.05fr]">
            <div className="ui-hr-illustration hidden sm:block" aria-hidden="true">
              <span className="person-a" />
              <span className="person-b" />
              <span className="task-card" />
              <span className="spark-one" />
              <span className="spark-two" />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            <div className="ui-visual-tile p-3">
              <p className="text-xs font-bold text-gray-500">People</p>
              <p className="mt-2 text-2xl font-extrabold text-gray-950">{stats?.activeEmployees ?? 0}</p>
            </div>
            <div className="ui-visual-tile p-3">
              <p className="text-xs font-bold text-gray-500">Present</p>
              <p className="mt-2 text-2xl font-extrabold text-teal-600">{stats?.presentToday ?? 0}</p>
            </div>
            <div className="ui-visual-tile p-3">
              <p className="text-xs font-bold text-gray-500">Actions</p>
              <p className="mt-2 text-2xl font-extrabold text-indigo-600">{stats?.pendingApprovals ?? 0}</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid - Narrower cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <div key={index} className="relative">
            <div
              onClick={stat.onClick}
              className="card card-hover cursor-pointer p-4 transition-shadow hover:shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={`${stat.iconBg} shrink-0 rounded-lg p-2`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <p className="truncate text-xs font-semibold text-gray-600">{stat.title}</p>
                  </div>
                  {stat.hasDropdown ? (
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${showApprovalsDropdown ? 'rotate-180' : ''}`} />
                  ) : (
                    <>
                      {stat.trend === 'up' && (
                        <ArrowTrendingUpIcon className="h-4 w-4 shrink-0 text-success-600" />
                      )}
                      {stat.trend === 'down' && (
                        <ArrowTrendingDownIcon className="h-4 w-4 shrink-0 text-danger-600" />
                      )}
                    </>
                  )}
                </div>
                <div>
                  {!stat.hideValue && (
                    <p className="text-xl font-bold text-gray-900">
                      {stat.value}
                      {stat.isPercentage && '%'}
                    </p>
                  )}
                  {stat.details ? (
                    <div className={`${stat.hideValue ? 'mt-1' : 'mt-2'} grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600`}>
                      {stat.details.map((detail: string) => (
                        <span key={detail} className="truncate">{detail}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{stat.changeLabel}</p>
                  )}
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

      {/* Employee self-service workbench */}
      {isEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                        className={`p-4 hover:bg-gray-50 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
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
          </div>
        </div>

        {/* HR Connect Feeds */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">HR Connect Feeds</h2>
              <button onClick={() => navigate('/hr-connect')} className="text-xs font-medium text-primary-600">Open</button>
            </div>
            <div className="card-body space-y-4">
              {personaData.hrConnectPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent wall posts.</p>
                </div>
              ) : (
                personaData.hrConnectPosts.slice(0, 4).map((post) => (
                  <button key={post.postId} onClick={() => navigate('/hr-connect')} className="block w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">{post.title || post.content}</p>
                    <p className="mt-1 text-xs text-gray-500">{post.authorName}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Calendar Reminders</h2>
              <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Open
              </button>
            </div>
            <div className="card-body p-0">
              {upcomingEvents.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarDaysIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No upcoming reminders.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <button
                      key={event.eventId}
                      onClick={() => navigate('/calendar')}
                      className="block w-full p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2">
                          <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatEventDate(event)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
