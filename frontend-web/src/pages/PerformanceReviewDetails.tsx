import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import PerformanceStatusChip from '../components/performance/PerformanceStatusChip';
import PerformanceProgressStepper from '../components/performance/PerformanceProgressStepper';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { GoalForm } from '../components/performance/GoalForm';
import { KPIForm } from '../components/performance/KPIForm';
import { ActionItemForm } from '../components/performance/ActionItemForm';
import { MidYearReviewForm } from '../components/performance/MidYearReviewForm';
import { AnnualReviewForm } from '../components/performance/AnnualReviewForm';
import { PerformanceRatingForm } from '../components/performance/PerformanceRatingForm';
import performanceService from '../services/performanceService';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface PerformanceReview {
  reviewId: string;
  employeeId: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: { name: string };
    designation: { name: string };
    manager: { firstName: string; lastName: string };
  };
  reviewCycle: string;
  reviewPeriod: string;
  currentState: string;
  goals: Goal[];
  midYearReview?: Review;
  annualReview?: Review;
  finalRating?: FinalRating;
  developmentPlan?: DevelopmentPlan;
}

interface Goal {
  goalId: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  weightage: number;
  status: string;
  progress: number;
  kpis: KPI[];
}

interface KPI {
  kpiId: string;
  metric: string;
  target: string;
  actual?: string;
  unit: string;
  status: string;
}

interface Review {
  reviewType: string;
  selfRating: number;
  managerRating?: number;
  selfComments: string;
  managerComments?: string;
  achievements: string[];
  challenges: string[];
  submittedDate?: string;
  completedDate?: string;
}

interface FinalRating {
  managerRating: number;
  normalizationRating?: number;
  finalRating: number;
  ratingCategory: string;
  promotionRecommended: boolean;
  incrementPercentage?: number;
  comments: string;
}

interface DevelopmentPlan {
  skillGaps: string[];
  trainingRecommendations: string[];
  careerAspirations: string;
  actionItems: ActionItem[];
}

interface ActionItem {
  itemId: string;
  action: string;
  timeline: string;
  status: string;
}

