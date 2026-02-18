import { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Department {
  departmentId: string;
  name: string;
  parentDeptId?: string;
  headEmployeeId?: string;
  employeeCount: number;
}

const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([
    {
      departmentId: '1',
      name: 'Engineering',
      employeeCount: 25,
    },
    {
      departmentId: '2',
      name: 'Human Resources',
      employeeCount: 5,
    },
    {
      departmentId: '3',
      name: 'Sales',
      employeeCount: 15,
    },
    {
      departmentId: '4',
      name: 'Marketing',
      employeeCount: 8,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentDept, setCurrentDept] = useState<Partial<Department>>({});
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setCurrentDept(dept);
      setIsEdit(true);
    } else {
      setCurrentDept({});
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDept({});
    setIsEdit(false);
  };

  const handleSave = () => {
    if (isEdit) {
      // Update existing department
      setDepartments(
        departments.map((d) =>
          d.departmentId === currentDept.departmentId
            ? { ...d, ...currentDept }
            : d
        )
      );
    } else {
      // Add new department
      const newDept: Department = {
        departmentId: Date.now().toString(),
        name: currentDept.name || '',
        employeeCount: 0,
      };
      setDepartments([...departments, newDept]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      setDepartments(departments.filter((d) => d.departmentId !== id));
    }
  };

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Department
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Department Name</strong></TableCell>
              <TableCell><strong>Employee Count</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No departments found. Click "Add Department" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.departmentId} hover>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.employeeCount}</TableCell>
                  <TableCell>
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(dept)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(dept.departmentId)}
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
          {isEdit ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Department Name"
              fullWidth
              required
              value={currentDept.name || ''}
              onChange={(e) =>
                setCurrentDept({ ...currentDept, name: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentDept.name}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default Departments;
