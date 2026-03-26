import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import onboardingService from '../services/onboardingService';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { TaskForm } from '../components/onboarding/TaskForm';
import { DocumentForm } from '../components/onboarding/DocumentForm';
import {
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function OnboardingCandidateDetailsCRUD() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'tasks' | 'documents'>('tasks');
  const [loading, setLoading] = useState(false);

  // Tasks data
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Documents data
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

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
  }, [candidateId, activeTab]);

  const fetchData = async () => {
    if (!candidateId) return;

    try {
      setLoading(true);
      if (activeTab === 'tasks') {
        const response = await onboardingService.getCandidateTasks(candidateId);
        setTasks(response.data || []);
      } else if (activeTab === 'documents') {
        const response = await onboardingService.getCandidateDocuments(candidateId);
        setDocuments(response.data || []);
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

  // Task CRUD
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: any) => {
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document CRUD
  const handleEditDocument = (document: any) => {
    setEditingDocument(document);
    setDocumentModalOpen(true);
  };

  const handleSubmitDocument = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingDocument) {
        await onboardingService.updateDocument(editingDocument.documentId, data);
        showNotification('Document updated successfully', 'success');
      }
      setDocumentModalOpen(false);
      setEditingDocument(null);
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'missing':
        return 'bg-yellow-100 text-yellow-800';
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
            onClick={() => navigate('/onboarding')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Onboarding Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Details - CRUD Demo</h1>
          <p className="text-sm text-gray-600 mt-1">Manage tasks and documents for candidate onboarding</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'tasks', label: 'Tasks', icon: ClipboardDocumentCheckIcon },
                { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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
            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Onboarding Tasks</h3>
                  <AddButton onClick={handleCreateTask} label="Add Task" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks found. Click "Add Task" to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.taskId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{task.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              {task.isRequired && (
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                  Required
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span>Category: {task.category}</span>
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditTask(task)} />
                            <DeleteButton onClick={() => setDeleteTaskId(task.taskId)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Onboarding Documents</h3>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No documents found for this candidate.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((document) => (
                      <div
                        key={document.documentId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{document.documentType}</h4>
                            <p className="text-sm text-gray-600">Category: {document.category}</p>
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditDocument(document)} />
                            <DeleteButton onClick={() => setDeleteDocumentId(document.documentId)} />
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getVerificationColor(document.verificationStatus)}`}>
                            {document.verificationStatus}
                          </span>
                          {document.isRequired && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              Required
                            </span>
                          )}
                          {document.requiresSignature && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Needs Signature
                            </span>
                          )}
                        </div>
                        {document.fileName && (
                          <p className="text-xs text-gray-500 mt-2">{document.fileName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modals */}
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

      <FormModal
        isOpen={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setEditingDocument(null);
        }}
        title="Edit Document"
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
            isEditMode={true}
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
