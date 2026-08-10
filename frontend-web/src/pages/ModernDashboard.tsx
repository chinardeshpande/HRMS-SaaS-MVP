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
  ArrowRightIcon,
  SparklesIcon,
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const commandDate = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date;
  };
  const formatCommandDate = (date: Date) => {
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const commandGroups = [
    {
      name: 'Payroll',
      context: 'Month-end readiness',
      icon: CreditCardIcon,
      accent: 'from-violet-500 to-indigo-500',
      soft: 'bg-violet-50 text-violet-700',
      actions: [
        { title: 'Prepare the monthly payroll hand-off', detail: 'Review salary inputs, revisions and partner checklist.', due: commandDate(1), path: '/payroll-operations', tone: 'planned' },
        { title: 'Confirm this month’s salary date', detail: `Current working date: ${salaryDateThisMonth}.`, due: commandDate(3), path: '/payroll-operations', tone: 'planned' },
      ],
    },
    {
      name: 'Attendance',
      context: 'Today’s exceptions',
      icon: ClockIcon,
      accent: 'from-teal-400 to-cyan-500',
      soft: 'bg-teal-50 text-teal-700',
      actions: [
        { title: `Resolve ${personaData.pendingRegularizations.length} attendance regularization${personaData.pendingRegularizations.length === 1 ? '' : 's'}`, detail: 'Review employee corrections before the attendance cut-off.', due: commandDate(0), path: '/attendance?filter=pending', tone: personaData.pendingRegularizations.length ? 'urgent' : 'clear' },
        { title: 'Review today’s attendance coverage', detail: `${stats?.presentToday || 0} present · ${stats?.absentToday || 0} absent · ${todayAttendanceBreakdown.wfh} WFH.`, due: commandDate(0), path: '/attendance', tone: 'due' },
      ],
    },
    {
      name: 'Leave',
      context: 'Approvals and coverage',
      icon: CalendarDaysIcon,
      accent: 'from-sky-400 to-blue-500',
      soft: 'bg-blue-50 text-blue-700',
      actions: [
        { title: `Act on ${personaData.pendingLeaveApprovals.length || stats?.pendingLeaveApprovals || 0} pending leave request${(personaData.pendingLeaveApprovals.length || stats?.pendingLeaveApprovals || 0) === 1 ? '' : 's'}`, detail: 'Protect team coverage and close employee requests.', due: commandDate(0), path: '/leave?filter=pending', tone: (personaData.pendingLeaveApprovals.length || stats?.pendingLeaveApprovals || 0) ? 'urgent' : 'clear' },
        { title: 'Scan upcoming leave and holidays', detail: `${companyHolidaysThisMonth} company holiday${companyHolidaysThisMonth === 1 ? '' : 's'} this month.`, due: commandDate(2), path: '/calendar', tone: 'planned' },
      ],
    },
    {
      name: 'Recruitment',
      context: 'Open roles and movement',
      icon: BriefcaseIcon,
      accent: 'from-fuchsia-500 to-pink-500',
      soft: 'bg-fuchsia-50 text-fuchsia-700',
      actions: [
        { title: 'Review open positions and candidate movement', detail: 'Check offers, BGV progress and candidates awaiting a decision.', due: commandDate(1), path: '/onboarding', tone: 'due' },
      ],
    },
    {
      name: 'Onboarding',
      context: 'Joining readiness',
      icon: UserPlusIcon,
      accent: 'from-amber-400 to-orange-500',
      soft: 'bg-amber-50 text-amber-700',
      actions: [
        { title: `Prepare ${newJoinersThisMonth} upcoming joiner${newJoinersThisMonth === 1 ? '' : 's'}`, detail: 'Confirm documents, owners and first-day readiness.', due: commandDate(2), path: '/onboarding', tone: newJoinersThisMonth ? 'due' : 'clear' },
        { title: 'Check probation milestones', detail: `${stats?.probationEndingSoon || 0} confirmation decision${stats?.probationEndingSoon === 1 ? '' : 's'} approaching.`, due: commandDate(4), path: '/probation', tone: stats?.probationEndingSoon ? 'due' : 'planned' },
      ],
    },
    {
      name: 'Employee Lifecycle',
      context: 'Moments that need ownership',
      icon: ArrowPathIcon,
      accent: 'from-emerald-400 to-green-500',
      soft: 'bg-emerald-50 text-emerald-700',
      actions: [
        { title: 'Review lifecycle cases and transitions', detail: 'Promotions, transfers, performance moments and exits in one queue.', due: commandDate(3), path: '/performance', tone: 'planned' },
        { title: `Track ${stats?.upcomingExits || 0} upcoming exit${stats?.upcomingExits === 1 ? '' : 's'}`, detail: 'Keep handover, assets and final documentation moving.', due: commandDate(5), path: '/exit', tone: stats?.upcomingExits ? 'due' : 'clear' },
      ],
    },
    {
      name: 'Employee Engagement',
      context: 'Listen and communicate',
      icon: ChatBubbleLeftRightIcon,
      accent: 'from-rose-400 to-pink-500',
      soft: 'bg-rose-50 text-rose-700',
      actions: [
        { title: 'Check the HR Connect pulse', detail: `${personaData.hrConnectPosts.length} recent post${personaData.hrConnectPosts.length === 1 ? '' : 's'} · ${personaData.unreadMessages} unread message${personaData.unreadMessages === 1 ? '' : 's'}.`, due: commandDate(0), path: '/hr-connect', tone: personaData.unreadMessages ? 'urgent' : 'due' },
        { title: 'Share a people update', detail: 'Recognise progress, clarify policy or invite a conversation.', due: commandDate(2), path: '/hr-connect', tone: 'planned' },
      ],
    },
  ].map((group) => ({ ...group, actions: [...group.actions].sort((a, b) => a.due.getTime() - b.due.getTime()) }));

  const urgentCommandCount = commandGroups.flatMap((group) => group.actions).filter((action) => action.tone === 'urgent').length;

  const managerCommandGroups = [
    {
      name: 'Approvals', context: 'Decisions waiting for you', icon: BellAlertIcon, accent: 'from-rose-500 to-orange-400', soft: 'bg-rose-50 text-rose-700',
      actions: [
        { title: `${personaData.pendingLeaveApprovals.length} leave request${personaData.pendingLeaveApprovals.length === 1 ? '' : 's'} to decide`, detail: 'Review dates, team coverage and employee context.', due: commandDate(0), path: '/leave?filter=pending', tone: personaData.pendingLeaveApprovals.length ? 'urgent' : 'clear' },
        { title: `${personaData.pendingRegularizations.length} attendance correction${personaData.pendingRegularizations.length === 1 ? '' : 's'} to review`, detail: 'Resolve exceptions while the context is still fresh.', due: commandDate(0), path: '/attendance?filter=pending', tone: personaData.pendingRegularizations.length ? 'urgent' : 'clear' },
      ],
    },
    {
      name: 'Team Today', context: 'Availability and coverage', icon: UsersIcon, accent: 'from-teal-400 to-cyan-500', soft: 'bg-teal-50 text-teal-700',
      actions: [
        { title: 'Check today’s team coverage', detail: `${stats?.presentToday || 0} present · ${stats?.absentToday || 0} absent · ${stats?.onLeaveToday || 0} on leave.`, due: commandDate(0), path: '/attendance', tone: stats?.absentToday ? 'due' : 'clear' },
        { title: 'Look ahead at leave and calendar events', detail: 'Spot coverage pressure before it becomes an exception.', due: commandDate(1), path: '/calendar', tone: 'planned' },
      ],
    },
    {
      name: 'Performance', context: 'Conversations and growth', icon: TrophyIcon, accent: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-50 text-violet-700',
      actions: [
        { title: 'Continue team performance conversations', detail: `${stats?.activeProbation || 0} active probation/review moment${stats?.activeProbation === 1 ? '' : 's'} in view.`, due: commandDate(2), path: '/performance', tone: stats?.activeProbation ? 'due' : 'planned' },
        { title: 'Review confirmation milestones', detail: `${stats?.probationEndingSoon || 0} decision${stats?.probationEndingSoon === 1 ? '' : 's'} approaching.`, due: commandDate(3), path: '/probation', tone: stats?.probationEndingSoon ? 'due' : 'clear' },
      ],
    },
    {
      name: 'Joining Support', context: 'Help new people land well', icon: UserPlusIcon, accent: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700',
      actions: [
        { title: `Support ${newJoinersThisMonth} new joiner${newJoinersThisMonth === 1 ? '' : 's'} this month`, detail: 'Check owners, introductions and first-week readiness.', due: commandDate(2), path: '/onboarding', tone: newJoinersThisMonth ? 'due' : 'clear' },
      ],
    },
    {
      name: 'Team Conversations', context: 'Stay connected', icon: ChatBubbleLeftRightIcon, accent: 'from-blue-500 to-indigo-500', soft: 'bg-blue-50 text-blue-700',
      actions: [
        { title: 'Catch up on team conversations', detail: `${personaData.unreadMessages} unread message${personaData.unreadMessages === 1 ? '' : 's'} and recent HR updates.`, due: commandDate(0), path: '/hr-connect', tone: personaData.unreadMessages ? 'urgent' : 'due' },
        { title: 'Recognise or update your team', detail: 'Share progress, context or appreciation in HR Connect.', due: commandDate(2), path: '/hr-connect', tone: 'planned' },
      ],
    },
  ].map((group) => ({ ...group, actions: [...group.actions].sort((a, b) => a.due.getTime() - b.due.getTime()) }));

  const employeeCommandGroups = [
    {
      name: 'My Attendance', context: 'Today and recent corrections', icon: ClockIcon, accent: 'from-teal-400 to-cyan-500', soft: 'bg-teal-50 text-teal-700',
      actions: [
        { title: 'Mark or review today’s attendance', detail: `${formatHours(getAttendanceMinutes('week'))} recorded this week.`, due: commandDate(0), path: '/attendance', tone: 'due' },
        { title: 'Request a past attendance correction', detail: 'Explain the change and send it through approval.', due: commandDate(0), path: '/attendance', tone: 'planned' },
      ],
    },
    {
      name: 'My Leave', context: 'Balance and requests', icon: CalendarDaysIcon, accent: 'from-sky-400 to-blue-500', soft: 'bg-blue-50 text-blue-700',
      actions: [
        { title: 'Plan or request leave', detail: `${totalAvailableLeave} days available · ${totalPendingLeaveDays} pending.`, due: commandDate(0), path: '/leave', tone: totalPendingLeaveDays ? 'due' : 'planned' },
        { title: 'See upcoming holidays', detail: `${companyHolidaysThisMonth} company holiday${companyHolidaysThisMonth === 1 ? '' : 's'} this month.`, due: commandDate(2), path: '/calendar', tone: 'planned' },
      ],
    },
    {
      name: 'My Documents', context: 'Payslips and employment records', icon: DocumentTextIcon, accent: 'from-violet-500 to-indigo-500', soft: 'bg-violet-50 text-violet-700',
      actions: [
        { title: 'Open my HR document wallet', detail: 'Payslips, Form 16 and employment documents in one place.', due: commandDate(1), path: '/my-hr-documents', tone: 'planned' },
        { title: 'Request an employment document', detail: 'Ask HR for a letter, certificate or exit document.', due: commandDate(2), path: '/my-hr-documents', tone: 'planned' },
      ],
    },
    {
      name: 'My Requests', context: 'Follow through to closure', icon: ClipboardDocumentCheckIcon, accent: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700',
      actions: [
        { title: `Track ${stats?.pendingApprovals || 0} pending request${stats?.pendingApprovals === 1 ? '' : 's'}`, detail: 'See what is waiting, approved or needs more context.', due: commandDate(0), path: '/leave', tone: stats?.pendingApprovals ? 'due' : 'clear' },
      ],
    },
    {
      name: 'My Workplace', context: 'Updates and conversations', icon: ChatBubbleLeftRightIcon, accent: 'from-fuchsia-500 to-pink-500', soft: 'bg-fuchsia-50 text-fuchsia-700',
      actions: [
        { title: 'Catch up on HR Connect', detail: `${personaData.unreadMessages} unread message${personaData.unreadMessages === 1 ? '' : 's'} and company updates.`, due: commandDate(0), path: '/hr-connect', tone: personaData.unreadMessages ? 'urgent' : 'due' },
        { title: 'See my people calendar', detail: 'Holidays, events and personal HR milestones.', due: commandDate(1), path: '/calendar', tone: 'planned' },
      ],
    },
  ].map((group) => ({ ...group, actions: [...group.actions].sort((a, b) => a.due.getTime() - b.due.getTime()) }));

  const personalCommandGroups = isManager ? managerCommandGroups : employeeCommandGroups;
  const personalUrgentCount = personalCommandGroups.flatMap((group) => group.actions).filter((action) => action.tone === 'urgent').length;

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

      {(isOwner || isHr) && (
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 px-6 py-6 text-white shadow-[0_24px_60px_rgba(76,56,140,0.20)] sm:px-8">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-[-80px] left-[38%] h-52 w-52 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  Now · {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                  What should I focus on or resolve today?
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                  Your people-operation priorities, sequenced by urgency and connected directly to the work that closes them.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    {urgentCommandCount} urgent now
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    {personaData.pendingLeaveApprovals.length + personaData.pendingRegularizations.length} approvals waiting
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    {newJoinersThisMonth} joiners this month
                  </span>
                </div>
              </div>
              <div className="relative min-h-[142px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                <SparklesIcon className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Manu’s focus brief</p>
                <p className="mt-2 text-lg font-semibold leading-7">
                  Start with today’s exceptions. Then protect payroll, joining readiness and employee response times.
                </p>
                <div className="absolute -bottom-9 -right-2 h-36 w-28 overflow-hidden" aria-hidden="true">
                  <img src="/images/assistant/peeks/manu-thoughtful.png" alt="" className="h-full w-full object-contain object-bottom opacity-90" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">HR command centre</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">What can I do today?</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500">Each reminder opens the relevant AuraHR workspace. Dates closest to now appear first within every function.</p>
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {commandGroups.map((group, groupIndex) => (
              <article
                key={group.name}
                className={`group relative overflow-hidden rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_14px_36px_rgba(77,62,137,0.09)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(77,62,137,0.15)] ${groupIndex === 0 ? 'md:col-span-2 xl:col-span-1' : ''}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${group.accent}`} />
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${group.soft}`}>
                      <group.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{group.name}</h3>
                      <p className="text-xs text-slate-500">{group.context}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{group.actions.length}</span>
                </header>

                <div className="mt-4 space-y-2.5">
                  {group.actions.map((action) => (
                    <button
                      key={action.title}
                      onClick={() => navigate(action.path)}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/70"
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${action.tone === 'urgent' ? 'bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]' : action.tone === 'clear' ? 'bg-emerald-400' : action.tone === 'due' ? 'bg-amber-400' : 'bg-violet-400'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-5 text-slate-900">{action.title}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${action.tone === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-500'}`}>
                            {formatCommandDate(action.due)}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{action.detail}</span>
                      </span>
                      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_14px_36px_rgba(77,62,137,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Live operating pulse</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">Today at a glance</h3>
                </div>
                <button onClick={() => navigate('/reports')} className="text-xs font-bold text-violet-600 hover:text-violet-700">Open reports</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Active people', stats?.activeEmployees || 0],
                  ['Present today', stats?.presentToday || 0],
                  ['Pending actions', stats?.pendingApprovals || 0],
                  ['Upcoming exits', stats?.upcomingExits || 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-gradient-to-br from-slate-50 to-violet-50 p-3">
                    <p className="text-2xl font-extrabold text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate('/calendar')} className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-5 text-left text-white shadow-[0_14px_36px_rgba(14,165,233,0.20)] transition hover:-translate-y-0.5">
              <CalendarDaysIcon className="h-6 w-6" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Next checkpoint</p>
              <p className="mt-1 text-xl font-bold">Open the people calendar</p>
              <p className="mt-2 text-sm text-cyan-50">See joining dates, leave, holidays and lifecycle reminders together.</p>
            </button>
          </section>
        </div>
      )}

      {(isManager || isEmployee) && (
        <div className="mb-5 space-y-5">
          <section className={`relative overflow-hidden rounded-[28px] border border-white/80 px-6 py-6 text-white shadow-[0_24px_60px_rgba(76,56,140,0.18)] sm:px-8 ${isManager ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900' : 'bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-800'}`}>
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[1fr_340px] lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  Now · {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {isManager ? 'What needs my attention across the team?' : 'What can I do for myself today?'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                  {isManager
                    ? 'Decisions, team moments and conversations—ordered around what helps your people move forward.'
                    : 'Your attendance, leave, documents and workplace conversations—clear, personal and ready when you are.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">{personalUrgentCount} urgent now</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    {isManager ? `${personaData.pendingLeaveApprovals.length + personaData.pendingRegularizations.length} decisions waiting` : `${stats?.pendingApprovals || 0} requests in progress`}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                    {isManager ? `${stats?.presentToday || 0} team members present` : `${totalAvailableLeave} leave days available`}
                  </span>
                </div>
              </div>
              <div className="relative min-h-[140px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                <SparklesIcon className="h-5 w-5 text-cyan-300" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Manu’s {isManager ? 'team brief' : 'personal brief'}</p>
                <p className="mt-2 pr-16 text-lg font-semibold leading-7">
                  {isManager
                    ? 'Clear today’s decisions first. Then make space for the conversations only you can lead.'
                    : 'Start with today. Your requests, records and next steps are all within reach.'}
                </p>
                <div className="absolute -bottom-9 -right-1 h-36 w-28 overflow-hidden" aria-hidden="true">
                  <img src={isManager ? '/images/assistant/peeks/manu-review.png' : '/images/assistant/peeks/manu-welcome.png'} alt="" className="h-full w-full object-contain object-bottom opacity-90" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">{isManager ? 'Manager command centre' : 'My AuraHR'}</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{isManager ? 'Lead the moments that matter' : 'Today, on my terms'}</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500">Every card is an action, not a report. Open it, complete the journey and return to what matters.</p>
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {personalCommandGroups.map((group) => (
              <article key={group.name} className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_14px_36px_rgba(77,62,137,0.09)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(77,62,137,0.15)]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${group.accent}`} />
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${group.soft}`}><group.icon className="h-5 w-5" /></div>
                    <div><h3 className="font-bold text-slate-950">{group.name}</h3><p className="text-xs text-slate-500">{group.context}</p></div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{group.actions.length}</span>
                </header>
                <div className="mt-4 space-y-2.5">
                  {group.actions.map((action) => (
                    <button key={action.title} onClick={() => navigate(action.path)} className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/70">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${action.tone === 'urgent' ? 'bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]' : action.tone === 'clear' ? 'bg-emerald-400' : action.tone === 'due' ? 'bg-amber-400' : 'bg-violet-400'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-5 text-slate-900">{action.title}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${action.tone === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-500'}`}>{formatCommandDate(action.due)}</span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{action.detail}</span>
                      </span>
                      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      )}

      {!(isOwner || isHr) && (
      <>

      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">Live snapshot</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{isManager ? 'My team right now' : 'My current position'}</h2>
        </div>
        <span className="text-xs text-slate-500">Updates from your AuraHR workspace</span>
      </div>

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
      </>
      )}
    </ModernLayout>
  );
}
