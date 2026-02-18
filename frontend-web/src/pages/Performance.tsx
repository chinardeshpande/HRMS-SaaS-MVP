import { useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Rating,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as GoalIcon,
  Star as ReviewIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import { AppLayout } from '../components/layout/AppLayout';

interface Goal {
  goalId: string;
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  title: string;
  description: string;
  category: 'Individual' | 'Team' | 'Organizational';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate: string;
  dueDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  progress: number;
}

interface Review {
  reviewId: string;
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewPeriod: string;
  reviewDate: string;
  overallRating: number;
  technicalSkills: number;
  communication: number;
  teamwork: number;
  leadership: number;
  comments: string;
  status: 'Draft' | 'Submitted' | 'Completed';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Performance = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Goals State
  const [goals, setGoals] = useState<Goal[]>([
    {
      goalId: '1',
      employeeId: '1',
      employeeName: 'John Doe',
      positionTitle: 'VP Engineering',
      title: 'Improve team productivity by 20%',
      description: 'Implement new agile processes and tools',
      category: 'Team',
      priority: 'High',
      startDate: '2024-01-01',
      dueDate: '2024-06-30',
      status: 'In Progress',
      progress: 60,
    },
    {
      goalId: '2',
      employeeId: '2',
      employeeName: 'Jane Smith',
      positionTitle: 'Backend Lead',
      title: 'Complete microservices migration',
      description: 'Migrate monolith to microservices architecture',
      category: 'Individual',
      priority: 'Critical',
      startDate: '2024-01-15',
      dueDate: '2024-12-31',
      status: 'In Progress',
      progress: 45,
    },
    {
      goalId: '3',
      employeeId: '3',
      employeeName: 'Mike Johnson',
      positionTitle: 'Backend Engineer II',
      title: 'Learn Kubernetes',
      description: 'Complete Kubernetes certification',
      category: 'Individual',
      priority: 'Medium',
      startDate: '2024-02-01',
      dueDate: '2024-05-31',
      status: 'In Progress',
      progress: 75,
    },
  ]);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([
    {
      reviewId: '1',
      employeeId: '1',
      employeeName: 'John Doe',
      positionTitle: 'VP Engineering',
      reviewerId: '100',
      reviewerName: 'CEO',
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-10',
      overallRating: 4.5,
      technicalSkills: 5,
      communication: 4,
      teamwork: 5,
      leadership: 4,
      comments: 'Excellent leadership and technical vision',
      status: 'Completed',
    },
    {
      reviewId: '2',
      employeeId: '2',
      employeeName: 'Jane Smith',
      positionTitle: 'Backend Lead',
      reviewerId: '1',
      reviewerName: 'John Doe',
      reviewPeriod: 'Q4 2023',
      reviewDate: '2024-01-12',
      overallRating: 4,
      technicalSkills: 4.5,
      communication: 3.5,
      teamwork: 4,
      leadership: 4,
      comments: 'Strong technical skills, working on communication',
      status: 'Completed',
    },
  ]);

  const [openGoalDialog, setOpenGoalDialog] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Partial<Goal>>({});
  const [isEditGoal, setIsEditGoal] = useState(false);

  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState<Partial<Review>>({});
  const [isEditReview, setIsEditReview] = useState(false);

  const mockEmployees = [
    { employeeId: '1', name: 'John Doe', position: 'VP Engineering' },
    { employeeId: '2', name: 'Jane Smith', position: 'Backend Lead' },
    { employeeId: '3', name: 'Mike Johnson', position: 'Backend Engineer II' },
    { employeeId: '4', name: 'Sarah Williams', position: 'Frontend Lead' },
  ];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Goal Handlers
  const handleOpenGoalDialog = (goal?: Goal) => {
    if (goal) {
      setCurrentGoal(goal);
      setIsEditGoal(true);
    } else {
      setCurrentGoal({
        category: 'Individual',
        priority: 'Medium',
        status: 'Not Started',
        progress: 0,
      });
      setIsEditGoal(false);
    }
    setOpenGoalDialog(true);
  };

  const handleCloseGoalDialog = () => {
    setOpenGoalDialog(false);
    setCurrentGoal({});
    setIsEditGoal(false);
  };

  const handleSaveGoal = () => {
    const selectedEmployee = mockEmployees.find(e => e.employeeId === currentGoal.employeeId);

    if (isEditGoal) {
      setGoals(
        goals.map((g) =>
          g.goalId === currentGoal.goalId
            ? {
                ...g,
                ...currentGoal,
                employeeName: selectedEmployee?.name || g.employeeName,
                positionTitle: selectedEmployee?.position || g.positionTitle,
              } as Goal
            : g
        )
      );
    } else {
      const newGoal: Goal = {
        goalId: Date.now().toString(),
        employeeId: currentGoal.employeeId || '',
        employeeName: selectedEmployee?.name || '',
        positionTitle: selectedEmployee?.position || '',
        title: currentGoal.title || '',
        description: currentGoal.description || '',
        category: currentGoal.category || 'Individual',
        priority: currentGoal.priority || 'Medium',
        startDate: currentGoal.startDate || '',
        dueDate: currentGoal.dueDate || '',
        status: currentGoal.status || 'Not Started',
        progress: currentGoal.progress || 0,
      };
      setGoals([...goals, newGoal]);
    }
    handleCloseGoalDialog();
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(goals.filter((g) => g.goalId !== id));
    }
  };

  // Review Handlers
  const handleOpenReviewDialog = (review?: Review) => {
    if (review) {
      setCurrentReview(review);
      setIsEditReview(true);
    } else {
      setCurrentReview({
        status: 'Draft',
        overallRating: 3,
        technicalSkills: 3,
        communication: 3,
        teamwork: 3,
        leadership: 3,
      });
      setIsEditReview(false);
    }
    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setCurrentReview({});
    setIsEditReview(false);
  };

  const handleSaveReview = () => {
    const selectedEmployee = mockEmployees.find(e => e.employeeId === currentReview.employeeId);

    if (isEditReview) {
      setReviews(
        reviews.map((r) =>
          r.reviewId === currentReview.reviewId
            ? {
                ...r,
                ...currentReview,
                employeeName: selectedEmployee?.name || r.employeeName,
                positionTitle: selectedEmployee?.position || r.positionTitle,
              } as Review
            : r
        )
      );
    } else {
      const newReview: Review = {
        reviewId: Date.now().toString(),
        employeeId: currentReview.employeeId || '',
        employeeName: selectedEmployee?.name || '',
        positionTitle: selectedEmployee?.position || '',
        reviewerId: 'current-user',
        reviewerName: 'Current User',
        reviewPeriod: currentReview.reviewPeriod || '',
        reviewDate: new Date().toISOString().split('T')[0],
        overallRating: currentReview.overallRating || 3,
        technicalSkills: currentReview.technicalSkills || 3,
        communication: currentReview.communication || 3,
        teamwork: currentReview.teamwork || 3,
        leadership: currentReview.leadership || 3,
        comments: currentReview.comments || '',
        status: currentReview.status || 'Draft',
      };
      setReviews([...reviews, newReview]);
    }
    handleCloseReviewDialog();
  };

  const handleDeleteReview = (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter((r) => r.reviewId !== id));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Not Started': return 'default';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'In Progress').length;
  const avgProgress = goals.reduce((sum, g) => sum + g.progress, 0) / goals.length || 0;
  const avgRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length || 0;

  return (
    <AppLayout>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Performance Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Goals
                  </Typography>
                  <Typography variant="h4">{totalGoals}</Typography>
                </Box>
                <GoalIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Completed Goals
                  </Typography>
                  <Typography variant="h4">{completedGoals}</Typography>
                </Box>
                <CompletedIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Avg Progress
                  </Typography>
                  <Typography variant="h4">{avgProgress.toFixed(0)}%</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Avg Rating
                  </Typography>
                  <Typography variant="h4">{avgRating.toFixed(1)}</Typography>
                </Box>
                <ReviewIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Goals & Objectives" />
          <Tab label="Performance Reviews" />
        </Tabs>

        {/* Goals Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Goals & Objectives</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenGoalDialog()}
              >
                Set New Goal
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Goal</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Priority</strong></TableCell>
                    <TableCell><strong>Due Date</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {goals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No goals found. Click "Set New Goal" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    goals.map((goal) => (
                      <TableRow key={goal.goalId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {goal.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {goal.positionTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {goal.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {goal.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{goal.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={goal.priority}
                            color={getPriorityColor(goal.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{goal.dueDate}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={goal.progress}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">{goal.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={goal.status}
                            color={getStatusColor(goal.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenGoalDialog(goal)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteGoal(goal.goalId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Reviews Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Performance Reviews</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenReviewDialog()}
              >
                Create Review
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Employee</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell><strong>Reviewer</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Rating</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No reviews found. Click "Create Review" to add one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((review) => (
                      <TableRow key={review.reviewId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {review.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.positionTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>{review.reviewPeriod}</TableCell>
                        <TableCell>{review.reviewerName}</TableCell>
                        <TableCell>{review.reviewDate}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={review.overallRating} precision={0.5} readOnly size="small" />
                            <Typography variant="body2">({review.overallRating})</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={review.status}
                            color={review.status === 'Completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenReviewDialog(review)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteReview(review.reviewId)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Goal Dialog */}
      <Dialog open={openGoalDialog} onClose={handleCloseGoalDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditGoal ? 'Edit Goal' : 'Set New Goal'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Employee"
              select
              fullWidth
              required
              value={currentGoal.employeeId || ''}
              onChange={(e) => {
                const emp = mockEmployees.find(emp => emp.employeeId === e.target.value);
                setCurrentGoal({
                  ...currentGoal,
                  employeeId: e.target.value,
                  employeeName: emp?.name,
                  positionTitle: emp?.position,
                });
              }}
            >
              {mockEmployees.map((emp) => (
                <MenuItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} - {emp.position}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Goal Title"
              fullWidth
              required
              value={currentGoal.title || ''}
              onChange={(e) => setCurrentGoal({ ...currentGoal, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentGoal.description || ''}
              onChange={(e) => setCurrentGoal({ ...currentGoal, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Category"
                  select
                  fullWidth
                  required
                  value={currentGoal.category || 'Individual'}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, category: e.target.value as any })}
                >
                  <MenuItem value="Individual">Individual</MenuItem>
                  <MenuItem value="Team">Team</MenuItem>
                  <MenuItem value="Organizational">Organizational</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Priority"
                  select
                  fullWidth
                  required
                  value={currentGoal.priority || 'Medium'}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, priority: e.target.value as any })}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  required
                  value={currentGoal.startDate || ''}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  required
                  value={currentGoal.dueDate || ''}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  select
                  fullWidth
                  required
                  value={currentGoal.status || 'Not Started'}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, status: e.target.value as any })}
                >
                  <MenuItem value="Not Started">Not Started</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Progress (%)"
                  type="number"
                  fullWidth
                  required
                  value={currentGoal.progress || 0}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, progress: parseInt(e.target.value) })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGoalDialog}>Cancel</Button>
          <Button
            onClick={handleSaveGoal}
            variant="contained"
            disabled={!currentGoal.employeeId || !currentGoal.title}
          >
            {isEditGoal ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditReview ? 'Edit Review' : 'Create Performance Review'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Employee"
              select
              fullWidth
              required
              value={currentReview.employeeId || ''}
              onChange={(e) => {
                const emp = mockEmployees.find(emp => emp.employeeId === e.target.value);
                setCurrentReview({
                  ...currentReview,
                  employeeId: e.target.value,
                  employeeName: emp?.name,
                  positionTitle: emp?.position,
                });
              }}
            >
              {mockEmployees.map((emp) => (
                <MenuItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} - {emp.position}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Review Period"
              fullWidth
              required
              value={currentReview.reviewPeriod || ''}
              onChange={(e) => setCurrentReview({ ...currentReview, reviewPeriod: e.target.value })}
              placeholder="e.g., Q1 2024, H1 2024"
            />
            <Box>
              <Typography variant="body2" gutterBottom>
                Overall Rating
              </Typography>
              <Rating
                value={currentReview.overallRating || 3}
                precision={0.5}
                onChange={(_e, value) => setCurrentReview({ ...currentReview, overallRating: value || 3 })}
                size="large"
              />
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Detailed Ratings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Technical Skills
                  </Typography>
                  <Rating
                    value={currentReview.technicalSkills || 3}
                    precision={0.5}
                    onChange={(_e, value) => setCurrentReview({ ...currentReview, technicalSkills: value || 3 })}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Communication
                  </Typography>
                  <Rating
                    value={currentReview.communication || 3}
                    precision={0.5}
                    onChange={(_e, value) => setCurrentReview({ ...currentReview, communication: value || 3 })}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Teamwork
                  </Typography>
                  <Rating
                    value={currentReview.teamwork || 3}
                    precision={0.5}
                    onChange={(_e, value) => setCurrentReview({ ...currentReview, teamwork: value || 3 })}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Leadership
                  </Typography>
                  <Rating
                    value={currentReview.leadership || 3}
                    precision={0.5}
                    onChange={(_e, value) => setCurrentReview({ ...currentReview, leadership: value || 3 })}
                  />
                </Box>
              </Grid>
            </Grid>
            <TextField
              label="Comments"
              fullWidth
              multiline
              rows={4}
              value={currentReview.comments || ''}
              onChange={(e) => setCurrentReview({ ...currentReview, comments: e.target.value })}
            />
            <TextField
              label="Status"
              select
              fullWidth
              required
              value={currentReview.status || 'Draft'}
              onChange={(e) => setCurrentReview({ ...currentReview, status: e.target.value as any })}
            >
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Submitted">Submitted</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancel</Button>
          <Button
            onClick={handleSaveReview}
            variant="contained"
            disabled={!currentReview.employeeId || !currentReview.reviewPeriod}
          >
            {isEditReview ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default Performance;
