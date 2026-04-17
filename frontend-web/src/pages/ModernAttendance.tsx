import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal';
import { EmptyState } from '../components/common/EmptyState';
import attendanceService, { Attendance, TimeEntryEdit, TimeEntryEditStatus } from '../services/attendanceService';
import leaveService, { LeaveRequest as APILeaveRequest } from '../services/leaveService';
import employeeService from '../services/employeeService';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// Using types from attendanceService and leaveService - no local types needed

export default function ModernAttendance() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'my-attendance' | 'team' | 'company' | 'requests'>('my-attendance');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Filter for attendance status

  // Employee state
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [myStats, setMyStats] = useState({ present: 0, absent: 0, late: 0, avgHours: 0 });
  const [clockedIn, setClockedIn] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<string | null>(null);

  // Manager/HR state - separate for team and company
  const [teamAttendance, setTeamAttendance] = useState<Attendance[]>([]);
  const [teamStats, setTeamStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });
  const [companyAttendance, setCompanyAttendance] = useState<Attendance[]>([]);
  const [companyStats, setCompanyStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });

  // Requests state
  const [leaveRequests, setLeaveRequests] = useState<APILeaveRequest[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<TimeEntryEdit[]>([]);

  // Leave application modal (unified component)
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);

  // Regularization request modal
  const [showRegularizationModal, setShowRegularizationModal] = useState(false);
  const [regularizationFormData, setRegularizationFormData] = useState({
    date: '',
    requestType: 'late-arrival',
    reason: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
  });

  // Mass update modal
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);
  const [massUpdateFormData, setMassUpdateFormData] = useState({
    date: '',
    status: 'present',
    reason: '',
    applyToAll: false,
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Employee list for multi-select (fetched from API)
  const [employees, setEmployees] = useState<Array<{
    id: string;
    code: string;
    name: string;
    department: string;
  }>>([]);

  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Sync attendance modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncFormData, setSyncFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    device: '',
    uploadMethod: 'device' as 'device' | 'file',
  });
  const [syncPreviewData, setSyncPreviewData] = useState<Array<{
    employeeCode: string;
    employeeName: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }>>([]);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const [syncResults, setSyncResults] = useState({ total: 0, successful: 0, failed: 0 });

  // Mock biometric devices
  const biometricDevices = [
    { id: 'device-1', name: 'Main Entrance - ZKTeco K40', location: 'Building A' },
    { id: 'device-2', name: 'Office Floor - Suprema BioStation', location: 'Building B' },
    { id: 'device-3', name: 'Warehouse - eSSL X990', location: 'Building C' },
  ];

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [user, selectedDate, selectedMonth, activeView]);

  // Set initial view only on mount
  useEffect(() => {
    setActiveView('my-attendance');
  }, []);

  const fetchEmployees = async () => {
    try {
      if (!user || !['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user.role?.toString().toUpperCase() || '')) {
        return; // Only HR/Admin need employee list for mass updates
      }

      const response = await employeeService.getEmployees();
      const employeeList = response.data.employees.map((emp: any) => ({
        id: emp.employeeId,
        code: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'N/A',
      }));
      setEmployees(employeeList);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      // Don't show error notification - employees list is optional for mass update feature
    }
  };

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date ranges
      const monthStart = new Date(selectedMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      const dayStart = new Date(selectedDate);
      const dayEnd = new Date(selectedDate);

      // Fetch My Attendance (always fetch for employee view)
      if (activeView === 'my-attendance') {
        const myAttendanceData = await attendanceService.getMyAttendance(
          monthStart.toISOString().split('T')[0],
          monthEnd.toISOString().split('T')[0]
        );
        setMyAttendance(myAttendanceData);

        // Calculate stats
        setMyStats({
          present: myAttendanceData.filter(a => a.status === 'present').length,
          absent: myAttendanceData.filter(a => a.status === 'absent').length,
          late: myAttendanceData.filter(a => a.isLate).length,
          avgHours: myAttendanceData.length > 0
            ? myAttendanceData.reduce((sum, a) => sum + (a.workMinutes || 0), 0) / myAttendanceData.length / 60
            : 0,
        });

        // Check if clocked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const todayRecord = myAttendanceData.find(a => {
          const recordDate = new Date(a.date);
          recordDate.setHours(0, 0, 0, 0);
          const recordDateStr = recordDate.toISOString().split('T')[0];
          return recordDateStr === todayStr;
        });

        if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
          setClockedIn(true);
          const checkInDate = new Date(todayRecord.checkIn);
          setTodayCheckIn(checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setClockedIn(false);
          setTodayCheckIn(null);
        }
      }

      // Fetch Team/Company Attendance
      if (activeView === 'team') {
        const isHRorAdmin = ['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user.role?.toString().toUpperCase() || '');

        if (isHRorAdmin) {
          // HR/Admin: Get company-wide attendance (backend filters by role)
          const companyData = await attendanceService.getCompanyWide(
            dayStart.toISOString().split('T')[0],
            dayEnd.toISOString().split('T')[0]
          );

          // CRITICAL: Filter out current user from company view
          const filteredCompanyData = companyData.filter(a => a.employeeId !== user.employeeId);
          setCompanyAttendance(filteredCompanyData);

          setCompanyStats({
            total: filteredCompanyData.length,
            present: filteredCompanyData.filter(a => a.status === 'present').length,
            absent: filteredCompanyData.filter(a => a.status === 'absent').length,
            late: filteredCompanyData.filter(a => a.isLate).length,
            onLeave: filteredCompanyData.filter(a => a.status === 'on-leave').length,
          });

          // For managers viewing company tab, use same data for team stats
          setTeamAttendance(filteredCompanyData);
          setTeamStats({
            total: filteredCompanyData.length,
            present: filteredCompanyData.filter(a => a.status === 'present').length,
            absent: filteredCompanyData.filter(a => a.status === 'absent').length,
            late: filteredCompanyData.filter(a => a.isLate).length,
            onLeave: filteredCompanyData.filter(a => a.status === 'on-leave').length,
          });
        } else if (user.role?.toString().toUpperCase() === 'MANAGER') {
          // Manager: Get team attendance (backend filters by reporting hierarchy)
          const teamData = await attendanceService.getTeamAttendance(
            dayStart.toISOString().split('T')[0],
            dayEnd.toISOString().split('T')[0]
          );
          setTeamAttendance(teamData);

          setTeamStats({
            total: teamData.length,
            present: teamData.filter(a => a.status === 'present').length,
            absent: teamData.filter(a => a.status === 'absent').length,
            late: teamData.filter(a => a.isLate).length,
            onLeave: teamData.filter(a => a.status === 'on-leave').length,
          });
        }
      }

      // Fetch Pending Requests
      if (activeView === 'requests') {
        if (['HR_ADMIN', 'SYSTEM_ADMIN', 'MANAGER'].includes(user.role?.toString().toUpperCase() || '')) {
          // Fetch pending leave requests
          const allLeaveRequests = await leaveService.getPendingApprovals();
          // CRITICAL: Filter out current user's own leave requests
          const filteredLeaveRequests = allLeaveRequests.filter(r => r.employeeId !== user.employeeId);
          setLeaveRequests(filteredLeaveRequests);

          // Fetch pending regularization requests
          const regularizations = await attendanceService.getPendingRegularizations();
          // CRITICAL: Filter out current user's own regularization requests
          const filteredRegularizations = regularizations.filter(r => r.employeeId !== user.employeeId);
          setRegularizationRequests(filteredRegularizations);
        }
      }
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      showNotification(error.message || 'Failed to fetch attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const attendance = await attendanceService.clockIn();
      const checkInDate = new Date(attendance.checkIn!);
      const time = checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTodayCheckIn(time);
      setClockedIn(true);
      showNotification('Clocked in successfully at ' + time, 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to clock in', 'error');
    }
  };

  const handleClockOut = async () => {
    try {
      await attendanceService.clockOut();
      setClockedIn(false);
      setTodayCheckIn(null);
      showNotification('Clocked out successfully', 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to clock out', 'error');
    }
  };

  const handleRegularizationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Construct date-time strings from date and time inputs
      const requestedCheckInDateTime = regularizationFormData.requestedCheckIn
        ? `${regularizationFormData.date}T${regularizationFormData.requestedCheckIn}:00`
        : undefined;

      const requestedCheckOutDateTime = regularizationFormData.requestedCheckOut
        ? `${regularizationFormData.date}T${regularizationFormData.requestedCheckOut}:00`
        : undefined;

      await attendanceService.requestRegularization({
        date: regularizationFormData.date,
        requestedCheckIn: requestedCheckInDateTime,
        requestedCheckOut: requestedCheckOutDateTime,
        reason: regularizationFormData.reason,
      });

      showNotification('Regularization request submitted successfully', 'success');
      setShowRegularizationModal(false);
      setRegularizationFormData({ date: '', requestType: 'late-arrival', reason: '', requestedCheckIn: '', requestedCheckOut: '' });
      // Refresh data if viewing requests
      if (activeView === 'requests') {
        await fetchData();
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to submit regularization request', 'error');
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await leaveService.approveOrReject(leaveId, 'approved');
      showNotification('Leave request approved', 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to approve leave request', 'error');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      await leaveService.approveOrReject(leaveId, 'rejected', 'Rejected from attendance module');
      showNotification('Leave request rejected', 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to reject leave request', 'error');
    }
  };

  const handleApproveRegularization = async (editId: string) => {
    try {
      await attendanceService.approveRegularization(editId);
      showNotification('Regularization request approved', 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to approve regularization request', 'error');
    }
  };

  const handleRejectRegularization = async (editId: string) => {
    try {
      await attendanceService.rejectRegularization(editId, 'Request rejected');
      showNotification('Regularization request rejected', 'success');
      // Refresh data
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to reject regularization request', 'error');
    }
  };

  const handleMassUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const count = massUpdateFormData.applyToAll ? employees.length : selectedEmployees.length;

    if (!massUpdateFormData.applyToAll && selectedEmployees.length === 0) {
      showNotification('Please select at least one employee', 'error');
      return;
    }

    // Simulate API call
    showNotification(`Mass attendance update completed for ${count} employee(s)`, 'success');
    setShowMassUpdateModal(false);
    setMassUpdateFormData({ date: '', status: 'present', reason: '', applyToAll: false });
    setSelectedEmployees([]);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleDeviceSelection = (deviceId: string) => {
    setSyncFormData({ ...syncFormData, device: deviceId });

    // Simulate fetching data from device
    if (deviceId) {
      setTimeout(() => {
        const mockData = employees.slice(0, 20).map(emp => ({
          employeeCode: emp.code,
          employeeName: emp.name,
          checkIn: `09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          checkOut: `18:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          status: Math.random() > 0.1 ? 'present' : 'absent',
        }));
        setSyncPreviewData(mockData);
      }, 1000);
    } else {
      setSyncPreviewData([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');

      // Parse CSV (assuming format: EmployeeCode,Name,CheckIn,CheckOut,Status)
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const [employeeCode, employeeName, checkIn, checkOut, status] = line.split(',');
        return {
          employeeCode: employeeCode?.trim() || '',
          employeeName: employeeName?.trim() || '',
          checkIn: checkIn?.trim() || '',
          checkOut: checkOut?.trim() || '',
          status: status?.trim() || 'present',
        };
      });

      setSyncPreviewData(data);
    };
    reader.readAsText(file);
  };

  const handleSyncSave = () => {
    if (syncPreviewData.length === 0) {
      showNotification('No attendance data to sync', 'error');
      return;
    }

    // Simulate API call to save attendance
    setTimeout(() => {
      const total = employees.length;
      const successful = syncPreviewData.length;
      const failed = Math.max(0, total - successful);

      setSyncResults({ total, successful, failed });
      setShowSyncResults(true);

      // Reset after showing results
      setTimeout(() => {
        setShowSyncModal(false);
        setShowSyncResults(false);
        setSyncPreviewData([]);
        setSyncFormData({ date: new Date().toISOString().split('T')[0], device: '', uploadMethod: 'device' });
        showNotification(`Attendance synced: ${successful} successful, ${failed} failed`, successful > 0 ? 'success' : 'error');
      }, 3000);
    }, 1000);
  };

  const handleExportCSV = () => {
    const data = activeView === 'my-attendance' ? myAttendance :
                 activeView === 'team' ? teamAttendance : companyAttendance;

    const headers = ['Date', 'Employee Code', 'Employee Name', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Late'];
    const rows = data.map(record => [
      record.date,
      record.employee?.employeeCode || '-',
      record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '-',
      record.checkIn || '-',
      record.checkOut || '-',
      record.workMinutes > 0 ? `${(record.workMinutes / 60).toFixed(1)}h` : '-',
      record.status,
      record.isLate ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    showNotification('Attendance data exported successfully', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'badge-success',
      absent: 'badge-danger',
      'half-day': 'badge-warning',
      'on-leave': 'badge-primary',
      weekend: 'badge-gray',
    };
    return badges[status as keyof typeof badges] || 'badge-gray';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Attendance</h1>
                <p className="text-xs text-gray-500">
                  {activeView === 'my-attendance' ? 'My records' :
                   activeView === 'team' ? 'Team overview' : 'Pending requests'}
                </p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveView('my-attendance');
                  setStatusFilter('all');
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeView === 'my-attendance' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                <span>My Attendance</span>
              </button>

              {(['MANAGER', 'HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                <>
                  <button
                    onClick={() => {
                      setActiveView('team');
                      setStatusFilter('all');
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      activeView === 'team' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UsersIcon className="h-4 w-4" />
                    <span>Company</span>
                  </button>

                  <button
                    onClick={() => setActiveView('requests')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 relative ${
                      activeView === 'requests' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ExclamationCircleIcon className="h-4 w-4" />
                    <span>Requests</span>
                    {(leaveRequests.filter(r => r.status === 'pending').length + regularizationRequests.filter(r => r.status === 'pending').length) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {leaveRequests.filter(r => r.status === 'pending').length + regularizationRequests.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Right: Date Selector + Actions Dropdown */}
            <div className="flex items-center space-x-2">
              {/* Date Selector */}
              {activeView === 'my-attendance' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              )}

              {activeView === 'team' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              )}

              {/* Compact Actions */}
              {activeView === 'team' && (['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowMassUpdateModal(true)}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-1 text-xs font-medium"
                    title="Mass Update"
                  >
                    <UsersIcon className="h-4 w-4" />
                    <span>Mass Update</span>
                  </button>
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-1 text-xs font-medium"
                    title="Sync Attendance"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Sync</span>
                  </button>
                </div>
              )}

              {/* Export */}
              {(activeView === 'my-attendance' || activeView === 'team') && (
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-1 text-xs font-medium"
                  title="Export to CSV"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MY ATTENDANCE VIEW (Employee) */}
        {activeView === 'my-attendance' && (
          <div className="space-y-4">
            {/* Clock In/Out Card - Compact */}
            <div className="card border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700 mb-0.5">TODAY'S ATTENDANCE</p>
                      <p className="text-base font-bold text-gray-900">
                        {clockedIn ? `Clocked In at ${todayCheckIn}` : 'Not Clocked In Yet'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!clockedIn ? (
                      <button onClick={handleClockIn} className="btn btn-primary">
                        <ClockIcon className="h-4 w-4 mr-1.5" />
                        Clock In
                      </button>
                    ) : (
                      <button onClick={handleClockOut} className="btn btn-danger">
                        <ClockIcon className="h-4 w-4 mr-1.5" />
                        Clock Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats - Clickable for Filtering - Compact */}
            <div className="grid grid-cols-4 gap-3">
              <div
                onClick={() => setStatusFilter('present')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'present' ? 'border-success-400 ring-2 ring-success-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{myStats.present}</p>
                    {statusFilter === 'present' && (
                      <p className="text-xs text-success-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-success-100 rounded-xl p-2">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('absent')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'absent' ? 'border-danger-400 ring-2 ring-danger-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{myStats.absent}</p>
                    {statusFilter === 'absent' && (
                      <p className="text-xs text-danger-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-danger-100 rounded-xl p-2">
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('late')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'late' ? 'border-warning-400 ring-2 ring-warning-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{myStats.late}</p>
                    {statusFilter === 'late' && (
                      <p className="text-xs text-warning-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-warning-100 rounded-xl p-2">
                    <ClockIcon className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('all')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'all' ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Avg Hours</p>
                    <p className="text-2xl font-bold text-primary-600">{myStats.avgHours.toFixed(1)}</p>
                    {statusFilter === 'all' && (
                      <p className="text-xs text-primary-600 mt-1">● View all</p>
                    )}
                  </div>
                  <div className="bg-primary-100 rounded-xl p-2">
                    <ChartBarIcon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* My Attendance Records - Compact */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">My Attendance History - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Late</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {myAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12">
                            <EmptyState
                              icon={<ClockIcon className="h-16 w-16 text-gray-400" />}
                              title="No Attendance Records"
                              description="Start tracking your attendance by clocking in above. Your attendance history will appear here."
                              primaryAction={{
                                label: "Clock In Now",
                                onClick: handleClockIn,
                                icon: <ClockIcon className="h-5 w-5 mr-2" />,
                              }}
                            />
                          </td>
                        </tr>
                      ) : (
                        myAttendance
                          .filter(record => {
                            if (statusFilter === 'all') return true;
                            if (statusFilter === 'late') return record.isLate;
                            return record.status === statusFilter;
                          })
                          .map((record) => {
                            const recordDate = typeof record.date === 'string' ? record.date : new Date(record.date).toISOString().split('T')[0];
                            const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
                            const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

                            return (
                              <tr key={record.attendanceId} className="hover:bg-purple-50 cursor-pointer transition-colors">
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {new Date(recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">{checkInTime}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{checkOutTime}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {record.workMinutes && record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                                    {record.status.toUpperCase().replace('-', ' ')}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {record.isLate ? (
                                    <span className="text-danger-600 font-medium">+{record.lateMinutes}m</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAM ATTENDANCE VIEW (Manager) */}
        {activeView === 'team' && (
          <div className="space-y-4">
            {/* Team Stats - Clickable - Compact */}
            <div className="grid grid-cols-5 gap-3">
              <div
                onClick={() => setStatusFilter('all')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'all' ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Team Size</p>
                    <p className="text-2xl font-bold text-primary-600">{teamStats.total}</p>
                    {statusFilter === 'all' && (
                      <p className="text-xs text-primary-600 mt-1">● View all</p>
                    )}
                  </div>
                  <div className="bg-primary-100 rounded-xl p-2">
                    <UsersIcon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('present')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'present' ? 'border-success-400 ring-2 ring-success-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{teamStats.present}</p>
                    {statusFilter === 'present' && (
                      <p className="text-xs text-success-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-success-100 rounded-xl p-2">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('absent')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'absent' ? 'border-danger-400 ring-2 ring-danger-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{teamStats.absent}</p>
                    {statusFilter === 'absent' && (
                      <p className="text-xs text-danger-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-danger-100 rounded-xl p-2">
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('late')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'late' ? 'border-warning-400 ring-2 ring-warning-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{teamStats.late}</p>
                    {statusFilter === 'late' && (
                      <p className="text-xs text-warning-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-warning-100 rounded-xl p-2">
                    <ClockIcon className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('on-leave')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'on-leave' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{teamStats.onLeave}</p>
                    {statusFilter === 'on-leave' && (
                      <p className="text-xs text-purple-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-xl p-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Attendance Table - Compact */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">Team Attendance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Employee</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamAttendance
                        .filter(record => {
                          if (statusFilter === 'all') return true;
                          if (statusFilter === 'late') return record.isLate;
                          return record.status === statusFilter;
                        })
                        .map((record) => {
                          const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
                          const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

                          return (
                            <tr key={record.attendanceId} className="hover:bg-purple-50 cursor-pointer transition-colors">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {record.employee?.firstName} {record.employee?.lastName}
                              </td>
                              <td className="px-3 py-2">
                                <span className="badge badge-gray text-xs">{record.employee?.employeeCode}</span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">{checkInTime}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{checkOutTime}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {record.workMinutes && record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                                  {record.status.toUpperCase().replace('-', ' ')}
                                </span>
                                {record.isLate && <span className="ml-2 text-xs text-danger-600">Late</span>}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPANY ATTENDANCE VIEW (HR Admin) */}
        {activeView === 'company' && (
          <div className="space-y-4">
            {/* Company Stats - Clickable - Compact */}
            <div className="grid grid-cols-5 gap-3">
              <div
                onClick={() => setStatusFilter('all')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'all' ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-primary-600">{companyStats.total}</p>
                    {statusFilter === 'all' && (
                      <p className="text-xs text-primary-600 mt-1">● View all</p>
                    )}
                  </div>
                  <div className="bg-primary-100 rounded-xl p-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('present')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'present' ? 'border-success-400 ring-2 ring-success-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{companyStats.present}</p>
                    {statusFilter === 'present' && (
                      <p className="text-xs text-success-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-success-100 rounded-xl p-2">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('absent')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'absent' ? 'border-danger-400 ring-2 ring-danger-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{companyStats.absent}</p>
                    {statusFilter === 'absent' && (
                      <p className="text-xs text-danger-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-danger-100 rounded-xl p-2">
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('late')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'late' ? 'border-warning-400 ring-2 ring-warning-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{companyStats.late}</p>
                    {statusFilter === 'late' && (
                      <p className="text-xs text-warning-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-warning-100 rounded-xl p-2">
                    <ClockIcon className="h-5 w-5 text-warning-600" />
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('on-leave')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'on-leave' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{companyStats.onLeave}</p>
                    {statusFilter === 'on-leave' && (
                      <p className="text-xs text-purple-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-xl p-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Attendance Table - Compact */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">Company-Wide Attendance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Employee</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyAttendance
                        .filter(record => {
                          if (statusFilter === 'all') return true;
                          if (statusFilter === 'late') return record.isLate;
                          return record.status === statusFilter;
                        })
                        .map((record) => {
                          const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
                          const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

                          return (
                            <tr key={record.attendanceId} className="hover:bg-purple-50 cursor-pointer transition-colors">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {record.employee?.firstName} {record.employee?.lastName}
                              </td>
                              <td className="px-3 py-2">
                                <span className="badge badge-gray text-xs">{record.employee?.employeeCode}</span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">{record.employee?.department?.name}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{checkInTime}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{checkOutTime}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {record.workMinutes && record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                                  {record.status.toUpperCase().replace('-', ' ')}
                                </span>
                                {record.isLate && <span className="ml-2 text-xs text-danger-600">Late</span>}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PENDING REQUESTS VIEW (Manager/HR) */}
        {activeView === 'requests' && (
          <div className="space-y-4">
            {/* Leave Requests */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center mr-2">
                      <CalendarIcon className="h-4 w-4" />
                    </span>
                    Pending Leave Requests
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {leaveRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No pending leave requests</p>
                  ) : (
                    leaveRequests.filter(r => r.status === 'pending').map((request) => (
                      <div key={request.leaveId} className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <div className="card-body p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-bold text-gray-900">
                                  {request.employee?.firstName} {request.employee?.lastName}
                                </p>
                                <span className="badge badge-gray text-xs">{request.employee?.email}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Leave Type</p>
                                  <p className="text-gray-900 capitalize">{request.leaveType}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Duration</p>
                                  <p className="text-gray-900">
                                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.numberOfDays} days)
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-gray-600 font-semibold">Reason</p>
                                  <p className="text-gray-900">{request.reason}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleApproveLeave(request.leaveId)}
                                className="btn btn-sm btn-success"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLeave(request.leaveId)}
                                className="btn btn-sm btn-danger"
                              >
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Regularization Requests */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center mr-2">
                      <ExclamationCircleIcon className="h-4 w-4" />
                    </span>
                    Pending Regularization Requests
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {regularizationRequests.filter(r => r.status === TimeEntryEditStatus.PENDING).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No pending regularization requests</p>
                  ) : (
                    regularizationRequests.filter(r => r.status === TimeEntryEditStatus.PENDING).map((request) => {
                      const requestDate = typeof request.attendance?.date === 'string'
                        ? request.attendance.date
                        : request.attendance?.date
                          ? new Date(request.attendance.date).toISOString().split('T')[0]
                          : '';

                      const requestedCheckInTime = request.requestedCheckIn
                        ? new Date(request.requestedCheckIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : undefined;

                      const requestedCheckOutTime = request.requestedCheckOut
                        ? new Date(request.requestedCheckOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : undefined;

                      return (
                        <div key={request.editId} className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                          <div className="card-body p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <p className="font-bold text-gray-900">
                                    {request.employee?.firstName} {request.employee?.lastName}
                                  </p>
                                  <span className="badge badge-gray text-xs">{request.employee?.email}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Date</p>
                                    <p className="text-gray-900">{requestDate ? new Date(requestDate).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Status</p>
                                    <p className="text-gray-900 capitalize">{request.status}</p>
                                  </div>
                                  {requestedCheckInTime && (
                                    <div>
                                      <p className="text-xs text-gray-600 font-semibold">Requested Check In</p>
                                      <p className="text-gray-900">{requestedCheckInTime}</p>
                                    </div>
                                  )}
                                  {requestedCheckOutTime && (
                                    <div>
                                      <p className="text-xs text-gray-600 font-semibold">Requested Check Out</p>
                                      <p className="text-gray-900">{requestedCheckOutTime}</p>
                                    </div>
                                  )}
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-600 font-semibold">Reason</p>
                                    <p className="text-gray-900">{request.reason}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => handleApproveRegularization(request.editId)}
                                  className="btn btn-sm btn-success"
                                >
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectRegularization(request.editId)}
                                  className="btn btn-sm btn-danger"
                                >
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Application Modal - Unified Component */}
      <ApplyLeaveModal
        isOpen={showApplyLeaveModal}
        onClose={() => setShowApplyLeaveModal(false)}
        onSuccess={() => {
          setShowApplyLeaveModal(false);
          showNotification('Leave request submitted successfully', 'success');
        }}
      />

      {/* Regularization Request Modal */}
      {showRegularizationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="card-body p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Request Attendance Regularization</h3>
                <button onClick={() => setShowRegularizationModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleRegularizationRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={regularizationFormData.date}
                    onChange={(e) => setRegularizationFormData({ ...regularizationFormData, date: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Request Type *</label>
                  <select
                    value={regularizationFormData.requestType}
                    onChange={(e) => setRegularizationFormData({ ...regularizationFormData, requestType: e.target.value })}
                    required
                    className="input"
                  >
                    <option value="late-arrival">Late Arrival</option>
                    <option value="early-departure">Early Departure</option>
                    <option value="missing-punch">Missing Punch</option>
                  </select>
                </div>

                {(regularizationFormData.requestType === 'late-arrival' || regularizationFormData.requestType === 'missing-punch') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Requested Check In Time *</label>
                    <input
                      type="time"
                      value={regularizationFormData.requestedCheckIn}
                      onChange={(e) => setRegularizationFormData({ ...regularizationFormData, requestedCheckIn: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                )}

                {(regularizationFormData.requestType === 'early-departure' || regularizationFormData.requestType === 'missing-punch') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Requested Check Out Time *</label>
                    <input
                      type="time"
                      value={regularizationFormData.requestedCheckOut}
                      onChange={(e) => setRegularizationFormData({ ...regularizationFormData, requestedCheckOut: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={regularizationFormData.reason}
                    onChange={(e) => setRegularizationFormData({ ...regularizationFormData, reason: e.target.value })}
                    required
                    rows={3}
                    placeholder="Explain why you need this regularization..."
                    className="input"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowRegularizationModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mass Update Modal */}
      {showMassUpdateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="card-body p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Mass Attendance Update</h3>
                    <p className="text-xs text-gray-600">Update multiple employee records at once</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMassUpdateModal(false);
                    setSelectedEmployees([]);
                    setMassUpdateFormData({ date: '', status: 'present', reason: '', applyToAll: false });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleMassUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={massUpdateFormData.date}
                    onChange={(e) => setMassUpdateFormData({ ...massUpdateFormData, date: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                  <select
                    value={massUpdateFormData.status}
                    onChange={(e) => setMassUpdateFormData({ ...massUpdateFormData, status: e.target.value })}
                    required
                    className="input"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="on-leave">On Leave</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={massUpdateFormData.applyToAll}
                      onChange={(e) => {
                        setMassUpdateFormData({ ...massUpdateFormData, applyToAll: e.target.checked });
                        if (e.target.checked) {
                          setSelectedEmployees([]);
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-bold text-gray-900">Apply to all employees ({employees.length})</span>
                  </label>

                  {!massUpdateFormData.applyToAll && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Select Employees ({selectedEmployees.length} selected)
                        </label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={selectAllEmployees}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={deselectAllEmployees}
                            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                        {employees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                                <span className="badge badge-gray text-xs">{employee.code}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{employee.department}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={massUpdateFormData.reason}
                    onChange={(e) => setMassUpdateFormData({ ...massUpdateFormData, reason: e.target.value })}
                    rows={3}
                    placeholder="Optional: Add a note for this mass update..."
                    className="input"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Warning</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {massUpdateFormData.applyToAll
                          ? `This will update attendance for ALL ${employees.length} employees on the selected date.`
                          : selectedEmployees.length > 0
                          ? `This will update attendance for ${selectedEmployees.length} selected employee(s). Make sure to review the selection before confirming.`
                          : 'Please select at least one employee or choose "Apply to all employees".'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMassUpdateModal(false);
                      setSelectedEmployees([]);
                      setMassUpdateFormData({ date: '', status: 'present', reason: '', applyToAll: false });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!massUpdateFormData.applyToAll && selectedEmployees.length === 0}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Attendance
                    {!massUpdateFormData.applyToAll && selectedEmployees.length > 0 && (
                      <span className="ml-1.5 text-xs">({selectedEmployees.length})</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sync Attendance Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-4xl w-full my-4 max-h-[95vh] flex flex-col">
            <div className="card-body p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Sync Attendance</h3>
                    <p className="text-xs text-gray-600">Import data from device or file</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncPreviewData([]);
                    setSyncFormData({ date: new Date().toISOString().split('T')[0], device: '', uploadMethod: 'device' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    value={syncFormData.date}
                    onChange={(e) => setSyncFormData({ ...syncFormData, date: e.target.value })}
                    required
                    className="input input-sm text-xs"
                  />
                </div>

                {/* Upload Method Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sync Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSyncFormData({ ...syncFormData, uploadMethod: 'device', device: '' })}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        syncFormData.uploadMethod === 'device'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          syncFormData.uploadMethod === 'device' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <ClockIcon className={`h-4 w-4 ${syncFormData.uploadMethod === 'device' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-xs font-medium text-gray-900">Biometric Device</p>
                          <p className="text-[10px] text-gray-500">Connect to device</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSyncFormData({ ...syncFormData, uploadMethod: 'file', device: '' })}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        syncFormData.uploadMethod === 'file'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          syncFormData.uploadMethod === 'file' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <ArrowDownTrayIcon className={`h-4 w-4 ${syncFormData.uploadMethod === 'file' ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-xs font-medium text-gray-900">Upload File</p>
                          <p className="text-[10px] text-gray-500">CSV or log file</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Device Selection */}
                {syncFormData.uploadMethod === 'device' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Biometric Device *</label>
                    <select
                      value={syncFormData.device}
                      onChange={(e) => handleDeviceSelection(e.target.value)}
                      className="input input-sm text-xs"
                    >
                      <option value="">-- Select a device --</option>
                      {biometricDevices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.name} ({device.location})
                        </option>
                      ))}
                    </select>
                    {syncFormData.device && (
                      <p className="text-[10px] text-blue-600 mt-1 flex items-center">
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Connected. Fetching data...
                      </p>
                    )}
                  </div>
                )}

                {/* File Upload */}
                {syncFormData.uploadMethod === 'file' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Attendance File *</label>
                    <input
                      type="file"
                      accept=".csv,.txt,.log"
                      onChange={handleFileUpload}
                      className="input input-sm text-xs"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Format: CSV, TXT, LOG (EmployeeCode, Name, CheckIn, CheckOut, Status)
                    </p>
                  </div>
                )}

                {/* Preview Data */}
                {syncPreviewData.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg p-2.5 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                      Preview ({syncPreviewData.length} records)
                    </h4>
                    <div className="max-h-40 overflow-y-auto bg-white rounded border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700">Code</th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700">Name</th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700">Check In</th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700">Check Out</th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {syncPreviewData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 py-1.5 text-[10px] text-gray-900">{record.employeeCode}</td>
                              <td className="px-2 py-1.5 text-[10px] text-gray-900">{record.employeeName}</td>
                              <td className="px-2 py-1.5 text-[10px] text-gray-900">{record.checkIn}</td>
                              <td className="px-2 py-1.5 text-[10px] text-gray-900">{record.checkOut}</td>
                              <td className="px-2 py-1.5">
                                <span className={`badge badge-sm text-[9px] ${
                                  record.status === 'present' ? 'badge-success' : 'badge-danger'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sync Results */}
                {showSyncResults && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-900">Sync Completed</p>
                        <div className="mt-1.5 space-y-0.5 text-[10px] text-green-800">
                          <p>Total: <span className="font-bold">{syncResults.total}</span></p>
                          <p>Success: <span className="font-bold text-green-600">{syncResults.successful}</span></p>
                          <p>Failed: <span className="font-bold text-red-600">{syncResults.failed}</span></p>
                        </div>
                        <p className="text-[10px] text-green-700 mt-1.5">Closing automatically...</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSyncModal(false);
                      setSyncPreviewData([]);
                      setSyncFormData({ date: new Date().toISOString().split('T')[0], device: '', uploadMethod: 'device' });
                    }}
                    className="btn btn-sm btn-secondary text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncSave}
                    disabled={syncPreviewData.length === 0 || showSyncResults}
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 py-1.5"
                  >
                    <CheckIcon className="h-3.5 w-3.5 mr-1" />
                    Save ({syncPreviewData.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
