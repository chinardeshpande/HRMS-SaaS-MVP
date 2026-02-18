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
  Rating,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assessment as PerformanceIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Employee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  positionTitle: string;
  departmentName: string;
}

const colors = {
  primary: '#3B82F6',
  warning: '#F59E0B',
  gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
};

const PerformanceReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  const [formData, setFormData] = useState({
    reviewPeriod: '',
    reviewType: '',
    overallRating: '',
    reviewDate: '',
    strengths: '',
    achievements: '',
  });

  const [competencies, setCompetencies] = useState([
    { name: 'Technical Skills', rating: 0 },
    { name: 'Communication', rating: 0 },
    { name: 'Teamwork', rating: 0 },
    { name: 'Leadership', rating: 0 },
    { name: 'Problem Solving', rating: 0 },
    { name: 'Initiative', rating: 0 },
  ]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const handleCompetencyChange = (index: number, rating: number) => {
    const updated = [...competencies];
    updated[index].rating = rating;
    setCompetencies(updated);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formData.reviewPeriod) errors.reviewPeriod = 'Required';
    if (!formData.reviewType) errors.reviewType = 'Required';
    if (!formData.overallRating) errors.overallRating = 'Required';
    if (!formData.reviewDate) errors.reviewDate = 'Required';

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      navigate(`/employees/${employee.employeeId}`, { state: { employee } });
    }
  };

  const averageRating = (competencies.reduce((sum, c) => sum + c.rating, 0) / competencies.length).toFixed(1);

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
                color: colors.warning,
                fontSize: '2rem',
                fontWeight: 700,
                border: '3px solid white',
              }}
            >
              ⭐
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Performance Review
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
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `2px solid ${alpha(colors.warning, 0.3)}` }}>
        <Grid container spacing={2}>
          {/* Review Details */}
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Review Period"
              value={formData.reviewPeriod}
              onChange={(e) => handleInputChange('reviewPeriod', e.target.value)}
              error={!!validationErrors.reviewPeriod}
              helperText={validationErrors.reviewPeriod}
              required
            >
              <MenuItem value="Q1 2025">Q1 2025</MenuItem>
              <MenuItem value="Q2 2025">Q2 2025</MenuItem>
              <MenuItem value="Q3 2025">Q3 2025</MenuItem>
              <MenuItem value="Q4 2025">Q4 2025</MenuItem>
              <MenuItem value="Annual 2025">Annual 2025</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Review Type"
              value={formData.reviewType}
              onChange={(e) => handleInputChange('reviewType', e.target.value)}
              error={!!validationErrors.reviewType}
              helperText={validationErrors.reviewType}
              required
            >
              <MenuItem value="Probation Review">Probation Review</MenuItem>
              <MenuItem value="Mid-Year Review">Mid-Year Review</MenuItem>
              <MenuItem value="Annual Review">Annual Review</MenuItem>
              <MenuItem value="Project Review">Project Review</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Review Date"
              type="date"
              value={formData.reviewDate}
              onChange={(e) => handleInputChange('reviewDate', e.target.value)}
              error={!!validationErrors.reviewDate}
              helperText={validationErrors.reviewDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Overall Rating"
              value={formData.overallRating}
              onChange={(e) => handleInputChange('overallRating', e.target.value)}
              error={!!validationErrors.overallRating}
              helperText={validationErrors.overallRating}
              required
            >
              <MenuItem value="Outstanding">⭐ Outstanding</MenuItem>
              <MenuItem value="Exceeds Expectations">✨ Exceeds Expectations</MenuItem>
              <MenuItem value="Meets Expectations">✓ Meets Expectations</MenuItem>
              <MenuItem value="Needs Improvement">⚠ Needs Improvement</MenuItem>
            </TextField>
          </Grid>

          {/* Competencies - Compact 2 Rows */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#FFFBEB', border: `2px solid ${alpha(colors.warning, 0.3)}` }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: colors.warning }}>
                Competency Assessment
              </Typography>
              <Grid container spacing={1.5}>
                {competencies.map((comp, index) => (
                  <Grid item xs={6} sm={4} key={comp.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', p: 1, borderRadius: '8px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '11px' }}>
                        {comp.name}
                      </Typography>
                      <Rating
                        value={comp.rating}
                        onChange={(_, newValue) => handleCompetencyChange(index, newValue || 0)}
                        size="small"
                        icon={<StarIcon sx={{ fontSize: '18px' }} />}
                        emptyIcon={<StarIcon sx={{ fontSize: '18px' }} />}
                      />
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', mt: 1, p: 1, bgcolor: alpha(colors.warning, 0.15), borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Average Rating:
                    </Typography>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: colors.warning, ml: 1 }}>
                      {averageRating} / 5.0
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Feedback - Compact Side by Side */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Key Strengths"
              multiline
              rows={2}
              value={formData.strengths}
              onChange={(e) => handleInputChange('strengths', e.target.value)}
              placeholder="List employee's key strengths..."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Key Achievements"
              multiline
              rows={2}
              value={formData.achievements}
              onChange={(e) => handleInputChange('achievements', e.target.value)}
              placeholder="Describe major achievements..."
            />
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
              sx={{ bgcolor: colors.warning, '&:hover': { bgcolor: '#D97706' } }}
            >
              Submit Review
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </AppLayout>
  );
};

export default PerformanceReview;
