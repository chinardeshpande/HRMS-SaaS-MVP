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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Event as CalendarIcon,
  Pending as PendingIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';
import leaveService, { LeaveRequest, LeaveBalance } from '../services/leaveService';
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
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Leave = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [openDialog, setOpenDialog] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Partial<LeaveRequest>>({});

  const leaveTypes = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'compensatory'];

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch leave requests and balances in parallel
      const [requests, balances] = await Promise.all([
        leaveService.getMyRequests(),
        leaveService.getMyBalance(new Date().getFullYear()),
      ]);

      setLeaveRequests(requests);
      setLeaveBalances(balances);
    } catch (err: any) {
      console.error('Error fetching leave data:', err);
      setError(err.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleOpenDialog = (request?: LeaveRequest) => {
    if (request) {
      setCurrentRequest(request);
    } else {
      setCurrentRequest({
        startDate: '',
        endDate: '',
        reason: '',
        leaveType: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRequest({});
  };

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSave = async () => {
    try {
      if (!currentRequest.leaveType || !currentRequest.startDate || !currentRequest.endDate || !currentRequest.reason) {
        setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
        return;
      }

      setLoading(true);

      await leaveService.applyLeave({
        leaveType: currentRequest.leaveType,
        startDate: currentRequest.startDate,
        endDate: currentRequest.endDate,
        reason: currentRequest.reason,
        emergencyContact: currentRequest.emergencyContact,
      });

      setSnackbar({ open: true, message: 'Leave request submitted successfully', severity: 'success' });
      handleCloseDialog();
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error applying leave:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to submit leave request', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      setLoading(true);
      await leaveService.approveOrReject(leaveId, 'approved');
      setSnackbar({ open: true, message: 'Leave request approved', severity: 'success' });
      await fetchData();
    } catch (err: any) {
      console.error('Error approving leave:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to approve leave', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (leaveId: string) => {
    const comments = window.prompt('Reason for rejection:');
    if (comments === null) return;

    try {
      setLoading(true);
      await leaveService.approveOrReject(leaveId, 'rejected', comments);
      setSnackbar({ open: true, message: 'Leave request rejected', severity: 'success' });
      await fetchData();
    } catch (err: any) {
      console.error('Error rejecting leave:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to reject leave', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

    try {
      setLoading(false);
      await leaveService.cancelLeave(leaveId);
      setSnackbar({ open: true, message: 'Leave request cancelled', severity: 'success' });
      await fetchData();
    } catch (err: any) {
      console.error('Error cancelling leave:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to cancel leave', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const totalDaysUsed = leaveRequests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.numberOfDays, 0);

  if (loading && leaveRequests.length === 0) {
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        Leave Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Requests
                  </Typography>
                  <Typography variant="h4">{pendingCount}</Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Approved
                  </Typography>
                  <Typography variant="h4">{approvedCount}</Typography>
                </Box>
                <ApproveIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Days Used
                  </Typography>
                  <Typography variant="h4">{totalDaysUsed}</Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Leave Types
                  </Typography>
                  <Typography variant="h4">{leaveBalances.length}</Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="My Leave Requests" />
          <Tab label="My Leave Balance" />
        </Tabs>

        {/* Leave Requests Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">My Leave Requests</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={loading}
              >
                Apply Leave
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Leave Type</strong></TableCell>
                    <TableCell><strong>Start Date</strong></TableCell>
                    <TableCell><strong>End Date</strong></TableCell>
                    <TableCell><strong>Days</strong></TableCell>
                    <TableCell><strong>Reason</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No leave requests found. Click "Apply Leave" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveRequests
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((request) => (
                        <TableRow key={request.leaveRequestId} hover>
                          <TableCell>
                            <Chip label={request.leaveType.toUpperCase()} size="small" variant="outlined" color="primary" />
                          </TableCell>
                          <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip label={`${request.numberOfDays} days`} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {request.reason}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status.toUpperCase()}
                              color={getStatusColor(request.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {request.status === 'pending' && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancel(request.leaveRequestId)}
                                title="Cancel"
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Leave Balance Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              My Leave Balance ({new Date().getFullYear()})
            </Typography>
            <Grid container spacing={3}>
              {leaveBalances.length === 0 ? (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No leave balance found. Contact HR to initialize your leave balance.
                  </Alert>
                </Grid>
              ) : (
                leaveBalances.map((balance) => (
                  <Grid item xs={12} sm={6} md={3} key={balance.leaveBalanceId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                          {balance.leaveType}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total:
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {balance.totalDays} days
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Used:
                            </Typography>
                            <Typography variant="body2" color="error.main" fontWeight={500}>
                              {balance.usedDays} days
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Pending:
                            </Typography>
                            <Typography variant="body2" color="warning.main" fontWeight={500}>
                              {balance.pendingDays} days
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Remaining:
                            </Typography>
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              {balance.remainingDays} days
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Apply Leave Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Leave Type"
              select
              fullWidth
              required
              value={currentRequest.leaveType || ''}
              onChange={(e) =>
                setCurrentRequest({ ...currentRequest, leaveType: e.target.value })
              }
            >
              {leaveTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.toUpperCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              required
              value={currentRequest.startDate || ''}
              onChange={(e) =>
                setCurrentRequest({ ...currentRequest, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              required
              value={currentRequest.endDate || ''}
              onChange={(e) =>
                setCurrentRequest({ ...currentRequest, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            {currentRequest.startDate && currentRequest.endDate && (
              <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="info.main">
                  Total Days: {calculateDays(currentRequest.startDate, currentRequest.endDate)}
                </Typography>
              </Box>
            )}
            <TextField
              label="Reason"
              fullWidth
              required
              multiline
              rows={3}
              value={currentRequest.reason || ''}
              onChange={(e) =>
                setCurrentRequest({ ...currentRequest, reason: e.target.value })
              }
              helperText="Please provide a reason for your leave request"
            />
            <TextField
              label="Emergency Contact (Optional)"
              fullWidth
              value={currentRequest.emergencyContact || ''}
              onChange={(e) =>
                setCurrentRequest({ ...currentRequest, emergencyContact: e.target.value })
              }
              helperText="Phone number to reach you in case of emergency"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              loading ||
              !currentRequest.leaveType ||
              !currentRequest.startDate ||
              !currentRequest.endDate ||
              !currentRequest.reason
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Submit'}
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

export default Leave;
