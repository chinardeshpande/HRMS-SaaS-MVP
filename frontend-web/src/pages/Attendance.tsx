import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tabs,
  Tab,
  Snackbar,
  Tooltip,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Avatar,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  People as PeopleIcon,
  PersonOff as AbsentIcon,
  Schedule as HoursIcon,
  Edit as EditIcon,
  WatchLater as LateIcon,
  Assessment as StatsIcon,
  CalendarMonth as CalendarIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';
import attendanceService, { Attendance as AttendanceRecord, AttendanceStatistics } from '../services/attendanceService';
import departmentService, { Department } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Attendance = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [companyAttendance, setCompanyAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Advanced Filters
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // HR Bulk actions
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [currentEditRecord, setCurrentEditRecord] = useState<AttendanceRecord | null>(null);

  // Case-insensitive role check
  const userRoleUpper = String(user?.role || '').toUpperCase();
  const isHROrAdmin = userRoleUpper === 'HR_ADMIN' || userRoleUpper === 'SYSTEM_ADMIN';

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data based on view mode
  useEffect(() => {
    if (isHROrAdmin) {
      updateDateRangeForViewMode();
    } else {
      fetchMyData();
    }
  }, [viewMode, isHROrAdmin]);

  useEffect(() => {
    if (isHROrAdmin) {
      fetchCompanyData();
    }
  }, [startDate, endDate, isHROrAdmin]);

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const depts = await departmentService.getAll();
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };

    if (isHROrAdmin) {
      fetchDepartments();
    }
  }, [isHROrAdmin]);

  const updateDateRangeForViewMode = () => {
    const today = new Date();
    switch (viewMode) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
    }
  };

  const fetchMyData = async () => {
    try {
      setLoading(true);
      setError('');
      const records = await attendanceService.getMyAttendance(startDate, endDate);
      setMyAttendance(records);

      const today = new Date().toISOString().split('T')[0];
      const todayRec = records.find(r => new Date(r.date).toISOString().split('T')[0] === today);
      setTodayRecord(todayRec || null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');

      const [records, stats] = await Promise.all([
        attendanceService.getCompanyWide(startDate, endDate),
        attendanceService.getStatistics(startDate, endDate),
      ]);

      setCompanyAttendance(records);
      setStatistics(stats);

      // Filter today's records
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = records.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
      setTodayAttendance(todayRecords);
    } catch (err: any) {
      console.error('Error fetching company data:', err);
      setError(err.message || 'Failed to load company attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const record = await attendanceService.clockIn();
      setTodayRecord(record);
      setSnackbar({ open: true, message: 'Successfully clocked in!', severity: 'success' });
      await fetchMyData();
    } catch (err: any) {
      console.error('Error clocking in:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to clock in', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const record = await attendanceService.clockOut();
      setTodayRecord(record);
      setSnackbar({ open: true, message: 'Successfully clocked out!', severity: 'success' });
      await fetchMyData();
    } catch (err: any) {
      console.error('Error clocking out:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to clock out', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !bulkReason) {
      setSnackbar({ open: true, message: 'Please select status and provide reason', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      const updates = selectedRecords.map(id => ({
        attendanceId: id,
        status: bulkStatus,
      }));

      await attendanceService.bulkUpdate(updates as any, bulkReason);
      setSnackbar({ open: true, message: `Updated ${updates.length} records successfully`, severity: 'success' });
      setBulkDialogOpen(false);
      setSelectedRecords([]);
      setBulkStatus('');
      setBulkReason('');
      await fetchCompanyData();
    } catch (err: any) {
      console.error('Error bulk updating:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setCurrentEditRecord(record);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentEditRecord || !bulkReason) {
      setSnackbar({ open: true, message: 'Please provide a reason for the change', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      await attendanceService.overrideAttendance(
        currentEditRecord.attendanceId,
        {
          status: currentEditRecord.status as any,
          checkIn: currentEditRecord.checkIn,
          checkOut: currentEditRecord.checkOut,
        },
        bulkReason
      );
      setSnackbar({ open: true, message: 'Attendance updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      setCurrentEditRecord(null);
      setBulkReason('');
      await fetchCompanyData();
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update attendance', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredTodayRecords.map(r => r.attendanceId));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      setSnackbar({
        open: true,
        message: 'No records to export',
        severity: 'error'
      });
      return;
    }

    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Date',
      'Check In',
      'Check Out',
      'Work Hours',
      'Status',
      'Late Minutes',
      'Overtime Minutes',
    ];

    const rows = filteredRecords.map(record => {
      const employee = record.employee;
      return [
        employee?.employeeCode || '-',
        employee ? `${employee.firstName} ${employee.lastName}` : '-',
        employee?.department?.name || '-',
        new Date(record.date).toLocaleDateString(),
        formatTime(record.checkIn),
        formatTime(record.checkOut),
        formatDuration(record.workMinutes),
        record.status.toUpperCase(),
        record.lateMinutes || 0,
        record.overtimeMinutes || 0,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: `Exported ${filteredRecords.length} records successfully`,
      severity: 'success'
    });
  };

  const formatTime = (dateStr?: string | Date) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' | 'error' => {
    switch (status) {
      case 'present': return 'success';
      case 'half-day': return 'info';
      case 'on-leave': return 'warning';
      case 'holiday': return 'info';
      case 'weekend': return 'default';
      case 'absent': return 'error';
      default: return 'default';
    }
  };

  // Filter records
  const filteredRecords = companyAttendance.filter(record => {
    if (searchQuery && record.employee) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase();
      const employeeCode = record.employee.employeeCode?.toLowerCase() || '';
      if (!fullName.includes(searchLower) && !employeeCode.includes(searchLower)) {
        return false;
      }
    }
    if (selectedDepartments.length > 0 && record.employee?.department?.departmentId) {
      if (!selectedDepartments.includes(record.employee.department.departmentId)) {
        return false;
      }
    }
    if (selectedStatus.length > 0 && !selectedStatus.includes(record.status)) {
      return false;
    }
    return true;
  });

  const filteredTodayRecords = todayAttendance.filter(record => {
    if (searchQuery && record.employee) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase();
      const employeeCode = record.employee.employeeCode?.toLowerCase() || '';
      if (!fullName.includes(searchLower) && !employeeCode.includes(searchLower)) {
        return false;
      }
    }
    if (selectedDepartments.length > 0 && record.employee?.department?.departmentId) {
      if (!selectedDepartments.includes(record.employee.department.departmentId)) {
        return false;
      }
    }
    if (selectedStatus.length > 0 && !selectedStatus.includes(record.status)) {
      return false;
    }
    return true;
  });

  const paginatedRecords = filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const absentCount = myAttendance.filter(a => a.status === 'absent').length;
  const lateCount = myAttendance.filter(a => a.isLate).length;
  const totalWorkMinutes = myAttendance.reduce((sum, a) => sum + (a.workMinutes || 0), 0);
  const avgWorkMinutes = myAttendance.length > 0 ? totalWorkMinutes / myAttendance.length : 0;

  const todayPresent = todayAttendance.filter(a => a.status === 'present').length;
  const todayAbsent = todayAttendance.filter(a => a.status === 'absent').length;
  const todayLate = todayAttendance.filter(a => a.isLate).length;
  const todayOnLeave = todayAttendance.filter(a => a.status === 'on-leave').length;

  if (loading && myAttendance.length === 0 && companyAttendance.length === 0) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Attendance Management</Typography>
        {isHROrAdmin && (
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />}>
              Import
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchCompanyData}>
              Refresh
            </Button>
          </Stack>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Employee View */}
      {!isHROrAdmin && (
        <>
          {/* Clock In/Out Card */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {!todayRecord?.checkIn && (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CheckInIcon />}
                        onClick={handleClockIn}
                        disabled={loading}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                      >
                        Clock In
                      </Button>
                    )}
                    {todayRecord?.checkIn && !todayRecord?.checkOut && (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CheckOutIcon />}
                        onClick={handleClockOut}
                        disabled={loading}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                      >
                        Clock Out
                      </Button>
                    )}
                    {todayRecord && (
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption">Check In</Typography>
                          <Typography variant="h6">{formatTime(todayRecord.checkIn)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption">Check Out</Typography>
                          <Typography variant="h6">{formatTime(todayRecord.checkOut)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption">Work Hours</Typography>
                          <Typography variant="h6">{formatDuration(todayRecord.workMinutes)}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">Present Days</Typography>
                      <Typography variant="h4">{presentCount}</Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">Absent Days</Typography>
                      <Typography variant="h4">{absentCount}</Typography>
                    </Box>
                    <AbsentIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">Late Arrivals</Typography>
                      <Typography variant="h4">{lateCount}</Typography>
                    </Box>
                    <LateIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">Avg Work Hours</Typography>
                      <Typography variant="h4">{(avgWorkMinutes / 60).toFixed(1)}</Typography>
                    </Box>
                    <HoursIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Date Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button variant="outlined" fullWidth onClick={fetchMyData}>
                  Apply
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* My Attendance History */}
          <Paper>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>My Attendance History</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Work Hours</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Remarks</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No attendance records found for the selected period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      myAttendance
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record) => (
                          <TableRow key={record.attendanceId} hover>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{formatTime(record.checkIn)}</TableCell>
                            <TableCell>{formatTime(record.checkOut)}</TableCell>
                            <TableCell>{formatDuration(record.workMinutes)}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={record.status.replace('_', ' ').toUpperCase()}
                                  color={getStatusColor(record.status)}
                                  size="small"
                                />
                                {record.isLate && (
                                  <Chip label={`Late ${record.lateMinutes}m`} color="warning" size="small" variant="outlined" />
                                )}
                                {record.isEarlyOut && (
                                  <Chip label={`Early ${record.earlyMinutes}m`} color="info" size="small" variant="outlined" />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {record.isManualOverride && (
                                <Tooltip title={record.overrideReason || 'Manual Override'}>
                                  <Chip label="Override" size="small" variant="outlined" />
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </>
      )}

      {/* HR/Admin View */}
      {isHROrAdmin && (
        <>
          {/* Today's Dashboard - Quick Overview */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Today's Attendance Dashboard - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{todayPresent}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Present</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{todayAbsent}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Absent</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{todayOnLeave}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>On Leave</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{todayLate}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Late</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab icon={<CalendarIcon />} iconPosition="start" label="Today's Attendance" />
            <Tab icon={<TableIcon />} iconPosition="start" label="All Records" />
            <Tab icon={<StatsIcon />} iconPosition="start" label="Analytics" />
            <Tab icon={<GroupIcon />} iconPosition="start" label="Employee Directory" />
          </Tabs>

          {/* Tab 1: Today's Attendance - Mass Actions */}
          <TabPanel value={currentTab} index={0}>
            <Paper sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select
                        multiple
                        value={selectedDepartments}
                        onChange={(e) => setSelectedDepartments(e.target.value as string[])}
                        input={<OutlinedInput label="Department" />}
                        renderValue={(selected) => {
                          const names = selected.map(id => departments.find(d => d.departmentId === id)?.name || id);
                          return names.join(', ');
                        }}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept.departmentId} value={dept.departmentId}>
                            <Checkbox checked={selectedDepartments.indexOf(dept.departmentId) > -1} />
                            <ListItemText primary={dept.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status Filter</InputLabel>
                      <Select
                        multiple
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as string[])}
                        input={<OutlinedInput label="Status Filter" />}
                        renderValue={(selected) => selected.join(', ')}
                      >
                        {['present', 'absent', 'half-day', 'on-leave'].map((status) => (
                          <MenuItem key={status} value={status}>
                            <Checkbox checked={selectedStatus.indexOf(status) > -1} />
                            <ListItemText primary={status.replace('_', ' ').toUpperCase()} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      {selectedRecords.length > 0 && (
                        <Button
                          variant="contained"
                          startIcon={<EditIcon />}
                          onClick={() => setBulkDialogOpen(true)}
                        >
                          Bulk Update ({selectedRecords.length})
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedRecords.length === filteredTodayRecords.length && filteredTodayRecords.length > 0}
                          indeterminate={selectedRecords.length > 0 && selectedRecords.length < filteredTodayRecords.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell><strong>Employee</strong></TableCell>
                      <TableCell><strong>Department</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Work Hours</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTodayRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No attendance records for today.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTodayRecords.map((record) => (
                        <TableRow key={record.attendanceId} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedRecords.includes(record.attendanceId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecords([...selectedRecords, record.attendanceId]);
                                } else {
                                  setSelectedRecords(selectedRecords.filter(id => id !== record.attendanceId));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {record.employee?.employeeCode}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{record.employee?.department?.name || '-'}</TableCell>
                          <TableCell>{formatTime(record.checkIn)}</TableCell>
                          <TableCell>{formatTime(record.checkOut)}</TableCell>
                          <TableCell>{formatDuration(record.workMinutes)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={record.status.replace('_', ' ').toUpperCase()}
                                color={getStatusColor(record.status)}
                                size="small"
                              />
                              {record.isLate && (
                                <Chip label={`Late ${record.lateMinutes}m`} color="warning" size="small" variant="outlined" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit Attendance">
                              <IconButton size="small" color="primary" onClick={() => handleEditRecord(record)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* Tab 2: All Records - Historical Data */}
          <TabPanel value={currentTab} index={1}>
            <Paper sx={{ mb: 3, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setViewMode(newMode)}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="today">Today</ToggleButton>
                    <ToggleButton value="week">Week</ToggleButton>
                    <ToggleButton value="month">Month</ToggleButton>
                    <ToggleButton value="custom">Custom</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
                {viewMode === 'custom' && (
                  <>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Start Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="End Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button variant="contained" fullWidth onClick={fetchCompanyData}>
                        Apply Filters
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Employee</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Work Hours</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.attendanceId} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.employee?.employeeCode}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatTime(record.checkIn)}</TableCell>
                        <TableCell>{formatTime(record.checkOut)}</TableCell>
                        <TableCell>{formatDuration(record.workMinutes)}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditRecord(record)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredRecords.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </Paper>
          </TabPanel>

          {/* Tab 3: Analytics */}
          <TabPanel value={currentTab} index={2}>
            {statistics && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Attendance Overview</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="success.main">{statistics.present}</Typography>
                            <Typography variant="body2" color="text.secondary">Present</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="error.main">{statistics.absent}</Typography>
                            <Typography variant="body2" color="text.secondary">Absent</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="info.main">{statistics.halfDay}</Typography>
                            <Typography variant="body2" color="text.secondary">Half Day</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="warning.main">{statistics.onLeave}</Typography>
                            <Typography variant="body2" color="text.secondary">On Leave</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Punctuality Metrics</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Late Arrivals</Typography>
                        <Typography variant="h4">{statistics.late}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Early Departures</Typography>
                        <Typography variant="h4">{statistics.earlyOut}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Work Hours</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Total Work Hours</Typography>
                        <Typography variant="h4">{formatDuration(statistics.totalWorkMinutes)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Average Work Hours</Typography>
                        <Typography variant="h4">{formatDuration(statistics.averageWorkMinutes)}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Tab 4: Employee Directory */}
          <TabPanel value={currentTab} index={3}>
            <Paper>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Employee</strong></TableCell>
                      <TableCell><strong>Department</strong></TableCell>
                      <TableCell><strong>Designation</strong></TableCell>
                      <TableCell><strong>Today's Status</strong></TableCell>
                      <TableCell align="right"><strong>Quick Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Group employees by unique employeeId */}
                    {Array.from(new Map(companyAttendance.map(r => [r.employeeId, r])).values())
                      .filter(record => {
                        if (!searchQuery || !record.employee) return true;
                        const searchLower = searchQuery.toLowerCase();
                        const fullName = `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase();
                        return fullName.includes(searchLower);
                      })
                      .map((record) => {
                        const todayRec = todayAttendance.find(r => r.employeeId === record.employeeId);
                        return (
                          <TableRow key={record.employeeId} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {record.employee?.firstName?.[0]}{record.employee?.lastName?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {record.employee?.employeeCode}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>{record.employee?.department?.name || '-'}</TableCell>
                            <TableCell>{record.employee?.designation?.name || '-'}</TableCell>
                            <TableCell>
                              {todayRec ? (
                                <Chip
                                  label={todayRec.status.replace('_', ' ').toUpperCase()}
                                  color={getStatusColor(todayRec.status)}
                                  size="small"
                                />
                              ) : (
                                <Chip label="NO RECORD" size="small" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="View History">
                                  <IconButton size="small">
                                    <CalendarIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Mark Attendance">
                                  <IconButton size="small" color="primary">
                                    <CheckInIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>
        </>
      )}

      {/* Bulk Update Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Update Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              You are updating {selectedRecords.length} attendance record(s) for today.
            </Alert>
            <TextField
              label="Status"
              select
              fullWidth
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="half-day">Half Day</MenuItem>
              <MenuItem value="on-leave">On Leave</MenuItem>
            </TextField>
            <TextField
              label="Reason for Update"
              fullWidth
              multiline
              rows={3}
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              helperText="Required: Explain the reason for this bulk update"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleBulkUpdate}
            variant="contained"
            disabled={loading || !bulkStatus || !bulkReason}
          >
            {loading ? <CircularProgress size={24} /> : 'Update All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Single Record Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          {currentEditRecord && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Editing record for {currentEditRecord.employee?.firstName} {currentEditRecord.employee?.lastName} on{' '}
                {new Date(currentEditRecord.date).toLocaleDateString()}
              </Alert>
              <TextField
                label="Status"
                select
                fullWidth
                value={currentEditRecord.status}
                onChange={(e) => setCurrentEditRecord({ ...currentEditRecord, status: e.target.value as any })}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="half-day">Half Day</MenuItem>
                <MenuItem value="on-leave">On Leave</MenuItem>
              </TextField>
              <TextField
                label="Check In Time"
                type="time"
                fullWidth
                value={currentEditRecord.checkIn ? new Date(currentEditRecord.checkIn).toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const date = new Date(currentEditRecord.date);
                  date.setHours(parseInt(hours), parseInt(minutes));
                  setCurrentEditRecord({ ...currentEditRecord, checkIn: date as any });
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Check Out Time"
                type="time"
                fullWidth
                value={currentEditRecord.checkOut ? new Date(currentEditRecord.checkOut).toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const date = new Date(currentEditRecord.date);
                  date.setHours(parseInt(hours), parseInt(minutes));
                  setCurrentEditRecord({ ...currentEditRecord, checkOut: date as any });
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Reason for Override"
                fullWidth
                multiline
                rows={3}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                helperText="Required: Explain why you're modifying this record"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={loading || !bulkReason}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default Attendance;
