import { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface ExitChecklistItem {
  itemId: string;
  task: string;
  completed: boolean;
}

interface ExitRecord {
  exitId: string;
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  departmentName: string;
  resignationDate: string;
  lastWorkingDate: string;
  exitType: 'Resignation' | 'Termination' | 'Retirement' | 'Contract End';
  reason: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  progress: number;
  handoverTo?: string;
  exitInterviewCompleted: boolean;
  checklist: ExitChecklistItem[];
}

const defaultExitChecklist: ExitChecklistItem[] = [
  { itemId: '1', task: 'Submit formal resignation letter', completed: false },
  { itemId: '2', task: 'Complete handover documentation', completed: false },
  { itemId: '3', task: 'Transfer responsibilities to designated person', completed: false },
  { itemId: '4', task: 'Return company assets (laptop, phone, ID card)', completed: false },
  { itemId: '5', task: 'Revoke system access and email', completed: false },
  { itemId: '6', task: 'Complete exit interview', completed: false },
  { itemId: '7', task: 'Clear pending leaves and dues', completed: false },
  { itemId: '8', task: 'Process final settlement', completed: false },
  { itemId: '9', task: 'Collect experience certificate', completed: false },
];

const ExitManagement = () => {
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([
    {
      exitId: '1',
      employeeId: '5',
      employeeName: 'David Brown',
      positionTitle: 'QA Engineer',
      departmentName: 'Engineering',
      resignationDate: '2024-01-10',
      lastWorkingDate: '2024-02-10',
      exitType: 'Resignation',
      reason: 'Career growth opportunity',
      status: 'Completed',
      progress: 100,
      handoverTo: 'Mike Johnson',
      exitInterviewCompleted: true,
      checklist: defaultExitChecklist.map(item => ({ ...item, completed: true })),
    },
    {
      exitId: '2',
      employeeId: '6',
      employeeName: 'Sarah Williams',
      positionTitle: 'Frontend Lead',
      departmentName: 'Frontend Team',
      resignationDate: '2024-01-15',
      lastWorkingDate: '2024-02-28',
      exitType: 'Resignation',
      reason: 'Relocation',
      status: 'In Progress',
      progress: 55,
      handoverTo: 'Jane Smith',
      exitInterviewCompleted: false,
      checklist: defaultExitChecklist.map((item, idx) => ({
        ...item,
        completed: idx < 5,
      })),
    },
    {
      exitId: '3',
      employeeId: '7',
      employeeName: 'Robert Miller',
      positionTitle: 'Senior Developer',
      departmentName: 'Backend Team',
      resignationDate: '2024-01-20',
      lastWorkingDate: '2024-03-20',
      exitType: 'Resignation',
      reason: 'Better compensation package',
      status: 'Pending',
      progress: 0,
      exitInterviewCompleted: false,
      checklist: [...defaultExitChecklist],
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<ExitRecord>>({});
  const [isEdit, setIsEdit] = useState(false);

  const [viewChecklistDialog, setViewChecklistDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExitRecord | null>(null);

  const mockEmployees = [
    { employeeId: '5', name: 'David Brown', position: 'QA Engineer', department: 'Engineering' },
    { employeeId: '6', name: 'Sarah Williams', position: 'Frontend Lead', department: 'Frontend Team' },
    { employeeId: '7', name: 'Robert Miller', position: 'Senior Developer', department: 'Backend Team' },
  ];

  const handleOpenDialog = (record?: ExitRecord) => {
    if (record) {
      setCurrentRecord(record);
      setIsEdit(true);
    } else {
      setCurrentRecord({
        exitType: 'Resignation',
        status: 'Pending',
        progress: 0,
        exitInterviewCompleted: false,
        checklist: [...defaultExitChecklist],
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord({});
    setIsEdit(false);
  };

  const handleSave = () => {
    const selectedEmployee = mockEmployees.find(e => e.employeeId === currentRecord.employeeId);

    if (isEdit) {
      setExitRecords(
        exitRecords.map((r) =>
          r.exitId === currentRecord.exitId
            ? {
                ...r,
                ...currentRecord,
                employeeName: selectedEmployee?.name || r.employeeName,
                positionTitle: selectedEmployee?.position || r.positionTitle,
                departmentName: selectedEmployee?.department || r.departmentName,
              } as ExitRecord
            : r
        )
      );
    } else {
      const newRecord: ExitRecord = {
        exitId: Date.now().toString(),
        employeeId: currentRecord.employeeId || '',
        employeeName: selectedEmployee?.name || '',
        positionTitle: selectedEmployee?.position || '',
        departmentName: selectedEmployee?.department || '',
        resignationDate: currentRecord.resignationDate || '',
        lastWorkingDate: currentRecord.lastWorkingDate || '',
        exitType: currentRecord.exitType || 'Resignation',
        reason: currentRecord.reason || '',
        status: 'Pending',
        progress: 0,
        handoverTo: currentRecord.handoverTo,
        exitInterviewCompleted: false,
        checklist: [...defaultExitChecklist],
      };
      setExitRecords([...exitRecords, newRecord]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this exit record?')) {
      setExitRecords(exitRecords.filter((r) => r.exitId !== id));
    }
  };

  const handleViewChecklist = (record: ExitRecord) => {
    setSelectedRecord(record);
    setViewChecklistDialog(true);
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!selectedRecord) return;

    const updatedChecklist = selectedRecord.checklist.map(item =>
      item.itemId === itemId ? { ...item, completed: !item.completed } : item
    );

    const completedCount = updatedChecklist.filter(item => item.completed).length;
    const progress = Math.round((completedCount / updatedChecklist.length) * 100);
    let status: 'Pending' | 'In Progress' | 'Completed' = 'In Progress';
    if (progress === 0) status = 'Pending';
    if (progress === 100) status = 'Completed';

    const updatedRecord = {
      ...selectedRecord,
      checklist: updatedChecklist,
      progress,
      status,
    };

    setSelectedRecord(updatedRecord);
    setExitRecords(
      exitRecords.map(r =>
        r.exitId === updatedRecord.exitId ? updatedRecord : r
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const getExitTypeColor = (exitType: string) => {
    switch (exitType) {
      case 'Resignation': return 'primary';
      case 'Termination': return 'error';
      case 'Retirement': return 'success';
      case 'Contract End': return 'default';
      default: return 'default';
    }
  };

  const totalRecords = exitRecords.length;
  const completedRecords = exitRecords.filter(r => r.status === 'Completed').length;
  const inProgressRecords = exitRecords.filter(r => r.status === 'In Progress').length;
  const pendingRecords = exitRecords.filter(r => r.status === 'Pending').length;

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Exit Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Exits
                  </Typography>
                  <Typography variant="h4">{totalRecords}</Typography>
                </Box>
                <ExitIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
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
                    Completed
                  </Typography>
                  <Typography variant="h4">{completedRecords}</Typography>
                </Box>
                <CompletedIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
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
                    In Progress
                  </Typography>
                  <Typography variant="h4">{inProgressRecords}</Typography>
                </Box>
                <TaskIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
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
                    Pending
                  </Typography>
                  <Typography variant="h4">{pendingRecords}</Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Exit Records Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Exit Records</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Initiate Exit
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Exit Type</strong></TableCell>
                <TableCell><strong>Resignation Date</strong></TableCell>
                <TableCell><strong>Last Working Day</strong></TableCell>
                <TableCell><strong>Handover To</strong></TableCell>
                <TableCell><strong>Progress</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exitRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No exit records found. Click "Initiate Exit" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                exitRecords
                  .sort((a, b) => new Date(b.resignationDate).getTime() - new Date(a.resignationDate).getTime())
                  .map((record) => (
                    <TableRow key={record.exitId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {record.employeeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.positionTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.exitType}
                          color={getExitTypeColor(record.exitType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.resignationDate}</TableCell>
                      <TableCell>{record.lastWorkingDate}</TableCell>
                      <TableCell>
                        {record.handoverTo || (
                          <Typography variant="body2" color="text.disabled">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                          <LinearProgress
                            variant="determinate"
                            value={record.progress}
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">{record.progress}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewChecklist(record)}
                          sx={{ mr: 1 }}
                        >
                          Checklist
                        </Button>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(record)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(record.exitId)}
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
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Exit Record' : 'Initiate Employee Exit'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Employee"
              select
              fullWidth
              required
              value={currentRecord.employeeId || ''}
              onChange={(e) => {
                const emp = mockEmployees.find(emp => emp.employeeId === e.target.value);
                setCurrentRecord({
                  ...currentRecord,
                  employeeId: e.target.value,
                  employeeName: emp?.name,
                  positionTitle: emp?.position,
                  departmentName: emp?.department,
                });
              }}
            >
              {mockEmployees.map((emp) => (
                <MenuItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} - {emp.position}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Exit Type"
              select
              fullWidth
              required
              value={currentRecord.exitType || 'Resignation'}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, exitType: e.target.value as any })
              }
            >
              <MenuItem value="Resignation">Resignation</MenuItem>
              <MenuItem value="Termination">Termination</MenuItem>
              <MenuItem value="Retirement">Retirement</MenuItem>
              <MenuItem value="Contract End">Contract End</MenuItem>
            </TextField>
            <TextField
              label="Resignation Date"
              type="date"
              fullWidth
              required
              value={currentRecord.resignationDate || ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, resignationDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Last Working Date"
              type="date"
              fullWidth
              required
              value={currentRecord.lastWorkingDate || ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, lastWorkingDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Handover To"
              fullWidth
              value={currentRecord.handoverTo || ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, handoverTo: e.target.value })
              }
              helperText="Employee who will take over responsibilities"
            />
            <TextField
              label="Reason for Exit"
              fullWidth
              required
              multiline
              rows={3}
              value={currentRecord.reason || ''}
              onChange={(e) =>
                setCurrentRecord({ ...currentRecord, reason: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !currentRecord.employeeId ||
              !currentRecord.resignationDate ||
              !currentRecord.lastWorkingDate ||
              !currentRecord.reason
            }
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog
        open={viewChecklistDialog}
        onClose={() => setViewChecklistDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Exit Checklist - {selectedRecord?.employeeName}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ pt: 2 }}>
              {/* Exit Details */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Exit Type
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRecord.exitType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Last Working Day
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRecord.lastWorkingDate}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Handover To
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRecord.handoverTo || 'Not assigned'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Exit Interview
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedRecord.exitInterviewCompleted ? 'Completed' : 'Pending'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body2">
                      {selectedRecord.reason}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Overall Progress</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedRecord.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedRecord.progress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>

              {/* Checklist */}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Exit Checklist ({selectedRecord.checklist.filter(i => i.completed).length}/{selectedRecord.checklist.length})
              </Typography>
              <List>
                {selectedRecord.checklist.map((item) => (
                  <ListItem
                    key={item.itemId}
                    dense
                    button
                    onClick={() => handleToggleChecklistItem(item.itemId)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={item.completed}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.task}
                      sx={{
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? 'text.secondary' : 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewChecklistDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default ExitManagement;
