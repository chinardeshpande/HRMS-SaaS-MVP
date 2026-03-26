import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import onboardingService from '../services/onboardingService';
import OnboardingStatusChip from '../components/onboarding/OnboardingStatusChip';
import OnboardingProgressStepper from '../components/onboarding/OnboardingProgressStepper';
import DocumentPreview from '../components/common/DocumentPreview';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { TaskForm } from '../components/onboarding/TaskForm';
import { DocumentForm } from '../components/onboarding/DocumentForm';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
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
  createdAt: string;
  verificationStatus: string;
  isRequired: boolean;
  requiresSignature: boolean;
  isSigned: boolean;
  signedDate?: string;
}

export default function CandidateDetails() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stateHistory, setStateHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // CRUD state for Tasks
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // CRUD state for Documents
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [transitionToState, setTransitionToState] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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

      // Fetch documents
      try {
        const docsRes = await onboardingService.getCandidateDocuments(candidateId!);
        setDocuments(docsRes.data || []);
      } catch (err) {
        console.log('No documents found');
      }

      // Fetch state history
      try {
        const historyRes = await onboardingService.getStateTransitionHistory(candidateId!);
        setStateHistory(historyRes.data || []);
      } catch (err) {
        console.log('No state history found');
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

  const handleSignAllDocuments = async () => {
    try {
      await onboardingService.signAllRequiredDocuments(candidateId!);
      showNotification('All required documents signed successfully', 'success');
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to sign documents', 'error');
    }
  };

  const handleGenerateAndSignDocuments = async () => {
    try {
      await onboardingService.generateAndSignDocuments(candidateId!);
      showNotification('All required documents generated and signed successfully', 'success');
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to generate documents', 'error');
    }
  };

  const handleEditCandidate = async () => {
    try {
      await onboardingService.updateCandidate(candidateId!, editForm);
      showNotification('Candidate updated successfully', 'success');
      setShowEditModal(false);
      setEditForm({});
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to update candidate', 'error');
    }
  };

  const openEditModal = () => {
    setEditForm({
      firstName: candidate?.firstName,
      lastName: candidate?.lastName,
      email: candidate?.email,
      phone: candidate?.phone,
      offeredSalary: candidate?.offeredSalary,
      expectedJoinDate: candidate?.expectedJoinDate,
    });
    setShowEditModal(true);
  };

  // Task CRUD handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSubmitTask = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingTask) {
        await onboardingService.updateTask(editingTask.taskId, data);
        showNotification('Task updated successfully', 'success');
      } else {
        await onboardingService.createTask(candidateId!, data);
        showNotification('Task created successfully', 'success');
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      setIsSubmitting(true);
      await onboardingService.deleteTask(deleteTaskId);
      showNotification('Task deleted successfully', 'success');
      setDeleteTaskId(null);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document CRUD handlers
  const handleCreateDocument = () => {
    setEditingDocument(null);
    setDocumentModalOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setDocumentModalOpen(true);
  };

  const handleSubmitDocument = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingDocument) {
        await onboardingService.updateDocument(editingDocument.documentId, data);
        showNotification('Document updated successfully', 'success');
      } else {
        await onboardingService.createDocument(candidateId!, data);
        showNotification('Document created successfully', 'success');
      }
      setDocumentModalOpen(false);
      setEditingDocument(null);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocumentId) return;
    try {
      setIsSubmitting(true);
      await onboardingService.deleteDocument(deleteDocumentId);
      showNotification('Document deleted successfully', 'success');
      setDeleteDocumentId(null);
      fetchCandidateDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete document', 'error');
    } finally {
      setIsSubmitting(false);
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

    const stateTransitions: Record<string, { forward: string[]; backward: string[] }> = {
      'offer_approved': { forward: ['offer_sent'], backward: [] },
      'offer_sent': { forward: ['offer_accepted'], backward: ['offer_approved'] },
      'offer_accepted': { forward: ['docs_pending'], backward: ['offer_sent'] },
      'docs_pending': { forward: ['docs_submitted'], backward: ['offer_accepted'] },
      'docs_submitted': { forward: ['hr_review'], backward: ['docs_pending'] },
      'hr_review': { forward: ['bgv_in_progress'], backward: ['docs_submitted'] },
      'bgv_in_progress': { forward: ['bgv_passed', 'bgv_discrepancy'], backward: ['hr_review'] },
      'bgv_passed': { forward: ['pre_joining_setup'], backward: ['bgv_in_progress'] },
      'bgv_discrepancy': { forward: ['bgv_in_progress'], backward: ['hr_review'] },
      'pre_joining_setup': { forward: ['joined'], backward: ['bgv_passed'] },
      'joined': { forward: ['orientation'], backward: [] },
      'orientation': { forward: ['onboarding_complete'], backward: ['joined'] },
      'onboarding_complete': { forward: [], backward: ['orientation', 'joined'] },
    };

    const transitions = stateTransitions[candidate.currentState];
    return [...(transitions?.forward || []), ...(transitions?.backward || [])];
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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/onboarding')}
              className="mr-3 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">{candidate.email}</p>
            </div>
          </div>
          <OnboardingStatusChip state={candidate.currentState} />
        </div>

        {/* Onboarding Progress Tracker */}
        <div className="mb-4 bg-white rounded-lg border-2 border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Onboarding Progress</h2>
          <OnboardingProgressStepper currentState={candidate.currentState} />
        </div>

        {/* Candidate Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="card border-2 border-gray-200">
            <div className="card-body p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Candidate Information</h2>
              <div className="space-y-2">
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
            <div className="card-body p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="space-y-2">
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
        <div className="card border-2 border-gray-200 mb-4">
          <div className="card-body p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Available Actions</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openEditModal}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <PencilIcon className="h-3.5 w-3.5 mr-1" />
                Edit
              </button>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <ClockIcon className="h-3.5 w-3.5 mr-1" />
                History
              </button>
              {candidate.currentState === 'offer_approved' && (
                <button
                  onClick={() => setShowSendOfferModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5 mr-1" />
                  Send Offer
                </button>
              )}

              {candidate.currentState === 'offer_sent' && (
                <button
                  onClick={() => setShowAcceptOfferModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                  Mark Accepted
                </button>
              )}

              {['docs_pending', 'docs_submitted', 'hr_review'].includes(candidate.currentState) && (
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  <DocumentArrowUpIcon className="h-3.5 w-3.5 mr-1" />
                  Upload Doc
                </button>
              )}

              {/* Show button if: no docs, or any required doc missing/unsigned, or not in final states */}
              {['offer_approved', 'offer_sent', 'offer_accepted', 'docs_pending', 'docs_submitted', 'hr_review', 'bgv_in_progress', 'bgv_passed', 'bgv_discrepancy', 'pre_joining_setup'].includes(candidate.currentState) && (
                <button
                  onClick={handleGenerateAndSignDocuments}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                  Generate Docs
                </button>
              )}

              {availableTransitions.length > 0 && (
                <button
                  onClick={() => setShowTransitionModal(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5 mr-1 rotate-180" />
                  Transition
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="card border-2 border-gray-200 mb-4">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-gray-900">Documents</h2>
                <AddButton onClick={handleCreateDocument} label="Add Document" size="sm" />
              </div>
              <DocumentPreview
                documents={documents.map(doc => ({
                  documentId: doc.documentId,
                  fileName: doc.fileName,
                  fileUrl: `/api/documents/${doc.documentId}/download`, // Adjust URL as needed
                  fileType: doc.documentType,
                  uploadedDate: doc.createdAt,
                  uploadedBy: 'Candidate', // Add actual uploader if available
                  size: '2.5 MB', // Add actual size if available
                }))}
                onDownload={(doc) => {
                  console.log('Download document:', doc);
                  // Implement actual download logic
                }}
              />

              {/* Document Status Legend */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Document Status:</p>
                <div className="flex flex-wrap gap-2">
                  {documents.map((doc) => (
                    <div key={doc.documentId} className="flex items-center gap-2 text-xs border rounded-lg p-2 bg-gray-50">
                      <span className="font-medium text-gray-900">{doc.documentType.replace(/_/g, ' ')}:</span>
                      <div className="flex items-center gap-1">
                        {doc.isRequired && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-semibold">
                            Required
                          </span>
                        )}
                        {doc.requiresSignature && (
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            doc.isSigned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.isSigned ? '✓ Signed' : 'Signature Pending'}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                          doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.verificationStatus === 'uploaded' ? 'bg-blue-100 text-blue-800' :
                          doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.verificationStatus}
                        </span>
                        <EditButton onClick={() => handleEditDocument(doc)} />
                        <DeleteButton onClick={() => setDeleteDocumentId(doc.documentId)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="card border-2 border-gray-200 mb-4">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-gray-900">Tasks</h2>
                <AddButton onClick={handleCreateTask} label="Add Task" size="sm" />
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{task.taskName}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                      <EditButton onClick={() => handleEditTask(task)} />
                      <DeleteButton onClick={() => setDeleteTaskId(task.taskId)} />
                    </div>
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

      {/* Edit Candidate Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Candidate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName || ''}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offered Salary</label>
                <input
                  type="number"
                  value={editForm.offeredSalary || ''}
                  onChange={(e) => setEditForm({ ...editForm, offeredSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Join Date</label>
                <input
                  type="date"
                  value={editForm.expectedJoinDate ? new Date(editForm.expectedJoinDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, expectedJoinDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({});
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCandidate}
                className="btn bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">State Transition History</h3>
            {stateHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No state transitions recorded yet</p>
            ) : (
              <div className="space-y-3">
                {stateHistory.map((transition, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {transition.fromState?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                        </span>
                        <ArrowLeftIcon className="h-4 w-4 text-gray-400 rotate-180" />
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {transition.toState?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(transition.transitionDate).toLocaleString()}
                      </span>
                    </div>
                    {transition.reason && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Reason:</span> {transition.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Triggered by: {transition.triggerType}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modals for Tasks */}
      <FormModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        onSubmit={() => {
          const form = document.querySelector('#task-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="task-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitTask(Object.fromEntries(formData));
        }}>
          <TaskForm
            task={editingTask}
            onSubmit={handleSubmitTask}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      <DeleteConfirmModal
        isOpen={deleteTaskId !== null}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        itemName="Task"
        isDeleting={isSubmitting}
      />

      {/* CRUD Modals for Documents */}
      <FormModal
        isOpen={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setEditingDocument(null);
        }}
        title={editingDocument ? 'Edit Document' : 'Add Document'}
        onSubmit={() => {
          const form = document.querySelector('#document-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
      >
        <form id="document-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitDocument(Object.fromEntries(formData));
        }}>
          <DocumentForm
            document={editingDocument}
            onSubmit={handleSubmitDocument}
            isSubmitting={isSubmitting}
            isEditMode={!!editingDocument}
          />
        </form>
      </FormModal>

      <DeleteConfirmModal
        isOpen={deleteDocumentId !== null}
        onClose={() => setDeleteDocumentId(null)}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        itemName="Document"
        isDeleting={isSubmitting}
      />
    </ModernLayout>
  );
}
