import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal';
import { LeaveRequestDetailModal } from '../components/leave/LeaveRequestDetailModal';
import { EmptyState } from '../components/common/EmptyState';
import leaveService, { LeaveRequest as APILeaveRequest, LeaveBalance as APILeaveBalance } from '../services/leaveService';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  ArrowPathIcon,
  BeakerIcon,
  HeartIcon,
  SunIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  totalRequests: number;
}

type ViewType = 'my-leave' | 'approvals';

export default function ModernLeave() {
  const { user } = useAuth();

  // View state
  const [activeView, setActiveView] = useState<ViewType>('my-leave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [myLeaveRequests, setMyLeaveRequests] = useState<APILeaveRequest[]>([]);
  const [teamLeaveRequests, setTeamLeaveRequests] = useState<APILeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<APILeaveBalance[]>([]);

  // Stats state
  const [myStats, setMyStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRequests: 0,
  });
  const [teamStats, setTeamStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRequests: 0,
  });

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<APILeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Role-based access
  const userRole = user?.role?.toString().toUpperCase();
  const isManager = userRole === 'MANAGER';
  const isHROrAdmin = userRole === 'HR_ADMIN' || userRole === 'SYSTEM_ADMIN';
  const canApprove = isManager || isHROrAdmin;

  // Fetch data on mount and when view changes
  useEffect(() => {
    setActiveView('my-leave'); // Always start with my-leave
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeView === 'my-leave') {
      fetchMyLeaveData();
    } else if (activeView === 'approvals') {
      fetchTeamLeaveData();
    }
  }, [activeView]);

  /**
   * Fetch all data (my requests, team requests, balances)
   */
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchMyLeaveData(),
        canApprove ? fetchTeamLeaveData() : Promise.resolve(),
      ]);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      showNotification('Failed to load leave data', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch MY leave requests and balances
   */
  const fetchMyLeaveData = async () => {
    try {
      console.log('📊 Fetching my leave data...');

      // Fetch my leave requests
      const myRequests = await leaveService.getMyRequests();
      console.log('✅ My leave requests:', myRequests);
      setMyLeaveRequests(myRequests);

      // Calculate my stats
      const myStatsData = {
        pending: myRequests.filter(r => r.status === 'pending').length,
        approved: myRequests.filter(r => r.status === 'approved').length,
        rejected: myRequests.filter(r => r.status === 'rejected').length,
        totalRequests: myRequests.length,
      };
      setMyStats(myStatsData);

      // Fetch my leave balance
      const balances = await leaveService.getMyBalance();
      console.log('✅ My leave balances:', balances);
      setLeaveBalances(balances);

    } catch (err: any) {
      console.error('❌ Error fetching my leave data:', err);
      throw err;
    }
  };

  /**
   * Fetch TEAM leave requests for approval (excludes current user)
   */
  const fetchTeamLeaveData = async () => {
    if (!canApprove) return;

    try {
      console.log('📊 Fetching team leave data...');

      if (isHROrAdmin) {
        // HR/Admin: Get all company requests
        const allRequests = await leaveService.getAllRequests();
        console.log('✅ All leave requests:', allRequests);

        // CRITICAL: Filter out current user's requests
        const teamOnlyRequests = allRequests.filter(
          r => r.employeeId !== user?.employeeId
        );
        console.log(`✅ Team requests (excluding self): ${allRequests.length} -> ${teamOnlyRequests.length}`);
        setTeamLeaveRequests(teamOnlyRequests);

        // Calculate team stats (excluding current user)
        const teamStatsData = {
          pending: teamOnlyRequests.filter(r => r.status === 'pending').length,
          approved: teamOnlyRequests.filter(r => r.status === 'approved').length,
          rejected: teamOnlyRequests.filter(r => r.status === 'rejected').length,
          totalRequests: teamOnlyRequests.length,
        };
        setTeamStats(teamStatsData);

      } else if (isManager) {
        // Manager: Get pending approvals for their team
        const pendingApprovals = await leaveService.getPendingApprovals();
        console.log('✅ Pending approvals for my team:', pendingApprovals);

        // CRITICAL: Filter out current user's requests
        const teamOnlyRequests = pendingApprovals.filter(
          r => r.employeeId !== user?.employeeId
        );
        console.log(`✅ Team requests (excluding self): ${pendingApprovals.length} -> ${teamOnlyRequests.length}`);
        setTeamLeaveRequests(teamOnlyRequests);

        // Calculate team stats
        const teamStatsData = {
          pending: teamOnlyRequests.filter(r => r.status === 'pending').length,
          approved: teamOnlyRequests.filter(r => r.status === 'approved').length,
          rejected: teamOnlyRequests.filter(r => r.status === 'rejected').length,
          totalRequests: teamOnlyRequests.length,
        };
        setTeamStats(teamStatsData);
      }

    } catch (err: any) {
      console.error('❌ Error fetching team leave data:', err);
      throw err;
    }
  };

  /**
   * Handle approve/reject action
   */
  const handleApproveReject = async (
    leaveId: string,
    status: 'approved' | 'rejected',
    comments?: string
  ) => {
    try {
      console.log(`🔄 ${status === 'approved' ? 'Approving' : 'Rejecting'} leave request:`, leaveId);
      console.log(`📝 Comments:`, comments);

      const result = await leaveService.approveOrReject(leaveId, status, comments);
      console.log(`✅ ${status} response:`, result);

      showNotification(
        `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        'success'
      );

      // Close modal first
      setShowDetailModal(false);
      setSelectedRequest(null);

      // Then refresh data
      console.log('🔄 Refreshing data after approval...');
      await fetchAllData();
      console.log('✅ Data refreshed successfully');

    } catch (err: any) {
      console.error(`❌ Error ${status === 'approved' ? 'approving' : 'rejecting'} leave:`, err);
      console.error('Error details:', err.response?.data || err.message);
      showNotification(err.response?.data?.error || err.message || `Failed to ${status} leave request`, 'error');
    }
  };

  /**
   * Handle leave application success
   */
  const handleLeaveApplicationSuccess = async () => {
    showNotification('Leave request submitted successfully', 'success');
    setShowApplyLeaveModal(false);

    // Refresh my leave data
    await fetchMyLeaveData();
  };

  /**
   * Show notification
   */
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  /**
   * Get filtered requests based on active view and filters
   */
  const getFilteredRequests = (): APILeaveRequest[] => {
    // Choose the correct data source
    const sourceRequests = activeView === 'my-leave' ? myLeaveRequests : teamLeaveRequests;

    return sourceRequests.filter((request) => {
      // Status filter
      const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;

      // Leave type filter
      const matchesType = selectedLeaveType === 'all' || request.leaveType === selectedLeaveType;

      // Search query filter (by employee name)
      const matchesSearch = !searchQuery ||
        (request.employee?.firstName + ' ' + request.employee?.lastName)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  };

  // Get current stats based on active view
  const currentStats = activeView === 'my-leave' ? myStats : teamStats;

  // Get filtered requests
  const filteredRequests = getFilteredRequests();

  // Map leave type to icon and color
  const getLeaveTypeIcon = (leaveType: string) => {
    const mapping: Record<string, { icon: typeof BeakerIcon; color: string }> = {
      casual: { icon: SunIcon, color: 'from-blue-500 to-blue-600' },
      sick: { icon: HeartIcon, color: 'from-red-500 to-red-600' },
      earned: { icon: BriefcaseIcon, color: 'from-green-500 to-green-600' },
      maternity: { icon: HeartIcon, color: 'from-pink-500 to-pink-600' },
      paternity: { icon: HeartIcon, color: 'from-indigo-500 to-indigo-600' },
      unpaid: { icon: CalendarDaysIcon, color: 'from-gray-500 to-gray-600' },
      compensatory: { icon: ClockIcon, color: 'from-purple-500 to-purple-600' },
    };
    return mapping[leaveType] || mapping.casual;
  };

  // Format leave balances for display
  const formattedLeaveBalances = leaveBalances.map((balance) => {
    const { icon, color } = getLeaveTypeIcon(balance.leaveType);

    // Convert all values to numbers to avoid NaN
    const totalAllocated = Number(balance.totalAllocated) || 0;
    const used = Number(balance.used) || 0;
    const pending = Number(balance.pending) || 0;
    const carriedForward = Number(balance.carriedForward) || 0;

    // Calculate available days
    const available = balance.available
      ? Number(balance.available)
      : totalAllocated + carriedForward - used - pending;

    return {
      leaveType: balance.leaveType,
      totalDays: totalAllocated,
      usedDays: used,
      pendingDays: pending,
      remainingDays: available,
      icon,
      color,
    };
  });

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg px-4 py-3 shadow-xl ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
                <p className="text-xs text-gray-500">
                  {activeView === 'my-leave' ? 'My leave requests' : 'Team leave approvals'}
                </p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex max-w-full items-center space-x-1 overflow-x-auto bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveView('my-leave');
                  setSelectedStatus('all');
                  setSelectedLeaveType('all');
                }}
                className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'my-leave'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>My Leave</span>
              </button>

              {canApprove && (
                <button
                  onClick={() => {
                    setActiveView('approvals');
                    setSelectedStatus('all');
                    setSelectedLeaveType('all');
                  }}
                  className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 relative ${
                    activeView === 'approvals'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Team Approvals</span>
                  {teamStats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {teamStats.pending}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-1.5 text-sm font-medium disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {activeView === 'my-leave' && (
                <button
                  onClick={() => setShowApplyLeaveModal(true)}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 flex items-center space-x-1.5 text-sm font-medium shadow-lg shadow-purple-500/30"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Apply Leave</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* MY LEAVE VIEW */}
        {activeView === 'my-leave' && (
          <div className="space-y-4">
            {/* Leave Balances - Compact 2-Row Design or Empty State */}
            {leaveBalances.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <EmptyState
                  icon={<CalendarDaysIcon className="h-16 w-16 text-gray-400" />}
                  title="No Leave Balance Configured"
                  description="You don't have any leave balances set up yet. Contact your HR administrator to configure your leave policies and balances."
                  secondaryAction={{
                    label: "View Leave Policies",
                    onClick: () => console.log('Navigate to leave policies'),
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formattedLeaveBalances.map((balance) => {
                  const Icon = balance.icon;
                  return (
                    <div
                      key={balance.leaveType}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                    >
                      {/* Row 1: Icon + Type + Days Available */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${balance.color} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {balance.leaveType}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 leading-none">{balance.remainingDays}</p>
                          <p className="text-xs text-gray-500">days available</p>
                        </div>
                      </div>

                      {/* Row 2: Total | Used inline */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-gray-500">Total </span>
                          <span className="font-semibold text-gray-700">{balance.totalDays}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Used </span>
                          <span className="font-semibold text-gray-700">{balance.usedDays}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats Cards - Clickable - Compact */}
            <div className="grid grid-cols-4 gap-3">
              <div
                onClick={() => setSelectedStatus('all')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'all' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{myStats.totalRequests}</p>
                    {selectedStatus === 'all' && (
                      <p className="text-xs text-purple-600 mt-1">● View all</p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-xl p-2">
                    <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('pending')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'pending' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{myStats.pending}</p>
                    {selectedStatus === 'pending' && (
                      <p className="text-xs text-orange-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-orange-100 rounded-xl p-2">
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('approved')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'approved' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{myStats.approved}</p>
                    {selectedStatus === 'approved' && (
                      <p className="text-xs text-green-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-green-100 rounded-xl p-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('rejected')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'rejected' ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{myStats.rejected}</p>
                    {selectedStatus === 'rejected' && (
                      <p className="text-xs text-red-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-red-100 rounded-xl p-2">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters - Single Row - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="w-48">
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Leave Types</option>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="earned">Earned</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="compensatory">Compensatory</option>
                  </select>
                </div>
                {(selectedStatus !== 'all' || selectedLeaveType !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedLeaveType('all');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* My Leave Requests Table - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900">My Leave Requests</h3>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {filteredRequests.length}
                    </span>
                  </div>
                  {selectedStatus !== 'all' && (
                    <p className="text-xs text-gray-500">Filtered by: {selectedStatus}</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Duration</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Days</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Applied</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 sticky right-0 bg-gray-50">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                          Loading...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4">
                          <EmptyState
                            icon={<CalendarDaysIcon className="h-16 w-16 text-gray-400" />}
                            title={myLeaveRequests.length === 0 ? "No Leave Requests Yet" : "No Matching Requests"}
                            description={
                              myLeaveRequests.length === 0
                                ? "You haven't applied for any leave yet. Click 'Apply Leave' to submit your first leave request."
                                : "Try adjusting your filters to find what you're looking for."
                            }
                            primaryAction={
                              myLeaveRequests.length === 0
                                ? {
                                    label: "Apply Leave",
                                    onClick: () => setShowApplyModal(true),
                                    icon: <PlusIcon className="h-5 w-5 mr-2" />,
                                  }
                                : undefined
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr
                          key={request.leaveId}
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="hover:bg-purple-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {request.leaveType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{request.numberOfDays}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 sticky right-0 bg-white">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-900 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEAM APPROVALS VIEW */}
        {activeView === 'approvals' && (
          <div className="space-y-4">
            {/* Team Stats Cards - Clickable - Compact */}
            <div className="grid grid-cols-4 gap-3">
              <div
                onClick={() => setSelectedStatus('all')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'all' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{teamStats.totalRequests}</p>
                    {selectedStatus === 'all' && (
                      <p className="text-xs text-purple-600 mt-1">● View all</p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-xl p-2">
                    <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('pending')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'pending' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{teamStats.pending}</p>
                    {selectedStatus === 'pending' && (
                      <p className="text-xs text-orange-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-orange-100 rounded-xl p-2">
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('approved')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'approved' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{teamStats.approved}</p>
                    {selectedStatus === 'approved' && (
                      <p className="text-xs text-green-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-green-100 rounded-xl p-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedStatus('rejected')}
                className={`bg-white rounded-lg shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedStatus === 'rejected' ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{teamStats.rejected}</p>
                    {selectedStatus === 'rejected' && (
                      <p className="text-xs text-red-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-red-100 rounded-xl p-2">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters - Single Row - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="🔍 Search employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="w-48">
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Leave Types</option>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="earned">Earned</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="compensatory">Compensatory</option>
                  </select>
                </div>
                {(selectedStatus !== 'all' || selectedLeaveType !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedLeaveType('all');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Team Leave Approvals Table - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900">Team Leave Approvals</h3>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {filteredRequests.length}
                    </span>
                  </div>
                  {selectedStatus !== 'all' && (
                    <p className="text-xs text-gray-500">Filtered by: {selectedStatus}</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Employee</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Duration</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Days</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Applied</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 sticky right-0 bg-gray-50">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                          Loading...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                          No team leave requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr
                          key={request.leaveId}
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="hover:bg-purple-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {request.employee?.firstName} {request.employee?.lastName}
                                </p>
                                {request.employee?.department && (
                                  <p className="text-xs text-gray-500">{request.employee.department.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {request.leaveType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{request.numberOfDays}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 sticky right-0 bg-white">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-900 font-medium"
                            >
                              {request.status === 'pending' ? 'Review' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={showApplyLeaveModal}
        onClose={() => setShowApplyLeaveModal(false)}
        onSuccess={handleLeaveApplicationSuccess}
      />

      {/* Leave Request Detail Modal */}
      {selectedRequest && (
        <LeaveRequestDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          canApprove={canApprove && activeView === 'approvals'}
          onApprove={(comments) => handleApproveReject(selectedRequest.leaveId, 'approved', comments)}
          onReject={(comments) => handleApproveReject(selectedRequest.leaveId, 'rejected', comments)}
        />
      )}
    </ModernLayout>
  );
}
