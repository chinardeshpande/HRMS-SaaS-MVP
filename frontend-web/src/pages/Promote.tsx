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
import {
  ArrowBack as BackIcon,
  TrendingUp as PromotionIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Employee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
  jobTitle: string;
  departmentName: string;
  salary?: number;
  currency?: string;
}

const colors = {
  primary: '#3B82F6',
  success: '#10B981',
  gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
};

const Promote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  const currentSalary = employee?.salary || 0;
  const [formData, setFormData] = useState({
    newPosition: '',
    newJobTitle: '',
    effectiveDate: '',
    performanceRating: '',
    salaryIncreasePercentage: 0,
    newSalary: currentSalary,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  const handleInputChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    if (field === 'salaryIncreasePercentage') {
      const increase = (currentSalary * value) / 100;
      updatedData.newSalary = currentSalary + increase;
    }
    setFormData(updatedData);
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.newPosition) errors.newPosition = 'Required';
    if (!formData.newJobTitle) errors.newJobTitle = 'Required';
    if (!formData.effectiveDate) errors.effectiveDate = 'Required';
    if (!formData.performanceRating) errors.performanceRating = 'Required';

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      navigate(`/employees/${employee.employeeId}`, { state: { employee } });
    }
  };

  const getInitials = () => {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
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
              {getInitials()}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Employee Promotion
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

      {/* Compact Form */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `2px solid ${alpha(colors.primary, 0.3)}` }}>
        <Grid container spacing={2}>
          {/* Position Change */}
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Current Position"
              value={employee.positionTitle}
              disabled
              sx={{ bgcolor: '#F9FAFB' }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="New Position"
              value={formData.newPosition}
              onChange={(e) => handleInputChange('newPosition', e.target.value)}
              error={!!validationErrors.newPosition}
              helperText={validationErrors.newPosition}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Current Job Title"
              value={employee.jobTitle}
              disabled
              sx={{ bgcolor: '#F9FAFB' }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="New Job Title"
              value={formData.newJobTitle}
              onChange={(e) => handleInputChange('newJobTitle', e.target.value)}
              error={!!validationErrors.newJobTitle}
              helperText={validationErrors.newJobTitle}
              required
            />
          </Grid>

          {/* Promotion Details */}
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Effective Date"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              error={!!validationErrors.effectiveDate}
              helperText={validationErrors.effectiveDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Performance Rating"
              value={formData.performanceRating}
              onChange={(e) => handleInputChange('performanceRating', e.target.value)}
              error={!!validationErrors.performanceRating}
              helperText={validationErrors.performanceRating}
              required
            >
              <MenuItem value="Outstanding">Outstanding</MenuItem>
              <MenuItem value="Exceeds Expectations">Exceeds Expectations</MenuItem>
              <MenuItem value="Meets Expectations">Meets Expectations</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Salary Increase %"
              type="number"
              value={formData.salaryIncreasePercentage}
              onChange={(e) => handleInputChange('salaryIncreasePercentage', parseFloat(e.target.value) || 0)}
              InputProps={{ endAdornment: '%' }}
            />
          </Grid>

          {/* Salary Summary */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                borderRadius: '10px',
                bgcolor: '#F0FDF4',
                border: `2px solid ${alpha(colors.success, 0.3)}`,
              }}
            >
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Current Salary
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#64748B' }}>
                  {employee.currency}
                  {currentSalary.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Increase
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.success }}>
                  +{employee.currency}
                  {(formData.newSalary - currentSalary).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  New Salary
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary }}>
                  {employee.currency}
                  {formData.newSalary.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<CheckIcon />}
              sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: '#2563EB' } }}
            >
              Process Promotion
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </AppLayout>
  );
};

export default Promote;
