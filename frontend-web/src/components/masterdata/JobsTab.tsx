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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export interface Job {
  jobId: string;
  title: string;
  code: string;
  level: number;
  category: string;
  positionCount: number;
  employeeCount: number;
  description?: string;
}

const JobsTab = () => {
  const [jobs, setJobs] = useState<Job[]>([
    {
      jobId: '1',
      title: 'Software Engineer',
      code: 'SE',
      level: 2,
      category: 'Engineering',
      positionCount: 15,
      employeeCount: 12,
      description: 'Develops and maintains software applications',
    },
    {
      jobId: '2',
      title: 'Senior Software Engineer',
      code: 'SSE',
      level: 3,
      category: 'Engineering',
      positionCount: 10,
      employeeCount: 8,
      description: 'Senior developer with mentorship responsibilities',
    },
    {
      jobId: '3',
      title: 'Engineering Manager',
      code: 'EM',
      level: 4,
      category: 'Engineering',
      positionCount: 5,
      employeeCount: 3,
      description: 'Manages engineering teams and projects',
    },
    {
      jobId: '4',
      title: 'HR Manager',
      code: 'HRM',
      level: 4,
      category: 'Human Resources',
      positionCount: 2,
      employeeCount: 2,
      description: 'Manages HR operations and policies',
    },
    {
      jobId: '5',
      title: 'Sales Executive',
      code: 'SX',
      level: 2,
      category: 'Sales',
      positionCount: 12,
      employeeCount: 10,
      description: 'Responsible for sales and client acquisition',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenDialog = (job?: Job) => {
    if (job) {
      setCurrentJob(job);
      setIsEdit(true);
    } else {
      setCurrentJob({ level: 1, category: 'Engineering' });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentJob({});
    setIsEdit(false);
  };

  const handleSave = () => {
    if (isEdit) {
      setJobs(
        jobs.map((j) =>
          j.jobId === currentJob.jobId
            ? { ...j, ...currentJob } as Job
            : j
        )
      );
    } else {
      const newJob: Job = {
        jobId: Date.now().toString(),
        title: currentJob.title || '',
        code: currentJob.code || '',
        level: currentJob.level || 1,
        category: currentJob.category || 'Engineering',
        positionCount: 0,
        employeeCount: 0,
        description: currentJob.description,
      };
      setJobs([...jobs, newJob]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    const job = jobs.find(j => j.jobId === id);
    if (job && job.positionCount > 0) {
      alert('Cannot delete job with existing positions. Please delete or reassign positions first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this job?')) {
      setJobs(jobs.filter((j) => j.jobId !== id));
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'error';
    if (level >= 4) return 'warning';
    if (level >= 3) return 'info';
    return 'success';
  };

  const getLevelLabel = (level: number) => {
    if (level >= 5) return 'Executive';
    if (level >= 4) return 'Manager';
    if (level >= 3) return 'Senior';
    if (level >= 2) return 'Mid-Level';
    return 'Junior';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Job Definitions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Job
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Job Title</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Level</strong></TableCell>
              <TableCell><strong>Positions</strong></TableCell>
              <TableCell><strong>Employees</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No jobs found. Click "Add Job" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              jobs
                .sort((a, b) => b.level - a.level || a.title.localeCompare(b.title))
                .map((job) => (
                  <TableRow key={job.jobId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {job.title}
                      </Typography>
                      {job.description && (
                        <Typography variant="caption" color="text.secondary">
                          {job.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={job.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{job.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={`L${job.level} - ${getLevelLabel(job.level)}`}
                        color={getLevelColor(job.level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{job.positionCount}</TableCell>
                    <TableCell>{job.employeeCount}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(job)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(job.jobId)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Job' : 'Add New Job'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Job Title"
              fullWidth
              required
              value={currentJob.title || ''}
              onChange={(e) =>
                setCurrentJob({ ...currentJob, title: e.target.value })
              }
              helperText="e.g., Software Engineer, HR Manager"
            />
            <TextField
              label="Job Code"
              fullWidth
              required
              value={currentJob.code || ''}
              onChange={(e) =>
                setCurrentJob({ ...currentJob, code: e.target.value.toUpperCase() })
              }
              helperText="Short code: SE, HRM, etc."
            />
            <TextField
              label="Category"
              select
              fullWidth
              required
              value={currentJob.category || 'Engineering'}
              onChange={(e) =>
                setCurrentJob({ ...currentJob, category: e.target.value })
              }
            >
              <MenuItem value="Engineering">Engineering</MenuItem>
              <MenuItem value="Human Resources">Human Resources</MenuItem>
              <MenuItem value="Sales">Sales</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="Executive">Executive</MenuItem>
            </TextField>
            <TextField
              label="Level"
              type="number"
              fullWidth
              required
              value={currentJob.level || 1}
              onChange={(e) =>
                setCurrentJob({ ...currentJob, level: parseInt(e.target.value) || 1 })
              }
              helperText="1=Junior, 2=Mid, 3=Senior, 4=Manager, 5+=Executive"
              inputProps={{ min: 1, max: 10 }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentJob.description || ''}
              onChange={(e) =>
                setCurrentJob({ ...currentJob, description: e.target.value })
              }
              helperText="Brief job description"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentJob.title || !currentJob.code}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobsTab;
