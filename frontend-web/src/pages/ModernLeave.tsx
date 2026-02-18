import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  XMarkIcon,
  BeakerIcon,
  HeartIcon,
  SunIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface LeaveRequest {
  leaveRequestId: string;
  employeeId: string;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectionReason?: string;
}

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  icon: typeof BeakerIcon;
  color: string;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  totalRequests: number;
}

interface TeamStats {
  totalMembers: number;
  onLeaveToday: number;
  upcomingLeaves: number;
  pendingApprovals: number;
}

interface TeamMember {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  isOnLeave: boolean;
  leaveType?: string;
  returnDate?: string;
}

type ViewType = 'my-leave' | 'team' | 'company';

export default function ModernLeave() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('my-leave');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [stats, setStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRequests: 0,
  });
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    onLeaveToday: 0,
    upcomingLeaves: 0,
    pendingApprovals: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Apply Leave Form
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Rejection form
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    // Set default view based on role (case-insensitive)
    const userRole = user?.role?.toString().toUpperCase();
    if (userRole === 'HR_ADMIN' || userRole === 'SYSTEM_ADMIN') {
      setActiveView('company');
    } else if (userRole === 'MANAGER') {
      setActiveView('team');
    } else {
      setActiveView('my-leave');
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);

    // Mock leave balances
    const mockBalances: LeaveBalance[] = [
      { leaveType: 'Casual Leave', totalDays: 12, usedDays: 5, remainingDays: 7, icon: SunIcon, color: 'from-blue-500 to-blue-600' },
      { leaveType: 'Sick Leave', totalDays: 10, usedDays: 2, remainingDays: 8, icon: BeakerIcon, color: 'from-red-500 to-red-600' },
      { leaveType: 'Annual Leave', totalDays: 15, usedDays: 8, remainingDays: 7, icon: CalendarDaysIcon, color: 'from-purple-500 to-purple-600' },
      { leaveType: 'Emergency Leave', totalDays: 5, usedDays: 1, remainingDays: 4, icon: HeartIcon, color: 'from-orange-500 to-orange-600' },
    ];

    // Mock leave requests
    const mockRequests: LeaveRequest[] = [
      {
        leaveRequestId: 'leave-1',
        employeeId: 'emp-1',
        employee: {
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          department: { name: 'Engineering' },
        },
        leaveType: 'Casual Leave',
        startDate: '2026-02-20',
        endDate: '2026-02-22',
        days: 3,
        reason: 'Personal work',
        status: 'pending',
        appliedOn: '2026-02-10',
      },
      {
        leaveRequestId: 'leave-2',
        employeeId: 'emp-2',
        employee: {
          employeeCode: 'EMP002',
          firstName: 'Sarah',
          lastName: 'Johnson',
          department: { name: 'HR' },
        },
        leaveType: 'Sick Leave',
        startDate: '2026-02-15',
        endDate: '2026-02-16',
        days: 2,
        reason: 'Medical appointment',
        status: 'approved',
        appliedOn: '2026-02-08',
        approvedBy: 'HR Manager',
        approvedOn: '2026-02-09',
      },
      {
        leaveRequestId: 'leave-3',
        employeeId: 'emp-3',
        employee: {
          employeeCode: 'EMP003',
          firstName: 'Mike',
          lastName: 'Smith',
          department: { name: 'Sales' },
        },
        leaveType: 'Annual Leave',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        days: 5,
        reason: 'Family vacation',
        status: 'pending',
        appliedOn: '2026-02-05',
      },
      {
        leaveRequestId: 'leave-4',
        employeeId: 'emp-4',
        employee: {
          employeeCode: 'EMP004',
          firstName: 'Emily',
          lastName: 'Brown',
          department: { name: 'Engineering' },
        },
        leaveType: 'Casual Leave',
        startDate: '2026-02-12',
        endDate: '2026-02-13',
        days: 2,
        reason: 'Personal errands',
        status: 'rejected',
        appliedOn: '2026-02-01',
        rejectionReason: 'Insufficient leave balance',
      },
      {
        leaveRequestId: 'leave-5',
        employeeId: 'emp-1',
        employee: {
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          department: { name: 'Engineering' },
        },
        leaveType: 'Sick Leave',
        startDate: '2026-01-25',
        endDate: '2026-01-26',
        days: 2,
        reason: 'Fever',
        status: 'approved',
        appliedOn: '2026-01-24',
        approvedBy: 'Manager',
        approvedOn: '2026-01-24',
      },
    ];

    // Mock team members data
    const mockTeamMembers: TeamMember[] = [
      { employeeId: 'emp-1', employeeCode: 'EMP001', firstName: 'John', lastName: 'Doe', department: 'Engineering', position: 'Senior Developer', isOnLeave: false },
      { employeeId: 'emp-2', employeeCode: 'EMP002', firstName: 'Sarah', lastName: 'Johnson', department: 'Engineering', position: 'Frontend Developer', isOnLeave: true, leaveType: 'Sick Leave', returnDate: '2026-02-17' },
      { employeeId: 'emp-3', employeeCode: 'EMP003', firstName: 'Mike', lastName: 'Smith', department: 'Engineering', position: 'Backend Developer', isOnLeave: false },
      { employeeId: 'emp-4', employeeCode: 'EMP004', firstName: 'Emily', lastName: 'Brown', department: 'Engineering', position: 'DevOps Engineer', isOnLeave: false },
      { employeeId: 'emp-5', employeeCode: 'EMP005', firstName: 'David', lastName: 'Wilson', department: 'Engineering', position: 'QA Engineer', isOnLeave: false },
      { employeeId: 'emp-6', employeeCode: 'EMP006', firstName: 'Lisa', lastName: 'Anderson', department: 'Engineering', position: 'UI/UX Designer', isOnLeave: false },
      { employeeId: 'emp-7', employeeCode: 'EMP007', firstName: 'Tom', lastName: 'Martinez', department: 'Engineering', position: 'Tech Lead', isOnLeave: false },
      { employeeId: 'emp-8', employeeCode: 'EMP008', firstName: 'Anna', lastName: 'Garcia', department: 'Engineering', position: 'Developer', isOnLeave: false },
    ];

    setTimeout(() => {
      setLeaveBalances(mockBalances);
      setRequests(mockRequests);
      setTeamMembers(mockTeamMembers);

      // Calculate stats
      const pending = mockRequests.filter(r => r.status === 'pending').length;
      const approved = mockRequests.filter(r => r.status === 'approved').length;
      const rejected = mockRequests.filter(r => r.status === 'rejected').length;

      setStats({
        pending,
        approved,
        rejected,
        totalRequests: mockRequests.length,
      });

      // Calculate team stats
      const today = new Date().toISOString().split('T')[0];
      const onLeaveToday = mockTeamMembers.filter(m => m.isOnLeave).length;
      const upcomingLeaves = mockRequests.filter(r =>
        r.status === 'approved' &&
        new Date(r.startDate) > new Date() &&
        mockTeamMembers.some(m => m.employeeId === r.employeeId)
      ).length;
      const pendingApprovals = mockRequests.filter(r =>
        r.status === 'pending' &&
        mockTeamMembers.some(m => m.employeeId === r.employeeId)
      ).length;

      setTeamStats({
        totalMembers: mockTeamMembers.length,
        onLeaveToday,
        upcomingLeaves,
        pendingApprovals,
      });

      setLoading(false);
    }, 500);
  };

  const handleApplyLeave = async () => {
    if (!applyForm.leaveType || !applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    // Calculate days
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequest = {
      leaveRequestId: `leave-${Date.now()}`,
      employeeId: user?.employeeId || 'emp-1',
      employee: {
        employeeCode: 'EMP001',
        firstName: user?.fullName?.split(' ')[0] || 'John',
        lastName: user?.fullName?.split(' ')[1] || 'Doe',
        department: { name: 'Engineering' },
      },
      leaveType: applyForm.leaveType,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      days,
      reason: applyForm.reason,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setRequests([newRequest, ...requests]);
    setStats({
      ...stats,
      pending: stats.pending + 1,
      totalRequests: stats.totalRequests + 1,
    });

    setShowApplyModal(false);
    setApplyForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' });
    showNotification('Leave application submitted successfully', 'success');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setRequests(requests.map(req =>
      req.leaveRequestId === selectedRequest.leaveRequestId
        ? { ...req, status: 'approved', approvedBy: user?.fullName, approvedOn: new Date().toISOString().split('T')[0] }
        : req
    ));

    setStats({
      ...stats,
      pending: stats.pending - 1,
      approved: stats.approved + 1,
    });

    setShowApproveModal(false);
    setSelectedRequest(null);
    setApprovalComments('');
    showNotification('Leave request approved successfully', 'success');
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showNotification('Please provide a reason for rejection', 'error');
      return;
    }

    setRequests(requests.map(req =>
      req.leaveRequestId === selectedRequest.leaveRequestId
        ? { ...req, status: 'rejected', rejectionReason }
        : req
    ));

    setStats({
      ...stats,
      pending: stats.pending - 1,
      rejected: stats.rejected + 1,
    });

    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
    showNotification('Leave request rejected', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleExportCSV = () => {
    const data = filteredRequests;
    if (data.length === 0) {
      showNotification('No records to export', 'error');
      return;
    }

    const headers = ['Employee Code', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On', 'Reason'];
    const rows = data.map(record => [
      record.employee?.employeeCode || '-',
      `${record.employee?.firstName} ${record.employee?.lastName}`,
      record.employee?.department?.name || '-',
      record.leaveType,
      record.startDate,
      record.endDate,
      record.days,
      record.status.toUpperCase(),
      record.appliedOn,
      record.reason,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Exported ${data.length} records`, 'success');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-warning-100 text-warning-700 border border-warning-200',
      approved: 'bg-success-100 text-success-700 border border-success-200',
      rejected: 'bg-danger-100 text-danger-700 border border-danger-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const filteredRequests = requests.filter(request => {
    // View-based filtering
    if (activeView === 'my-leave') {
      // Show only current user's requests
      if (request.employeeId !== user?.employeeId && request.employee?.employeeCode !== 'EMP001') {
        return false;
      }
    } else if (activeView === 'team') {
      // Show only team member requests
      const isTeamMember = teamMembers.some(m => m.employeeId === request.employeeId);
      if (!isTeamMember) {
        return false;
      }
    }

    const matchesSearch = !searchTerm ||
      request.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesType = selectedLeaveType === 'all' || request.leaveType === selectedLeaveType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const userRole = user?.role?.toString().toUpperCase();
  const isHROrAdmin = userRole === 'HR_ADMIN' || userRole === 'SYSTEM_ADMIN';
  const isManager = userRole === 'MANAGER';

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg p-4 shadow-lg ${
              notification.type === 'success' ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'
            }`}
          >
            <div className="flex items-center">
              <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-success-800' : 'text-danger-800'}`}>
                {notification.message}
              </p>
              <button onClick={() => setNotification({ ...notification, show: false })} className="ml-4">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title with Icon */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <CalendarDaysIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
              <p className="text-sm text-gray-500">Manage leave requests and balances</p>
            </div>
          </div>

          {/* Center: Tab Navigation */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
            <button
              onClick={() => setActiveView('my-leave')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeView === 'my-leave'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BriefcaseIcon className="h-4 w-4" />
              <span>My Leave</span>
            </button>

            {(isManager || isHROrAdmin) && (
              <button
                onClick={() => setActiveView('team')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'team'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Team Leave</span>
              </button>
            )}

            {isHROrAdmin && (
              <button
                onClick={() => setActiveView('company')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'company'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>Company</span>
              </button>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 flex items-center space-x-1.5 text-xs font-medium"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Apply Leave</span>
            </button>

            {isHROrAdmin && (
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-1.5 text-xs font-medium"
              >
                <DocumentTextIcon className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leave Balances - Show for My Leave view */}
      {activeView === 'my-leave' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {leaveBalances.map((balance) => {
            const Icon = balance.icon;
            const percentage = (balance.remainingDays / balance.totalDays) * 100;

            return (
              <div key={balance.leaveType} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${balance.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{balance.totalDays} days</span>
                </div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">{balance.leaveType}</h3>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{balance.remainingDays}</span>
                  <span className="text-sm text-gray-500">remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${balance.color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{balance.usedDays} used</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Stats - Show for Team view */}
      {activeView === 'team' && (
        <>
          {/* Team Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Team Members</p>
                  <p className="text-2xl font-bold text-primary-600">{teamStats.totalMembers}</p>
                </div>
                <div className="bg-primary-100 rounded-xl p-3">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">On Leave Today</p>
                  <p className="text-2xl font-bold text-warning-600">{teamStats.onLeaveToday}</p>
                </div>
                <div className="bg-warning-100 rounded-xl p-3">
                  <CalendarDaysIcon className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Leaves</p>
                  <p className="text-2xl font-bold text-purple-600">{teamStats.upcomingLeaves}</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-3">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Approvals</p>
                  <p className="text-2xl font-bold text-danger-600">{teamStats.pendingApprovals}</p>
                </div>
                <div className="bg-danger-100 rounded-xl p-3">
                  <ExclamationCircleIcon className="h-6 w-6 text-danger-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Team Availability */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
              Team Availability
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {teamMembers.map((member) => (
                <div
                  key={member.employeeId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    member.isOnLeave
                      ? 'border-warning-200 bg-warning-50'
                      : 'border-success-200 bg-success-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      member.isOnLeave ? 'bg-warning-600' : 'bg-success-600'
                    }`}>
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{member.position}</p>
                      {member.isOnLeave ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-200 text-warning-800">
                            {member.leaveType}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">Until {member.returnDate}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-success-200 text-success-800">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3">
              <ChartBarIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
            </div>
            <div className="bg-warning-100 rounded-xl p-3">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-success-600">{stats.approved}</p>
            </div>
            <div className="bg-success-100 rounded-xl p-3">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-danger-600">{stats.rejected}</p>
            </div>
            <div className="bg-danger-100 rounded-xl p-3">
              <XCircleIcon className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading leave requests...</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No leave requests found</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.leaveRequestId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {request.employee?.firstName?.charAt(0)}{request.employee?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {request.employee?.firstName} {request.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{request.employee?.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.startDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.endDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-sm text-gray-900">{request.days} days</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.appliedOn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' && (isManager || isHROrAdmin) && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveModal(true);
                            }}
                            className="px-3 py-1.5 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors text-xs font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status === 'approved' && (
                        <span className="text-xs text-success-600">✓ Approved</span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="text-xs text-danger-600">✗ Rejected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <PlusIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="text-white/80 hover:text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for your leave..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyLeave}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 font-medium"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-success-600 to-success-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Approve Leave Request</h2>
                </div>
                <button onClick={() => setShowApproveModal(false)} className="text-white/80 hover:text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee:</span> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Leave Type:</span> {selectedRequest.leaveType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Duration:</span> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.days} days)
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {selectedRequest.reason}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows={2}
                  placeholder="Add any comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-gradient-to-r from-success-600 to-success-700 text-white rounded-lg hover:from-success-700 hover:to-success-800 transition-all shadow-lg shadow-success-500/30 font-medium"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-danger-600 to-danger-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <XCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Reject Leave Request</h2>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="text-white/80 hover:text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee:</span> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Leave Type:</span> {selectedRequest.leaveType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Duration:</span> {selectedRequest.startDate} to {selectedRequest.endDate} ({selectedRequest.days} days)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a reason for rejecting this leave request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-gradient-to-r from-danger-600 to-danger-700 text-white rounded-lg hover:from-danger-700 hover:to-danger-800 transition-all shadow-lg shadow-danger-500/30 font-medium"
                >
                  Reject Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
