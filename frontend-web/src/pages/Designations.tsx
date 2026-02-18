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

interface Designation {
  designationId: string;
  name: string;
  level?: number;
  employeeCount: number;
}

const Designations = () => {
  const [designations, setDesignations] = useState<Designation[]>([
    { designationId: '1', name: 'Software Engineer', level: 2, employeeCount: 12 },
    { designationId: '2', name: 'Senior Software Engineer', level: 3, employeeCount: 8 },
    { designationId: '3', name: 'Engineering Manager', level: 4, employeeCount: 3 },
    { designationId: '4', name: 'HR Manager', level: 4, employeeCount: 2 },
    { designationId: '5', name: 'Sales Executive', level: 2, employeeCount: 10 },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentDesignation, setCurrentDesignation] = useState<Partial<Designation>>({});
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenDialog = (designation?: Designation) => {
    if (designation) {
      setCurrentDesignation(designation);
      setIsEdit(true);
    } else {
      setCurrentDesignation({});
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDesignation({});
    setIsEdit(false);
  };

  const handleSave = () => {
    if (isEdit) {
      setDesignations(
        designations.map((d) =>
          d.designationId === currentDesignation.designationId
            ? { ...d, ...currentDesignation }
            : d
        )
      );
    } else {
      const newDesignation: Designation = {
        designationId: Date.now().toString(),
        name: currentDesignation.name || '',
        level: currentDesignation.level,
        employeeCount: 0,
      };
      setDesignations([...designations, newDesignation]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      setDesignations(designations.filter((d) => d.designationId !== id));
    }
  };

  const getLevelColor = (level?: number) => {
    if (!level) return 'default';
    if (level >= 4) return 'error';
    if (level >= 3) return 'warning';
    return 'info';
  };

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Designations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Designation
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Designation Name</strong></TableCell>
              <TableCell><strong>Level</strong></TableCell>
              <TableCell><strong>Employee Count</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {designations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No designations found. Click "Add Designation" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              designations.map((designation) => (
                <TableRow key={designation.designationId} hover>
                  <TableCell>{designation.name}</TableCell>
                  <TableCell>
                    {designation.level ? (
                      <Chip
                        label={`Level ${designation.level}`}
                        color={getLevelColor(designation.level)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{designation.employeeCount}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(designation)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(designation.designationId)}
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
          {isEdit ? 'Edit Designation' : 'Add New Designation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Designation Name"
              fullWidth
              required
              value={currentDesignation.name || ''}
              onChange={(e) =>
                setCurrentDesignation({ ...currentDesignation, name: e.target.value })
              }
            />
            <TextField
              label="Level"
              type="number"
              fullWidth
              value={currentDesignation.level || ''}
              onChange={(e) =>
                setCurrentDesignation({
                  ...currentDesignation,
                  level: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              helperText="Lower number = Junior, Higher number = Senior"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentDesignation.name}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default Designations;
