import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  styled,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as PromotionIcon,
  SwapHoriz as TransferIcon,
  AttachMoney as CompensationIcon,
  Assessment as PerformanceIcon,
  AccessTime as TimeIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  CelebrationOutlined as CelebrationIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';
import { PageBanner, bannerImages } from '../components/common/PageBanner';

interface HistoryEvent {
  id: string;
  type: 'joining' | 'promotion' | 'transfer' | 'salary_increase' | 'performance_review' | 'probation_end';
  date: string;
  title: string;
  description: string;
  details?: {
    from?: string;
    to?: string;
    amount?: number;
    rating?: string;
  };
}

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
  organizationalHistory?: HistoryEvent[];
}

// Mock employee data with comprehensive organizational history
const mockEmployees: Employee[] = [
  {
    employeeId: '1',
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1-555-0101',
    photoUrl: '/images/profiles/male-1.jpg',
    positionId: '1',
    positionTitle: 'VP Engineering',
    jobTitle: 'Engineering Manager',
    departmentName: 'Engineering',
    status: 'active',
    dateOfJoining: '2020-01-15',
    dateOfBirth: '1985-05-20',
    gender: 'Male',
    maritalStatus: 'Married',
    nationality: 'American',
    address: '123 Main St, San Francisco, CA 94102',
    emergencyContact: 'Jane Doe (Spouse)',
    emergencyPhone: '+1-555-0199',
    employmentType: 'Full-time',
    workLocation: 'San Francisco HQ',
    salary: 180000,
    currency: '$',
    lastPromotionDate: '2023-01-01',
    yearsOfExperience: 15,
    organizationalHistory: [
      {
        id: '1',
        type: 'joining',
        date: '2020-01-15',
        title: 'Joined Company',
        description: 'Started as Senior Engineering Manager in Engineering Department',
        details: { to: 'Senior Engineering Manager' },
      },
      {
        id: '2',
        type: 'probation_end',
        date: '2020-07-15',
        title: 'Probation Completed',
        description: 'Successfully completed 6-month probation period',
      },
      {
        id: '3',
        type: 'salary_increase',
        date: '2021-01-15',
        title: 'Annual Salary Review',
        description: 'Salary increased based on performance',
        details: { from: '$150,000', to: '$165,000', amount: 10 },
      },
      {
        id: '4',
        type: 'performance_review',
        date: '2021-06-30',
        title: 'Mid-Year Performance Review',
        description: 'Exceeded expectations in team leadership and project delivery',
        details: { rating: 'Exceeds Expectations' },
      },
      {
        id: '5',
        type: 'promotion',
        date: '2022-03-01',
        title: 'Promoted to Engineering Manager',
        description: 'Promoted for exceptional leadership and technical contributions',
        details: { from: 'Senior Engineering Manager', to: 'Engineering Manager' },
      },
      {
        id: '6',
        type: 'salary_increase',
        date: '2022-03-01',
        title: 'Promotion Salary Adjustment',
        description: 'Salary adjusted with promotion',
        details: { from: '$165,000', to: '$175,000', amount: 6 },
      },
      {
        id: '7',
        type: 'performance_review',
        date: '2022-12-31',
        title: 'Annual Performance Review',
        description: 'Outstanding performance in scaling engineering team',
        details: { rating: 'Outstanding' },
      },
      {
        id: '8',
        type: 'promotion',
        date: '2023-01-01',
        title: 'Promoted to VP Engineering',
        description: 'Elevated to executive leadership role',
        details: { from: 'Engineering Manager', to: 'VP Engineering' },
      },
      {
        id: '9',
        type: 'salary_increase',
        date: '2023-01-01',
        title: 'Executive Compensation Package',
        description: 'New compensation reflecting VP role',
        details: { from: '$175,000', to: '$180,000', amount: 3 },
      },
      {
        id: '10',
        type: 'performance_review',
        date: '2023-06-30',
        title: 'Mid-Year Executive Review',
        description: 'Successfully leading engineering org transformation',
        details: { rating: 'Exceeds Expectations' },
      },
    ],
  },
  {
    employeeId: '2',
    employeeCode: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    phone: '+1-555-0102',
    photoUrl: '/images/profiles/female-1.jpg',
    positionId: '2',
    positionTitle: 'Backend Lead',
    jobTitle: 'Senior Software Engineer',
    departmentName: 'Backend Team',
    reportsToEmployeeName: 'John Doe',
    status: 'active',
    dateOfJoining: '2021-06-10',
    dateOfBirth: '1990-08-15',
    gender: 'Female',
    maritalStatus: 'Single',
    nationality: 'Canadian',
    address: '456 Oak Ave, San Francisco, CA 94103',
    emergencyContact: 'Robert Smith (Father)',
    emergencyPhone: '+1-555-0298',
    employmentType: 'Full-time',
    workLocation: 'San Francisco HQ',
    salary: 145000,
    currency: '$',
    lastPromotionDate: '2023-06-10',
    yearsOfExperience: 8,
    organizationalHistory: [
      {
        id: '1',
        type: 'joining',
        date: '2021-06-10',
        title: 'Joined Company',
        description: 'Started as Software Engineer in Backend Team',
        details: { to: 'Software Engineer' },
      },
      {
        id: '2',
        type: 'probation_end',
        date: '2021-12-10',
        title: 'Probation Completed',
        description: 'Successfully completed 6-month probation period',
      },
      {
        id: '3',
        type: 'performance_review',
        date: '2022-01-15',
        title: 'Annual Performance Review',
        description: 'Excellent performance in backend development and API design',
        details: { rating: 'Exceeds Expectations' },
      },
      {
        id: '4',
        type: 'salary_increase',
        date: '2022-06-10',
        title: 'Annual Salary Review',
        description: 'Salary increased based on strong performance',
        details: { from: '$120,000', to: '$132,000', amount: 10 },
      },
      {
        id: '5',
        type: 'promotion',
        date: '2022-09-01',
        title: 'Promoted to Senior Software Engineer',
        description: 'Promoted for technical excellence and mentorship',
        details: { from: 'Software Engineer', to: 'Senior Software Engineer' },
      },
      {
        id: '6',
        type: 'salary_increase',
        date: '2022-09-01',
        title: 'Promotion Salary Adjustment',
        description: 'Salary adjusted with promotion',
        details: { from: '$132,000', to: '$140,000', amount: 6 },
      },
      {
        id: '7',
        type: 'performance_review',
        date: '2023-01-15',
        title: 'Annual Performance Review',
        description: 'Outstanding contributions to microservices architecture',
        details: { rating: 'Outstanding' },
      },
      {
        id: '8',
        type: 'promotion',
        date: '2023-06-10',
        title: 'Promoted to Backend Lead',
        description: 'Elevated to team lead role for exceptional leadership',
        details: { from: 'Senior Software Engineer', to: 'Backend Lead' },
      },
      {
        id: '9',
        type: 'salary_increase',
        date: '2023-06-10',
        title: 'Leadership Role Compensation',
        description: 'Compensation adjusted for leadership responsibilities',
        details: { from: '$140,000', to: '$145,000', amount: 4 },
      },
    ],
  },
  {
    employeeId: '3',
    employeeCode: 'EMP003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@company.com',
    phone: '+1-555-0103',
    photoUrl: '/images/profiles/male-2.jpg',
    positionId: '4',
    positionTitle: 'Backend Engineer II',
    jobTitle: 'Software Engineer',
    departmentName: 'Backend Team',
    reportsToEmployeeName: 'Jane Smith',
    status: 'active',
    dateOfJoining: '2023-03-20',
    dateOfBirth: '1995-12-10',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: 'American',
    address: '789 Pine St, San Francisco, CA 94104',
    emergencyContact: 'Lisa Johnson (Mother)',
    emergencyPhone: '+1-555-0397',
    employmentType: 'Full-time',
    workLocation: 'San Francisco HQ',
    salary: 110000,
    currency: '$',
    probationEndDate: '2023-09-20',
    yearsOfExperience: 4,
    organizationalHistory: [
      {
        id: '1',
        type: 'joining',
        date: '2023-03-20',
        title: 'Joined Company',
        description: 'Started as Junior Software Engineer in Backend Team',
        details: { to: 'Junior Software Engineer' },
      },
      {
        id: '2',
        type: 'performance_review',
        date: '2023-06-30',
        title: 'Probation Review',
        description: 'Strong performance in first 3 months, meeting all expectations',
        details: { rating: 'Meets Expectations' },
      },
      {
        id: '3',
        type: 'probation_end',
        date: '2023-09-20',
        title: 'Probation Completed',
        description: 'Successfully completed 6-month probation period',
      },
      {
        id: '4',
        type: 'promotion',
        date: '2024-01-15',
        title: 'Promoted to Backend Engineer II',
        description: 'Promoted for excellent coding skills and quick learning',
        details: { from: 'Junior Software Engineer', to: 'Backend Engineer II' },
      },
      {
        id: '5',
        type: 'salary_increase',
        date: '2024-01-15',
        title: 'Promotion Salary Adjustment',
        description: 'Salary adjusted with promotion',
        details: { from: '$100,000', to: '$110,000', amount: 10 },
      },
      {
        id: '6',
        type: 'performance_review',
        date: '2024-06-30',
        title: 'Mid-Year Performance Review',
        description: 'Exceeding expectations in backend development and collaboration',
        details: { rating: 'Exceeds Expectations' },
      },
    ],
  },
  {
    employeeId: '4',
    employeeCode: 'EMP004',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.williams@company.com',
    phone: '+1-555-0104',
    photoUrl: '/images/profiles/female-2.jpg',
    positionId: '6',
    positionTitle: 'HR Manager',
    jobTitle: 'HR Manager',
    departmentName: 'Human Resources',
    status: 'active',
    dateOfJoining: '2022-09-01',
    dateOfBirth: '1988-03-25',
    gender: 'Female',
    maritalStatus: 'Married',
    nationality: 'British',
    address: '321 Elm St, San Francisco, CA 94105',
    emergencyContact: 'David Williams (Husband)',
    emergencyPhone: '+1-555-0496',
    employmentType: 'Full-time',
    workLocation: 'San Francisco HQ',
    salary: 125000,
    currency: '$',
    yearsOfExperience: 10,
    organizationalHistory: [
      {
        id: '1',
        type: 'joining',
        date: '2022-09-01',
        title: 'Joined Company',
        description: 'Started as HR Specialist in Human Resources Department',
        details: { to: 'HR Specialist' },
      },
      {
        id: '2',
        type: 'probation_end',
        date: '2023-03-01',
        title: 'Probation Completed',
        description: 'Successfully completed 6-month probation period',
      },
      {
        id: '3',
        type: 'performance_review',
        date: '2023-03-15',
        title: 'Probation Review',
        description: 'Excellent performance in HR operations and employee relations',
        details: { rating: 'Exceeds Expectations' },
      },
      {
        id: '4',
        type: 'promotion',
        date: '2023-06-01',
        title: 'Promoted to Senior HR Specialist',
        description: 'Promoted for outstanding work in talent acquisition',
        details: { from: 'HR Specialist', to: 'Senior HR Specialist' },
      },
      {
        id: '5',
        type: 'salary_increase',
        date: '2023-06-01',
        title: 'Promotion Salary Adjustment',
        description: 'Salary adjusted with promotion',
        details: { from: '$100,000', to: '$110,000', amount: 10 },
      },
      {
        id: '6',
        type: 'performance_review',
        date: '2023-09-15',
        title: 'Annual Performance Review',
        description: 'Outstanding contributions to employee engagement initiatives',
        details: { rating: 'Outstanding' },
      },
      {
        id: '7',
        type: 'salary_increase',
        date: '2023-09-15',
        title: 'Performance Bonus & Raise',
        description: 'Merit-based salary increase for exceptional work',
        details: { from: '$110,000', to: '$118,000', amount: 7 },
      },
      {
        id: '8',
        type: 'promotion',
        date: '2024-03-01',
        title: 'Promoted to HR Manager',
        description: 'Elevated to management role to lead HR operations',
        details: { from: 'Senior HR Specialist', to: 'HR Manager' },
      },
      {
        id: '9',
        type: 'salary_increase',
        date: '2024-03-01',
        title: 'Management Role Compensation',
        description: 'Compensation package for management responsibilities',
        details: { from: '$118,000', to: '$125,000', amount: 6 },
      },
      {
        id: '10',
        type: 'performance_review',
        date: '2024-09-15',
        title: 'Annual Performance Review',
        description: 'Successfully leading HR team and implementing new policies',
        details: { rating: 'Exceeds Expectations' },
      },
    ],
  },
];

