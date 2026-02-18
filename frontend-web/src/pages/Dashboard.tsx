import { Typography, Paper, Grid, Card, CardContent, Box } from '@mui/material';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
        {/* Welcome Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</strong> • {user?.email}
          </Typography>
        </Paper>

        {/* Dashboard Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Employees
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Departments
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4">1</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending Tasks
                </Typography>
                <Typography variant="h4">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Welcome Message */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            🎉 Your HRMS SaaS MVP is Running!
          </Typography>
          <Typography variant="body1" paragraph>
            The application is successfully deployed with the following features ready:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">✅ User Authentication (Mock)</Typography>
            <Typography component="li" variant="body2">✅ Database with 5 entity models</Typography>
            <Typography component="li" variant="body2">✅ Multi-tenant architecture</Typography>
            <Typography component="li" variant="body2">✅ Material-UI design system</Typography>
            <Typography component="li" variant="body2">✅ Backend API with Swagger docs</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Next steps: Build authentication API, employee management, attendance tracking, and more!
          </Typography>
        </Paper>
    </AppLayout>
  );
};

export default Dashboard;
