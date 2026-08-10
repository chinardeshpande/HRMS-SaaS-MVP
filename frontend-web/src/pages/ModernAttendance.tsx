import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ApplyLeaveModal } from '../components/leave/ApplyLeaveModal';
import { EmptyState } from '../components/common/EmptyState';
import attendanceService, {
  Attendance,
  AttendanceImportConflictPolicy,
  AttendanceImportPreview,
  AttendanceStatistics,
  DepartmentAttendance,
  TimeEntryEdit,
  TimeEntryEditStatus,
} from '../services/attendanceService';
import leaveService from '../services/leaveService';
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
  const [activeView, setActiveView] = useState<'my-attendance' | 'team' | 'requests' | 'reports'>('my-attendance');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [myDatePreset, setMyDatePreset] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [myRangeStart, setMyRangeStart] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [myRangeEnd, setMyRangeEnd] = useState(new Date().toISOString().split('T')[0]);
  const [workingFrom, setWorkingFrom] = useState<'Office' | 'WFH' | 'Off-site'>('Office');
  const [timerNow, setTimerNow] = useState(new Date());
  const [companyViewMode, setCompanyViewMode] = useState<'day' | 'range'>('day');
  const [companyRangeStart, setCompanyRangeStart] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [companyRangeEnd, setCompanyRangeEnd] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Filter for attendance status

  // Employee state
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [myStats, setMyStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    weekend: 0,
    holiday: 0,
    halfDay: 0,
    avgHours: 0,
  });
  const [clockedIn, setClockedIn] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<string | null>(null);

  // Manager/HR state - separate for team and company
  const [teamAttendance, setTeamAttendance] = useState<Attendance[]>([]);
  const [teamStats, setTeamStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });
  const [companyAttendance, setCompanyAttendance] = useState<Attendance[]>([]);
  const [companyStats, setCompanyStats] = useState({ total: 0, present: 0, absent: 0, late: 0, onLeave: 0 });

  // Requests state
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

  // Attendance import modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncFile, setSyncFile] = useState<File | null>(null);
  const [syncConflictPolicy, setSyncConflictPolicy] = useState<AttendanceImportConflictPolicy>('skip');
  const [syncPreview, setSyncPreview] = useState<AttendanceImportPreview | null>(null);
  const [syncImported, setSyncImported] = useState<number | null>(null);
  const [syncPreviewing, setSyncPreviewing] = useState(false);
  const [syncSaving, setSyncSaving] = useState(false);

  const [reportStartDate, setReportStartDate] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatistics | null>(null);
  const [departmentAttendance, setDepartmentAttendance] = useState<DepartmentAttendance[]>([]);
  const [leaveStats, setLeaveStats] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [user, selectedDate, selectedMonth, activeView, reportStartDate, reportEndDate, myDatePreset, myRangeStart, myRangeEnd, companyViewMode, companyRangeStart, companyRangeEnd]);

  // Set initial view only on mount
  useEffect(() => {
    setActiveView('my-attendance');
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTimerNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('manu-suppressed', showSyncModal);
    return () => document.body.classList.remove('manu-suppressed');
  }, [showSyncModal]);

  const fetchEmployees = async () => {
    try {
      if (!user || !['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user.role?.toString().toUpperCase() || '')) {
        return; // Only HR/Admin need employee list for mass updates
      }

      const response = await employeeService.getEmployees({ status: 'active' });
      const employeeList = response.data.employees
      .filter((emp: any) => (emp.status || '').toLowerCase() === 'active')
      .map((emp: any) => ({
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

  const isHROrAdmin = ['HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '');
  const isManager = user?.role?.toString().toUpperCase() === 'MANAGER';
  const canApproveAttendance = isHROrAdmin || isManager;
  const peopleViewLabel = isHROrAdmin ? 'Company' : isManager ? 'Team' : 'Team';

  const getNormalizedStatus = (status: string) => status.replace('-', '_');

  const getStatusLabel = (status: string) => getNormalizedStatus(status).replace('_', ' ').toUpperCase();

  const toISODate = (date: Date) => date.toISOString().split('T')[0];

  const getMyDateRange = () => {
    const today = new Date();
    const todayIso = toISODate(today);

    if (myDatePreset === 'today') {
      return { start: todayIso, end: todayIso };
    }

    if (myDatePreset === 'week') {
      const start = new Date(today);
      const day = start.getDay();
      const daysFromMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - daysFromMonday);
      return { start: toISODate(start), end: todayIso };
    }

    if (myDatePreset === 'custom') {
      return { start: myRangeStart, end: myRangeEnd };
    }

    const monthStart = new Date(`${selectedMonth}-01T00:00:00`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    return { start: toISODate(monthStart), end: toISODate(monthEnd) };
  };

  const getCompanyDateRange = () => (
    companyViewMode === 'day'
      ? { start: selectedDate, end: selectedDate }
      : { start: companyRangeStart, end: companyRangeEnd }
  );

  const getSelectedMassUpdateEmployees = () => {
    return massUpdateFormData.applyToAll ? employees : employees.filter((employee) => selectedEmployees.includes(employee.id));
  };

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date ranges
      const myRange = getMyDateRange();
      const companyRange = getCompanyDateRange();

      // Fetch My Attendance (always fetch for employee view)
      if (activeView === 'my-attendance') {
        const myAttendanceData = await attendanceService.getMyAttendance(
          myRange.start,
          myRange.end
        );
        setMyAttendance(myAttendanceData);

        // Calculate stats
        setMyStats({
          total: myAttendanceData.length,
          present: myAttendanceData.filter(a => a.status === 'present').length,
          absent: myAttendanceData.filter(a => a.status === 'absent').length,
          late: myAttendanceData.filter(a => a.isLate).length,
          onLeave: myAttendanceData.filter(a => getNormalizedStatus(a.status) === 'on_leave').length,
          weekend: myAttendanceData.filter(a => getNormalizedStatus(a.status) === 'weekend').length,
          holiday: myAttendanceData.filter(a => getNormalizedStatus(a.status) === 'holiday').length,
          halfDay: myAttendanceData.filter(a => getNormalizedStatus(a.status) === 'half_day').length,
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
            companyRange.start,
            companyRange.end
          );

          // CRITICAL: Filter out current user from company view
          const filteredCompanyData = companyData.filter(a => a.employeeId !== user.employeeId);
          setCompanyAttendance(filteredCompanyData);

          setCompanyStats({
            total: filteredCompanyData.length,
            present: filteredCompanyData.filter(a => a.status === 'present').length,
            absent: filteredCompanyData.filter(a => a.status === 'absent').length,
            late: filteredCompanyData.filter(a => a.isLate).length,
            onLeave: filteredCompanyData.filter(a => a.status === 'on_leave').length,
          });

          // For managers viewing company tab, use same data for team stats
          setTeamAttendance(filteredCompanyData);
          setTeamStats({
            total: filteredCompanyData.length,
            present: filteredCompanyData.filter(a => a.status === 'present').length,
            absent: filteredCompanyData.filter(a => a.status === 'absent').length,
            late: filteredCompanyData.filter(a => a.isLate).length,
            onLeave: filteredCompanyData.filter(a => a.status === 'on_leave').length,
          });
        } else if (user.role?.toString().toUpperCase() === 'MANAGER') {
          // Manager: Get team attendance (backend filters by reporting hierarchy)
          const teamData = await attendanceService.getTeamAttendance(
            companyRange.start,
            companyRange.end
          );
          setTeamAttendance(teamData);

          setTeamStats({
            total: teamData.length,
            present: teamData.filter(a => a.status === 'present').length,
            absent: teamData.filter(a => a.status === 'absent').length,
            late: teamData.filter(a => a.isLate).length,
            onLeave: teamData.filter(a => a.status === 'on_leave').length,
          });
        }
      }

      if (activeView === 'reports' && isHROrAdmin) {
        setReportsLoading(true);
        try {
          const [attendanceSummary, departmentSummary, leaveSummary] = await Promise.all([
            attendanceService.getStatistics(reportStartDate, reportEndDate),
            attendanceService.getByDepartment(reportStartDate, reportEndDate),
            leaveService.getStatistics(reportStartDate, reportEndDate),
          ]);
          setAttendanceStats(attendanceSummary);
          setDepartmentAttendance(departmentSummary);
          setLeaveStats(leaveSummary);
        } finally {
          setReportsLoading(false);
        }
      }

      // Fetch Pending Attendance Regularization Requests
      if (activeView === 'requests') {
        if (['HR_ADMIN', 'SYSTEM_ADMIN', 'MANAGER'].includes(user.role?.toString().toUpperCase() || '')) {
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
      const attendance = await attendanceService.clockIn(workingFrom);
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

  const handleReopenToday = async () => {
    const reason = window.prompt('Why are you reopening today\'s attendance?', 'Accidental clock-out');
    if (!reason?.trim()) return;

    try {
      await attendanceService.reopenToday(reason.trim());
      showNotification('Today\'s attendance is open again', 'success');
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to reopen attendance', 'error');
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

  const handleMassUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetEmployees = getSelectedMassUpdateEmployees();
    const count = targetEmployees.length;

    if (!massUpdateFormData.date) {
      showNotification('Please select an attendance date', 'error');
      return;
    }

    if (!massUpdateFormData.applyToAll && count === 0) {
      showNotification('Please select at least one employee', 'error');
      return;
    }

    try {
      const existingRecords = await attendanceService.getCompanyWide(massUpdateFormData.date, massUpdateFormData.date);
      const recordsByEmployeeId = new Map(existingRecords.map((record) => [record.employeeId, record]));
      const status = getNormalizedStatus(massUpdateFormData.status);

      await attendanceService.bulkUpdate(
        targetEmployees.map((employee) => {
          const existing = recordsByEmployeeId.get(employee.id);
          return {
            attendanceId: existing?.attendanceId,
            employeeId: employee.id,
            date: massUpdateFormData.date,
            status,
            notes: massUpdateFormData.reason || `Mass update by ${user?.fullName || user?.email || 'HR'}`,
          };
        }),
        massUpdateFormData.reason || `Mass attendance update for ${massUpdateFormData.date}`
      );

      showNotification(`Mass attendance update completed for ${count} employee(s)`, 'success');
      setShowMassUpdateModal(false);
      setMassUpdateFormData({ date: '', status: 'present', reason: '', applyToAll: false });
      setSelectedEmployees([]);
      await fetchData();
    } catch (error: any) {
      showNotification(error.message || 'Failed to update attendance records', 'error');
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSyncFile(file || null);
    setSyncPreview(null);
    setSyncImported(null);
  };

  const getImportError = (error: any, fallback: string) =>
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

  const handleSyncPreview = async () => {
    if (!syncFile) {
      showNotification('Choose a CSV attendance file first', 'error');
      return;
    }

    setSyncPreviewing(true);
    try {
      const preview = await attendanceService.previewImport(syncFile, syncConflictPolicy);
      setSyncPreview(preview);
      setSyncImported(null);
    } catch (error: any) {
      setSyncPreview(null);
      showNotification(getImportError(error, 'Unable to preview attendance file'), 'error');
    } finally {
      setSyncPreviewing(false);
    }
  };

  const handleSyncSave = async () => {
    if (!syncFile || !syncPreview) {
      showNotification('Preview the attendance file before importing it', 'error');
      return;
    }
    if (syncPreview.summary.errors > 0) {
      showNotification('Correct the invalid rows before importing', 'error');
      return;
    }
    setSyncSaving(true);
    try {
      const result = await attendanceService.commitImport(syncFile, syncConflictPolicy);
      setSyncPreview(result);
      setSyncImported(result.imported);
      showNotification(result.message, 'success');
      await fetchData();
    } catch (error: any) {
      showNotification(getImportError(error, 'Failed to import attendance records'), 'error');
    } finally {
      setSyncSaving(false);
    }
  };

  const handleDownloadImportTemplate = () => {
    const template = [
      'employeeCode,date,status,checkIn,checkOut,workMinutes,location,notes',
      'EMP001,2026-07-01,present,09:00,18:00,540,Office,Regular workday',
      'EMP002,2026-07-01,present,09:15,17:45,510,WFH,',
      'EMP001,2026-07-02,on_leave,,,,,Approved leave',
    ].join('\n');
    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aura_attendance_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const closeSyncModal = () => {
    setShowSyncModal(false);
    setSyncFile(null);
    setSyncPreview(null);
    setSyncImported(null);
    setSyncConflictPolicy('skip');
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

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    showNotification('Attendance data downloaded successfully', 'success');
  };

  const handleDownloadMyAttendance = () => {
    downloadCsv(
      `my_attendance_${mySelectedRange.start}_to_${mySelectedRange.end}.csv`,
      ['Date', 'Present / Absent', 'Working From', 'In Time', 'Out Time', 'Hours Worked'],
      myAttendanceRows.map(({ date, record }) => {
        const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
        return [
          date,
          record ? getPresentAbsentLabel(record.status) : 'Absent',
          isPresent ? formatWorkLocation(record.location || 'Office') : '-',
          record ? formatTime(record.checkIn) : '-',
          record ? formatTime(record.checkOut) : '-',
          record?.workMinutes ? formatDuration(record.workMinutes) : '-',
        ];
      })
    );
  };

  const handleDownloadCompanyAttendance = () => {
    if (companyViewMode === 'range') {
      downloadCsv(
        `${peopleViewLabel.toLowerCase()}_attendance_${companyRangeStart}_to_${companyRangeEnd}.csv`,
        ['Employee', 'Employee Code', ...companyGridDays],
        companyGridEmployees.map((employee) => [
          employee.name,
          employee.code || '-',
          ...companyGridDays.map((date) => {
            const record = attendanceByEmployeeAndDate.get(`${employee.id}:${date}`);
            const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
            return isPresent ? `P - ${formatWorkLocation(record.location || 'Office')}` : 'A';
          }),
        ])
      );
      return;
    }

    downloadCsv(
      `${peopleViewLabel.toLowerCase()}_attendance_${selectedDate}.csv`,
      ['Employee', 'Employee Code', 'Present / Absent', 'Working From', 'In Time', 'Out Time', 'Hours Worked'],
      companyGridEmployees.map((employee) => {
        const record = attendanceByEmployeeAndDate.get(`${employee.id}:${selectedDate}`);
        const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
        return [
          employee.name,
          employee.code || '-',
          record ? getPresentAbsentLabel(record.status) : 'Absent',
          isPresent ? formatWorkLocation(record.location || 'Office') : '-',
          record ? formatTime(record.checkIn) : '-',
          record ? formatTime(record.checkOut) : '-',
          record?.workMinutes ? formatDuration(record.workMinutes) : '-',
        ];
      })
    );
  };

  const handleExportReportCSV = () => {
    const attendanceRows = [
      ['Attendance Summary', 'Value'],
      ['Total Records', attendanceStats?.totalRecords || 0],
      ['Present', attendanceStats?.present || 0],
      ['Absent', attendanceStats?.absent || 0],
      ['Half Day', attendanceStats?.halfDay || 0],
      ['On Leave', attendanceStats?.onLeave || 0],
      ['Late', attendanceStats?.late || 0],
      ['Average Work Hours', attendanceStats?.averageWorkMinutes ? (attendanceStats.averageWorkMinutes / 60).toFixed(2) : '0'],
      [],
      ['Department', 'Total Records', 'Present', 'Absent', 'Total Work Hours'],
      ...departmentAttendance.map((department) => [
        department.departmentName || 'Unassigned',
        department.totalRecords,
        department.presentCount,
        department.absentCount,
        department.totalWorkMinutes ? (Number(department.totalWorkMinutes) / 60).toFixed(2) : '0',
      ]),
      [],
      ['Leave Summary', 'Value'],
      ['Total Requests', leaveStats?.total || 0],
      ['Approved', leaveStats?.approved || 0],
      ['Pending', leaveStats?.pending || 0],
      ['Rejected', leaveStats?.rejected || 0],
      ['Cancelled', leaveStats?.cancelled || 0],
      ['Total Days', leaveStats?.totalDays || 0],
    ];

    const csvContent = attendanceRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_leave_report_${reportStartDate}_to_${reportEndDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    showNotification('Report exported successfully', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'badge-success',
      absent: 'badge-danger',
      half_day: 'badge-warning',
      on_leave: 'badge-primary',
      holiday: 'badge-gray',
      weekend: 'badge-gray',
    };
    return badges[getNormalizedStatus(status) as keyof typeof badges] || 'badge-gray';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (value?: Date | string) =>
    value ? new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

  const formatWorkLocation = (value?: string) => {
    if (!value) return '-';
    const normalized = value.toLowerCase();
    if (normalized.includes('wfh') || normalized.includes('home')) return 'WFH';
    if (normalized.includes('off')) return 'Off-site';
    if (normalized.includes('office')) return 'Office';
    return value;
  };

  const getPresentAbsentLabel = (status: string) => {
    const normalized = getNormalizedStatus(status);
    if (normalized === 'present' || normalized === 'half_day') return 'Present';
    if (normalized === 'on_leave') return 'On Leave';
    if (normalized === 'weekend') return 'Weekend';
    if (normalized === 'holiday') return 'Holiday';
    return 'Absent';
  };

  const getLiveTimer = () => {
    if (!clockedIn || !todayCheckIn) return '00h 00m';
    const today = new Date().toISOString().split('T')[0];
    const started = new Date(`${today} ${todayCheckIn}`);
    if (Number.isNaN(started.getTime())) return '00h 00m';
    const elapsedMinutes = Math.max(0, Math.floor((timerNow.getTime() - started.getTime()) / 60000));
    return formatDuration(elapsedMinutes);
  };

  const getDateRangeDays = (start: string, end: string) => {
    const days: string[] = [];
    const current = new Date(`${start}T00:00:00`);
    const final = new Date(`${end}T00:00:00`);
    if (Number.isNaN(current.getTime()) || Number.isNaN(final.getTime()) || final < current) return days;

    while (current <= final && days.length < 62) {
      days.push(toISODate(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getRecordDateKey = (record: Attendance) =>
    typeof record.date === 'string' ? record.date.slice(0, 10) : toISODate(new Date(record.date));

  const filterAttendanceRecords = (records: Attendance[]) =>
    records.filter(record => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'late') return record.isLate;
      return getNormalizedStatus(record.status) === statusFilter;
    });

  const filteredMyAttendance = filterAttendanceRecords(myAttendance);
  const myAttendanceByDate = new Map(myAttendance.map((record) => [getRecordDateKey(record), record]));
  const todayAttendance = myAttendanceByDate.get(toISODate(new Date()));
  const canReopenToday = Boolean(todayAttendance?.checkIn && todayAttendance?.checkOut);
  const mySelectedRange = getMyDateRange();
  const myAttendanceRows = getDateRangeDays(mySelectedRange.start, mySelectedRange.end).map((date) => ({
    date,
    record: myAttendanceByDate.get(date),
  }));
  const filteredPeopleAttendance = filterAttendanceRecords(teamAttendance);
  const attendanceByEmployeeAndDate = new Map(
    teamAttendance.map((record) => [`${record.employeeId}:${getRecordDateKey(record)}`, record])
  );
  const companyGridDays = getDateRangeDays(companyRangeStart, companyRangeEnd);
  const activeEmployeeIds = new Set(employees.map((employee) => employee.id));
  const activeTeamAttendance = isHROrAdmin && activeEmployeeIds.size > 0
    ? teamAttendance.filter((record) => activeEmployeeIds.has(record.employeeId))
    : teamAttendance;
  const companyGridEmployees = isHROrAdmin && employees.length > 0
    ? employees
    : Array.from(new Map(activeTeamAttendance.map((record) => [
        record.employeeId,
        {
          id: record.employeeId,
          code: record.employee?.employeeCode || '-',
          name: `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim() || 'Employee',
          department: record.employee?.department?.name || 'N/A',
        },
      ])).values());

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
        <div className="ui-experiment-hero p-4 mb-4">
          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-gray-950">Attendance command desk</h1>
                <p className="text-xs font-semibold text-gray-500">
                  {activeView === 'my-attendance' ? 'My records' :
                   activeView === 'team' ? `${peopleViewLabel} overview` :
                   activeView === 'requests' ? 'Attendance regularisation approvals' : 'Attendance workspace'}
                </p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="hidden xl:block w-48">
              <div className="ui-hr-illustration ui-hr-illustration-compact" aria-hidden="true">
                <span className="person-a" />
                <span className="person-b" />
                <span className="task-card" />
                <span className="spark-one" />
                <span className="spark-two" />
              </div>
            </div>

            <div className="grid w-full max-w-full grid-cols-2 gap-1 rounded-2xl border border-white/70 bg-white/60 p-1 shadow-sm sm:flex sm:w-auto sm:items-center sm:space-x-1 sm:gap-0 sm:overflow-x-auto">
              <button
                onClick={() => {
                  setActiveView('my-attendance');
                  setStatusFilter('all');
                }}
                className={`min-w-0 justify-center shrink-0 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeView === 'my-attendance' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                <span className="truncate sm:hidden">Mine</span>
                <span className="hidden sm:inline">My Attendance</span>
              </button>

              {(['MANAGER', 'HR_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role?.toString().toUpperCase() || '')) && (
                <>
                  <button
                    onClick={() => {
                      setActiveView('team');
                      setStatusFilter('all');
                    }}
                    className={`min-w-0 justify-center shrink-0 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      activeView === 'team' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UsersIcon className="h-4 w-4" />
                    <span>{peopleViewLabel}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('requests');
                      setStatusFilter('all');
                    }}
                    className={`relative min-w-0 justify-center shrink-0 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      activeView === 'requests' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="truncate sm:hidden">Approvals</span>
                    <span className="hidden sm:inline">Team Approvals</span>
                    {regularizationRequests.filter(r => r.status === TimeEntryEditStatus.PENDING).length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {regularizationRequests.filter(r => r.status === TimeEntryEditStatus.PENDING).length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="relative z-10 flex flex-wrap items-center gap-2">
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
                    title="Import attendance"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Import</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MY ATTENDANCE VIEW */}
        {activeView === 'my-attendance' && (
          <div className="space-y-4">
            <div className="card border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="card-body p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-800">Working from</span>
                      <select
                        value={workingFrom}
                        onChange={(event) => setWorkingFrom(event.target.value as 'Office' | 'WFH' | 'Off-site')}
                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="Office">Office</option>
                        <option value="WFH">WFH</option>
                        <option value="Off-site">Off-site</option>
                      </select>
                    </label>
                    <div className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-blue-800">Today</span>
                      <span className="mt-1 block text-sm font-semibold text-gray-900">
                        {clockedIn ? `Clocked in at ${todayCheckIn}` : 'Not clocked in'}
                      </span>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-white px-3 py-2">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-blue-800">Live timer</span>
                      <span className="mt-1 block text-lg font-bold text-gray-900">{getLiveTimer()}</span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:flex sm:justify-end">
                    <button
                      onClick={() => {
                        setRegularizationFormData((current) => ({
                          ...current,
                          date: new Date().toISOString().split('T')[0],
                        }));
                        setShowRegularizationModal(true);
                      }}
                      className="btn btn-secondary justify-center"
                    >
                      <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                      Regularize
                    </button>
                    <button onClick={() => setShowApplyLeaveModal(true)} className="btn btn-secondary justify-center">
                      <CalendarIcon className="h-4 w-4 mr-1.5" />
                      Apply Leave
                    </button>
                    {!clockedIn ? (
                      <div className="grid gap-2 sm:flex">
                        {canReopenToday && (
                          <button onClick={handleReopenToday} className="btn btn-secondary justify-center">
                            <ClockIcon className="h-4 w-4 mr-1.5" />
                            Reopen accidental clock-out
                          </button>
                        )}
                        {!canReopenToday && (
                          <button onClick={handleClockIn} className="btn btn-primary justify-center">
                            <ClockIcon className="h-4 w-4 mr-1.5" />
                            Clock In
                          </button>
                        )}
                      </div>
                    ) : (
                      <button onClick={handleClockOut} className="btn btn-danger justify-center">
                        <ClockIcon className="h-4 w-4 mr-1.5" />
                        Clock Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: 'This Week' },
                      { key: 'month', label: 'This Month' },
                      { key: 'custom', label: 'Date Range' },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => setMyDatePreset(preset.key as 'today' | 'week' | 'month' | 'custom')}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          myDatePreset === preset.key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:flex sm:items-center">
                    {myDatePreset === 'month' && (
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(event) => setSelectedMonth(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    )}
                    {myDatePreset === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={myRangeStart}
                          onChange={(event) => setMyRangeStart(event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        <span className="hidden text-xs text-gray-500 sm:inline">to</span>
                        <input
                          type="date"
                          value={myRangeEnd}
                          onChange={(event) => setMyRangeEnd(event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-0">
                <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Attendance Records</h3>
                  <button
                    onClick={handleDownloadMyAttendance}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    title="Download my attendance list"
                  >
                    <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
                    Download
                  </button>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                  {myAttendanceRows.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">Select a valid date range.</div>
                  ) : (
                    myAttendanceRows.map(({ date, record }) => {
                      const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
                      return (
                        <div key={date} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">{isPresent ? formatWorkLocation(record.location || 'Office') : '-'}</p>
                            </div>
                            <span className={`badge ${record ? getStatusBadge(record.status) : 'badge-danger'} text-xs`}>
                              {record ? getPresentAbsentLabel(record.status) : 'Absent'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">In</p>
                              <p className="font-semibold text-gray-900">{record ? formatTime(record.checkIn) : '-'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Out</p>
                              <p className="font-semibold text-gray-900">{record ? formatTime(record.checkOut) : '-'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Hours</p>
                              <p className="font-semibold text-gray-900">{record?.workMinutes ? formatDuration(record.workMinutes) : '-'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Present / Absent</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Working From</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">In Time</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Out Time</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {myAttendanceRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                            Select a valid date range.
                          </td>
                        </tr>
                      ) : (
                        myAttendanceRows.map(({ date, record }) => {
                          const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
                          return (
                            <tr key={date} className="hover:bg-blue-50">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`badge ${record ? getStatusBadge(record.status) : 'badge-danger'} text-xs`}>
                                  {record ? getPresentAbsentLabel(record.status) : 'Absent'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">{isPresent ? formatWorkLocation(record.location || 'Office') : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record ? formatTime(record.checkIn) : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record ? formatTime(record.checkOut) : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record?.workMinutes ? formatDuration(record.workMinutes) : '-'}</td>
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

        {/* COMPANY / TEAM ATTENDANCE VIEW */}
        {activeView === 'team' && (
          <div className="space-y-4">
            <div className="card">
              <div className="card-body p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{peopleViewLabel} Attendance</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {companyViewMode === 'day'
                        ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                        : `${new Date(`${companyRangeStart}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(`${companyRangeEnd}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="grid gap-2 md:flex md:items-center md:justify-end">
                    <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                      <button
                        onClick={() => setCompanyViewMode('day')}
                        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                          companyViewMode === 'day' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Day view
                      </button>
                      <button
                        onClick={() => setCompanyViewMode('range')}
                        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                          companyViewMode === 'range' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Date range
                      </button>
                    </div>
                    {companyViewMode === 'day' ? (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    ) : (
                      <div className="grid gap-2 sm:flex sm:items-center">
                        <input
                          type="date"
                          value={companyRangeStart}
                          onChange={(event) => setCompanyRangeStart(event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                        <span className="hidden text-xs text-gray-500 sm:inline">to</span>
                        <input
                          type="date"
                          value={companyRangeEnd}
                          onChange={(event) => setCompanyRangeEnd(event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {companyViewMode === 'day' ? (
              <div className="card">
                <div className="card-body p-0">
                  <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-gray-900">{peopleViewLabel} Day List</h3>
                    <button
                      onClick={handleDownloadCompanyAttendance}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      title={`Download ${peopleViewLabel.toLowerCase()} attendance`}
                    >
                      <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
                      Download
                    </button>
                  </div>
                  <div className="md:hidden divide-y divide-gray-100">
                    {companyGridEmployees.map((employee) => {
                      const record = attendanceByEmployeeAndDate.get(`${employee.id}:${selectedDate}`);
                      const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
                      return (
                        <div key={employee.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                              <p className="mt-1 text-xs text-gray-500">{employee.code || '-'} · {employee.department || 'No department'}</p>
                            </div>
                            <span className={`badge ${record ? getStatusBadge(record.status) : 'badge-danger'} text-xs`}>
                              {record ? getPresentAbsentLabel(record.status) : 'Absent'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">From</p>
                              <p className="font-semibold text-gray-900">{isPresent ? formatWorkLocation(record.location || 'Office') : '-'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">In / Out</p>
                              <p className="font-semibold text-gray-900">{record ? `${formatTime(record.checkIn)} - ${formatTime(record.checkOut)}` : '-'}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Hours</p>
                              <p className="font-semibold text-gray-900">{record?.workMinutes ? formatDuration(record.workMinutes) : '-'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Employee</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Present / Absent</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Working From</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">In Time</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Out Time</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Hours Worked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {companyGridEmployees.map((employee) => {
                          const record = attendanceByEmployeeAndDate.get(`${employee.id}:${selectedDate}`);
                          const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
                          return (
                            <tr key={employee.id} className="hover:bg-purple-50">
                              <td className="px-3 py-2">
                                <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                                <p className="text-xs text-gray-500">{employee.code || '-'} · {employee.department || 'No department'}</p>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`badge ${record ? getStatusBadge(record.status) : 'badge-danger'} text-xs`}>
                                  {record ? getPresentAbsentLabel(record.status) : 'Absent'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">{isPresent ? formatWorkLocation(record.location || 'Office') : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record ? formatTime(record.checkIn) : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record ? formatTime(record.checkOut) : '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{record?.workMinutes ? formatDuration(record.workMinutes) : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body p-0">
                  <div className="flex flex-col gap-2 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-gray-900">{peopleViewLabel} Date Range Grid</h3>
                    <button
                      onClick={handleDownloadCompanyAttendance}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      title={`Download ${peopleViewLabel.toLowerCase()} attendance`}
                    >
                      <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
                      Download
                    </button>
                  </div>
                  <div className="max-h-[620px] overflow-auto">
                    <table className="min-w-max divide-y divide-gray-200">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th className="sticky left-0 z-20 min-w-[220px] bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Employee
                          </th>
                          {companyGridDays.map((date) => (
                            <th key={date} className="min-w-[92px] px-3 py-2 text-center text-xs font-semibold text-gray-700">
                              <span className="block">{new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className="block text-gray-500">{new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {companyGridEmployees.map((employee) => (
                          <tr key={employee.id}>
                            <td className="sticky left-0 z-10 min-w-[220px] bg-white px-3 py-2 shadow-[1px_0_0_#e5e7eb]">
                              <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.code || '-'} · {employee.department || 'No department'}</p>
                            </td>
                            {companyGridDays.map((date) => {
                              const record = attendanceByEmployeeAndDate.get(`${employee.id}:${date}`);
                              const isPresent = record && ['present', 'half_day'].includes(getNormalizedStatus(record.status));
                              return (
                                <td key={date} className="px-2 py-2 text-center">
                                  <div className={`mx-auto min-h-[52px] rounded-lg border px-2 py-1 ${
                                    isPresent ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-100 bg-red-50 text-red-700'
                                  }`}>
                                    <span className="block text-sm font-bold">{isPresent ? 'P' : 'A'}</span>
                                    {isPresent && (
                                      <span className="mt-0.5 block text-[11px] font-semibold">{formatWorkLocation(record.location || 'Office')}</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {companyGridDays.length === 0 && (
                      <div className="p-8 text-center text-sm text-gray-500">Select a valid date range.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEGACY TEAM ATTENDANCE VIEW (disabled) */}
        {false && activeView === 'team' && (
          <div className="space-y-4">
            {/* Team Stats - Clickable - Compact */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div
                onClick={() => setStatusFilter('all')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'all' ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">{peopleViewLabel} Size</p>
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
                onClick={() => setStatusFilter('on_leave')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'on_leave' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{teamStats.onLeave}</p>
                    {statusFilter === 'on_leave' && (
                      <p className="text-xs text-purple-600 mt-1">● Filtering</p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-xl p-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team/Company Attendance Table - Compact */}
            <div className="card">
              <div className="card-body p-0">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900">{peopleViewLabel} Attendance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                </div>
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredPeopleAttendance.map((record) => {
                      const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
                      const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

                      return (
                        <div key={record.attendanceId} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {record.employee?.firstName} {record.employee?.lastName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">{record.employee?.employeeCode || '-'} · {record.employee?.department?.name || 'No department'}</p>
                            </div>
                            <span className={`badge ${getStatusBadge(record.status)} text-xs`}>
                              {getStatusLabel(record.status)}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">In</p>
                              <p className="font-semibold text-gray-900">{checkInTime}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Out</p>
                              <p className="font-semibold text-gray-900">{checkOutTime}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-gray-500">Hours</p>
                              <p className="font-semibold text-gray-900">
                                {record.workMinutes && record.workMinutes > 0 ? formatDuration(record.workMinutes) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {filteredPeopleAttendance.length === 0 && (
                    <div className="p-8 text-center text-sm text-gray-500">No attendance records match this filter.</div>
                  )}
                </div>
                <div className="hidden overflow-x-auto md:block">
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
                      {filteredPeopleAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                            No attendance records match this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPeopleAttendance.map((record) => {
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
                                  {getStatusLabel(record.status)}
                                </span>
                                {record.isLate && <span className="ml-2 text-xs text-danger-600">Late</span>}
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

        {/* COMPANY ATTENDANCE VIEW (HR Admin) */}
        {false && (
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
                onClick={() => setStatusFilter('on_leave')}
                className={`bg-white rounded-xl shadow-sm border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === 'on_leave' ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{companyStats.onLeave}</p>
                    {statusFilter === 'on_leave' && (
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
                                  {getStatusLabel(record.status)}
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

        {/* REPORTS VIEW (HR/Admin) */}
        {activeView === 'reports' && isHROrAdmin && (
          <div className="space-y-4">
            {reportsLoading ? (
              <div className="card">
                <div className="card-body p-8 text-center text-sm text-gray-500">Loading reports...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Records</p>
                    <p className="text-2xl font-bold text-gray-900">{attendanceStats?.totalRecords || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
                    <p className="text-2xl font-bold text-success-600">{attendanceStats?.present || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-danger-600">{attendanceStats?.absent || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
                    <p className="text-2xl font-bold text-warning-600">{attendanceStats?.late || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-purple-600">{attendanceStats?.onLeave || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Avg Hours</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {attendanceStats?.averageWorkMinutes ? (attendanceStats.averageWorkMinutes / 60).toFixed(1) : '0.0'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="card lg:col-span-2">
                    <div className="card-body p-0">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900">Department Attendance</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Department</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Records</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Present</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Absent</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Hours</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {departmentAttendance.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">No department attendance found for this period</td>
                              </tr>
                            ) : (
                              departmentAttendance.map((department) => (
                                <tr key={department.departmentId || department.departmentName || 'unassigned'}>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{department.departmentName || 'Unassigned'}</td>
                                  <td className="px-3 py-2 text-sm text-gray-700">{department.totalRecords}</td>
                                  <td className="px-3 py-2 text-sm text-success-700">{department.presentCount}</td>
                                  <td className="px-3 py-2 text-sm text-danger-700">{department.absentCount}</td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {department.totalWorkMinutes ? (Number(department.totalWorkMinutes) / 60).toFixed(1) : '0.0'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Leave Summary</h3>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs text-gray-600">Total</p>
                          <p className="text-xl font-bold text-gray-900">{leaveStats?.total || 0}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3">
                          <p className="text-xs text-green-700">Approved</p>
                          <p className="text-xl font-bold text-green-700">{leaveStats?.approved || 0}</p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-3">
                          <p className="text-xs text-orange-700">Pending</p>
                          <p className="text-xl font-bold text-orange-700">{leaveStats?.pending || 0}</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-3">
                          <p className="text-xs text-red-700">Rejected</p>
                          <p className="text-xl font-bold text-red-700">{leaveStats?.rejected || 0}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(leaveStats?.byType || {}).map(([type, days]) => (
                          <div key={type} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                            <span className="text-sm capitalize text-gray-700">{type}</span>
                            <span className="text-sm font-bold text-gray-900">{Number(days).toFixed(1)} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TEAM APPROVALS VIEW (Manager/HR) */}
        {activeView === 'requests' && canApproveAttendance && (
          <div className="space-y-4">
            <div className="card border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="card-body p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Team Approvals</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Review attendance regularisation requests raised by team members for missing punch, late arrival, or early departure corrections.
                    </p>
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                  >
                    <ClockIcon className="mr-1.5 h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-0">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center mr-2">
                      <ExclamationCircleIcon className="h-4 w-4" />
                    </span>
                    Pending Attendance Regularisation
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {regularizationRequests.filter(r => r.status === TimeEntryEditStatus.PENDING).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No pending attendance regularisation requests</p>
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
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-gray-900">
                                    {request.employee?.firstName} {request.employee?.lastName}
                                  </p>
                                  <span className="badge badge-gray text-xs">{request.employee?.email}</span>
                                  {request.employee?.department?.name && (
                                    <span className="badge badge-blue text-xs">{request.employee.department.name}</span>
                                  )}
                                </div>
                                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Date</p>
                                    <p className="text-gray-900">{requestDate ? new Date(requestDate).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Original Check In</p>
                                    <p className="text-gray-900">{request.originalCheckIn ? formatTime(request.originalCheckIn) : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 font-semibold">Original Check Out</p>
                                    <p className="text-gray-900">{request.originalCheckOut ? formatTime(request.originalCheckOut) : '-'}</p>
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
                                  <div className="sm:col-span-2 lg:col-span-4">
                                    <p className="text-xs text-gray-600 font-semibold">Reason</p>
                                    <p className="text-gray-900">{request.reason}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 lg:ml-4">
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
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
            <div className="card-body p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Request Attendance Regularization</h3>
                  <p className="mt-1 text-xs text-gray-500">Use this governed request to correct an attendance time. Your manager or HR must approve the edit.</p>
                </div>
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
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
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

      {/* Attendance Import Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-6xl my-4 max-h-[95vh] overflow-hidden rounded-lg bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50">
                  <ArrowDownTrayIcon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">Import attendance</h3>
                  <p className="text-xs text-gray-600">Daily, weekly, or monthly CSV or Excel data</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSyncModal}
                className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="space-y-5 border-b border-gray-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary-700">1. Prepare the file</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Use one row per employee and attendance date. Add one day, one week, or a complete month in the same format.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadImportTemplate}
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Download CSV template
                    </button>
                  </div>

                  <div>
                    <label htmlFor="attendance-import-file" className="text-xs font-bold uppercase tracking-wide text-primary-700">
                      2. Choose attendance file
                    </label>
                    <input
                      id="attendance-import-file"
                      type="file"
                      accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileUpload}
                      className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-800"
                    />
                    {syncFile && (
                      <p className="mt-2 truncate text-xs font-medium text-gray-700" title={syncFile.name}>
                        {syncFile.name} · {(syncFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary-700">3. Existing records</p>
                    <div className="mt-2 grid grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-1">
                      {(['skip', 'overwrite'] as AttendanceImportConflictPolicy[]).map((policy) => (
                        <button
                          key={policy}
                          type="button"
                          onClick={() => {
                            setSyncConflictPolicy(policy);
                            setSyncPreview(null);
                            setSyncImported(null);
                          }}
                          className={`rounded px-3 py-2 text-xs font-semibold capitalize ${
                            syncConflictPolicy === policy
                              ? 'bg-white text-primary-800 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {policy}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {syncConflictPolicy === 'skip'
                        ? 'Existing employee-date records are left unchanged.'
                        : 'Existing employee-date records are replaced after preview.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncPreview}
                    disabled={!syncFile || syncPreviewing}
                    className="btn btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {syncPreviewing ? 'Validating file...' : 'Preview import'}
                  </button>
                </aside>

                <section className="min-w-0">
                  {!syncPreview && (
                    <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-gray-300 px-6 py-12 text-center">
                      <CalendarDaysIcon className="h-9 w-9 text-gray-300" />
                      <h4 className="mt-3 text-sm font-bold text-gray-900">Preview before anything changes</h4>
                      <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
                        Aura will match employee codes, validate every date and status, identify duplicates, and show exactly what will be created or updated.
                      </p>
                    </div>
                  )}

                  {syncPreview && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Validated range</p>
                          <h4 className="mt-1 text-lg font-bold text-gray-950">
                            {syncPreview.dateRange.from || 'No valid dates'}
                            {syncPreview.dateRange.to && syncPreview.dateRange.to !== syncPreview.dateRange.from
                              ? ` to ${syncPreview.dateRange.to}`
                              : ''}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600">{syncPreview.totalRows} source rows</p>
                      </div>

                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-5">
                        {[
                          ['Create', syncPreview.summary.creates, 'text-emerald-700'],
                          ['Update', syncPreview.summary.updates, 'text-blue-700'],
                          ['Unchanged', syncPreview.summary.unchanged, 'text-gray-700'],
                          ['Skipped', syncPreview.summary.skipped, 'text-amber-700'],
                          ['Errors', syncPreview.summary.errors, 'text-red-700'],
                        ].map(([label, value, color]) => (
                          <div key={String(label)} className="bg-white px-3 py-3">
                            <p className="text-[11px] font-semibold text-gray-500">{label}</p>
                            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {syncImported !== null && (
                        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-700" />
                          <div>
                            <p className="text-sm font-bold text-emerald-900">Import completed</p>
                            <p className="mt-0.5 text-xs text-emerald-800">{syncImported} attendance rows were saved.</p>
                          </div>
                        </div>
                      )}

                      {syncPreview.summary.errors > 0 && (
                        <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3">
                          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 text-red-700" />
                          <div>
                            <p className="text-sm font-bold text-red-900">Correct the invalid rows</p>
                            <p className="mt-0.5 text-xs text-red-800">
                              The import stays locked until the file has no validation errors.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="max-h-[42vh] overflow-auto border border-gray-200">
                        <table className="min-w-[920px] w-full divide-y divide-gray-200 text-left">
                          <thead className="sticky top-0 bg-gray-50">
                            <tr>
                              {['Row', 'Employee', 'Date', 'Status', 'In', 'Out', 'Location', 'Action', 'Notes'].map((heading) => (
                                <th key={heading} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {syncPreview.rows.map((row) => (
                              <tr key={`${row.row}-${row.employeeCode}-${row.date}`} className={row.action === 'error' ? 'bg-red-50/50' : ''}>
                                <td className="px-3 py-2 text-xs text-gray-500">{row.row}</td>
                                <td className="px-3 py-2">
                                  <p className="text-xs font-semibold text-gray-900">{row.employeeName || row.employeeCode || 'Missing code'}</p>
                                  {row.employeeName && <p className="text-[11px] text-gray-500">{row.employeeCode}</p>}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-700">{row.date || '-'}</td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-700">{row.status ? getStatusLabel(row.status) : '-'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{row.checkIn ? formatTime(row.checkIn) : '-'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{row.checkOut ? formatTime(row.checkOut) : '-'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{row.location || '-'}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase ${
                                    row.action === 'create' ? 'bg-emerald-50 text-emerald-700' :
                                    row.action === 'update' ? 'bg-blue-50 text-blue-700' :
                                    row.action === 'error' ? 'bg-red-50 text-red-700' :
                                    row.action === 'skip' ? 'bg-amber-50 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {row.action}
                                  </span>
                                </td>
                                <td className="max-w-64 px-3 py-2 text-[11px] leading-5 text-gray-600">
                                  {row.messages.length ? row.messages.join(' · ') : row.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">Every completed import is recorded in the audit log.</p>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeSyncModal} className="btn btn-secondary">
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSyncSave}
                  disabled={
                    !syncPreview ||
                    syncPreview.summary.errors > 0 ||
                    syncPreview.summary.ready === 0 ||
                    syncSaving ||
                    syncImported !== null
                  }
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  {syncSaving ? 'Importing...' : `Import ${syncPreview?.summary.ready || 0} rows`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
