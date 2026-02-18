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
  AttachMoney as CompensationIcon,
  CheckCircle as CheckIcon,
  TrendingUp as IncreaseIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Employee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
  departmentName: string;
  salary?: number;
  currency?: string;
}

const colors = {
  primary: '#3B82F6',
  success: '#10B981',
  gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
};

const Compensation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  const currentSalary = employee?.salary || 0;
  const currency = employee?.currency || '$';

  const [formData, setFormData] = useState({
    adjustmentType: 'percentage',
    percentageIncrease: 0,
    fixedAmount: 0,
    newSalary: currentSalary,
    effectiveDate: '',
    reason: '',
    category: '',
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

    if (field === 'percentageIncrease' && formData.adjustmentType === 'percentage') {
      const increase = (currentSalary * value) / 100;
      updatedData.newSalary = currentSalary + increase;
    } else if (field === 'fixedAmount' && formData.adjustmentType === 'fixed') {
      updatedData.newSalary = currentSalary + value;
    } else if (field === 'adjustmentType') {
      if (value === 'percentage') {
        const increase = (currentSalary * formData.percentageIncrease) / 100;
        updatedData.newSalary = currentSalary + increase;
      } else {
        updatedData.newSalary = currentSalary + formData.fixedAmount;
      }
    }

    setFormData(updatedData);
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.effectiveDate) errors.effectiveDate = 'Required';
    if (!formData.reason) errors.reason = 'Required';
    if (!formData.category) errors.category = 'Required';
    if (formData.newSalary <= currentSalary) {
      errors.adjustment = 'New salary must be greater than current';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      navigate(`/employees/${employee.employeeId}`, { state: { employee } });
    }
  };

  const increase = formData.newSalary - currentSalary;
  const increasePercentage = currentSalary > 0 ? ((increase / currentSalary) * 100).toFixed(2) : 0;

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
              💰
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Compensation Adjustment
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
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `2px solid ${alpha(colors.success, 0.3)}` }}>
        <Grid container spacing={2}>
          {/* Adjustment Method */}
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Adjustment Type"
              value={formData.adjustmentType}
              onChange={(e) => handleInputChange('adjustmentType', e.target.value)}
            >
              <MenuItem value="percentage">Percentage Increase</MenuItem>
              <MenuItem value="fixed">Fixed Amount</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            {formData.adjustmentType === 'percentage' ? (
              <TextField
                fullWidth
                size="small"
                label="Percentage Increase"
                type="number"
                value={formData.percentageIncrease}
                onChange={(e) => handleInputChange('percentageIncrease', parseFloat(e.target.value) || 0)}
                InputProps={{ endAdornment: '%' }}
              />
            ) : (
              <TextField
                fullWidth
                size="small"
                label="Fixed Amount"
                type="number"
                value={formData.fixedAmount}
                onChange={(e) => handleInputChange('fixedAmount', parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: currency }}
              />
            )}
          </Grid>
          <Grid item xs={6} sm={3}>
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
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              error={!!validationErrors.category}
              helperText={validationErrors.category}
              required
            >
              <MenuItem value="Annual Review">Annual Review</MenuItem>
              <MenuItem value="Merit Increase">Merit Increase</MenuItem>
              <MenuItem value="Promotion Adjustment">Promotion Adjustment</MenuItem>
              <MenuItem value="Market Adjustment">Market Adjustment</MenuItem>
              <MenuItem value="Cost of Living">Cost of Living</MenuItem>
            </TextField>
          </Grid>

          {/* Reason */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              select
              label="Reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              error={!!validationErrors.reason}
              helperText={validationErrors.reason}
              required
            >
              <MenuItem value="Outstanding Performance">Outstanding Performance</MenuItem>
              <MenuItem value="Exceeds Expectations">Exceeds Expectations</MenuItem>
              <MenuItem value="Market Competitiveness">Market Competitiveness</MenuItem>
              <MenuItem value="Increased Responsibilities">Increased Responsibilities</MenuItem>
              <MenuItem value="Retention">Retention</MenuItem>
            </TextField>
          </Grid>

          {/* Compensation Summary - 3 Boxes */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, p: 2, borderRadius: '10px', bgcolor: '#F0FDF4', border: `2px solid ${alpha(colors.success, 0.3)}` }}>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '11px' }}>
                  CURRENT SALARY
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#64748B' }}>
                  {currency}{currentSalary.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: alpha(colors.success, 0.1), borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '11px' }}>
                  INCREASE
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: colors.success }}>
                  <IncreaseIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '20px' }} />
                  {currency}{increase.toLocaleString()} ({increasePercentage}%)
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: colors.success, borderRadius: '8px' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'white', fontSize: '11px' }}>
                  NEW SALARY
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'white' }}>
                  {currency}{formData.newSalary.toLocaleString()}
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
              sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' } }}
            >
              Process Adjustment
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </AppLayout>
  );
};

export default Compensation;