export default function PerformanceReviewDetails() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // CRUD state
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [selectedGoalForKPI, setSelectedGoalForKPI] = useState<string | null>(null);
  const [deleteKPIId, setDeleteKPIId] = useState<string | null>(null);

  const [actionItemModalOpen, setActionItemModalOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<ActionItem | null>(null);
  const [deleteActionItemId, setDeleteActionItemId] = useState<string | null>(null);

  // Mid-Year Review state
  const [midYearReviewModalOpen, setMidYearReviewModalOpen] = useState(false);
  const [editingMidYearReview, setEditingMidYearReview] = useState<Review | null>(null);

  // Annual Review state
  const [annualReviewModalOpen, setAnnualReviewModalOpen] = useState(false);
  const [editingAnnualReview, setEditingAnnualReview] = useState<Review | null>(null);

  // Performance Rating state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState<FinalRating | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchReviewDetails();
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockReview: PerformanceReview = {
        reviewId: '1',
        employeeId: 'emp1',
        employee: {
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          phone: '+1 234 567 8900',
          department: { name: 'Engineering' },
          designation: { name: 'Senior Software Engineer' },
          manager: { firstName: 'Sarah', lastName: 'Manager' },
        },
        reviewCycle: '2026',
        reviewPeriod: 'Jan 2026 - Dec 2026',
        currentState: 'mid_year_completed',
        goals: [
          {
            goalId: 'g1',
            title: 'Improve System Performance',
            description: 'Reduce API response time by 30%',
            category: 'technical',
            targetDate: '2026-12-31',
            weightage: 25,
            status: 'in_progress',
            progress: 65,
            kpis: [
              { kpiId: 'k1', metric: 'API Response Time', target: '200', actual: '250', unit: 'ms', status: 'on_track' },
              { kpiId: 'k2', metric: 'Error Rate', target: '0.5', actual: '0.8', unit: '%', status: 'at_risk' },
            ],
          },
          {
            goalId: 'g2',
            title: 'Team Leadership',
            description: 'Mentor 2 junior developers',
            category: 'leadership',
            targetDate: '2026-12-31',
            weightage: 20,
            status: 'in_progress',
            progress: 50,
            kpis: [
              { kpiId: 'k3', metric: 'Mentees', target: '2', actual: '2', unit: 'people', status: 'achieved' },
            ],
          },
          {
            goalId: 'g3',
            title: 'Revenue Growth',
            description: 'Increase product revenue by 15%',
            category: 'business',
            targetDate: '2026-12-31',
            weightage: 30,
            status: 'in_progress',
            progress: 40,
            kpis: [
              { kpiId: 'k4', metric: 'Revenue Growth', target: '15', actual: '8', unit: '%', status: 'on_track' },
            ],
          },
        ],
        midYearReview: {
          reviewType: 'mid_year',
          selfRating: 4,
          managerRating: 4.5,
          selfComments: 'Making good progress on technical goals. API performance has improved significantly.',
          managerComments: 'Excellent technical work and strong team collaboration. Keep up the good work.',
          achievements: [
            'Reduced API response time by 20%',
            'Successfully mentored 2 junior developers',
            'Led architecture redesign for payment module',
          ],
          challenges: [
            'Balancing feature delivery with performance optimization',
            'Managing increased team size',
          ],
          submittedDate: '2026-06-15',
          completedDate: '2026-06-20',
        },
        finalRating: {
          managerRating: 4.5,
          normalizationRating: 4.3,
          finalRating: 4.4,
          ratingCategory: 'exceeds_expectations',
          promotionRecommended: true,
          incrementPercentage: 12,
          comments: 'Outstanding performance throughout the year.',
        },
        developmentPlan: {
          skillGaps: ['Cloud Architecture', 'System Design at Scale'],
          trainingRecommendations: [
            'AWS Solutions Architect Certification',
            'System Design Workshop',
          ],
          careerAspirations: 'Technical Lead role within 2 years',
          actionItems: [
            { itemId: 'a1', action: 'Complete AWS Certification', timeline: 'Q1 2027', status: 'pending' },
            { itemId: 'a2', action: 'Lead 1 major project', timeline: 'Q2 2027', status: 'pending' },
          ],
        },
      };

      setReview(mockReview);
    } catch (error) {
      console.error('Failed to fetch review details:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Goal CRUD handlers
  const handleCreateGoal = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  const handleSubmitGoal = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingGoal) {
        await performanceService.updateGoal(editingGoal.goalId, data);
        showNotification('Goal updated successfully', 'success');
      } else {
        await performanceService.createGoal(reviewId!, data);
        showNotification('Goal created successfully', 'success');
      }
      setGoalModalOpen(false);
      setEditingGoal(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;
    try {
      setIsSubmitting(true);
      await performanceService.deleteGoal(deleteGoalId);
      showNotification('Goal deleted successfully', 'success');
      setDeleteGoalId(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI CRUD handlers
  const handleCreateKPI = (goalId: string) => {
    setSelectedGoalForKPI(goalId);
    setEditingKPI(null);
    setKpiModalOpen(true);
  };

  const handleEditKPI = (kpi: KPI) => {
    setEditingKPI(kpi);
    setKpiModalOpen(true);
  };

  const handleSubmitKPI = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingKPI) {
        await performanceService.updateKPI(editingKPI.kpiId, data);
        showNotification('KPI updated successfully', 'success');
      } else if (selectedGoalForKPI) {
        await performanceService.createKPI(selectedGoalForKPI, data);
        showNotification('KPI created successfully', 'success');
      }
      setKpiModalOpen(false);
      setEditingKPI(null);
      setSelectedGoalForKPI(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save KPI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKPI = async () => {
    if (!deleteKPIId) return;
    try {
      setIsSubmitting(true);
      await performanceService.deleteKPI(deleteKPIId);
      showNotification('KPI deleted successfully', 'success');
      setDeleteKPIId(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete KPI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action Item CRUD handlers
  const handleCreateActionItem = () => {
    setEditingActionItem(null);
    setActionItemModalOpen(true);
  };

  const handleEditActionItem = (item: ActionItem) => {
    setEditingActionItem(item);
    setActionItemModalOpen(true);
  };

  const handleSubmitActionItem = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingActionItem) {
        await performanceService.updateActionItem(editingActionItem.itemId, data);
        showNotification('Action item updated successfully', 'success');
      } else {
        await performanceService.createActionItem(reviewId!, data);
        showNotification('Action item created successfully', 'success');
      }
      setActionItemModalOpen(false);
      setEditingActionItem(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save action item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActionItem = async () => {
    if (!deleteActionItemId) return;
    try {
      setIsSubmitting(true);
      await performanceService.deleteActionItem(deleteActionItemId);
      showNotification('Action item deleted successfully', 'success');
      setDeleteActionItemId(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete action item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mid-Year Review CRUD handlers
  const handleCreateMidYearReview = () => {
    setEditingMidYearReview(null);
    setMidYearReviewModalOpen(true);
  };

  const handleEditMidYearReview = (reviewData: Review) => {
    setEditingMidYearReview(reviewData);
    setMidYearReviewModalOpen(true);
  };

  const handleSubmitMidYearReview = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingMidYearReview) {
        await performanceService.updateMidYearReview(reviewId!, data);
        showNotification('Mid-year review updated successfully', 'success');
      } else {
        await performanceService.submitMidYearReview(reviewId!, data);
        showNotification('Mid-year review submitted successfully', 'success');
      }
      setMidYearReviewModalOpen(false);
      setEditingMidYearReview(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save mid-year review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Annual Review CRUD handlers
  const handleCreateAnnualReview = () => {
    setEditingAnnualReview(null);
    setAnnualReviewModalOpen(true);
  };

  const handleEditAnnualReview = (reviewData: Review) => {
    setEditingAnnualReview(reviewData);
    setAnnualReviewModalOpen(true);
  };

  const handleSubmitAnnualReview = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingAnnualReview) {
        await performanceService.updateAnnualReview(reviewId!, data);
        showNotification('Annual review updated successfully', 'success');
      } else {
        await performanceService.submitAnnualReview(reviewId!, data);
        showNotification('Annual review submitted successfully', 'success');
      }
      setAnnualReviewModalOpen(false);
      setEditingAnnualReview(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save annual review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Performance Rating CRUD handlers
  const handleCreateRating = () => {
    setEditingRating(null);
    setRatingModalOpen(true);
  };

  const handleEditRating = (ratingData: FinalRating) => {
    setEditingRating(ratingData);
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingRating) {
        await performanceService.updatePerformanceRating(reviewId!, data);
        showNotification('Performance rating updated successfully', 'success');
      } else {
        await performanceService.assignPerformanceRating(reviewId!, data);
        showNotification('Performance rating assigned successfully', 'success');
      }
      setRatingModalOpen(false);
      setEditingRating(null);
      fetchReviewDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save performance rating', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ModernLayout title="Performance Review">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </ModernLayout>
    );
  }

  if (!review) {
    return (
      <ModernLayout title="Performance Review">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Review not found</div>
        </div>
      </ModernLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'goals', label: 'Goals & KPIs' },
    { id: 'midyear', label: 'Mid-Year Review' },
    { id: 'annual', label: 'Annual Review' },
    { id: 'rating', label: 'Performance Rating' },
    { id: 'development', label: 'Development Plan' },
  ];

  return (
    <ModernLayout title="Performance Review">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <button
            onClick={() => navigate('/performance')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Performance Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {review.employee.firstName[0]}
                {review.employee.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {review.employee.firstName} {review.employee.lastName}
                </h1>
                <p className="text-sm text-gray-600">{review.employee.employeeCode}</p>
              </div>
            </div>
            <PerformanceStatusChip status={review.currentState} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="flex items-center text-xs text-gray-600">
              <BriefcaseIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              {review.employee.designation.name}
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              {review.employee.department.name}
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              Manager: {review.employee.manager.firstName} {review.employee.manager.lastName}
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
              Cycle: {review.reviewCycle}
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <PerformanceProgressStepper currentState={review.currentState} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{review.employee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{review.employee.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium text-gray-900">{review.employee.department.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Designation:</span>
                      <span className="font-medium text-gray-900">{review.employee.designation.name}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Review Cycle Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Review Cycle:</span>
                      <span className="font-medium text-gray-900">{review.reviewCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Review Period:</span>
                      <span className="font-medium text-gray-900">{review.reviewPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <PerformanceStatusChip status={review.currentState} />
                    </div>
                    {review.finalRating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Final Rating:</span>
                        <span className="font-semibold text-gray-900 flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          {review.finalRating.finalRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Total Goals:</span>
                      <span className="ml-2 font-semibold text-gray-900">{review.goals.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average Progress:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {(review.goals.reduce((sum, g) => sum + g.progress, 0) / review.goals.length).toFixed(0)}%
                      </span>
                    </div>
                    {review.midYearReview && (
                      <div>
                        <span className="text-gray-600">Mid-Year Rating:</span>
                        <span className="ml-2 font-semibold text-gray-900 flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          {review.midYearReview.managerRating?.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Goals & KPIs Tab */}
            {activeTab === 'goals' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Performance Goals</h3>
                  <AddButton onClick={handleCreateGoal} label="Add Goal" size="sm" />
                </div>

                {review.goals.map((goal) => (
                  <div key={goal.goalId} className="border-2 border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{goal.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                          goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <EditButton onClick={() => handleEditGoal(goal)} />
                        <DeleteButton onClick={() => setDeleteGoalId(goal.goalId)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 text-xs">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-1 font-medium text-gray-900">{goal.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Weightage:</span>
                        <span className="ml-1 font-medium text-gray-900">{goal.weightage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <span className="ml-1 font-medium text-gray-900">{goal.progress}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target Date:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            goal.progress >= 80 ? 'bg-green-500' :
                            goal.progress >= 50 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-gray-700">Key Performance Indicators</h5>
                        <button
                          onClick={() => handleCreateKPI(goal.goalId)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Add KPI
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {goal.kpis.map((kpi) => (
                          <div key={kpi.kpiId} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{kpi.metric}:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">
                                {kpi.actual || '-'} / {kpi.target} {kpi.unit}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                kpi.status === 'achieved' ? 'bg-green-100 text-green-800' :
                                kpi.status === 'on_track' ? 'bg-blue-100 text-blue-800' :
                                kpi.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {kpi.status.replace('_', ' ')}
                              </span>
                              <EditButton onClick={() => handleEditKPI(kpi)} />
                              <DeleteButton onClick={() => setDeleteKPIId(kpi.kpiId)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mid-Year Review Tab */}
            {activeTab === 'midyear' && (
              <div className="space-y-3">
                {review.midYearReview ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Mid-Year Review</h3>
                      <EditButton onClick={() => handleEditMidYearReview(review.midYearReview!)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Self Assessment</h4>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Self Rating:</span>
                            <span className="font-semibold text-gray-900 flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {review.midYearReview.selfRating.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-600 mb-1">Comments:</p>
                          <p className="text-gray-900">{review.midYearReview.selfComments}</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Manager Assessment</h4>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Manager Rating:</span>
                            <span className="font-semibold text-gray-900 flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {review.midYearReview.managerRating?.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-600 mb-1">Comments:</p>
                          <p className="text-gray-900">{review.midYearReview.managerComments}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Achievements</h4>
                        <ul className="space-y-1 text-xs">
                          {review.midYearReview.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              <span className="text-gray-900">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Challenges Faced</h4>
                        <ul className="space-y-1 text-xs">
                          {review.midYearReview.challenges.map((challenge, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-600 mr-2">!</span>
                              <span className="text-gray-900">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">Submitted Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(review.midYearReview.submittedDate!).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Completed Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {new Date(review.midYearReview.completedDate!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">Mid-year review not yet submitted</p>
                    <AddButton onClick={handleCreateMidYearReview} label="Submit Mid-Year Review" size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Annual Review Tab */}
            {activeTab === 'annual' && (
              <div className="space-y-3">
                {review.annualReview ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Annual Review</h3>
                      <EditButton onClick={() => handleEditAnnualReview(review.annualReview!)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Self Assessment</h4>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Self Rating:</span>
                            <span className="font-semibold text-gray-900 flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {review.annualReview.selfRating.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-600 mb-1">Comments:</p>
                          <p className="text-gray-900">{review.annualReview.selfComments}</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Manager Assessment</h4>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Manager Rating:</span>
                            <span className="font-semibold text-gray-900 flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              {review.annualReview.managerRating?.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-xs">
                          <p className="text-gray-600 mb-1">Comments:</p>
                          <p className="text-gray-900">{review.annualReview.managerComments}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Achievements</h4>
                        <ul className="space-y-1 text-xs">
                          {review.annualReview.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              <span className="text-gray-900">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Challenges Faced</h4>
                        <ul className="space-y-1 text-xs">
                          {review.annualReview.challenges.map((challenge, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-600 mr-2">!</span>
                              <span className="text-gray-900">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {(review.annualReview.submittedDate || review.annualReview.completedDate) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {review.annualReview.submittedDate && (
                            <div>
                              <span className="text-gray-600">Submitted Date:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(review.annualReview.submittedDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {review.annualReview.completedDate && (
                            <div>
                              <span className="text-gray-600">Completed Date:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(review.annualReview.completedDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">Annual review not yet submitted</p>
                    <AddButton onClick={handleCreateAnnualReview} label="Submit Annual Review" size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Performance Rating Tab */}
            {activeTab === 'rating' && (
              <div className="space-y-3">
                {review.finalRating ? (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Performance Rating</h3>
                      <EditButton onClick={() => handleEditRating(review.finalRating!)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Manager Rating</p>
                        <p className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                          <StarIcon className="h-6 w-6 text-yellow-500 mr-1" />
                          {review.finalRating.managerRating.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Normalization Rating</p>
                        <p className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                          <StarIcon className="h-6 w-6 text-yellow-500 mr-1" />
                          {review.finalRating.normalizationRating?.toFixed(1) || '-'}
                        </p>
                      </div>
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">Final Rating</p>
                        <p className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                          <StarIcon className="h-6 w-6 text-yellow-500 mr-1" />
                          {review.finalRating.finalRating.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Rating Category</h4>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                          review.finalRating.ratingCategory === 'exceeds_expectations'
                            ? 'bg-green-100 text-green-800'
                            : review.finalRating.ratingCategory === 'meets_expectations'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {review.finalRating.ratingCategory.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Promotion:</span>
                            <span className={`font-semibold ${
                              review.finalRating.promotionRecommended ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {review.finalRating.promotionRecommended ? 'Recommended' : 'Not Recommended'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Increment:</span>
                            <span className="font-semibold text-gray-900">
                              {review.finalRating.incrementPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Manager Comments</h4>
                      <p className="text-xs text-gray-900">{review.finalRating.comments}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-4">Performance rating not yet assigned</p>
                    <AddButton onClick={handleCreateRating} label="Assign Performance Rating" size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Development Plan Tab */}
            {activeTab === 'development' && (
              <div className="space-y-3">
                {review.developmentPlan ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Skill Gaps</h4>
                        <ul className="space-y-1 text-xs">
                          {review.developmentPlan.skillGaps.map((gap, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-600 mr-2">•</span>
                              <span className="text-gray-900">{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Training Recommendations</h4>
                        <ul className="space-y-1 text-xs">
                          {review.developmentPlan.trainingRecommendations.map((training, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">✓</span>
                              <span className="text-gray-900">{training}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Career Aspirations</h4>
                      <p className="text-xs text-gray-900">{review.developmentPlan.careerAspirations}</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Action Items</h4>
                        <AddButton onClick={handleCreateActionItem} label="Add Action Item" size="sm" />
                      </div>
                      <div className="space-y-2">
                        {review.developmentPlan.actionItems.map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.action}</p>
                              <p className="text-gray-600 mt-0.5">Timeline: {item.timeline}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <EditButton onClick={() => handleEditActionItem(item)} />
                              <DeleteButton onClick={() => setDeleteActionItemId(item.itemId)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Development plan not yet created
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Goal Form Modal */}
      <FormModal
        isOpen={goalModalOpen}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Goal' : 'Add Goal'}
        onSubmit={() => {
          const form = document.querySelector('#goal-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="goal-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitGoal(Object.fromEntries(formData));
        }}>
          <GoalForm
            goal={editingGoal}
            onSubmit={handleSubmitGoal}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      {/* KPI Form Modal */}
      <FormModal
        isOpen={kpiModalOpen}
        onClose={() => {
          setKpiModalOpen(false);
          setEditingKPI(null);
          setSelectedGoalForKPI(null);
        }}
        title={editingKPI ? 'Edit KPI' : 'Add KPI'}
        onSubmit={() => {
          const form = document.querySelector('#kpi-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="kpi-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitKPI(Object.fromEntries(formData));
        }}>
          <KPIForm
            kpi={editingKPI}
            onSubmit={handleSubmitKPI}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      {/* Action Item Form Modal */}
      <FormModal
        isOpen={actionItemModalOpen}
        onClose={() => {
          setActionItemModalOpen(false);
          setEditingActionItem(null);
        }}
        title={editingActionItem ? 'Edit Action Item' : 'Add Action Item'}
        onSubmit={() => {
          const form = document.querySelector('#action-item-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="action-item-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitActionItem(Object.fromEntries(formData));
        }}>
          <ActionItemForm
            actionItem={editingActionItem}
            onSubmit={handleSubmitActionItem}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      {/* Delete Confirmation Modals */}
      <DeleteConfirmModal
        isOpen={deleteGoalId !== null}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This will also delete all associated KPIs."
        itemName="Goal"
        isDeleting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={deleteKPIId !== null}
        onClose={() => setDeleteKPIId(null)}
        onConfirm={handleDeleteKPI}
        title="Delete KPI"
        message="Are you sure you want to delete this KPI?"
        itemName="KPI"
        isDeleting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={deleteActionItemId !== null}
        onClose={() => setDeleteActionItemId(null)}
        onConfirm={handleDeleteActionItem}
        title="Delete Action Item"
        message="Are you sure you want to delete this action item?"
        itemName="Action Item"
        isDeleting={isSubmitting}
      />

      {/* Mid-Year Review Form Modal */}
      <FormModal
        isOpen={midYearReviewModalOpen}
        onClose={() => {
          setMidYearReviewModalOpen(false);
          setEditingMidYearReview(null);
        }}
        title={editingMidYearReview ? 'Edit Mid-Year Review' : 'Submit Mid-Year Review'}
        onSubmit={() => {
          const form = document.querySelector('#midyear-review-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="midyear-review-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitMidYearReview(Object.fromEntries(formData));
        }}>
          <MidYearReviewForm
            review={editingMidYearReview || undefined}
            onSubmit={handleSubmitMidYearReview}
            isSubmitting={isSubmitting}
            isManagerView={false}
          />
        </form>
      </FormModal>

      {/* Annual Review Form Modal */}
      <FormModal
        isOpen={annualReviewModalOpen}
        onClose={() => {
          setAnnualReviewModalOpen(false);
          setEditingAnnualReview(null);
        }}
        title={editingAnnualReview ? 'Edit Annual Review' : 'Submit Annual Review'}
        onSubmit={() => {
          const form = document.querySelector('#annual-review-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="annual-review-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitAnnualReview(Object.fromEntries(formData));
        }}>
          <AnnualReviewForm
            review={editingAnnualReview || undefined}
            onSubmit={handleSubmitAnnualReview}
            isSubmitting={isSubmitting}
            isManagerView={false}
          />
        </form>
      </FormModal>

      {/* Performance Rating Form Modal */}
      <FormModal
        isOpen={ratingModalOpen}
        onClose={() => {
          setRatingModalOpen(false);
          setEditingRating(null);
        }}
        title={editingRating ? 'Edit Performance Rating' : 'Assign Performance Rating'}
        onSubmit={() => {
          const form = document.querySelector('#rating-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="rating-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitRating(Object.fromEntries(formData));
        }}>
          <PerformanceRatingForm
            rating={editingRating || undefined}
            onSubmit={handleSubmitRating}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>
    </ModernLayout>
  );
}
