import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AccessTime as TimeIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  EventBusy as LeaveIcon,
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
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
};

const EmployeeAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee;

  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate(`/employees/${employee.employeeId}`, { state: { employee } });
  };

  // Compact attendance summary data
  const stats = {
    present: 18,
    absent: 1,
    leave: 1,
    avgHours: 8.9,
  };

  // Recent attendance (last 7 days)
  const recentAttendance = [
    { date: 'Mon, Jan 20', status: 'Present', hours: 9.0, icon: '✓', color: colors.success },
    { date: 'Tue, Jan 21', status: 'Present', hours: 9.5, icon: '✓', color: colors.success },
    { date: 'Wed, Jan 22', status: 'Present', hours: 8.9, icon: '✓', color: colors.success },
    { date: 'Thu, Jan 23', status: 'Absent', hours: 0, icon: '✗', color: colors.error },
    { date: 'Fri, Jan 24', status: 'Present', hours: 9.0, icon: '✓', color: colors.success },
    { date: 'Sat, Jan 25', status: 'Weekend', hours: 0, icon: '-', color: '#94A3B8' },
    { date: 'Sun, Jan 26', status: 'Weekend', hours: 0, icon: '-', color: '#94A3B8' },
  ];

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
                fontSize: '2rem',
                fontWeight: 700,
                border: '3px solid white',
              }}
            >
              🕐
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Attendance Tracking
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

      {/* Compact Content */}
      <Grid container spacing={2}>
        {/* Summary Cards - Single Row */}
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '10px',
              border: `2px solid ${alpha(colors.success, 0.3)}`,
              bgcolor: '#F0FDF4',
              textAlign: 'center',
            }}
          >
            <PresentIcon sx={{ fontSize: '32px', color: colors.success, mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
              {stats.present}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Present Days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '10px',
              border: `2px solid ${alpha(colors.error, 0.3)}`,
              bgcolor: '#FEF2F2',
              textAlign: 'center',
            }}
          >
            <AbsentIcon sx={{ fontSize: '32px', color: colors.error, mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.error }}>
              {stats.absent}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Absent Days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '10px',
              border: `2px solid ${alpha(colors.warning, 0.3)}`,
              bgcolor: '#FFFBEB',
              textAlign: 'center',
            }}
          >
            <LeaveIcon sx={{ fontSize: '32px', color: colors.warning, mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning }}>
              {stats.leave}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Leave Days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '10px',
              border: `2px solid ${alpha(colors.primary, 0.3)}`,
              bgcolor: '#EFF6FF',
              textAlign: 'center',
            }}
          >
            <TimeIcon sx={{ fontSize: '32px', color: colors.primary, mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
              {stats.avgHours}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Avg Hours/Day
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Attendance - Compact Horizontal Timeline */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.primary }}>
              Recent Attendance (Last 7 Days)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
              {recentAttendance.map((day, index) => (
                <Box
                  key={index}
                  sx={{
                    minWidth: '140px',
                    p: 1.5,
                    borderRadius: '10px',
                    border: `2px solid ${alpha(day.color, 0.3)}`,
                    bgcolor: alpha(day.color, 0.05),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: day.color, fontSize: '24px', display: 'block' }}>
                    {day.icon}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {day.date}
                  </Typography>
                  <Chip
                    label={day.status}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: day.color,
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '10px',
                      height: '20px',
                    }}
                  />
                  {day.hours > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 600, color: 'text.secondary' }}>
                      {day.hours} hrs
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </AppLayout>
  );
};

export default EmployeeAttendance;
