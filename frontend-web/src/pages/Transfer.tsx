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
  SwapHoriz as TransferIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
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
  workLocation?: string;
  reportsToEmployeeName?: string;
}

const colors = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
};

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  const [formData, setFormData] = useState({
    toDepartment: '',
    toPosition: '',
    toLocation: '',
    toReportsTo: '',
    effectiveDate: '',
    reason: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.toDepartment) errors.toDepartment = 'Required';
    if (!formData.toPosition) errors.toPosition = 'Required';
    if (!formData.effectiveDate) errors.effectiveDate = 'Required';
    if (!formData.reason) errors.reason = 'Required';

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
                color: colors.success,
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid white',
              }}
            >
              {getInitials()}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Employee Transfer
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

      {/* Compact Transfer Form */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `2px solid ${alpha(colors.success, 0.3)}` }}>
        <Grid container spacing={2}>
          {/* Current → New Comparison */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: '#FEF2F2',
                  border: '2px solid #FCA5A5',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '11px' }}>
                  FROM
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {employee.departmentName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {employee.positionTitle}
                </Typography>
              </Box>
              <ArrowIcon sx={{ fontSize: '32px', color: colors.success }} />
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: '10px',
                  bgcolor: '#F0FDF4',
                  border: '2px solid #86EFAC',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: colors.success, fontSize: '11px' }}>
                  TO
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {formData.toDepartment || 'Select department...'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.toPosition || 'Select position...'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Transfer Details */}
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="New Department"
              value={formData.toDepartment}
              onChange={(e) => handleInputChange('toDepartment', e.target.value)}
              error={!!validationErrors.toDepartment}
              helperText={validationErrors.toDepartment}
              required
            >
              <MenuItem value="Engineering">Engineering</MenuItem>
              <MenuItem value="Backend Team">Backend Team</MenuItem>
              <MenuItem value="Frontend Team">Frontend Team</MenuItem>
              <MenuItem value="Human Resources">Human Resources</MenuItem>
              <MenuItem value="Sales">Sales</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="New Position"
              value={formData.toPosition}
              onChange={(e) => handleInputChange('toPosition', e.target.value)}
              error={!!validationErrors.toPosition}
              helperText={validationErrors.toPosition}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="New Location"
              value={formData.toLocation}
              onChange={(e) => handleInputChange('toLocation', e.target.value)}
            >
              <MenuItem value="San Francisco HQ">San Francisco HQ</MenuItem>
              <MenuItem value="New York Office">New York Office</MenuItem>
              <MenuItem value="London Office">London Office</MenuItem>
              <MenuItem value="Remote">Remote</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Reports To"
              value={formData.toReportsTo}
              onChange={(e) => handleInputChange('toReportsTo', e.target.value)}
            />
          </Grid>
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
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              select
              label="Transfer Reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              error={!!validationErrors.reason}
              helperText={validationErrors.reason}
              required
            >
              <MenuItem value="Career Development">Career Development</MenuItem>
              <MenuItem value="Business Need">Business Need</MenuItem>
              <MenuItem value="Restructuring">Restructuring</MenuItem>
              <MenuItem value="Employee Request">Employee Request</MenuItem>
              <MenuItem value="Performance Improvement">Performance Improvement</MenuItem>
            </TextField>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<CheckIcon />}
              sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' } }}
            >
              Process Transfer
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </AppLayout>
  );
};

export default Transfer;
