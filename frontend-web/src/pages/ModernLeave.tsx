import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal';
import { LeaveRequestDetailModal } from '../components/leave/LeaveRequestDetailModal';
import { EmptyState } from '../components/common/EmptyState';
import leaveService, {
  LeaveRequest as APILeaveRequest,
  LeaveBalance as APILeaveBalance,
  LeavePolicy as APILeavePolicy,
  CompanyLeaveBalanceReportRow,
} from '../services/leaveService';
import employeeService from '../services/employeeService';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  ArrowPathIcon,
  DocumentTextIcon,
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

type ViewType = 'my-leave' | 'approvals' | 'company-leaves';

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
  const [leavePolicies, setLeavePolicies] = useState<APILeavePolicy[]>([]);
  const [companyLeaveEmployees, setCompanyLeaveEmployees] = useState<Array<{
    id: string;
    code: string;
    name: string;
    department: string;
    gender?: string;
  }>>([]);
  const [companyLeaveBalances, setCompanyLeaveBalances] = useState<CompanyLeaveBalanceReportRow[]>([]);

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
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [initializingBalance, setInitializingBalance] = useState(false);

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
    } else if (activeView === 'company-leaves') {
      fetchCompanyLeaveData();
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
      const [balances, policies] = await Promise.all([
        leaveService.getMyBalance(),
        leaveService.getPolicies(),
      ]);
      console.log('✅ My leave balances:', balances);
      setLeaveBalances(balances);
      setLeavePolicies(policies);

    } catch (err: any) {
      console.error('❌ Error fetching my leave data:', err);
      throw err;
    }
  };

  /**
   * Initialize current user's leave balance from active leave policies
   */
  const handleInitializeMyBalance = async () => {
    if (!user?.employeeId) {
      showNotification('Employee profile is required before leave balance can be initialized', 'error');
      return;
    }

    setInitializingBalance(true);
    try {
      await leaveService.initializeBalance(user.employeeId, new Date().getFullYear());
      await fetchMyLeaveData();
      showNotification('Leave balance initialized from active policies', 'success');
    } catch (err: any) {
      console.error('❌ Error initializing leave balance:', err);
      showNotification(err.response?.data?.error || err.message || 'Failed to initialize leave balance', 'error');
    } finally {
      setInitializingBalance(false);
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
        // Manager: Get complete request history for their team
        const pendingApprovals = await leaveService.getAllRequests();
        console.log('✅ Leave history for my team:', pendingApprovals);

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

  const fetchCompanyLeaveData = async () => {
    if (!isHROrAdmin) return;

    try {
      setLoading(true);
      const [employeeResponse, balanceReport, policies] = await Promise.all([
        employeeService.getEmployees({ status: 'active' }),
        leaveService.getCompanyLeaveBalanceReport(),
        leaveService.getPolicies(),
      ]);

      const activeEmployees = employeeResponse.data.employees
        .filter((employee: any) => (employee.status || '').toLowerCase() === 'active')
        .map((employee: any) => ({
          id: employee.employeeId,
          code: employee.employeeCode,
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          department: employee.department?.name || 'N/A',
          gender: employee.gender,
        }));
      const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.id));

      setCompanyLeaveEmployees(activeEmployees);
      setCompanyLeaveBalances(balanceReport.filter((row) => activeEmployeeIds.has(row.employeeId)));
      setLeavePolicies(policies);
    } catch (err: any) {
      console.error('❌ Error fetching company leave matrix:', err);
      showNotification(err.response?.data?.error?.message || err.message || 'Failed to load company leave data', 'error');
    } finally {
      setLoading(false);
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

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await leaveService.cancelLeave(leaveId);
      setShowDetailModal(false);
      setSelectedRequest(null);
      await fetchMyLeaveData();
      showNotification('Pending leave request cancelled', 'success');
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message || 'Failed to cancel leave request', 'error');
    }
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
  const myLeaveRegisterRequests = [...myLeaveRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const normalizeLeaveKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizeGender = (value?: string) => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return '';
    if (normalized === 'm' || normalized === 'male') return 'male';
    if (normalized === 'f' || normalized === 'female') return 'female';
    return normalized;
  };
  const isGenderEligibleForPolicy = (employeeGender: string | undefined, policyGender: string | undefined) => {
    const normalizedPolicyGender = normalizeGender(policyGender);
    if (!normalizedPolicyGender || normalizedPolicyGender === 'all') return true;
    return normalizeGender(employeeGender) === normalizedPolicyGender;
  };
  const formatLeaveColumnLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const activeLeavePolicies = leavePolicies.filter((policy) => policy.isActive);
  const reportLeaveTypes = Array.from(new Set(companyLeaveBalances.map((balance) => balance.leaveType).filter(Boolean)));
  const companyLeaveColumns = activeLeavePolicies.length > 0
    ? activeLeavePolicies.map((policy) => ({
        key: policy.policyName || policy.leaveType,
        label: formatLeaveColumnLabel(policy.leaveType || policy.policyName),
        fallbackTotal: Number(policy.totalLeaves) || 0,
        applicableGender: policy.applicableGender || 'all',
        matchKeys: [
          normalizeLeaveKey(policy.policyName || ''),
          normalizeLeaveKey(policy.leaveType || ''),
        ].filter(Boolean),
      }))
    : reportLeaveTypes.map((leaveType) => ({
        key: leaveType,
        label: formatLeaveColumnLabel(leaveType),
        fallbackTotal: 0,
        applicableGender: 'all',
        matchKeys: [normalizeLeaveKey(leaveType)],
      }));
  const companyLeaveBalanceByEmployee = new Map<string, CompanyLeaveBalanceReportRow[]>();
  companyLeaveBalances.forEach((balance) => {
    const balances = companyLeaveBalanceByEmployee.get(balance.employeeId) || [];
    balances.push(balance);
    companyLeaveBalanceByEmployee.set(balance.employeeId, balances);
  });
  const currentLeaveYear = new Date().getFullYear();
  const activePolicyCount = leavePolicies.filter((policy) => policy.isActive).length;
  const initializedBalanceCount = leaveBalances.length;
  const hasLeaveSetupGap = activePolicyCount > 0 && initializedBalanceCount === 0;

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
      genderEligible: balance.genderEligible !== false,
      icon,
      color,
    };
  });
  const visibleLeaveBalanceCards = formattedLeaveBalances.filter((balance) => {
    const leaveType = balance.leaveType.toLowerCase();
    if (leaveType === 'maternity' || leaveType === 'paternity') {
      return balance.genderEligible === true && balance.totalDays > 0;
    }
    return true;
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
                  {activeView === 'my-leave'
                    ? 'My leave requests'
                    : activeView === 'company-leaves'
                    ? 'Company leave balances'
                    : 'Team leave approvals'}
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
                <>
                  {isHROrAdmin && (
                    <button
                      onClick={() => {
                        setActiveView('company-leaves');
                        setSelectedStatus('all');
                        setSelectedLeaveType('all');
                      }}
                      className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                        activeView === 'company-leaves'
                          ? 'bg-white text-purple-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <UserGroupIcon className="h-4 w-4" />
                      <span>Company Leaves</span>
                    </button>
                  )}

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
                </>
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
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                    <DocumentTextIcon className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Policy and balance status for {currentLeaveYear}</h2>
                    <p className="mt-1 text-sm leading-5 text-gray-600">
                      Leave policies define company entitlement rules. Your visible balances are yearly employee records created from those active policies.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">
                        {activePolicyCount} active polic{activePolicyCount === 1 ? 'y' : 'ies'}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-semibold ${
                        initializedBalanceCount > 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {initializedBalanceCount} initialized balance{initializedBalanceCount === 1 ? '' : 's'}
                      </span>
                      {hasLeaveSetupGap && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">
                          Balance setup pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  <button
                    onClick={() => setShowPoliciesModal(true)}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="mr-2 h-4 w-4" />
                    View active policies
                  </button>
                  {canApprove && hasLeaveSetupGap && (
                    <button
                      onClick={handleInitializeMyBalance}
                      disabled={initializingBalance}
                      className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      <ArrowPathIcon className={`mr-2 h-4 w-4 ${initializingBalance ? 'animate-spin' : ''}`} />
                      Initialize my balance
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Leave Balances - Compact 2-Row Design or Empty State */}
            {leaveBalances.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <EmptyState
                  icon={<CalendarDaysIcon className="h-16 w-16 text-gray-400" />}
                  title={leavePolicies.length > 0 ? "Leave Balance Not Initialized" : "No Leave Policies Configured"}
                  description={
                    leavePolicies.length > 0
                      ? "Leave policies exist for this company, but your yearly leave balance has not been initialized yet."
                      : "No active leave policies are available for this company. HR must create leave policies before balances can be initialized."
                  }
                  primaryAction={
                    canApprove && leavePolicies.length > 0
                      ? {
                          label: initializingBalance ? "Initializing..." : "Initialize My Balance",
                          onClick: handleInitializeMyBalance,
                          icon: <ArrowPathIcon className={`h-5 w-5 mr-2 ${initializingBalance ? 'animate-spin' : ''}`} />,
                        }
                      : undefined
                  }
                  secondaryAction={{
                    label: "View Leave Policies",
                    onClick: () => setShowPoliciesModal(true),
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {visibleLeaveBalanceCards.map((balance) => {
                  const Icon = balance.icon;
                  return (
                    <div
                      key={balance.leaveType}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${balance.color} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {balance.leaveType}
                          </span>
                        </div>
                        {!balance.genderEligible && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            Not eligible
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                          <p className="text-[11px] font-medium text-gray-500">Eligible</p>
                          <p className="text-sm font-bold text-gray-900">{balance.totalDays}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                          <p className="text-[11px] font-medium text-gray-500">Taken</p>
                          <p className="text-sm font-bold text-gray-900">{balance.usedDays}</p>
                        </div>
                        <div className="rounded-lg bg-purple-50 px-2 py-1.5">
                          <p className="text-[11px] font-medium text-purple-700">Balance</p>
                          <p className="text-sm font-bold text-purple-800">{balance.remainingDays}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Leave Register */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900">Leave Register</h3>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {myLeaveRegisterRequests.length}
                    </span>
                  </div>
                  <p className="hidden text-xs text-gray-500 sm:block">Complete history of applied leave, approval status, and decision dates</p>
                </div>
              </div>

              <div className="md:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Loading...
                  </div>
                ) : myLeaveRegisterRequests.length === 0 ? (
                  <div className="px-4">
                    <EmptyState
                      icon={<CalendarDaysIcon className="h-16 w-16 text-gray-400" />}
                      title={myLeaveRequests.length === 0 ? "No Leave Requests Yet" : "No Matching Requests"}
                      description={
                        myLeaveRequests.length === 0
                          ? "You haven't applied for any leave yet. Tap Apply Leave to submit your first request."
                          : "Try adjusting your filters."
                      }
                      primaryAction={
                        myLeaveRequests.length === 0
                          ? {
                              label: "Apply Leave",
                              onClick: () => setShowApplyLeaveModal(true),
                              icon: <PlusIcon className="h-5 w-5 mr-2" />,
                            }
                          : undefined
                      }
                    />
                  </div>
                ) : (
                  myLeaveRegisterRequests.map((request) => (
                    <button
                      key={request.leaveId}
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className="block w-full p-4 text-left hover:bg-purple-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{request.leaveType}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Applied {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-gray-500">Days</p>
                          <p className="font-semibold text-gray-900">{request.numberOfDays}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-gray-500">Decision</p>
                          <p className="font-semibold text-gray-900">
                            {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-gray-500">Action</p>
                          <p className="font-semibold text-purple-700">View</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Application Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">From</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">To</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Days</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Approval Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Approver Comments</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 sticky right-0 bg-gray-50">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-500">
                          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                          Loading...
                        </td>
                      </tr>
                    ) : myLeaveRegisterRequests.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4">
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
                                    onClick: () => setShowApplyLeaveModal(true),
                                    icon: <PlusIcon className="h-5 w-5 mr-2" />,
                                  }
                                : undefined
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      myLeaveRegisterRequests.map((request) => (
                        <tr
                          key={request.leaveId}
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="hover:bg-purple-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {request.leaveType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(request.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(request.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{request.numberOfDays}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-[220px] truncate" title={request.reason || '-'}>
                            {request.reason || '-'}
                          </td>
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
                          <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                            {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-[220px] truncate" title={request.approverComments || '-'}>
                            {request.approverComments || '-'}
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

        {activeView === 'company-leaves' && isHROrAdmin && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Company Leaves</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Active employees only. Each cell shows days taken / total eligible for the current leave year.
                  </p>
                </div>
                <button
                  onClick={fetchCompanyLeaveData}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  <ArrowPathIcon className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Leave Balance Matrix</h3>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    {companyLeaveEmployees.length} active employees
                  </span>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="min-w-max divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-20 min-w-[240px] bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Employee
                      </th>
                      {companyLeaveColumns.map((column) => (
                        <th key={column.key} className="min-w-[140px] px-3 py-2 text-center text-xs font-semibold text-gray-700">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={companyLeaveColumns.length + 1} className="px-4 py-10 text-center text-sm text-gray-500">
                          <ArrowPathIcon className="mx-auto mb-2 h-6 w-6 animate-spin text-purple-600" />
                          Loading company leave balances...
                        </td>
                      </tr>
                    ) : companyLeaveEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={companyLeaveColumns.length + 1} className="px-4 py-10 text-center text-sm text-gray-500">
                          No active employees found.
                        </td>
                      </tr>
                    ) : companyLeaveColumns.length === 0 ? (
                      <tr>
                        <td colSpan={1} className="px-4 py-10 text-center text-sm text-gray-500">
                          No active leave policies or leave balance records found.
                        </td>
                      </tr>
                    ) : (
                      companyLeaveEmployees.map((employee) => {
                        const employeeBalances = companyLeaveBalanceByEmployee.get(employee.id) || [];
                        return (
                          <tr key={employee.id} className="hover:bg-purple-50">
                            <td className="sticky left-0 z-10 min-w-[240px] bg-white px-3 py-2 shadow-[1px_0_0_#e5e7eb]">
                              <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.code || '-'} · {employee.department || 'No department'}</p>
                            </td>
                            {companyLeaveColumns.map((column) => {
                              const balance = employeeBalances.find((item) => {
                                const key = normalizeLeaveKey(item.leaveType || '');
                                return column.matchKeys.includes(key);
                              });
                              const isEligible = isGenderEligibleForPolicy(employee.gender, column.applicableGender);
                              const used = Number(balance?.used) || 0;
                              const total = isEligible ? (Number(balance?.totalEntitlement) || column.fallbackTotal || 0) : 0;
                              return (
                                <td key={`${employee.id}-${column.key}`} className="px-3 py-2 text-center">
                                  <span className={`inline-flex min-w-[72px] justify-center rounded-lg px-3 py-1.5 text-sm font-bold ${
                                    !isEligible ? 'bg-gray-100 text-gray-400' : balance ? 'bg-purple-50 text-purple-800' : 'bg-gray-50 text-gray-500'
                                  }`}>
                                    {used} / {total}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        leaveBalances={leaveBalances}
        leavePolicies={leavePolicies}
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
          canCancel={activeView === 'my-leave' && selectedRequest.status === 'pending'}
          onApprove={(comments) => handleApproveReject(selectedRequest.leaveId, 'approved', comments)}
          onReject={(comments) => handleApproveReject(selectedRequest.leaveId, 'rejected', comments)}
          onCancel={() => handleCancelLeave(selectedRequest.leaveId)}
        />
      )}

      {/* Leave Policies Modal */}
      {showPoliciesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close leave policies"
              className="fixed inset-0 bg-gray-900/70"
              onClick={() => setShowPoliciesModal(false)}
            />
            <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                    <DocumentTextIcon className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Active Leave Policies</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Active company-wide policies define entitlement rules. Employee balances are separate yearly records created from these policies.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPoliciesModal(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {leavePolicies.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-3 text-base font-semibold text-gray-900">No active policies found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      HR must create active leave policies before employee balances can be initialized.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {leavePolicies.map((policy) => {
                      const { icon: Icon, color } = getLeaveTypeIcon(policy.leaveType);
                      return (
                        <div key={policy.policyId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{policy.policyName}</h3>
                                <p className="text-xs capitalize text-gray-500">{policy.leaveType} leave · Company-wide</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">{policy.totalLeaves}</p>
                              <p className="text-xs text-gray-500">days/year</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Approval</p>
                              <p className="font-semibold text-gray-900">{policy.requiresApproval ? 'Required' : 'Not required'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Carry fwd</p>
                              <p className="font-semibold text-gray-900">{policy.carryForward ? policy.maxCarryForward : 0}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Notice</p>
                              <p className="font-semibold text-gray-900">{policy.minNoticeDays || 0}d</p>
                            </div>
                          </div>
                          {policy.description && (
                            <p className="mt-3 text-xs leading-5 text-gray-500">{policy.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
