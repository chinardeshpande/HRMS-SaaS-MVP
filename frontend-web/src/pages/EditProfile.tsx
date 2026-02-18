import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  TextField,
  MenuItem,
  Avatar,
  alpha,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, Person as PersonIcon } from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Employee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  positionId: string;
  positionTitle: string;
  jobTitle: string;
  departmentName: string;
  reportsToEmployeeName?: string;
  status: 'active' | 'inactive' | 'on-leave' | 'exited';
  dateOfJoining: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  employeeType?: string;
  workLocation?: string;
  salary?: number;
  currency?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  probationEndDate?: string;
  lastPromotionDate?: string;
  yearsOfExperience?: number;
}

const colors = {
  primary: '#3B82F6',
  success: '#10B981',
  gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
};

const EditProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  const [formData, setFormData] = useState<Partial<Employee>>(employee || {});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName) errors.firstName = 'Required';
    if (!formData.lastName) errors.lastName = 'Required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email';

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      navigate(`/employees/${employee.employeeId}`, { state: { employee: formData } });
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <AppLayout>
      {/* Compact Banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: '12px',
          overflow: 'hidden',
          background: colors.gradient,
          height: '100px',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={employee.photoUrl}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'white',
                color: colors.primary,
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid white',
              }}
            >
              {!employee.photoUrl && getInitials(formData.firstName, formData.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Edit Profile
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {employee.firstName} {employee.lastName} • {employee.employeeCode}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<BackIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Back
          </Button>
        </Box>
      </Paper>

      {/* Compact Form - Single Row */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <Grid container spacing={2}>
          {/* Personal Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: colors.primary, fontSize: '13px' }}>
              👤 Personal Information
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="First Name"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Last Name"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Gender"
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {/* Contact Details */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: colors.primary, fontSize: '13px' }}>
              📧 Contact Details
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              required
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </Grid>

          {/* Professional Info */}
          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: colors.primary, fontSize: '13px' }}>
              💼 Professional Information
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Position"
              value={formData.positionTitle || ''}
              onChange={(e) => handleInputChange('positionTitle', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Department"
              value={formData.departmentName || ''}
              onChange={(e) => handleInputChange('departmentName', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Employment Type"
              value={formData.employmentType || 'Full-time'}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
            >
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Intern">Intern</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Work Location"
              value={formData.workLocation || ''}
              onChange={(e) => handleInputChange('workLocation', e.target.value)}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' } }}
            >
              Save Changes
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </AppLayout>
  );
};

export default EditProfile;
