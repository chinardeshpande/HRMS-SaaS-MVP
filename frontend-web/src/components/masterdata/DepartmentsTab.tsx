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
  MenuItem,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as TreeIcon,
} from '@mui/icons-material';

export interface Department {
  departmentId: string;
  name: string;
  code: string;
  parentDeptId?: string;
  parentDeptName?: string;
  headEmployeeId?: string;
  headEmployeeName?: string;
  level: number;
  employeeCount: number;
  positionCount: number;
}

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState<Department[]>([
    {
      departmentId: '1',
      name: 'Executive',
      code: 'EXEC',
      level: 1,
      employeeCount: 3,
      positionCount: 3,
    },
    {
      departmentId: '2',
      name: 'Engineering',
      code: 'ENG',
      parentDeptId: '1',
      parentDeptName: 'Executive',
      level: 2,
      employeeCount: 25,
      positionCount: 30,
    },
    {
      departmentId: '3',
      name: 'Backend Team',
      code: 'ENG-BE',
      parentDeptId: '2',
      parentDeptName: 'Engineering',
      level: 3,
      employeeCount: 12,
      positionCount: 15,
    },
    {
      departmentId: '4',
      name: 'Frontend Team',
      code: 'ENG-FE',
      parentDeptId: '2',
      parentDeptName: 'Engineering',
      level: 3,
      employeeCount: 13,
      positionCount: 15,
    },
    {
      departmentId: '5',
      name: 'Human Resources',
      code: 'HR',
      parentDeptId: '1',
      parentDeptName: 'Executive',
      level: 2,
      employeeCount: 5,
      positionCount: 6,
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
      setCurrentDept({ level: 1 });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDept({});
    setIsEdit(false);
  };

  const calculateLevel = (parentId?: string): number => {
    if (!parentId) return 1;
    const parent = departments.find(d => d.departmentId === parentId);
    return parent ? parent.level + 1 : 1;
  };

  const handleSave = () => {
    const level = calculateLevel(currentDept.parentDeptId);
    const parentDept = departments.find(d => d.departmentId === currentDept.parentDeptId);

    if (isEdit) {
      setDepartments(
        departments.map((d) =>
          d.departmentId === currentDept.departmentId
            ? {
                ...d,
                ...currentDept,
                level,
                parentDeptName: parentDept?.name,
              } as Department
            : d
        )
      );
    } else {
      const newDept: Department = {
        departmentId: Date.now().toString(),
        name: currentDept.name || '',
        code: currentDept.code || '',
        parentDeptId: currentDept.parentDeptId,
        parentDeptName: parentDept?.name,
        level,
        employeeCount: 0,
        positionCount: 0,
      };
      setDepartments([...departments, newDept]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    const hasChildren = departments.some(d => d.parentDeptId === id);
    if (hasChildren) {
      alert('Cannot delete department with sub-departments. Please delete or reassign sub-departments first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this department?')) {
      setDepartments(departments.filter((d) => d.departmentId !== id));
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'default';
    }
  };

  const getIndentation = (level: number) => {
    return (level - 1) * 2;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Department Hierarchy</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Department
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Department Name</strong></TableCell>
              <TableCell><strong>Code</strong></TableCell>
              <TableCell><strong>Parent Department</strong></TableCell>
              <TableCell><strong>Level</strong></TableCell>
              <TableCell><strong>Positions</strong></TableCell>
              <TableCell><strong>Employees</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No departments found. Click "Add Department" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              departments
                .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                .map((dept) => (
                  <TableRow key={dept.departmentId} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', pl: getIndentation(dept.level) }}>
                        {dept.level > 1 && <TreeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                        <Typography variant="body2" fontWeight={dept.level === 1 ? 600 : 400}>
                          {dept.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={dept.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {dept.parentDeptName ? (
                        <Typography variant="body2" color="text.secondary">
                          {dept.parentDeptName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          Root
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`L${dept.level}`}
                        color={getLevelColor(dept.level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{dept.positionCount}</TableCell>
                    <TableCell>{dept.employeeCount}</TableCell>
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
            <TextField
              label="Department Code"
              fullWidth
              required
              value={currentDept.code || ''}
              onChange={(e) =>
                setCurrentDept({ ...currentDept, code: e.target.value.toUpperCase() })
              }
              helperText="e.g., ENG, HR, SALES"
            />
            <TextField
              label="Parent Department"
              select
              fullWidth
              value={currentDept.parentDeptId || ''}
              onChange={(e) =>
                setCurrentDept({ ...currentDept, parentDeptId: e.target.value || undefined })
              }
              helperText="Leave empty for root department"
            >
              <MenuItem value="">
                <em>None (Root Department)</em>
              </MenuItem>
              {departments
                .filter(d => d.departmentId !== currentDept.departmentId)
                .map((dept) => (
                  <MenuItem key={dept.departmentId} value={dept.departmentId}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentDept.name || !currentDept.code}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsTab;
