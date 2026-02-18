import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ModernLayout } from '../components/layout/ModernLayout';
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

// Types
interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'on-leave' | 'weekend';
  isLate: boolean;
  lateMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
}

interface LeaveRequest {
  leaveId: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

interface RegularizationRequest {
  requestId: string;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  date: string;
  requestType: 'late-arrival' | 'early-departure' | 'missing-punch';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedCheckIn?: string;
  requestedCheckOut?: string;
}

export default function ModernAttendance() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'my-attendance' | 'team' | 'company' | 'requests'>('my-attendance');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Employee state
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myStats, setMyStats] = useState({ present: 0, absent: 0, late: 0, avgHours: 0 });
  const [clockedIn, setClockedIn] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<string | null>(null);

  // Manager state
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [teamStats, setTeamStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });

  // HR state
  const [companyAttendance, setCompanyAttendance] = useState<AttendanceRecord[]>([]);
  const [companyStats, setCompanyStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });

  // Requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regularizationRequests, setRegularizationRequests] = useState<RegularizationRequest[]>([]);

  // Leave application modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'casual',
    reason: '',
  });

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

  // Mock employees list for multi-select
  const mockEmployees = Array.from({ length: 30 }, (_, i) => ({
    id: `emp-${i}`,
    code: `EMP${String(i + 1).padStart(3, '0')}`,
    name: `${['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Tom', 'Anna'][i % 8]} ${['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor'][i % 8]}`,
    department: ['Engineering', 'Sales', 'HR'][i % 3],
  }));

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
    // Set default view based on role (handle both uppercase and lowercase roles)
    const userRole = user?.role?.toString().toUpperCase();
    if (userRole === 'HR_ADMIN' || userRole === 'SYSTEM_ADMIN') {
      setActiveView('company');
    } else if (userRole === 'MANAGER') {
      setActiveView('team');
    } else {
      setActiveView('my-attendance');
    }

    fetchData();
  }, [user, selectedDate, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    // Simulate API calls with mock data
    setTimeout(() => {
      // Mock my attendance
      const mockMyAttendance: AttendanceRecord[] = Array.from({ length: 20 }, (_, i) => ({
        attendanceId: `my-att-${i}`,
        employeeId: user?.employeeId || '',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkIn: i % 7 === 0 || i % 7 === 6 ? undefined : i % 10 === 0 ? '09:15 AM' : '08:55 AM',
        checkOut: i % 7 === 0 || i % 7 === 6 ? undefined : '06:00 PM',
        status: i % 7 === 0 || i % 7 === 6 ? 'weekend' : (i % 15 === 0 ? 'on-leave' : 'present'),
        isLate: i % 10 === 0 && i % 7 !== 0 && i % 7 !== 6,
        lateMinutes: i % 10 === 0 ? 15 : 0,
        workMinutes: i % 7 === 0 || i % 7 === 6 ? 0 : 480 + Math.floor(Math.random() * 60),
        overtimeMinutes: Math.random() > 0.8 ? 30 : 0,
      }));
      setMyAttendance(mockMyAttendance);
      setMyStats({
        present: mockMyAttendance.filter(a => a.status === 'present').length,
        absent: mockMyAttendance.filter(a => a.status === 'absent').length,
        late: mockMyAttendance.filter(a => a.isLate).length,
        avgHours: 8.2,
      });

      // Mock team attendance
      const mockTeamAttendance: AttendanceRecord[] = Array.from({ length: 12 }, (_, i) => ({
        attendanceId: `team-att-${i}`,
        employeeId: `emp-${i}`,
        employee: {
          employeeCode: `EMP${String(i + 1).padStart(3, '0')}`,
          firstName: ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa'][i % 6],
          lastName: ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'][i % 6],
          department: { name: 'Engineering' },
        },
        date: selectedDate,
        checkIn: i % 8 === 0 ? undefined : i % 5 === 0 ? '09:10 AM' : '08:50 AM',
        checkOut: i % 8 === 0 ? undefined : '06:00 PM',
        status: i % 8 === 0 ? 'absent' : (i % 12 === 0 ? 'on-leave' : 'present'),
        isLate: i % 5 === 0 && i % 8 !== 0,
        lateMinutes: i % 5 === 0 ? 10 : 0,
        workMinutes: i % 8 === 0 ? 0 : 480,
        overtimeMinutes: 0,
      }));
      setTeamAttendance(mockTeamAttendance);
      setTeamStats({
        total: 12,
        present: mockTeamAttendance.filter(a => a.status === 'present').length,
        absent: mockTeamAttendance.filter(a => a.status === 'absent').length,
        late: mockTeamAttendance.filter(a => a.isLate).length,
        onLeave: mockTeamAttendance.filter(a => a.status === 'on-leave').length,
      });

      // Mock company attendance
      const mockCompanyAttendance: AttendanceRecord[] = Array.from({ length: 30 }, (_, i) => ({
        attendanceId: `comp-att-${i}`,
        employeeId: `emp-${i}`,
        employee: {
          employeeCode: `EMP${String(i + 1).padStart(3, '0')}`,
          firstName: ['John', 'Sarah', 'Mike', 'Emily', 'David'][i % 5],
          lastName: ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis'][i % 5],
          department: { name: ['Engineering', 'Sales', 'HR'][i % 3] },
        },
        date: selectedDate,
        checkIn: i % 10 === 0 ? undefined : i % 6 === 0 ? '09:05 AM' : '08:55 AM',
        checkOut: i % 10 === 0 ? undefined : '06:00 PM',
        status: i % 10 === 0 ? 'absent' : (i % 15 === 0 ? 'on-leave' : 'present'),
        isLate: i % 6 === 0 && i % 10 !== 0,
        lateMinutes: i % 6 === 0 ? 5 : 0,
        workMinutes: i % 10 === 0 ? 0 : 480,
        overtimeMinutes: 0,
      }));
      setCompanyAttendance(mockCompanyAttendance);
      setCompanyStats({
        total: 30,
        present: mockCompanyAttendance.filter(a => a.status === 'present').length,
        absent: mockCompanyAttendance.filter(a => a.status === 'absent').length,
        late: mockCompanyAttendance.filter(a => a.isLate).length,
        onLeave: mockCompanyAttendance.filter(a => a.status === 'on-leave').length,
      });

      // Mock leave requests
      setLeaveRequests([
        {
          leaveId: '1',
          employeeId: 'emp-1',
          employee: { firstName: 'John', lastName: 'Doe', employeeCode: 'EMP001' },
          startDate: '2025-02-15',
          endDate: '2025-02-17',
          leaveType: 'Casual Leave',
          reason: 'Family function',
          status: 'pending',
          appliedOn: '2025-02-10',
        },
        {
          leaveId: '2',
          employeeId: 'emp-2',
          employee: { firstName: 'Sarah', lastName: 'Smith', employeeCode: 'EMP002' },
          startDate: '2025-02-20',
          endDate: '2025-02-20',
          leaveType: 'Sick Leave',
          reason: 'Medical appointment',
          status: 'pending',
          appliedOn: '2025-02-08',
        },
      ]);

      // Mock regularization requests
      setRegularizationRequests([
        {
          requestId: '1',
          employeeId: 'emp-3',
          employee: { firstName: 'Mike', lastName: 'Johnson', employeeCode: 'EMP003' },
          date: '2025-02-05',
          requestType: 'late-arrival',
          reason: 'Traffic jam due to accident',
          status: 'pending',
          requestedCheckIn: '09:30 AM',
        },
        {
          requestId: '2',
          employeeId: 'emp-4',
          employee: { firstName: 'Emily', lastName: 'Brown', employeeCode: 'EMP004' },
          date: '2025-02-06',
          requestType: 'missing-punch',
          reason: 'Forgot to check out',
          status: 'pending',
          requestedCheckIn: '09:00 AM',
          requestedCheckOut: '06:00 PM',
        },
      ]);

      setLoading(false);
    }, 500);
  };

  const handleClockIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setTodayCheckIn(time);
    setClockedIn(true);
    showNotification('Clocked in successfully at ' + time, 'success');
  };

  const handleClockOut = () => {
    setClockedIn(false);
    showNotification('Clocked out successfully', 'success');
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    showNotification('Leave request submitted successfully', 'success');
    setShowLeaveModal(false);
    setLeaveFormData({ startDate: '', endDate: '', leaveType: 'casual', reason: '' });
  };

  const handleRegularizationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    showNotification('Regularization request submitted successfully', 'success');
    setShowRegularizationModal(false);
    setRegularizationFormData({ date: '', requestType: 'late-arrival', reason: '', requestedCheckIn: '', requestedCheckOut: '' });
  };

  const handleApproveLeave = (leaveId: string) => {
    setLeaveRequests(prev => prev.map(req => req.leaveId === leaveId ? { ...req, status: 'approved' as const } : req));
    showNotification('Leave request approved', 'success');
  };

  const handleRejectLeave = (leaveId: string) => {
    setLeaveRequests(prev => prev.map(req => req.leaveId === leaveId ? { ...req, status: 'rejected' as const } : req));
    showNotification('Leave request rejected', 'success');
  };

  const handleApproveRegularization = (requestId: string) => {
    setRegularizationRequests(prev => prev.map(req => req.requestId === requestId ? { ...req, status: 'approved' as const } : req));
    showNotification('Regularization request approved', 'success');
  };

  const handleRejectRegularization = (requestId: string) => {
    setRegularizationRequests(prev => prev.map(req => req.requestId === requestId ? { ...req, status: 'rejected' as const } : req));
    showNotification('Regularization request rejected', 'success');
  };

  const handleMassUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const count = massUpdateFormData.applyToAll ? mockEmployees.length : selectedEmployees.length;

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
    setSelectedEmployees(mockEmployees.map(emp => emp.id));
  };

  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleDeviceSelection = (deviceId: string) => {
    setSyncFormData({ ...syncFormData, device: deviceId });

    // Simulate fetching data from device
    if (deviceId) {
      setTimeout(() => {
        const mockData = mockEmployees.slice(0, 20).map(emp => ({
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
      const total = mockEmployees.length;
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                <p className="text-sm text-gray-500">Real-time attendance tracking</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
                {user?.role?.toString().toUpperCase() === 'EMPLOYEE' && (
                  <button
                    onClick={() => setActiveView('my-attendance')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                      activeView === 'my-attendance' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ClockIcon className="h-4 w-4" />
                    <span>My Attendance</span>
                  </button>
                )}

                {(['MANAGER', 'HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                  <>
                    {user?.role?.toString().toUpperCase() === 'MANAGER' && (
                      <button
                        onClick={() => setActiveView('team')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                          activeView === 'team' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <UsersIcon className="h-4 w-4" />
                        <span>Team</span>
                      </button>
                    )}

                    {(['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                      <button
                        onClick={() => setActiveView('company')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                          activeView === 'company' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>Company</span>
                      </button>
                    )}

                    <button
                      onClick={() => setActiveView('requests')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 relative ${
                        activeView === 'requests' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ExclamationCircleIcon className="h-4 w-4" />
                      <span>Requests</span>
                      {(leaveRequests.filter(r => r.status === 'pending').length + regularizationRequests.filter(r => r.status === 'pending').length) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {leaveRequests.filter(r => r.status === 'pending').length + regularizationRequests.filter(r => r.status === 'pending').length}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                {/* Date/Month Selector based on view */}
                {activeView === 'my-attendance' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="input input-sm w-36 text-xs"
                  />
                )}

                {(activeView === 'team' || activeView === 'company') && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input input-sm w-36 text-xs"
                  />
                )}

                {/* Mass Update Button for HR */}
                {activeView === 'company' && (['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                  <button
                    onClick={() => setShowMassUpdateModal(true)}
                    className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1 px-2.5 py-1.5 text-xs"
                  >
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>Mass</span>
                  </button>
                )}

                {/* Sync Attendance Button for HR */}
                {activeView === 'company' && (['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1 px-2.5 py-1.5 text-xs"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    <span>Sync</span>
                  </button>
                )}

                {/* Export Button */}
                {(activeView === 'my-attendance' || activeView === 'team' || activeView === 'company') && (
                  <button
                    onClick={handleExportCSV}
                    className="btn btn-sm btn-secondary flex items-center space-x-1 px-2.5 py-1.5 text-xs"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </button>
                )}

                {/* Quick Actions for Employee */}
                {activeView === 'my-attendance' && user?.role?.toString().toUpperCase() === 'EMPLOYEE' && (
                  <>
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="btn btn-sm btn-primary flex items-center space-x-1 px-2.5 py-1.5 text-xs"
                    >
                      <CalendarDaysIcon className="h-3.5 w-3.5" />
                      <span>Leave</span>
                    </button>
                    <button
                      onClick={() => setShowRegularizationModal(true)}
                      className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-1 px-2.5 py-1.5 text-xs"
                    >
                      <ExclamationCircleIcon className="h-3.5 w-3.5" />
                      <span>Regularize</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

        {/* MY ATTENDANCE VIEW (Employee) */}
        {activeView === 'my-attendance' && (
          <div className="space-y-4">
            {/* Clock In/Out Card */}
            <div className="card border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="card-body p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <ClockIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700 mb-1">TODAY'S ATTENDANCE</p>
                      <p className="text-lg font-bold text-gray-900">
                        {clockedIn ? `Clocked In at ${todayCheckIn}` : 'Not Clocked In Yet'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!clockedIn ? (
                      <button onClick={handleClockIn} className="btn btn-primary btn-lg">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        Clock In
                      </button>
                    ) : (
                      <button onClick={handleClockOut} className="btn btn-danger btn-lg">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        Clock Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{myStats.present}</p>
                  </div>
                  <div className="bg-success-100 rounded-xl p-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{myStats.absent}</p>
                  </div>
                  <div className="bg-danger-100 rounded-xl p-3">
                    <XCircleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{myStats.late}</p>
                  </div>
                  <div className="bg-warning-100 rounded-xl p-3">
                    <ClockIcon className="h-6 w-6 text-warning-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Avg Hours</p>
                    <p className="text-2xl font-bold text-primary-600">{myStats.avgHours}</p>
                  </div>
                  <div className="bg-primary-100 rounded-xl p-3">
                    <ChartBarIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* My Attendance Records */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">My Attendance History - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Late</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {myAttendance.map((record) => (
                        <tr key={record.attendanceId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkIn || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkOut || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                              {record.status.toUpperCase().replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.isLate ? (
                              <span className="text-danger-600 font-medium">+{record.lateMinutes}m</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
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
            {/* Team Stats */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Team Size</p>
                    <p className="text-2xl font-bold text-primary-600">{teamStats.total}</p>
                  </div>
                  <div className="bg-primary-100 rounded-xl p-3">
                    <UsersIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{teamStats.present}</p>
                  </div>
                  <div className="bg-success-100 rounded-xl p-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{teamStats.absent}</p>
                  </div>
                  <div className="bg-danger-100 rounded-xl p-3">
                    <XCircleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{teamStats.late}</p>
                  </div>
                  <div className="bg-warning-100 rounded-xl p-3">
                    <ClockIcon className="h-6 w-6 text-warning-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{teamStats.onLeave}</p>
                  </div>
                  <div className="bg-purple-100 rounded-xl p-3">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Attendance Table */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">Team Attendance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamAttendance.map((record) => (
                        <tr key={record.attendanceId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-gray text-xs">{record.employee?.employeeCode}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkIn || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkOut || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                              {record.status.toUpperCase().replace('-', ' ')}
                            </span>
                            {record.isLate && <span className="ml-2 text-xs text-danger-600">Late</span>}
                          </td>
                        </tr>
                      ))}
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
            {/* Company Stats */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-primary-600">{companyStats.total}</p>
                  </div>
                  <div className="bg-primary-100 rounded-xl p-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{companyStats.present}</p>
                  </div>
                  <div className="bg-success-100 rounded-xl p-3">
                    <CheckCircleIcon className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{companyStats.absent}</p>
                  </div>
                  <div className="bg-danger-100 rounded-xl p-3">
                    <XCircleIcon className="h-6 w-6 text-danger-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{companyStats.late}</p>
                  </div>
                  <div className="bg-warning-100 rounded-xl p-3">
                    <ClockIcon className="h-6 w-6 text-warning-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{companyStats.onLeave}</p>
                  </div>
                  <div className="bg-purple-100 rounded-xl p-3">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Attendance Table */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">Company-Wide Attendance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Work Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyAttendance.map((record) => (
                        <tr key={record.attendanceId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {record.employee?.firstName} {record.employee?.lastName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-gray text-xs">{record.employee?.employeeCode}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.employee?.department?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkIn || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{record.checkOut || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                              {record.status.toUpperCase().replace('-', ' ')}
                            </span>
                            {record.isLate && <span className="ml-2 text-xs text-danger-600">Late</span>}
                          </td>
                        </tr>
                      ))}
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
                                <span className="badge badge-gray text-xs">{request.employee?.employeeCode}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Leave Type</p>
                                  <p className="text-gray-900">{request.leaveType}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Duration</p>
                                  <p className="text-gray-900">
                                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
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
                  {regularizationRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No pending regularization requests</p>
                  ) : (
                    regularizationRequests.filter(r => r.status === 'pending').map((request) => (
                      <div key={request.requestId} className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                        <div className="card-body p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-bold text-gray-900">
                                  {request.employee?.firstName} {request.employee?.lastName}
                                </p>
                                <span className="badge badge-gray text-xs">{request.employee?.employeeCode}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Request Type</p>
                                  <p className="text-gray-900 capitalize">{request.requestType.replace('-', ' ')}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 font-semibold">Date</p>
                                  <p className="text-gray-900">{new Date(request.date).toLocaleDateString()}</p>
                                </div>
                                {request.requestedCheckIn && (
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Requested Check In</p>
                                    <p className="text-gray-900">{request.requestedCheckIn}</p>
                                  </div>
                                )}
                                {request.requestedCheckOut && (
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Requested Check Out</p>
                                    <p className="text-gray-900">{request.requestedCheckOut}</p>
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
                                onClick={() => handleApproveRegularization(request.requestId)}
                                className="btn btn-sm btn-success"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRegularization(request.requestId)}
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
          </div>
        )}
      </div>

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="card-body p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Apply for Leave</h3>
                <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={leaveFormData.startDate}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={leaveFormData.endDate}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Type *</label>
                  <select
                    value={leaveFormData.leaveType}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value })}
                    required
                    className="input"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={leaveFormData.reason}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                    required
                    rows={3}
                    placeholder="Provide a brief reason for your leave..."
                    className="input"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowLeaveModal(false)} className="btn btn-secondary">
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
                    <span className="text-sm font-bold text-gray-900">Apply to all employees ({mockEmployees.length})</span>
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
                        {mockEmployees.map((employee) => (
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
                          ? `This will update attendance for ALL ${mockEmployees.length} employees on the selected date.`
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
