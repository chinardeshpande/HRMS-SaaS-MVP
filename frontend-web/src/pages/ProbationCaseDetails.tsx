import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import probationService from '../services/probationService';
import ProbationStatusChip from '../components/probation/ProbationStatusChip';
import ProbationProgressTracker from '../components/probation/ProbationProgressTracker';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface ProbationCase {
  probationId: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    department?: { name: string };
    designation?: { name: string };
  };
  currentState: string;
  probationStartDate: string;
  probationEndDate: string;
  isAtRisk: boolean;
  riskLevel?: string;
  riskReason?: string;
  review30Completed: boolean;
  review60Completed: boolean;
  finalReviewCompleted: boolean;
  review30DueDate?: string;
  review60DueDate?: string;
  finalReviewDueDate?: string;
  isExtended: boolean;
  extensionDurationDays?: number;
  originalEndDate?: string;
}

interface Review {
  reviewId: string;
  reviewType: string;
  managerRating: number;
  managerComments: string;
  submittedDate: string;
  hrApproved: boolean;
}

export default function ProbationCaseDetails() {
  const { probationId } = useParams<{ probationId: string }>();
  const navigate = useNavigate();

  const [probationCase, setProbationCase] = useState<ProbationCase | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);
  const [showFlagAtRiskModal, setShowFlagAtRiskModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  // Form data
  const [reviewType, setReviewType] = useState('');
  const [managerRating, setManagerRating] = useState(3);
  const [managerComments, setManagerComments] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [teamwork, setTeamwork] = useState(3);
  const [initiative, setInitiative] = useState(3);
  const [punctuality, setPunctuality] = useState(3);

  const [riskLevel, setRiskLevel] = useState('medium');
  const [riskReason, setRiskReason] = useState('');

  const [extensionDays, setExtensionDays] = useState('30');
  const [extensionReason, setExtensionReason] = useState('');
  const [improvementPlan, setImprovementPlan] = useState('');

  const [terminationReason, setTerminationReason] = useState('');

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchProbationDetails();
  }, [probationId]);

  const fetchProbationDetails = async () => {
    try {
      setLoading(true);
      const response = await probationService.getProbationCase(probationId!);
      setProbationCase(response.data);
    } catch (error: any) {
      console.error('Error fetching probation case:', error);
      showNotification(error.response?.data?.error?.message || 'Failed to load probation case', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmitReview = async () => {
    try {
      const reviewData = {
        reviewType,
        managerRating,
        managerComments,
        technicalSkills,
        communication,
        teamwork,
        initiative,
        punctuality,
      };
      await probationService.submitReview(probationId!, reviewData);
      showNotification('Review submitted successfully', 'success');
      setShowSubmitReviewModal(false);
      resetReviewForm();
      fetchProbationDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to submit review', 'error');
    }
  };

  const handleFlagAtRisk = async () => {
    try {
      await probationService.flagAtRisk(probationId!, { riskLevel, riskReason });
      showNotification('Employee flagged as at-risk', 'success');
      setShowFlagAtRiskModal(false);
      setRiskLevel('medium');
      setRiskReason('');
      fetchProbationDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to flag at-risk', 'error');
    }
  };

  const handleExtendProbation = async () => {
    try {
      await probationService.extendProbation(probationId!, {
        extensionDays: parseInt(extensionDays),
        reason: extensionReason,
        improvementPlan,
      });
      showNotification('Probation extended successfully', 'success');
      setShowExtendModal(false);
      setExtensionDays('30');
      setExtensionReason('');
      setImprovementPlan('');
      fetchProbationDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to extend probation', 'error');
    }
  };

  const handleConfirmEmployee = async () => {
    try {
      await probationService.confirmEmployee(probationId!);
      showNotification('Employee confirmed successfully', 'success');
      setShowConfirmModal(false);
      fetchProbationDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to confirm employee', 'error');
    }
  };

  const handleTerminateProbation = async () => {
    try {
      await probationService.terminateProbation(probationId!, { reason: terminationReason });
      showNotification('Probation terminated', 'success');
      setShowTerminateModal(false);
      setTerminationReason('');
      fetchProbationDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to terminate probation', 'error');
    }
  };

  const resetReviewForm = () => {
    setReviewType('');
    setManagerRating(3);
    setManagerComments('');
    setTechnicalSkills(3);
    setCommunication(3);
    setTeamwork(3);
    setInitiative(3);
    setPunctuality(3);
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getNextReviewType = () => {
    if (!probationCase) return null;
    if (!probationCase.review30Completed) return '30_day';
    if (!probationCase.review60Completed) return '60_day';
    if (!probationCase.finalReviewCompleted) return 'final';
    return null;
  };

  if (loading) {
    return (
      <ModernLayout>
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (!probationCase) {
    return (
      <ModernLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Probation case not found</p>
        </div>
      </ModernLayout>
    );
  }

  const daysRemaining = calculateDaysRemaining(probationCase.probationEndDate);
  const nextReview = getNextReviewType();

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/onboarding')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {probationCase.employee.firstName} {probationCase.employee.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {probationCase.employee.employeeCode} • {probationCase.employee.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {probationCase.isAtRisk && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                ⚠ {probationCase.riskLevel?.toUpperCase() || 'AT RISK'}
              </span>
            )}
            <ProbationStatusChip state={probationCase.currentState} />
          </div>
        </div>

        {/* Probation Progress Tracker */}
        <div className="mb-8 bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Probation Progress Tracker</h2>
          <p className="text-sm text-gray-600 mb-6">Track milestones and review completion status</p>
          <ProbationProgressTracker
            currentState={probationCase.currentState}
            review30Completed={probationCase.review30Completed}
            review60Completed={probationCase.review60Completed}
            finalReviewCompleted={probationCase.finalReviewCompleted}
            review30DueDate={probationCase.review30DueDate}
            review60DueDate={probationCase.review60DueDate}
            finalReviewDueDate={probationCase.finalReviewDueDate}
            probationStartDate={probationCase.probationStartDate}
            probationEndDate={probationCase.probationEndDate}
            isAtRisk={probationCase.isAtRisk}
          />
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border-2 border-gray-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">DEPARTMENT</p>
                  <p className="text-sm text-gray-900">{probationCase.employee.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">DESIGNATION</p>
                  <p className="text-sm text-gray-900">{probationCase.employee.designation?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-gray-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Probation Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">START DATE</p>
                  <p className="text-sm text-gray-900">{new Date(probationCase.probationStartDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">END DATE</p>
                  <p className="text-sm text-gray-900">{new Date(probationCase.probationEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">DAYS REMAINING</p>
                  <p className={`text-sm font-bold ${
                    daysRemaining < 7 ? 'text-red-600' : daysRemaining < 30 ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {daysRemaining} days
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-gray-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Progress</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">30-Day Review</span>
                  {probationCase.review30Completed ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">60-Day Review</span>
                  {probationCase.review60Completed ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Final Review</span>
                  {probationCase.finalReviewCompleted ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card border-2 border-gray-200 mb-6">
          <div className="card-body p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h2>
            <div className="flex flex-wrap gap-3">
              {nextReview && (
                <button
                  onClick={() => {
                    setReviewType(nextReview);
                    setShowSubmitReviewModal(true);
                  }}
                  className="btn bg-blue-600 text-white hover:bg-blue-700"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Submit {nextReview.replace('_', '-').toUpperCase()} Review
                </button>
              )}

              {!probationCase.isAtRisk && (
                <button
                  onClick={() => setShowFlagAtRiskModal(true)}
                  className="btn bg-orange-600 text-white hover:bg-orange-700"
                >
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Flag At-Risk
                </button>
              )}

              {probationCase.finalReviewCompleted && !probationCase.isExtended && (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="btn bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Confirm Employee
                  </button>
                  <button
                    onClick={() => setShowExtendModal(true)}
                    className="btn bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Extend Probation
                  </button>
                </>
              )}

              <button
                onClick={() => setShowTerminateModal(true)}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Terminate
              </button>
            </div>
          </div>
        </div>

        {/* At-Risk Information */}
        {probationCase.isAtRisk && (
          <div className="card border-2 border-red-200 bg-red-50 mb-6">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">At-Risk Status</h2>
              <p className="text-sm text-red-800 font-medium mb-2">Risk Level: {probationCase.riskLevel?.toUpperCase()}</p>
              {probationCase.riskReason && (
                <p className="text-sm text-red-700">Reason: {probationCase.riskReason}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {showSubmitReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit {reviewType.replace('_', '-').toUpperCase()} Review
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Skills (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={technicalSkills}
                    onChange={(e) => setTechnicalSkills(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={communication}
                    onChange={(e) => setCommunication(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teamwork (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={teamwork}
                    onChange={(e) => setTeamwork(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initiative (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={initiative}
                    onChange={(e) => setInitiative(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Punctuality (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={punctuality}
                    onChange={(e) => setPunctuality(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={managerRating}
                    onChange={(e) => setManagerRating(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments *</label>
                <textarea
                  value={managerComments}
                  onChange={(e) => setManagerComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter detailed review comments..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubmitReviewModal(false);
                  resetReviewForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!managerComments}
                className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag At-Risk Modal */}
      {showFlagAtRiskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flag Employee At-Risk</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={riskReason}
                  onChange={(e) => setRiskReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Explain why this employee is at risk..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFlagAtRiskModal(false);
                  setRiskLevel('medium');
                  setRiskReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagAtRisk}
                disabled={!riskReason}
                className="btn bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Flag At-Risk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Probation Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Extend Probation Period</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extension Duration (days) *</label>
                <input
                  type="number"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Why is the extension needed?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Improvement Plan *</label>
                <textarea
                  value={improvementPlan}
                  onChange={(e) => setImprovementPlan(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="What should the employee improve?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setExtensionDays('30');
                  setExtensionReason('');
                  setImprovementPlan('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendProbation}
                disabled={!extensionDays || !extensionReason || !improvementPlan}
                className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Extend Probation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Employee Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Employee</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to confirm {probationCase.employee.firstName} {probationCase.employee.lastName} as a permanent employee?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmployee}
                className="btn bg-green-600 text-white hover:bg-green-700"
              >
                Confirm Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Terminate Probation</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will terminate the employment of {probationCase.employee.firstName} {probationCase.employee.lastName}.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Termination *</label>
              <textarea
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter detailed reason for termination..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTerminateModal(false);
                  setTerminationReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminateProbation}
                disabled={!terminationReason}
                className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