// Color palette
const colors = {
  primary: '#3B82F6', // Bright blue
  secondary: '#FCD34D', // Bright yellow
  accent: '#A78BFA', // Light purple
  success: '#10B981',
  gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  lightBg: '#F0F9FF',
  cardBg: '#FFFFFF',
};

// Styled action button with icon
const ActionButton = styled(Button)(({ theme }) => ({
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: colors.cardBg,
  border: `2px solid ${alpha(colors.primary, 0.2)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minHeight: '80px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: colors.gradient,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    borderColor: colors.primary,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 16px ${alpha(colors.primary, 0.2)}`,
    '&::before': {
      opacity: 0.1,
    },
  },
  '& .MuiSvgIcon-root': {
    fontSize: '28px',
    color: colors.primary,
    zIndex: 1,
  },
  '& .action-label': {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.primary,
    textTransform: 'none',
    zIndex: 1,
  },
}));

// Styled summary card with compact design
const SummaryCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  border: `2px solid ${alpha(colors.primary, 0.15)}`,
  background: colors.cardBg,
  transition: 'all 0.3s ease',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    background: colors.gradient,
  },
  '&:hover': {
    borderColor: colors.primary,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px ${alpha(colors.primary, 0.15)}`,
  },
}));

// Custom styled tabs
const StyledTabs = styled(Tabs)({
  minHeight: '48px',
  '& .MuiTabs-indicator': {
    height: '3px',
    borderRadius: '3px 3px 0 0',
    background: colors.gradient,
  },
  '& .MuiTab-root': {
    minHeight: '48px',
    fontWeight: 600,
    fontSize: '14px',
    textTransform: 'none',
    color: '#64748B',
    '&.Mui-selected': {
      color: colors.primary,
    },
  },
});

// Tab Panel component
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
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 1.5 }}>{children}</Box>}
    </div>
  );
}

const EmployeeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = useState(0);

  // Get employee from location state or mock data
  const employee = location.state?.employee || mockEmployees.find(emp => emp.employeeId === id);

  // If no employee found, redirect to employees list
  if (!employee) {
    navigate('/employees');
    return null;
  }

  const handleBack = () => {
    navigate('/employees');
  };

  const handleEdit = () => {
    navigate('/edit-profile', { state: { employee } });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'promotion':
        navigate('/promote', { state: { employee } });
        break;
      case 'transfer':
        navigate('/transfer', { state: { employee } });
        break;
      case 'compensation':
        navigate('/compensation', { state: { employee } });
        break;
      case 'performance':
        navigate('/performance-review', { state: { employee } });
        break;
      case 'attendance':
        navigate('/employee-attendance', { state: { employee } });
        break;
      default:
        console.log(`Unknown action: ${action}`);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'on-leave': return 'warning';
      case 'exited': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '9px' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '12px', color: '#1E293B' }}>
        {value || 'Not provided'}
      </Typography>
    </Box>
  );

  return (
    <AppLayout>
      {/* Banner matching the design image */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 0,
          overflow: 'hidden',
          border: 'none',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* Full width banner with image */}
        <Box
          sx={{
            height: '190px',
            position: 'relative',
            overflow: 'hidden',
            background: '#f8f9fa',
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src="/images/banners/team-collaboration.jpg"
            alt="Team collaboration"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />

          {/* Subtle dark overlay for text contrast */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
              zIndex: 0,
            }}
          />

          {/* Content overlay - Back button and title */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 3,
              zIndex: 1,
            }}
          >
            {/* Back button at top */}
            <Box>
              <Button
                startIcon={<BackIcon />}
                onClick={handleBack}
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '15px',
                  textTransform: 'none',
                  px: 2.5,
                  py: 1,
                  borderRadius: '8px',
                  bgcolor: alpha(colors.primary, 0.8),
                  '&:hover': {
                    bgcolor: colors.primary,
                  },
                }}
              >
                Back
              </Button>
            </Box>

            {/* Employee info at bottom */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5 }}>
              <Avatar
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: colors.primary,
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  border: '4px solid white',
                  boxShadow: `0 4px 16px ${alpha('#000', 0.2)}`,
                }}
              >
                {!employee.photoUrl && getInitials(employee.firstName, employee.lastName)}
              </Avatar>
              <Box sx={{ pb: 0.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {employee.firstName} {employee.lastName}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {employee.positionTitle} • {employee.departmentName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip
                    label={employee.employeeCode}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.95)',
                      color: colors.primary,
                      fontWeight: 600,
                      fontSize: '11px',
                      height: '24px',
                    }}
                  />
                  <Chip
                    label={employee.status.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: '#10B981',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '11px',
                      height: '24px',
                    }}
                  />
                  <Chip
                    label={`Joined ${new Date(employee.dateOfJoining).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '11px',
                      height: '24px',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Compact Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <SummaryCard elevation={0}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                Tenure
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, color: colors.primary, fontSize: '1.1rem' }}>
                {(() => {
                  const joinDate = new Date(employee.dateOfJoining);
                  const now = new Date();
                  const years = now.getFullYear() - joinDate.getFullYear();
                  const months = now.getMonth() - joinDate.getMonth();
                  const totalMonths = years * 12 + months;
                  if (totalMonths < 12) return `${totalMonths}m`;
                  return `${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`;
                })()}
              </Typography>
            </CardContent>
          </SummaryCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard elevation={0}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                Experience
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, color: colors.primary, fontSize: '1.1rem' }}>
                {employee.yearsOfExperience || 'N/A'}y
              </Typography>
            </CardContent>
          </SummaryCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard elevation={0}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                Type
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, color: colors.primary, fontSize: '0.95rem' }}>
                {employee.employmentType || 'Full-time'}
              </Typography>
            </CardContent>
          </SummaryCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard elevation={0}>
            <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
              <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.5px' }}>
                Location
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.25, fontWeight: 700, color: colors.primary, fontSize: '0.9rem', lineHeight: 1.2 }}>
                {employee.workLocation || 'Remote'}
              </Typography>
            </CardContent>
          </SummaryCard>
        </Grid>
      </Grid>

      {/* Compact Information Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: `2px solid ${alpha(colors.primary, 0.15)}`,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<PersonIcon sx={{ fontSize: '18px', mr: 0.5 }} />}
              iconPosition="start"
              label="Personal Info"
            />
            <Tab
              icon={<WorkIcon sx={{ fontSize: '18px', mr: 0.5 }} />}
              iconPosition="start"
              label="Professional Info"
            />
            <Tab
              icon={<HistoryIcon sx={{ fontSize: '18px', mr: 0.5 }} />}
              iconPosition="start"
              label="Organizational History"
            />
          </StyledTabs>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Edit Profile" arrow>
              <IconButton
                size="small"
                onClick={handleEdit}
                sx={{
                  color: colors.primary,
                  '&:hover': { bgcolor: alpha(colors.primary, 0.1) },
                }}
              >
                <EditIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Promote" arrow>
              <IconButton
                size="small"
                onClick={() => handleAction('promotion')}
                sx={{
                  color: colors.primary,
                  '&:hover': { bgcolor: alpha(colors.primary, 0.1) },
                }}
              >
                <PromotionIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Transfer" arrow>
              <IconButton
                size="small"
                onClick={() => handleAction('transfer')}
                sx={{
                  color: colors.accent,
                  '&:hover': { bgcolor: alpha(colors.accent, 0.1) },
                }}
              >
                <TransferIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Compensation" arrow>
              <IconButton
                size="small"
                onClick={() => handleAction('compensation')}
                sx={{
                  color: colors.success,
                  '&:hover': { bgcolor: alpha(colors.success, 0.1) },
                }}
              >
                <CompensationIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Performance" arrow>
              <IconButton
                size="small"
                onClick={() => handleAction('performance')}
                sx={{
                  color: '#F59E0B',
                  '&:hover': { bgcolor: alpha('#F59E0B', 0.1) },
                }}
              >
                <PerformanceIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Attendance" arrow>
              <IconButton
                size="small"
                onClick={() => handleAction('attendance')}
                sx={{
                  color: colors.primary,
                  '&:hover': { bgcolor: alpha(colors.primary, 0.1) },
                }}
              >
                <TimeIcon sx={{ fontSize: '20px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Personal Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <Grid container spacing={2}>
              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📧 Contact Details
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6} md={4}>
                    <InfoItem label="Email Address" value={employee.email} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <InfoItem label="Phone Number" value={employee.phone} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <InfoItem label="Address" value={employee.address} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
              </Grid>

              {/* Personal Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👤 Personal Details
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Date of Birth" value={employee.dateOfBirth} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Gender" value={employee.gender} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Marital Status" value={employee.maritalStatus} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Nationality" value={employee.nationality} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🆘 Emergency Contact
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Contact Name" value={employee.emergencyContact} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Contact Phone" value={employee.emergencyPhone} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Professional Info Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <Grid container spacing={2}>
              {/* Position & Hierarchy */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🏢 Position & Hierarchy
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Position" value={employee.positionTitle} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Job Title" value={employee.jobTitle} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Department" value={employee.departmentName} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Reports To" value={employee.reportsToEmployeeName || 'No manager'} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
              </Grid>

              {/* Employment Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📋 Employment Details
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Type" value={employee.employmentType || 'Full-time'} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Location" value={employee.workLocation} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Joining Date" value={employee.dateOfJoining} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Experience" value={employee.yearsOfExperience ? `${employee.yearsOfExperience} years` : undefined} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>
                        Status
                      </Typography>
                      <Chip
                        label={employee.status.toUpperCase()}
                        color={getStatusColor(employee.status)}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '11px', height: '22px' }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <InfoItem label="Probation End" value={employee.probationEndDate || 'Confirmed'} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
              </Grid>

              {/* Compensation */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: colors.primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  💰 Compensation
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>
                        Annual Salary
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: colors.success, fontSize: '1.1rem' }}>
                        {employee.salary
                          ? `${employee.currency || '$'}${employee.salary.toLocaleString()}`
                          : 'Confidential'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Last Promotion" value={employee.lastPromotionDate || 'No history'} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Organizational History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ pb: 1.5 }}>
            {employee.organizationalHistory && employee.organizationalHistory.length > 0 ? (
              <Box
                sx={{
                  position: 'relative',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  pb: 2,
                  px: 2.5,
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: alpha(colors.primary, 0.05),
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: alpha(colors.primary, 0.3),
                    borderRadius: '10px',
                    '&:hover': {
                      background: alpha(colors.primary, 0.5),
                    },
                  },
                }}
              >
                {/* Horizontal Timeline Container */}
                <Box sx={{ display: 'flex', gap: 3, pt: 2, minWidth: 'max-content' }}>
                  {/* Timeline horizontal line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '40px',
                      right: '40px',
                      top: '90px',
                      height: '4px',
                      background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.accent} 100%)`,
                      borderRadius: '4px',
                      boxShadow: `0 2px 8px ${alpha(colors.primary, 0.2)}`,
                    }}
                  />

                  {/* Timeline events */}
                  {employee.organizationalHistory
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event: any, index: number) => {
                    const getEventIcon = (type: string) => {
                      switch (type) {
                        case 'joining':
                          return <CelebrationIcon sx={{ fontSize: '20px' }} />;
                        case 'promotion':
                          return <TrendingUpIcon sx={{ fontSize: '20px' }} />;
                        case 'transfer':
                          return <TransferIcon sx={{ fontSize: '20px' }} />;
                        case 'salary_increase':
                          return <CompensationIcon sx={{ fontSize: '20px' }} />;
                        case 'performance_review':
                          return <StarIcon sx={{ fontSize: '20px' }} />;
                        case 'probation_end':
                          return <CheckCircleIcon sx={{ fontSize: '20px' }} />;
                        default:
                          return <HistoryIcon sx={{ fontSize: '20px' }} />;
                      }
                    };

                    const getEventColor = (type: string) => {
                      switch (type) {
                        case 'joining':
                          return '#10B981'; // Green
                        case 'promotion':
                          return colors.primary; // Blue
                        case 'transfer':
                          return colors.accent; // Purple
                        case 'salary_increase':
                          return colors.success; // Green
                        case 'performance_review':
                          return '#F59E0B'; // Yellow/Orange
                        case 'probation_end':
                          return '#10B981'; // Green
                        default:
                          return colors.primary;
                      }
                    };

                    return (
                      <Box
                        key={event.id}
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: '320px',
                          maxWidth: '320px',
                        }}
                      >
                        {/* Hero Date Display at Top - Single Line */}
                        <Box
                          sx={{
                            mb: 2,
                            textAlign: 'center',
                            px: 2.5,
                            py: 1.2,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${getEventColor(event.type)} 0%, ${alpha(getEventColor(event.type), 0.7)} 100%)`,
                            boxShadow: `0 4px 12px ${alpha(getEventColor(event.type), 0.3)}`,
                            border: `2px solid ${alpha(getEventColor(event.type), 0.4)}`,
                            minWidth: '200px',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              lineHeight: 1,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>

                        {/* Timeline dot/icon on horizontal line */}
                        <Box
                          sx={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            bgcolor: 'white',
                            border: `4px solid ${getEventColor(event.type)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 16px ${alpha(getEventColor(event.type), 0.4)}`,
                            color: getEventColor(event.type),
                            zIndex: 2,
                            mb: 2,
                            background: `radial-gradient(circle, white 0%, ${alpha(getEventColor(event.type), 0.05)} 100%)`,
                          }}
                        >
                          {getEventIcon(event.type)}
                        </Box>

                        {/* Event card below the line */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '16px',
                            border: `3px solid ${alpha(getEventColor(event.type), 0.25)}`,
                            bgcolor: 'white',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: '100%',
                            height: '220px',
                            minHeight: '220px',
                            maxHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: `linear-gradient(to bottom, white 0%, ${alpha(getEventColor(event.type), 0.02)} 100%)`,
                            '&:hover': {
                              borderColor: getEventColor(event.type),
                              boxShadow: `0 8px 24px ${alpha(getEventColor(event.type), 0.25)}`,
                              transform: 'translateY(-4px)',
                            },
                          }}
                        >
                          {/* Event Title with Icon Badge */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Box
                              sx={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                bgcolor: alpha(getEventColor(event.type), 0.15),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: getEventColor(event.type),
                              }}
                            >
                              {getEventIcon(event.type)}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: getEventColor(event.type), fontSize: '1rem', flex: 1 }}>
                              {event.title}
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px', mb: 2, lineHeight: 1.6 }}>
                            {event.description}
                          </Typography>

                          {/* Event details */}
                          {event.details && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {event.details.from && event.details.to && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    px: 2,
                                    py: 1,
                                    borderRadius: '8px',
                                    bgcolor: alpha(getEventColor(event.type), 0.1),
                                    border: `1px solid ${alpha(getEventColor(event.type), 0.2)}`,
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px', color: '#64748B' }}>
                                    {event.details.from}
                                  </Typography>
                                  <Box
                                    sx={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      bgcolor: getEventColor(event.type),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: '12px' }}>
                                      →
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '12px', color: getEventColor(event.type) }}>
                                    {event.details.to}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                {event.details.amount && (
                                  <Chip
                                    label={`+${event.details.amount}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(colors.success, 0.15),
                                      color: colors.success,
                                      fontWeight: 700,
                                      fontSize: '11px',
                                      height: '26px',
                                      border: `1px solid ${alpha(colors.success, 0.3)}`,
                                    }}
                                  />
                                )}
                                {event.details.rating && (
                                  <Chip
                                    icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                                    label={event.details.rating}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha('#F59E0B', 0.15),
                                      color: '#F59E0B',
                                      fontWeight: 600,
                                      fontSize: '11px',
                                      height: '26px',
                                      border: `1px solid ${alpha('#F59E0B', 0.3)}`,
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <HistoryIcon sx={{ fontSize: '64px', color: '#CBD5E1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
                  No History Available
                </Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                  Organizational history will appear here as events occur
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </AppLayout>
  );
};

export default EmployeeDetail;
