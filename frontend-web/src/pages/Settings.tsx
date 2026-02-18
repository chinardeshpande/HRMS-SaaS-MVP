import { Typography, Paper } from '@mui/material';
import { AppLayout } from '../components/layout/AppLayout';

const Settings = () => {
  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Application settings and configuration will be implemented here.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Features: Company settings, User preferences, System configuration, Integrations
        </Typography>
      </Paper>
    </AppLayout>
  );
};

export default Settings;
