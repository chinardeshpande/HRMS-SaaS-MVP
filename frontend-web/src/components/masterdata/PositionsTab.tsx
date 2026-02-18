import { useState } from 'react';
import {
  Typography,
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
  Paper,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

export interface Position {
  positionId: string;
  title: string;
  code: string;
  jobId: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  reportsToPositionId?: string;
  reportsToPositionTitle?: string;
  status: 'vacant' | 'filled';
  employeeId?: string;
  employeeName?: string;
  headcount: number;
}

// Mock data for jobs and departments
const mockJobs = [
  { jobId: '1', title: 'Software Engineer', code: 'SE' },
  { jobId: '2', title: 'Senior Software Engineer', code: 'SSE' },
  { jobId: '3', title: 'Engineering Manager', code: 'EM' },
  { jobId: '4', title: 'HR Manager', code: 'HRM' },
];

const mockDepartments = [
  { departmentId: '1', name: 'Executive', code: 'EXEC' },
  { departmentId: '2', name: 'Engineering', code: 'ENG' },
  { departmentId: '3', name: 'Backend Team', code: 'ENG-BE' },
  { departmentId: '4', name: 'Frontend Team', code: 'ENG-FE' },
  { departmentId: '5', name: 'Human Resources', code: 'HR' },
];

const PositionsTab = () => {
  const [positions, setPositions] = useState<Position[]>([
    {
      positionId: '1',
      title: 'VP Engineering',
      code: 'POS-EM-001',
      jobId: '3',
      jobTitle: 'Engineering Manager',
      departmentId: '2',
      departmentName: 'Engineering',
      status: 'filled',
      employeeName: 'John Doe',
      headcount: 1,
    },
    {
      positionId: '2',
      title: 'Backend Lead',
      code: 'POS-SSE-001',
      jobId: '2',
      jobTitle: 'Senior Software Engineer',
      departmentId: '3',
      departmentName: 'Backend Team',
      reportsToPositionId: '1',
      reportsToPositionTitle: 'VP Engineering',
      status: 'filled',
      employeeName: 'Jane Smith',
      headcount: 1,
    },
    {
      positionId: '3',
      title: 'Backend Engineer I',
      code: 'POS-SE-001',
      jobId: '1',
      jobTitle: 'Software Engineer',
      departmentId: '3',
      departmentName: 'Backend Team',
      reportsToPositionId: '2',
      reportsToPositionTitle: 'Backend Lead',
      status: 'vacant',
      headcount: 1,
    },
    {
      positionId: '4',
      title: 'Backend Engineer II',
      code: 'POS-SE-002',
      jobId: '1',
      jobTitle: 'Software Engineer',
      departmentId: '3',
      departmentName: 'Backend Team',
      reportsToPositionId: '2',
      reportsToPositionTitle: 'Backend Lead',
      status: 'filled',
      employeeName: 'Mike Johnson',
      headcount: 1,
    },
    {
      positionId: '5',
      title: 'Frontend Lead',
      code: 'POS-SSE-002',
      jobId: '2',
      jobTitle: 'Senior Software Engineer',
      departmentId: '4',
      departmentName: 'Frontend Team',
      reportsToPositionId: '1',
      reportsToPositionTitle: 'VP Engineering',
      status: 'vacant',
      headcount: 1,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Partial<Position>>({});
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenDialog = (position?: Position) => {
    if (position) {
      setCurrentPosition(position);
      setIsEdit(true);
    } else {
      setCurrentPosition({ status: 'vacant', headcount: 1 });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPosition({});
    setIsEdit(false);
  };

  const handleSave = () => {
    const selectedJob = mockJobs.find(j => j.jobId === currentPosition.jobId);
    const selectedDept = mockDepartments.find(d => d.departmentId === currentPosition.departmentId);
    const reportsToPosition = positions.find(p => p.positionId === currentPosition.reportsToPositionId);

    if (isEdit) {
      setPositions(
        positions.map((p) =>
          p.positionId === currentPosition.positionId
            ? {
                ...p,
                ...currentPosition,
                jobTitle: selectedJob?.title || p.jobTitle,
                departmentName: selectedDept?.name || p.departmentName,
                reportsToPositionTitle: reportsToPosition?.title,
              } as Position
            : p
        )
      );
    } else {
      const newPosition: Position = {
        positionId: Date.now().toString(),
        title: currentPosition.title || '',
        code: currentPosition.code || `POS-${Date.now().toString().slice(-6)}`,
        jobId: currentPosition.jobId || '',
        jobTitle: selectedJob?.title || '',
        departmentId: currentPosition.departmentId || '',
        departmentName: selectedDept?.name || '',
        reportsToPositionId: currentPosition.reportsToPositionId,
        reportsToPositionTitle: reportsToPosition?.title,
        status: currentPosition.status || 'vacant',
        headcount: currentPosition.headcount || 1,
      };
      setPositions([...positions, newPosition]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    const hasSubordinates = positions.some(p => p.reportsToPositionId === id);
    if (hasSubordinates) {
      alert('Cannot delete position with reporting positions. Please reassign subordinate positions first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this position?')) {
      setPositions(positions.filter((p) => p.positionId !== id));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Position Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Position
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Position Title</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Job</strong></TableCell>
              <TableCell><strong>Department</strong></TableCell>
              <TableCell><strong>Reports To</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Employee</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No positions found. Click "Add Position" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.positionId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {position.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={position.code} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{position.jobTitle}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{position.departmentName}</Typography>
                  </TableCell>
                  <TableCell>
                    {position.reportsToPositionTitle ? (
                      <Typography variant="body2" color="text.secondary">
                        {position.reportsToPositionTitle}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                      color={position.status === 'filled' ? 'success' : 'warning'}
                      size="small"
                      icon={position.status === 'filled' ? <PersonIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    {position.employeeName || (
                      <Typography variant="body2" color="text.disabled">
                        Vacant
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(position)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(position.positionId)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Position' : 'Add New Position'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Position Title"
                  fullWidth
                  required
                  value={currentPosition.title || ''}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, title: e.target.value })
                  }
                  helperText="e.g., Backend Lead, Sales Manager"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Position Code"
                  fullWidth
                  required
                  value={currentPosition.code || ''}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, code: e.target.value.toUpperCase() })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Job"
                  select
                  fullWidth
                  required
                  value={currentPosition.jobId || ''}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, jobId: e.target.value })
                  }
                  helperText="Select the job definition for this position"
                >
                  {mockJobs.map((job) => (
                    <MenuItem key={job.jobId} value={job.jobId}>
                      {job.title} ({job.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  select
                  fullWidth
                  required
                  value={currentPosition.departmentId || ''}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, departmentId: e.target.value })
                  }
                  helperText="Department where this position belongs"
                >
                  {mockDepartments.map((dept) => (
                    <MenuItem key={dept.departmentId} value={dept.departmentId}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reports To Position"
                  select
                  fullWidth
                  value={currentPosition.reportsToPositionId || ''}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, reportsToPositionId: e.target.value || undefined })
                  }
                  helperText="Leave empty for top-level positions"
                >
                  <MenuItem value="">
                    <em>None (Top Level)</em>
                  </MenuItem>
                  {positions
                    .filter(p => p.positionId !== currentPosition.positionId)
                    .map((pos) => (
                      <MenuItem key={pos.positionId} value={pos.positionId}>
                        {pos.title} ({pos.departmentName})
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  select
                  fullWidth
                  required
                  value={currentPosition.status || 'vacant'}
                  onChange={(e) =>
                    setCurrentPosition({ ...currentPosition, status: e.target.value as any })
                  }
                >
                  <MenuItem value="vacant">Vacant</MenuItem>
                  <MenuItem value="filled">Filled</MenuItem>
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
              !currentPosition.title ||
              !currentPosition.code ||
              !currentPosition.jobId ||
              !currentPosition.departmentId
            }
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PositionsTab;
