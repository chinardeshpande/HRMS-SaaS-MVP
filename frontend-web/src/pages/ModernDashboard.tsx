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
  ChevronDownIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import activityService, { Activity } from '../services/activityService';
import calendarService, { CalendarEvent } from '../services/calendarService';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  upcomingOnboarding: number;
  upcomingExits: number;
  pendingApprovals: number;
  employeeTrend: number;
  attendanceTrend: number;
}

export default function ModernDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 30,
    presentToday: 28,
    upcomingOnboarding: 8,
    upcomingExits: 3,
    pendingApprovals: 12,
    employeeTrend: 12,
    attendanceTrend: -2,
  });

  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [showApprovalsDropdown, setShowApprovalsDropdown] = useState(false);
  const approvalsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecentActivities();
    fetchUpcomingEvents();
  }, []);

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
      count: 5,
      path: '/leave?filter=pending',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      label: 'Attendance Approvals',
      icon: ClockIcon,
      count: 3,
      path: '/attendance?filter=pending',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      label: 'Appraisal Reviews',
      icon: TrophyIcon,
      count: 2,
      path: '/performance?filter=pending',
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      label: 'Promotion Requests',
      icon: ArrowTrendingUpIcon,
      count: 1,
      path: '/employees?filter=promotions',
      color: 'text-indigo-600',
      bg: 'bg-indigo-100'
    },
    {
      label: 'Increment Approvals',
      icon: CurrencyDollarIcon,
      count: 1,
      path: '/employees?filter=increments',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100'
    },
  ];

  const handleApprovalNavigation = (path: string) => {
    setShowApprovalsDropdown(false);
    navigate(path);
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      change: stats.employeeTrend,
      changeLabel: 'vs last month',
      icon: UsersIcon,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      trend: stats.employeeTrend > 0 ? 'up' : 'down',
      onClick: () => navigate('/employees'),
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      change: Math.round((stats.presentToday / stats.totalEmployees) * 100),
      changeLabel: 'attendance',
      icon: CheckCircleIcon,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      trend: 'up',
      isPercentage: false,
      onClick: () => navigate('/attendance'),
    },
    {
      title: 'Upcoming Onboarding',
      value: stats.upcomingOnboarding,
      change: stats.upcomingOnboarding,
      changeLabel: 'this month',
      icon: UserPlusIcon,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      trend: 'neutral',
      onClick: () => navigate('/onboarding'),
    },
    {
      title: 'Upcoming Exits',
      value: stats.upcomingExits,
      change: stats.upcomingExits,
      changeLabel: 'this month',
      icon: ArrowRightOnRectangleIcon,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      trend: 'neutral',
      onClick: () => navigate('/exit'),
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      change: stats.pendingApprovals,
      changeLabel: 'need action',
      icon: BellAlertIcon,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      trend: 'neutral',
      onClick: () => setShowApprovalsDropdown(!showApprovalsDropdown),
      hasDropdown: true,
    },
  ];

  return (
    <ModernLayout>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">Here's what's happening with your organization today.</p>
      </div>

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
                    <ChevronDownIcon className={`h-4 w-4 text-gray-600 transition-transform ${showApprovalsDropdown && index === 4 ? 'rotate-180' : ''}`} />
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
            {stat.hasDropdown && showApprovalsDropdown && index === 4 && (
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
