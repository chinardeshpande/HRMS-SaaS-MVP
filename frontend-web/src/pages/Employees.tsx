import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  MenuItem,
  Grid,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';
import employeeService, { Employee, EmployeeFilters, EmployeeStats } from '../services/employeeService';
import departmentService, { Department } from '../services/departmentService';

const Employees = () => {
  const navigate = useNavigate();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});

  // Fetch data on mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchStats();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const filters: EmployeeFilters = {
      search: searchTerm || undefined,
      departmentId: selectedDepartment || undefined,
      status: selectedStatus as any || undefined,
    };
    fetchEmployees(filters);
  }, [searchTerm, selectedDepartment, selectedStatus]);

  const fetchEmployees = async (filters?: EmployeeFilters) => {
    try {
      setLoading(true);
      const data = await employeeService.getAll(filters);
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.error?.message || 'Failed to load employees');
      setSnackbar({ open: true, message: 'Failed to load employees', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await employeeService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAddEmployee = () => {
    setCurrentEmployee({
      status: 'active',
      employmentType: 'Full-Time',
      dateOfJoining: new Date().toISOString().split('T')[0],
    });
    setIsEdit(false);
    setOpenDialog(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsEdit(true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee({});
    setIsEdit(false);
  };

  const handleViewEmployee = (employee: Employee) => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  const handleSave = async () => {
    try {
      if (isEdit && currentEmployee.employeeId) {
        await employeeService.update(currentEmployee.employeeId, currentEmployee);
        setSnackbar({ open: true, message: 'Employee updated successfully', severity: 'success' });
      } else {
        await employeeService.create(currentEmployee as any);
        setSnackbar({ open: true, message: 'Employee created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchEmployees();
      fetchStats();
    } catch (err: any) {
      console.error('Error saving employee:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error?.message || 'Failed to save employee',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this employee as exited?')) {
      return;
    }

    try {
      await employeeService.delete(id);
      setSnackbar({ open: true, message: 'Employee marked as exited', severity: 'success' });
      fetchEmployees();
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error?.message || 'Failed to delete employee',
        severity: 'error',
      });
    }
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      setSnackbar({ open: true, message: 'No employees to export', severity: 'error' });
      return;
    }

    const headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Status', 'Date of Joining'];
    const rows = employees.map(emp => [
      emp.employeeCode || '-',
      emp.firstName || '-',
      emp.lastName || '-',
      emp.email || '-',
      emp.department?.name || '-',
      emp.designation?.title || '-',
      emp.status || '-',
      emp.dateOfJoining || '-',
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
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: 'Employee data exported successfully', severity: 'success' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'exited':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employee Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddEmployee}>
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Total Employees
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Active
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Inactive
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.inactive}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Exited
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.exited}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by name, email, or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                label="Department"
                onChange={(e: SelectChangeEvent) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.departmentId} value={dept.departmentId}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="exited">Exited</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Employee</strong>
                </TableCell>
                <TableCell>
                  <strong>Code</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>Department</strong>
                </TableCell>
                <TableCell>
                  <strong>Designation</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No employees found. Click "Add Employee" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.employeeId} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>{getInitials(employee.firstName, employee.lastName)}</Avatar>
                        <Box>
                          <Typography variant="body1">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          {employee.manager && (
                            <Typography variant="caption" color="text.secondary">
                              Reports to: {employee.manager.firstName} {employee.manager.lastName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.employeeCode}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department?.name || '-'}</TableCell>
                    <TableCell>{employee.designation?.title || '-'}</TableCell>
                    <TableCell>
                      <Chip label={employee.status} color={getStatusColor(employee.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewEmployee(employee)} title="View Details">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditEmployee(employee)} title="Edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(employee.employeeId)} title="Mark as Exited">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee Code"
                  value={currentEmployee.employeeCode || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, employeeCode: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={currentEmployee.email || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={currentEmployee.firstName || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={currentEmployee.lastName || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={currentEmployee.phone || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Joining"
                  type="date"
                  value={currentEmployee.dateOfJoining || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, dateOfJoining: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  value={currentEmployee.departmentId || ''}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, departmentId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Employment Type"
                  value={currentEmployee.employmentType || 'Full-Time'}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, employmentType: e.target.value })}
                >
                  <MenuItem value="Full-Time">Full-Time</MenuItem>
                  <MenuItem value="Part-Time">Part-Time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Intern">Intern</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={currentEmployee.status || 'active'}
                  onChange={(e) => setCurrentEmployee({ ...currentEmployee, status: e.target.value as any })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="exited">Exited</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !currentEmployee.firstName ||
              !currentEmployee.lastName ||
              !currentEmployee.email ||
              !currentEmployee.employeeCode ||
              !currentEmployee.dateOfJoining
            }
          >
            {isEdit ? 'Update' : 'Create'}
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default Employees;
