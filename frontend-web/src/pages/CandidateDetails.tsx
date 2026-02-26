import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import onboardingService from '../services/onboardingService';
import OnboardingStatusChip from '../components/onboarding/OnboardingStatusChip';
import OnboardingProgressStepper from '../components/onboarding/OnboardingProgressStepper';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface Candidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentState: string;
  offeredSalary: string;
  currency: string;
  expectedJoinDate: string;
  actualJoinDate?: string;
  offerSentDate?: string;
  offerAcceptedDate?: string;
  department?: { name: string };
  designation?: { name: string };
  reportingManager?: { firstName: string; lastName: string };
}

interface Task {
  taskId: string;
  taskName: string;
  description: string;
  dueDate: string;
  status: string;
  priority: string;
}

interface Document {
  documentId: string;
  documentType: string;
  fileName: string;
  uploadedDate: string;
  verificationStatus: string;
}

export default function CandidateDetails() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // Form data
  const [transitionToState, setTransitionToState] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const response = await onboardingService.getCandidateById(candidateId!);
      setCandidate(response.data);

      // Fetch tasks
      try {
        const tasksRes = await onboardingService.getCandidateTasks(candidateId!);
        setTasks(tasksRes.data || []);
      } catch (err) {
        console.log('No tasks found');
      }
    } catch (error: any) {
      console.error('Error fetching candidate:', error);
      showNotification(error.response?.data?.error?.message || 'Failed to load candidate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSendOffer = async () => {
    try {
      await onboardingService.sendOffer(candidateId!);
      showNotification('Offer sent successfully', 'success');
      setShowSendOfferModal(false);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to send offer', 'error');
    }
  };

  const handleAcceptOffer = async () => {
    try {
      await onboardingService.acceptOffer(candidateId!, { acceptedDate: new Date() });
      showNotification('Offer accepted successfully', 'success');
      setShowAcceptOfferModal(false);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to accept offer', 'error');
    }
  };

  const handleTransitionState = async () => {
    try {
      await onboardingService.transitionState(candidateId!, transitionToState, transitionReason);
      showNotification(`Transitioned to ${transitionToState}`, 'success');
      setShowTransitionModal(false);
      setTransitionToState('');
      setTransitionReason('');
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to transition state', 'error');
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadDocType) {
      showNotification('Please select a document and specify type', 'error');
      return;
    }

    try {
      // Upload file with real file object
      await onboardingService.uploadDocument(candidateId!, uploadFile, uploadDocType);
      showNotification('Document uploaded successfully', 'success');
      setShowUploadDocModal(false);
      setUploadDocType('');
      setUploadFile(null);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to upload document', 'error');
    }
  };

  const getAvailableTransitions = () => {
    if (!candidate) return [];

    const stateTransitions: Record<string, string[]> = {
      'offer_approved': ['offer_sent'],
      'offer_sent': ['offer_accepted'],
      'offer_accepted': ['docs_pending'],
      'docs_pending': ['docs_submitted'],
      'docs_submitted': ['hr_review'],
      'hr_review': ['bgv_in_progress'],
      'bgv_in_progress': ['bgv_passed', 'bgv_discrepancy'],
      'bgv_passed': ['pre_joining_setup'],
      'bgv_discrepancy': ['bgv_in_progress'],
      'pre_joining_setup': ['joined'],
      'joined': ['orientation'],
      'orientation': ['onboarding_complete'],
    };

    return stateTransitions[candidate.currentState] || [];
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

  if (!candidate) {
    return (
      <ModernLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Candidate not found</p>
        </div>
      </ModernLayout>
    );
  }

  const availableTransitions = getAvailableTransitions();

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
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{candidate.email}</p>
            </div>
          </div>
          <OnboardingStatusChip state={candidate.currentState} />
        </div>

        {/* Onboarding Progress Tracker */}
        <div className="mb-8 bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress</h2>
          <OnboardingProgressStepper currentState={candidate.currentState} />
        </div>

        {/* Candidate Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card border-2 border-gray-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">PHONE</p>
                  <p className="text-sm text-gray-900">{candidate.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">DEPARTMENT</p>
                  <p className="text-sm text-gray-900">{candidate.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">DESIGNATION</p>
                  <p className="text-sm text-gray-900">{candidate.designation?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">OFFERED SALARY</p>
                  <p className="text-sm text-gray-900">{candidate.currency} {parseFloat(candidate.offeredSalary).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-gray-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">EXPECTED JOIN DATE</p>
                  <p className="text-sm text-gray-900">{new Date(candidate.expectedJoinDate).toLocaleDateString()}</p>
                </div>
                {candidate.offerSentDate && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">OFFER SENT</p>
                    <p className="text-sm text-gray-900">{new Date(candidate.offerSentDate).toLocaleDateString()}</p>
                  </div>
                )}
                {candidate.offerAcceptedDate && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">OFFER ACCEPTED</p>
                    <p className="text-sm text-gray-900">{new Date(candidate.offerAcceptedDate).toLocaleDateString()}</p>
                  </div>
                )}
                {candidate.actualJoinDate && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">ACTUAL JOIN DATE</p>
                    <p className="text-sm text-gray-900">{new Date(candidate.actualJoinDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card border-2 border-gray-200 mb-6">
          <div className="card-body p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h2>
            <div className="flex flex-wrap gap-3">
              {candidate.currentState === 'offer_approved' && (
                <button
                  onClick={() => setShowSendOfferModal(true)}
                  className="btn bg-blue-600 text-white hover:bg-blue-700"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Offer
                </button>
              )}

              {candidate.currentState === 'offer_sent' && (
                <button
                  onClick={() => setShowAcceptOfferModal(true)}
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Mark Offer Accepted
                </button>
              )}

              {['docs_pending', 'docs_submitted', 'hr_review'].includes(candidate.currentState) && (
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  className="btn bg-purple-600 text-white hover:bg-purple-700"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Document
                </button>
              )}

              {availableTransitions.length > 0 && (
                <button
                  onClick={() => setShowTransitionModal(true)}
                  className="btn bg-gray-600 text-white hover:bg-gray-700"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2 rotate-180" />
                  Transition State
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="card border-2 border-gray-200 mb-6">
            <div className="card-body p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.taskName}</p>
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Offer Modal */}
      {showSendOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Offer Letter</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to send the offer letter to {candidate.firstName} {candidate.lastName}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendOfferModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendOffer}
                className="btn bg-blue-600 text-white hover:bg-blue-700"
              >
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Offer Modal */}
      {showAcceptOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Offer Accepted</h3>
            <p className="text-sm text-gray-600 mb-6">
              Confirm that {candidate.firstName} {candidate.lastName} has accepted the offer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAcceptOfferModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptOffer}
                className="btn bg-green-600 text-white hover:bg-green-700"
              >
                Confirm Acceptance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select type...</option>
                  <option value="resume">Resume</option>
                  <option value="id_proof">ID Proof</option>
                  <option value="address_proof">Address Proof</option>
                  <option value="education">Education Certificate</option>
                  <option value="experience">Experience Letter</option>
                  <option value="photo">Photograph</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadDocModal(false);
                  setUploadDocType('');
                  setUploadFile(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                className="btn bg-purple-600 text-white hover:bg-purple-700"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition State Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transition State</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To State</label>
                <select
                  value={transitionToState}
                  onChange={(e) => setTransitionToState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select state...</option>
                  {availableTransitions.map((state) => (
                    <option key={state} value={state}>{state.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <textarea
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter reason for state transition..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTransitionModal(false);
                  setTransitionToState('');
                  setTransitionReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleTransitionState}
                disabled={!transitionToState}
                className="btn bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
