import { useEffect, useState } from 'react';
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
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaves: number;
  employeeTrend: number;
  attendanceTrend: number;
}

export default function ModernDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 30,
    activeEmployees: 30,
    presentToday: 28,
    absentToday: 2,
    lateToday: 3,
    pendingLeaves: 5,
    employeeTrend: 12,
    attendanceTrend: -2,
  });

  const [loading, setLoading] = useState(false);

  // Sample recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'new_employee',
      message: 'John Doe joined the Engineering team',
      time: '2 hours ago',
      icon: UsersIcon,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
    },
    {
      id: 2,
      type: 'leave_approved',
      message: 'Leave request approved for Sarah Johnson',
      time: '3 hours ago',
      icon: CheckCircleIcon,
      iconColor: 'text-success-600',
      iconBg: 'bg-success-100',
    },
    {
      id: 3,
      type: 'late_arrival',
      message: '3 employees marked late today',
      time: '5 hours ago',
      icon: ClockIcon,
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100',
    },
    {
      id: 4,
      type: 'absence',
      message: '2 unplanned absences reported',
      time: '6 hours ago',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-danger-600',
      iconBg: 'bg-danger-100',
    },
  ];

  // Sample upcoming events
  const upcomingEvents = [
    { id: 1, title: 'Team Meeting', date: 'Today, 2:00 PM', type: 'meeting' },
    { id: 2, title: 'Performance Reviews Due', date: 'Tomorrow', type: 'deadline' },
    { id: 3, title: 'Company Holiday', date: 'Friday, Feb 14', type: 'holiday' },
  ];

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
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      change: Math.round((stats.presentToday / stats.totalEmployees) * 100),
      changeLabel: 'attendance rate',
      icon: CheckCircleIcon,
      iconColor: 'text-success-600',
      iconBg: 'bg-success-100',
      trend: 'up',
      isPercentage: true,
    },
    {
      title: 'Late Arrivals',
      value: stats.lateToday,
      change: stats.attendanceTrend,
      changeLabel: 'vs yesterday',
      icon: ClockIcon,
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100',
      trend: stats.attendanceTrend > 0 ? 'up' : 'down',
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      change: 2,
      changeLabel: 'require approval',
      icon: ClipboardDocumentCheckIcon,
      iconColor: 'text-danger-600',
      iconBg: 'bg-danger-100',
      trend: 'neutral',
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="stat-label">{stat.title}</p>
                <p className="stat-value">
                  {stat.value}
                  {stat.isPercentage && '%'}
                </p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' && (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-success-600 mr-1" />
                  )}
                  {stat.trend === 'down' && (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-danger-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === 'up'
                        ? 'text-success-600'
                        : stat.trend === 'down'
                        ? 'text-danger-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stat.trend !== 'neutral' && (stat.change > 0 ? '+' : '')}
                    {stat.trend !== 'neutral' && stat.change}
                    {stat.trend !== 'neutral' && '%'}{' '}
                    <span className="text-gray-500 font-normal">{stat.changeLabel}</span>
                  </span>
                </div>
              </div>
              <div className={`${stat.iconBg} rounded-xl p-3`}>
                <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="card-body p-0">
              <div className="divide-y divide-gray-200">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`${activity.iconBg} rounded-lg p-2 flex-shrink-0`}>
                        <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-sm btn-outline-primary w-full">View All Activities</button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            <div className="card-body p-0">
              <div className="divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <div className="flex items-center mt-1">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">{event.date}</p>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          event.type === 'meeting'
                            ? 'badge-primary'
                            : event.type === 'deadline'
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button className="btn btn-primary w-full justify-start">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Add New Employee
                </button>
                <button className="btn btn-secondary w-full justify-start">
                  <CalendarDaysIcon className="h-5 w-5 mr-2" />
                  Mark Attendance
                </button>
                <button className="btn btn-secondary w-full justify-start">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                  Approve Leaves
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Department Overview</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Engineering', employees: 15, present: 14, absent: 1, color: 'primary' },
                { name: 'Sales', employees: 10, present: 9, absent: 1, color: 'success' },
                { name: 'HR', employees: 5, present: 5, absent: 0, color: 'warning' },
              ].map((dept, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                    <span className={`badge badge-${dept.color}`}>{dept.employees} employees</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Present:</span>
                      <span className="font-medium text-success-600">{dept.present}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Absent:</span>
                      <span className="font-medium text-danger-600">{dept.absent}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div
                        className={`bg-${dept.color}-600 h-2 rounded-full`}
                        style={{ width: `${(dept.present / dept.employees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
