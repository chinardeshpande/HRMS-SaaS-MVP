import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';
import { PageBanner, bannerImages } from '../components/common/PageBanner';

// Color palette
const colors = {
  primary: '#3B82F6',
  secondary: '#FCD34D',
  accent: '#A78BFA',
  success: '#10B981',
  error: '#EF4444',
};

interface NewEmployee {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  address: string;

  // Emergency Contact
  emergencyContact: string;
  emergencyPhone: string;

  // Professional Information
  positionTitle: string;
  jobTitle: string;
  departmentName: string;
  reportsToEmployeeName: string;
  employmentType: string;
  workLocation: string;
  dateOfJoining: string;
  salary: string;
  currency: string;

  // Additional
  yearsOfExperience: string;
}

interface BulkUploadRow {
  id: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  data: Partial<NewEmployee>;
}

const initialEmployeeData: NewEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  positionTitle: '',
  jobTitle: '',
  departmentName: '',
  reportsToEmployeeName: '',
  employmentType: 'Full-time',
  workLocation: '',
  dateOfJoining: '',
  salary: '',
  currency: '$',
  yearsOfExperience: '',
};

const wizardSteps = [
  'Personal Information',
  'Emergency Contact',
  'Professional Details',
  'Review & Submit',
];

const Onboarding = () => {
  const navigate = useNavigate();

  // Wizard mode state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [employeeData, setEmployeeData] = useState<NewEmployee>(initialEmployeeData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Bulk upload state
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadedRows, setUploadedRows] = useState<BulkUploadRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Statistics
  const [onboardingStats] = useState({
    total: 12,
    completed: 8,
    inProgress: 3,
    pending: 1,
  });

  // ============= Wizard Functions =============

  const handleWizardOpen = () => {
    setWizardOpen(true);
    setActiveStep(0);
    setEmployeeData(initialEmployeeData);
    setValidationErrors({});
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    setActiveStep(0);
    setEmployeeData(initialEmployeeData);
    setValidationErrors({});
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (field: keyof NewEmployee, value: string) => {
    setEmployeeData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Personal Information
        if (!employeeData.firstName) errors.firstName = 'First name is required';
        if (!employeeData.lastName) errors.lastName = 'Last name is required';
        if (!employeeData.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(employeeData.email)) errors.email = 'Invalid email format';
        if (!employeeData.phone) errors.phone = 'Phone is required';
        if (!employeeData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!employeeData.gender) errors.gender = 'Gender is required';
        break;

      case 1: // Emergency Contact
        if (!employeeData.emergencyContact) errors.emergencyContact = 'Emergency contact name is required';
        if (!employeeData.emergencyPhone) errors.emergencyPhone = 'Emergency contact phone is required';
        break;

      case 2: // Professional Details
        if (!employeeData.positionTitle) errors.positionTitle = 'Position is required';
        if (!employeeData.jobTitle) errors.jobTitle = 'Job title is required';
        if (!employeeData.departmentName) errors.departmentName = 'Department is required';
        if (!employeeData.dateOfJoining) errors.dateOfJoining = 'Joining date is required';
        if (!employeeData.salary) errors.salary = 'Salary is required';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEmployee = () => {
    console.log('Submitting employee:', employeeData);
    // Here you would typically make an API call to save the employee
    alert('Employee added successfully! In a real app, this would save to the backend.');
    handleWizardClose();
    // Navigate to employee detail or list
    // navigate('/employees');
  };

  // ============= Bulk Upload Functions =============

  const handleBulkUploadOpen = () => {
    setBulkUploadOpen(true);
    setUploadedRows([]);
  };

  const handleBulkUploadClose = () => {
    setBulkUploadOpen(false);
    setUploadedRows([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: BulkUploadRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const data: Partial<NewEmployee> = {};

      headers.forEach((header, index) => {
        const key = header.replace(/\s+/g, '') as keyof NewEmployee;
        data[key] = values[index] || '';
      });

      rows.push({
        id: `row-${i}`,
        status: 'pending',
        data,
      });
    }

    setUploadedRows(rows);
  };

  const validateBulkRow = (data: Partial<NewEmployee>): string | null => {
    if (!data.firstName || !data.lastName) return 'Missing name';
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) return 'Invalid email';
    if (!data.dateOfJoining) return 'Missing joining date';
    return null;
  };

  const handleProcessBulkUpload = async () => {
    setIsProcessing(true);

    // Simulate processing each row
    for (let i = 0; i < uploadedRows.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      const error = validateBulkRow(uploadedRows[i].data);

      setUploadedRows(prev => prev.map((row, index) =>
        index === i
          ? { ...row, status: error ? 'error' : 'success', error: error || undefined }
          : row
      ));
    }

    setIsProcessing(false);

    const successCount = uploadedRows.filter(r => !validateBulkRow(r.data)).length;
    alert(`Bulk upload complete! ${successCount} employees added successfully.`);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'maritalStatus', 'nationality', 'address', 'emergencyContact', 'emergencyPhone',
      'positionTitle', 'jobTitle', 'departmentName', 'reportsToEmployeeName',
      'employmentType', 'workLocation', 'dateOfJoining', 'salary', 'currency', 'yearsOfExperience'
    ];

    const sampleData = [
      'John', 'Doe', 'john.doe@company.com', '+1-555-0101', '1990-01-15', 'Male',
      'Single', 'American', '123 Main St', 'Jane Doe', '+1-555-0199',
      'Software Engineer', 'Backend Developer', 'Engineering', 'Tech Lead',
      'Full-time', 'San Francisco HQ', '2025-02-01', '120000', '$', '5'
    ];

    const csv = headers.join(',') + '\n' + sampleData.join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
  };

  // ============= Render Step Content =============

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={employeeData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!validationErrors.firstName}
                helperText={validationErrors.firstName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={employeeData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={employeeData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={employeeData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={employeeData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                error={!!validationErrors.dateOfBirth}
                helperText={validationErrors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={employeeData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                error={!!validationErrors.gender}
                helperText={validationErrors.gender}
                required
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
                <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Marital Status"
                value={employeeData.maritalStatus}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
              >
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Divorced">Divorced</MenuItem>
                <MenuItem value="Widowed">Widowed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nationality"
                value={employeeData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={employeeData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please provide an emergency contact who can be reached in case of emergencies.
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={employeeData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                error={!!validationErrors.emergencyContact}
                helperText={validationErrors.emergencyContact || 'e.g., Spouse, Parent, Sibling'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                value={employeeData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                error={!!validationErrors.emergencyPhone}
                helperText={validationErrors.emergencyPhone}
                required
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position Title"
                value={employeeData.positionTitle}
                onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                error={!!validationErrors.positionTitle}
                helperText={validationErrors.positionTitle}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={employeeData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                error={!!validationErrors.jobTitle}
                helperText={validationErrors.jobTitle}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={employeeData.departmentName}
                onChange={(e) => handleInputChange('departmentName', e.target.value)}
                error={!!validationErrors.departmentName}
                helperText={validationErrors.departmentName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reports To"
                value={employeeData.reportsToEmployeeName}
                onChange={(e) => handleInputChange('reportsToEmployeeName', e.target.value)}
                helperText="Manager's name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Employment Type"
                value={employeeData.employmentType}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                required
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Work Location"
                value={employeeData.workLocation}
                onChange={(e) => handleInputChange('workLocation', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Joining"
                type="date"
                value={employeeData.dateOfJoining}
                onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                error={!!validationErrors.dateOfJoining}
                helperText={validationErrors.dateOfJoining}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Currency"
                value={employeeData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <MenuItem value="$">$ (USD)</MenuItem>
                <MenuItem value="€">€ (EUR)</MenuItem>
                <MenuItem value="£">£ (GBP)</MenuItem>
                <MenuItem value="₹">₹ (INR)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Annual Salary"
                type="number"
                value={employeeData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                error={!!validationErrors.salary}
                helperText={validationErrors.salary}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={employeeData.yearsOfExperience}
                onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Please review all information before submitting. You can go back to edit any section.
            </Alert>

            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(colors.primary, 0.05), mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primary }}>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{employeeData.firstName} {employeeData.lastName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{employeeData.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{employeeData.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">{employeeData.dateOfBirth}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Gender</Typography>
                  <Typography variant="body1">{employeeData.gender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Nationality</Typography>
                  <Typography variant="body1">{employeeData.nationality || 'Not provided'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(colors.success, 0.05), mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.success }}>
                Emergency Contact
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Contact Name</Typography>
                  <Typography variant="body1">{employeeData.emergencyContact}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Contact Phone</Typography>
                  <Typography variant="body1">{employeeData.emergencyPhone}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(colors.accent, 0.05) }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.accent }}>
                Professional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Position</Typography>
                  <Typography variant="body1">{employeeData.positionTitle}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Job Title</Typography>
                  <Typography variant="body1">{employeeData.jobTitle}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{employeeData.departmentName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Reports To</Typography>
                  <Typography variant="body1">{employeeData.reportsToEmployeeName || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Employment Type</Typography>
                  <Typography variant="body1">{employeeData.employmentType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Work Location</Typography>
                  <Typography variant="body1">{employeeData.workLocation || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Joining Date</Typography>
                  <Typography variant="body1">{employeeData.dateOfJoining}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Annual Salary</Typography>
                  <Typography variant="body1">{employeeData.currency}{Number(employeeData.salary).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <PageBanner
        title="Employee Onboarding"
        subtitle="Streamline your employee onboarding process"
        imageUrl={bannerImages.onboarding}
        icon={<PersonAddIcon />}
        height="200px"
      />

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: `2px solid ${alpha(colors.primary, 0.2)}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    Total Onboarding
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary }}>
                    {onboardingStats.total}
                  </Typography>
                </Box>
                <PersonAddIcon sx={{ fontSize: 32, color: colors.primary, opacity: 0.2 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: `2px solid ${alpha(colors.success, 0.2)}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    Completed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success }}>
                    {onboardingStats.completed}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 32, color: colors.success, opacity: 0.2 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: `2px solid ${alpha('#F59E0B', 0.2)}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    In Progress
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                    {onboardingStats.inProgress}
                  </Typography>
                </Box>
                <UploadIcon sx={{ fontSize: 32, color: '#F59E0B', opacity: 0.2 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card elevation={0} sx={{ border: `2px solid ${alpha(colors.accent, 0.2)}` }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: colors.accent }}>
                    {onboardingStats.pending}
                  </Typography>
                </Box>
                <CloudUploadIcon sx={{ fontSize: 32, color: colors.accent, opacity: 0.2 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PersonAddIcon />}
            onClick={handleWizardOpen}
            sx={{
              py: 2,
              fontSize: '1rem',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
              boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha(colors.primary, 0.4)}`,
              },
            }}
          >
            Add Single Employee (Wizard)
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<CloudUploadIcon />}
            onClick={handleBulkUploadOpen}
            sx={{
              py: 2,
              fontSize: '1rem',
              fontWeight: 700,
              borderWidth: 2,
              borderColor: colors.accent,
              color: colors.accent,
              '&:hover': {
                borderWidth: 2,
                borderColor: colors.accent,
                bgcolor: alpha(colors.accent, 0.05),
              },
            }}
          >
            Bulk Upload Employees
          </Button>
        </Grid>
      </Grid>

      {/* Info Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `2px solid ${alpha(colors.primary, 0.15)}` }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: colors.primary }}>
              Wizard-Based Onboarding
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Our intuitive 4-step wizard guides you through the entire employee onboarding process:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li><Typography variant="body2">Personal Information Collection</Typography></li>
              <li><Typography variant="body2">Emergency Contact Details</Typography></li>
              <li><Typography variant="body2">Professional Information & Compensation</Typography></li>
              <li><Typography variant="body2">Review & Submit</Typography></li>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, border: `2px solid ${alpha(colors.accent, 0.15)}` }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: colors.accent }}>
              Bulk Upload Feature
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload multiple employees at once using CSV format:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <li><Typography variant="body2">Download CSV Template</Typography></li>
              <li><Typography variant="body2">Fill in Employee Data</Typography></li>
              <li><Typography variant="body2">Upload and Validate</Typography></li>
              <li><Typography variant="body2">Review and Confirm</Typography></li>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ borderColor: colors.accent, color: colors.accent }}
            >
              Download Template
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* ============= Wizard Dialog ============= */}
      <Dialog
        open={wizardOpen}
        onClose={handleWizardClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minHeight: '600px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Add New Employee
            </Typography>
            <IconButton onClick={handleWizardClose}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {wizardSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button
            onClick={handleWizardClose}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<BackIcon />}
              variant="outlined"
            >
              Back
            </Button>

            {activeStep === wizardSteps.length - 1 ? (
              <Button
                onClick={handleSubmitEmployee}
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
                }}
              >
                Submit Employee
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                endIcon={<ForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* ============= Bulk Upload Dialog ============= */}
      <Dialog
        open={bulkUploadOpen}
        onClose={handleBulkUploadClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minHeight: '600px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Bulk Upload Employees
            </Typography>
            <IconButton onClick={handleBulkUploadClose}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Upload a CSV file with employee data. Make sure to use the provided template format.
          </Alert>

          {/* Upload Section */}
          {uploadedRows.length === 0 ? (
            <Box
              sx={{
                border: `2px dashed ${colors.accent}`,
                borderRadius: '12px',
                p: 6,
                textAlign: 'center',
                bgcolor: alpha(colors.accent, 0.05),
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: alpha(colors.accent, 0.1),
                  borderColor: colors.primary,
                },
              }}
              component="label"
            >
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileUpload}
              />
              <CloudUploadIcon sx={{ fontSize: 64, color: colors.accent, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Click to upload CSV file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or drag and drop your file here
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate();
                }}
                sx={{ mt: 2 }}
              >
                Download Template
              </Button>
            </Box>
          ) : (
            <Box>
              {/* Upload Summary */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip
                  label={`Total: ${uploadedRows.length}`}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Success: ${uploadedRows.filter(r => r.status === 'success').length}`}
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Errors: ${uploadedRows.filter(r => r.status === 'error').length}`}
                  color="error"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`Pending: ${uploadedRows.filter(r => r.status === 'pending').length}`}
                  color="default"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Progress Bar */}
              {isProcessing && (
                <LinearProgress sx={{ mb: 2 }} />
              )}

              {/* Upload Table */}
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Joining Date</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.status === 'pending' && (
                            <Chip label="Pending" size="small" color="default" />
                          )}
                          {row.status === 'success' && (
                            <Chip label="Success" size="small" color="success" />
                          )}
                          {row.status === 'error' && (
                            <Chip label="Error" size="small" color="error" />
                          )}
                        </TableCell>
                        <TableCell>{row.data.firstName} {row.data.lastName}</TableCell>
                        <TableCell>{row.data.email}</TableCell>
                        <TableCell>{row.data.positionTitle}</TableCell>
                        <TableCell>{row.data.departmentName}</TableCell>
                        <TableCell>{row.data.dateOfJoining}</TableCell>
                        <TableCell>
                          {row.error && (
                            <Typography variant="caption" color="error">
                              {row.error}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleBulkUploadClose} variant="outlined" color="inherit">
            Cancel
          </Button>
          {uploadedRows.length > 0 && (
            <Button
              onClick={handleProcessBulkUpload}
              variant="contained"
              disabled={isProcessing}
              startIcon={<CheckCircleIcon />}
              sx={{
                background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.primary} 100%)`,
              }}
            >
              {isProcessing ? 'Processing...' : 'Process Upload'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default Onboarding;
