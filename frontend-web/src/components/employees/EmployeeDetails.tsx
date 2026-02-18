import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Paper,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as PromotionIcon,
  SwapHoriz as TransferIcon,
  AttachMoney as CompensationIcon,
  Assessment as PerformanceIcon,
  AccessTime as TimeIcon,
  ExitToApp as ExitIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  PersonAdd as OnboardingIcon,
} from '@mui/icons-material';

interface Employee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  positionId: string;
  positionTitle: string;
  jobTitle: string;
  departmentName: string;
  reportsToEmployeeName?: string;
  status: 'active' | 'inactive' | 'on-leave' | 'exited';
  dateOfJoining: string;
  // Personal Info
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  // Organizational Data
  employeeType?: string;
  workLocation?: string;
  salary?: number;
  currency?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  probationEndDate?: string;
  lastPromotionDate?: string;
  yearsOfExperience?: number;
}

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

interface EmployeeDetailsProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
}

const EmployeeDetails = ({ employee, open, onClose, onEdit }: EmployeeDetailsProps) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState<null | HTMLElement>(null);

  if (!employee) return null;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleActionsClick = (event: React.MouseEvent<HTMLElement>) => {
    setActionsMenuAnchor(event.currentTarget);
  };

  const handleActionsClose = () => {
    setActionsMenuAnchor(null);
  };

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for employee ${employee.employeeId}`);
    handleActionsClose();
    // Implement action handlers
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'on-leave': return 'warning';
      case 'exited': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h5">
                {employee.firstName} {employee.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.employeeCode} • {employee.positionTitle}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={employee.status.toUpperCase()}
                  color={getStatusColor(employee.status)}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Action Buttons */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Grid container spacing={1}>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PromotionIcon />}
              onClick={() => handleAction('promotion')}
            >
              Promote
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TransferIcon />}
              onClick={() => handleAction('transfer')}
            >
              Transfer
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CompensationIcon />}
              onClick={() => handleAction('compensation')}
            >
              Compensation
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PerformanceIcon />}
              onClick={() => handleAction('performance')}
            >
              Performance
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TimeIcon />}
              onClick={() => handleAction('attendance')}
            >
              Time & Attendance
            </Button>
          </Grid>
          <Grid item>
            <IconButton
              size="small"
              onClick={handleActionsClick}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <MoreIcon />
            </IconButton>
            <Menu
              anchorEl={actionsMenuAnchor}
              open={Boolean(actionsMenuAnchor)}
              onClose={handleActionsClose}
            >
              <MenuItem onClick={() => handleAction('onboarding')}>
                <ListItemIcon>
                  <OnboardingIcon fontSize="small" />
                </ListItemIcon>
                View Onboarding
              </MenuItem>
              <MenuItem onClick={() => handleAction('edit')}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                Edit Details
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleAction('exit')} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <ExitIcon fontSize="small" color="error" />
                </ListItemIcon>
                Initiate Exit
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Personal Information" />
          <Tab label="Organizational Data" />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3 }}>
        {/* Personal Information Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={employee.email}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Phone"
                      secondary={employee.phone || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Address"
                      secondary={employee.address || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Personal Details */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Personal Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Date of Birth"
                      secondary={employee.dateOfBirth || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Gender"
                      secondary={employee.gender || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Marital Status"
                      secondary={employee.maritalStatus || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Nationality"
                      secondary={employee.nationality || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Contact Name"
                      secondary={employee.emergencyContact || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Contact Phone"
                      secondary={employee.emergencyPhone || 'Not provided'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Organizational Data Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            {/* Position & Hierarchy */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Position & Hierarchy
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Position"
                      secondary={employee.positionTitle}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Job Title"
                      secondary={employee.jobTitle}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Department"
                      secondary={employee.departmentName}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Reports To"
                      secondary={employee.reportsToEmployeeName || 'No direct manager'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Employment Details */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Employment Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Employment Type"
                      secondary={employee.employmentType || 'Full-time'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Work Location"
                      secondary={employee.workLocation || 'Not specified'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Date of Joining"
                      secondary={employee.dateOfJoining}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Years of Experience"
                      secondary={employee.yearsOfExperience ? `${employee.yearsOfExperience} years` : 'Not specified'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Compensation */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Compensation
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Current Salary"
                      secondary={
                        employee.salary
                          ? `${employee.currency || '$'}${employee.salary.toLocaleString()}`
                          : 'Confidential'
                      }
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Promotion Date"
                      secondary={employee.lastPromotionDate || 'No promotion history'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* Probation & Status */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Probation & Status
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Employment Status"
                      secondary={
                        <Chip
                          label={employee.status.toUpperCase()}
                          color={getStatusColor(employee.status)}
                          size="small"
                        />
                      }
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Probation End Date"
                      secondary={employee.probationEndDate || 'Confirmed employee'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {onEdit && (
          <Button variant="contained" onClick={() => onEdit(employee)}>
            Edit Employee
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDetails;
