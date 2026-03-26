import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import performanceService from '../services/performanceService';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { GoalForm } from '../components/performance/GoalForm';
import { KPIForm } from '../components/performance/KPIForm';
import { ActionItemForm } from '../components/performance/ActionItemForm';
import { Feedback360Form } from '../components/performance/Feedback360Form';
import {
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';

export default function PerformanceReviewDetailsCRUD() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'goals' | 'kpis' | 'action-items' | 'feedback'>('goals');
  const [loading, setLoading] = useState(false);

  // Goals data
  const [goals, setGoals] = useState<any[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KPIs data
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<any | null>(null);
  const [deleteKPIId, setDeleteKPIId] = useState<string | null>(null);

  // Action Items data
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [actionItemModalOpen, setActionItemModalOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<any | null>(null);
  const [deleteActionItemId, setDeleteActionItemId] = useState<string | null>(null);

  // Feedback data
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<any | null>(null);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchData();
  }, [reviewId, activeTab]);

  const fetchData = async () => {
    if (!reviewId) return;

    try {
      setLoading(true);
      if (activeTab === 'goals') {
        const response = await performanceService.getGoalsByReviewId(reviewId);
        setGoals(response.data || []);
      } else if (activeTab === 'action-items') {
        const response = await performanceService.getActionItemsByReviewId(reviewId);
        setActionItems(response.data || []);
      } else if (activeTab === 'feedback') {
        const response = await performanceService.getFeedbackByReviewId(reviewId);
        setFeedbackList(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      showNotification(error.response?.data?.error?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Goal CRUD
  const handleCreateGoal = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  const handleEditGoal = (goal: any) => {
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI CRUD
  const handleCreateKPI = (goalId: string) => {
    setSelectedGoalId(goalId);
    setEditingKPI(null);
    setKpiModalOpen(true);
  };

  const handleEditKPI = (kpi: any) => {
    setEditingKPI(kpi);
    setKpiModalOpen(true);
  };

  const handleSubmitKPI = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingKPI) {
        await performanceService.updateKPI(editingKPI.kpiId, data);
        showNotification('KPI updated successfully', 'success');
      } else if (selectedGoalId) {
        await performanceService.createKPI(selectedGoalId, data);
        showNotification('KPI created successfully', 'success');
      }
      setKpiModalOpen(false);
      setEditingKPI(null);
      setSelectedGoalId(null);
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete KPI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action Item CRUD
  const handleCreateActionItem = () => {
    setEditingActionItem(null);
    setActionItemModalOpen(true);
  };

  const handleEditActionItem = (item: any) => {
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete action item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feedback CRUD
  const handleCreateFeedback = () => {
    setEditingFeedback(null);
    setFeedbackModalOpen(true);
  };

  const handleEditFeedback = (feedback: any) => {
    setEditingFeedback(feedback);
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingFeedback) {
        await performanceService.updateFeedback360(editingFeedback.feedbackId, data);
        showNotification('Feedback updated successfully', 'success');
      } else {
        await performanceService.submit360Feedback(reviewId!, data);
        showNotification('Feedback submitted successfully', 'success');
      }
      setFeedbackModalOpen(false);
      setEditingFeedback(null);
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deleteFeedbackId) return;

    try {
      setIsSubmitting(true);
      await performanceService.deleteFeedback360(deleteFeedbackId);
      showNotification('Feedback deleted successfully', 'success');
      setDeleteFeedbackId(null);
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete feedback', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'business':
        return 'bg-blue-100 text-blue-800';
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'leadership':
        return 'bg-orange-100 text-orange-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'submitted':
        return 'bg-cyan-100 text-cyan-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/performance')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Performance Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Performance Review - CRUD Demo</h1>
          <p className="text-sm text-gray-600 mt-1">Manage goals, KPIs, action items, and 360° feedback</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'goals', label: 'Goals', icon: TrophyIcon },
                { id: 'kpis', label: 'KPIs', icon: ChartBarIcon },
                { id: 'action-items', label: 'Action Items', icon: ClipboardDocumentListIcon },
                { id: 'feedback', label: '360° Feedback', icon: ChatBubbleLeftEllipsisIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Goals Tab */}
            {activeTab === 'goals' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Goals</h3>
                  <AddButton onClick={handleCreateGoal} label="Add Goal" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : goals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No goals found. Click "Add Goal" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div
                        key={goal.goalId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(goal.category)}`}>
                                {goal.category}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                                {goal.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>Weightage: {goal.weightage}%</span>
                              <span>Progress: {goal.progress}%</span>
                              <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                            {goal.kpis && goal.kpis.length > 0 && (
                              <div className="mt-3 flex gap-2">
                                {goal.kpis.map((kpi: any) => (
                                  <span key={kpi.kpiId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {kpi.metric}: {kpi.actual || 'N/A'} / {kpi.target}
                                  </span>
                                ))}
                                <button
                                  onClick={() => handleCreateKPI(goal.goalId)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  + Add KPI
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditGoal(goal)} />
                            <DeleteButton onClick={() => setDeleteGoalId(goal.goalId)} />
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KPIs Tab */}
            {activeTab === 'kpis' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h3>
                  <p className="text-sm text-gray-600">KPIs are managed within goals. Switch to Goals tab to add KPIs.</p>
                </div>
                {goals.flatMap(g => g.kpis || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No KPIs found. Add goals first, then add KPIs to each goal.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) =>
                      (goal.kpis || []).map((kpi: any) => (
                        <div
                          key={kpi.kpiId}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{kpi.metric}</h4>
                              <p className="text-xs text-gray-600">Goal: {goal.title}</p>
                            </div>
                            <div className="flex gap-1">
                              <EditButton onClick={() => handleEditKPI(kpi)} />
                              <DeleteButton onClick={() => setDeleteKPIId(kpi.kpiId)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                            <div>
                              <p className="text-xs text-gray-600">Target</p>
                              <p className="font-semibold">{kpi.target} {kpi.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Actual</p>
                              <p className="font-semibold">{kpi.actual || 'N/A'} {kpi.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Status</p>
                              <p className={`text-xs font-semibold ${
                                kpi.status === 'achieved' || kpi.status === 'on_track' ? 'text-green-600' :
                                kpi.status === 'at_risk' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {kpi.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Items Tab */}
            {activeTab === 'action-items' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Development Action Items</h3>
                  <AddButton onClick={handleCreateActionItem} label="Add Action Item" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : actionItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No action items found. Click "Add Action Item" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-gray-900">{item.action}</p>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">Timeline: {item.timeline}</p>
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditActionItem(item)} />
                            <DeleteButton onClick={() => setDeleteActionItemId(item.itemId)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">360° Feedback</h3>
                  <AddButton onClick={handleCreateFeedback} label="Add Feedback" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No feedback found. Click "Add Feedback" to create one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbackList.map((feedback) => (
                      <div
                        key={feedback.feedbackId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{feedback.feedbackFrom}</h4>
                            <p className="text-sm text-gray-600">{feedback.relationship}</p>
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditFeedback(feedback)} />
                            <DeleteButton onClick={() => setDeleteFeedbackId(feedback.feedbackId)} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            <span className="font-semibold text-yellow-600">{feedback.rating} / 5</span>
                          </div>
                          <p className="text-sm text-gray-700 italic">"{feedback.comments}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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

      <FormModal
        isOpen={kpiModalOpen}
        onClose={() => {
          setKpiModalOpen(false);
          setEditingKPI(null);
          setSelectedGoalId(null);
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

      <FormModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setEditingFeedback(null);
        }}
        title={editingFeedback ? 'Edit Feedback' : 'Add 360° Feedback'}
        onSubmit={() => {
          const form = document.querySelector('#feedback-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="feedback-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitFeedback(Object.fromEntries(formData));
        }}>
          <Feedback360Form
            feedback={editingFeedback}
            onSubmit={handleSubmitFeedback}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      {/* Delete Modals */}
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

      <DeleteConfirmModal
        isOpen={deleteFeedbackId !== null}
        onClose={() => setDeleteFeedbackId(null)}
        onConfirm={handleDeleteFeedback}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback?"
        itemName="Feedback"
        isDeleting={isSubmitting}
      />
    </ModernLayout>
  );
}
