import { useState } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { AppLayout } from '../components/layout/AppLayout';
import DepartmentsTab from '../components/masterdata/DepartmentsTab';
import JobsTab from '../components/masterdata/JobsTab';
import PositionsTab from '../components/masterdata/PositionsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`master-data-tabpanel-${index}`}
      aria-labelledby={`master-data-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const MasterData = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Master Data Management
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="master data tabs">
            <Tab label="Departments" />
            <Tab label="Jobs" />
            <Tab label="Positions" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <DepartmentsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <JobsTab />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <PositionsTab />
        </TabPanel>
      </Paper>
    </AppLayout>
  );
};

export default MasterData;
