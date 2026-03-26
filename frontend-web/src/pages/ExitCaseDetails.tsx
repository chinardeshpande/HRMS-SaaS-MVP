import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import exitService from '../services/exitService';
import ExitStatusChip from '../components/exit/ExitStatusChip';
import ExitProgressTracker from '../components/exit/ExitProgressTracker';
import DocumentPreview from '../components/common/DocumentPreview';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { ClearanceForm } from '../components/exit/ClearanceForm';
import { AssetReturnForm } from '../components/exit/AssetReturnForm';
import { ExitInterviewForm } from '../components/exit/ExitInterviewForm';
import { SettlementForm } from '../components/exit/SettlementForm';
import { DocumentForm, ExitDocument } from '../components/exit/DocumentForm';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  CubeIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface Clearance {
  clearanceId: string;
  department: string;
  status: 'pending' | 'completed';
  clearedBy?: string;
  clearedDate?: string;
  notes?: string;
}

interface Asset {
  assetId: string;
  assetName: string;
  assetType: string;
  serialNumber?: string;
  assignedDate: string;
  status: 'pending' | 'returned';
  returnedDate?: string;
  condition?: string;
}

interface ExitInterview {
  interviewId?: string;
  completed: boolean;
  overallRating?: number;
  managementRating?: number;
  cultureRating?: number;
  growthRating?: number;
  compensationRating?: number;
  wouldRecommend?: boolean;
  reasonsForLeaving?: string[];
  feedback?: string;
  conductedBy?: string;
  conductedDate?: string;
}

interface Settlement {
  settlementId?: string;
  salary: {
    basic: number;
    hra: number;
    allowances: number;
  };
  deductions: {
    noticePeriodShortfall: number;
    assetsNotReturned: number;
    loans: number;
    other: number;
  };
  leaveEncashment: number;
  bonus: number;
  netSettlement: number;
  paymentStatus: 'pending' | 'processed' | 'completed';
  paymentDate?: string;
}

interface ExitCase {
  exitId: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
    department?: { departmentName: string };
    designation?: { designationName: string };
  };
  currentState: string;
  resignationType: string;
  resignationReason: string;
  detailedReason?: string;
  lastWorkingDate: string;
  resignationSubmittedDate: string;
  noticePeriodDays: number;
  totalClearances: number;
  completedClearances: number;
  allClearancesCleared: boolean;
  totalAssets: number;
  returnedAssets: number;
  allAssetsReturned: boolean;
  exitInterviewCompleted: boolean;
  settlementAmount?: number;
  isEligibleForRehire: boolean;
  notes?: string;
  clearances?: Clearance[];
  assets?: Asset[];
  exitInterview?: ExitInterview;
  settlement?: Settlement;
  documents?: ExitDocument[];
}

export default function ExitCaseDetails() {
  const { exitId } = useParams<{ exitId: string }>();
  const navigate = useNavigate();

  const [exitCase, setExitCase] = useState<ExitCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clearances' | 'assets' | 'interview' | 'settlement'>('overview');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBuyoutModal, setShowBuyoutModal] = useState(false);

  // Form data
  const [rejectionReason, setRejectionReason] = useState('');
  const [buyoutAmount, setBuyoutAmount] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // CRUD state for Clearances
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [editingClearance, setEditingClearance] = useState<Clearance | null>(null);
  const [deleteClearanceId, setDeleteClearanceId] = useState<string | null>(null);

  // CRUD state for Assets
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  // CRUD state for Exit Interview
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(false);

  // CRUD state for Settlement
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState(false);

  // CRUD state for Documents
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ExitDocument | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    fetchExitDetails();
  }, [exitId]);

  const fetchExitDetails = async () => {
    try {
      setLoading(true);
      const response = await exitService.getExitCase(exitId!);
      setExitCase(response.data);
    } catch (error: any) {
      console.error('Error fetching exit case:', error);
      showNotification(error.response?.data?.error?.message || 'Failed to load exit case', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleApproveResignation = async () => {
    try {
      await exitService.approveResignation(exitId!, approvalNotes);
      showNotification('Resignation approved successfully', 'success');
      setShowApproveModal(false);
      setApprovalNotes('');
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to approve resignation', 'error');
    }
  };

  const handleRejectResignation = async () => {
    try {
      if (!rejectionReason.trim()) {
        showNotification('Rejection reason is required', 'error');
        return;
      }
      await exitService.rejectResignation(exitId!, rejectionReason);
      showNotification('Resignation rejected successfully', 'success');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to reject resignation', 'error');
    }
  };

  const handleBuyoutNoticePeriod = async () => {
    try {
      const amount = parseFloat(buyoutAmount);
      if (isNaN(amount) || amount <= 0) {
        showNotification('Valid buyout amount is required', 'error');
        return;
      }
      await exitService.buyoutNoticePeriod(exitId!, amount);
      showNotification('Notice period buyout processed successfully', 'success');
      setShowBuyoutModal(false);
      setBuyoutAmount('');
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to process buyout', 'error');
    }
  };

  // Clearance CRUD handlers
  const handleCreateClearance = () => {
    setEditingClearance(null);
    setClearanceModalOpen(true);
  };

  const handleEditClearance = (clearance: Clearance) => {
    setEditingClearance(clearance);
    setClearanceModalOpen(true);
  };

  const handleSubmitClearance = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingClearance) {
        await exitService.updateClearance(editingClearance.clearanceId, data);
        showNotification('Clearance updated successfully', 'success');
      } else {
        await exitService.createClearance(exitId!, data);
        showNotification('Clearance created successfully', 'success');
      }
      setClearanceModalOpen(false);
      setEditingClearance(null);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save clearance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClearance = async () => {
    if (!deleteClearanceId) return;
    try {
      setIsSubmitting(true);
      await exitService.deleteClearance(deleteClearanceId);
      showNotification('Clearance deleted successfully', 'success');
      setDeleteClearanceId(null);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete clearance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asset CRUD handlers
  const handleCreateAsset = () => {
    setEditingAsset(null);
    setAssetModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetModalOpen(true);
  };

  const handleSubmitAsset = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingAsset) {
        await exitService.updateAssetReturn(editingAsset.assetId, data);
        showNotification('Asset updated successfully', 'success');
      } else {
        await exitService.recordAssetReturn(exitId!, data);
        showNotification('Asset recorded successfully', 'success');
      }
      setAssetModalOpen(false);
      setEditingAsset(null);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteAssetId) return;
    try {
      setIsSubmitting(true);
      await exitService.deleteAssetReturn(deleteAssetId);
      showNotification('Asset deleted successfully', 'success');
      setDeleteAssetId(null);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exit Interview CRUD handlers
  const handleSubmitExitInterview = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (exitCase?.exitInterview) {
        await exitService.updateExitInterview(exitCase.exitInterview.interviewId!, data);
        showNotification('Exit interview updated successfully', 'success');
      } else {
        await exitService.createExitInterview(exitId!, data);
        showNotification('Exit interview submitted successfully', 'success');
      }
      setInterviewModalOpen(false);
      setEditingInterview(false);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save exit interview', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExitInterview = () => {
    setEditingInterview(true);
    setInterviewModalOpen(true);
  };

  const handleSubmitInterview = () => {
    setEditingInterview(false);
    setInterviewModalOpen(true);
  };

  // Settlement CRUD handlers
  const handleSubmitSettlement = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (exitCase?.settlement) {
        await exitService.updateSettlement(exitCase.settlement.settlementId!, data);
        showNotification('Settlement updated successfully', 'success');
      } else {
        await exitService.createSettlement(exitId!, data);
        showNotification('Settlement created successfully', 'success');
      }
      setSettlementModalOpen(false);
      setEditingSettlement(false);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save settlement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSettlement = () => {
    setEditingSettlement(true);
    setSettlementModalOpen(true);
  };

  // Document CRUD handlers
  const handleCreateDocument = () => {
    setEditingDocument(null);
    setDocumentModalOpen(true);
  };

  const handleEditDocument = (document: ExitDocument) => {
    setEditingDocument(document);
    setDocumentModalOpen(true);
  };

  const handleSubmitDocument = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingDocument) {
        await exitService.updateDocument(editingDocument.documentId!, data);
        showNotification('Document updated successfully', 'success');
      } else {
        await exitService.uploadDocument(exitId!, data);
        showNotification('Document uploaded successfully', 'success');
      }
      setDocumentModalOpen(false);
      setEditingDocument(null);
      fetchExitDetails();
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
      await exitService.deleteDocument(deleteDocumentId);
      showNotification('Document deleted successfully', 'success');
      setDeleteDocumentId(null);
      fetchExitDetails();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysRemaining = (lastWorkingDate: string) => {
    const target = new Date(lastWorkingDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (!exitCase) {
    return (
      <ModernLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Exit case not found</p>
          <button onClick={() => navigate('/exit')} className="mt-4 text-blue-600 hover:text-blue-800">
            Back to Exit Dashboard
          </button>
        </div>
      </ModernLayout>
    );
  }

  const daysRemaining = calculateDaysRemaining(exitCase.lastWorkingDate);

  return (
    <ModernLayout>
      <div className="space-y-4">
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

        {/* Header with Back Button */}
        <div>
          <button
            onClick={() => navigate('/exit')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Exit Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {exitCase.employee.firstName} {exitCase.employee.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {exitCase.employee.employeeCode} • {exitCase.employee.email}
              </p>
            </div>
            <div className="flex gap-2">
              <ExitStatusChip state={exitCase.currentState} />
            </div>
          </div>
        </div>

        {/* Exit Progress Tracker */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-3">
          <h2 className="text-base font-bold text-gray-900 mb-2">Exit Progress Tracker</h2>
          <ExitProgressTracker currentState={exitCase.currentState} lastWorkingDate={exitCase.lastWorkingDate} />
        </div>

        {/* Summary Cards - 3 column grid like probation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Clearances Progress */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Clearances Progress</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {exitCase.totalClearances > 0
                    ? Math.round((exitCase.completedClearances / exitCase.totalClearances) * 100)
                    : 0}
                  %
                </div>
              </div>
              <ShieldCheckIcon className="h-10 w-10 text-indigo-400" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    exitCase.totalClearances > 0
                      ? (exitCase.completedClearances / exitCase.totalClearances) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-600">
              {exitCase.completedClearances}/{exitCase.totalClearances} Cleared
            </div>
          </div>

          {/* Days Remaining */}
          <div
            className={`rounded-lg border-2 p-4 ${
              daysRemaining < 0
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                : daysRemaining < 7
                ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Days Remaining</div>
                <div
                  className={`text-2xl font-bold ${
                    daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  {daysRemaining}
                </div>
              </div>
              <ClockIcon
                className={`h-10 w-10 ${
                  daysRemaining < 0 ? 'text-red-400' : daysRemaining < 7 ? 'text-orange-400' : 'text-green-400'
                }`}
              />
            </div>
            <div className="text-xs text-gray-600">Until {new Date(exitCase.lastWorkingDate).toLocaleDateString()}</div>
          </div>

          {/* Assets Returned */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-medium text-gray-600">Assets Returned</div>
                <div className="text-2xl font-bold text-orange-600">
                  {exitCase.returnedAssets}/{exitCase.totalAssets}
                </div>
              </div>
              <CubeIcon className="h-10 w-10 text-orange-400" />
            </div>
            {exitCase.allAssetsReturned && (
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ All Returned
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
                { id: 'clearances', label: 'Clearances', icon: ShieldCheckIcon },
                { id: 'assets', label: 'Assets', icon: CubeIcon },
                { id: 'interview', label: 'Exit Interview', icon: ChatBubbleLeftRightIcon },
                { id: 'settlement', label: 'Settlement', icon: BanknotesIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-1.5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Employee Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Employee Information</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department</span>
                      <span className="font-medium text-gray-900">{exitCase.employee.department?.departmentName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Designation</span>
                      <span className="font-medium text-gray-900">{exitCase.employee.designation?.designationName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resignation Type</span>
                      <span className="font-medium text-gray-900">{exitCase.resignationType.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notice Period</span>
                      <span className="font-medium text-gray-900">{exitCase.noticePeriodDays} days</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resignation Submitted</span>
                      <span className="font-medium text-gray-900">
                        {new Date(exitCase.resignationSubmittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Working Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(exitCase.lastWorkingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Remaining</span>
                      <span className={`font-bold ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysRemaining} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resignation Reason - Full width */}
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Resignation Reason</h3>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Primary Reason: </span>
                      <span className="text-gray-900">{exitCase.resignationReason}</span>
                    </div>
                    {exitCase.detailedReason && (
                      <div>
                        <span className="font-medium text-gray-600">Details: </span>
                        <span className="text-gray-900">{exitCase.detailedReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exit Completion Status */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Exit Completion Status</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">Clearances</span>
                      <div className="flex items-center gap-1">
                        {exitCase.allClearancesCleared ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {exitCase.completedClearances}/{exitCase.totalClearances}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">Assets Returned</span>
                      <div className="flex items-center gap-1">
                        {exitCase.allAssetsReturned ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {exitCase.returnedAssets}/{exitCase.totalAssets}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">Exit Interview</span>
                      <div className="flex items-center gap-1">
                        {exitCase.exitInterviewCompleted ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700">Completed</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-700">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rehire Eligibility */}
                <div className={`rounded-lg border p-3 ${exitCase.isEligibleForRehire ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Rehire Eligibility</h3>
                  <div className="flex items-center gap-2">
                    {exitCase.isEligibleForRehire ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">Eligible for Rehire</p>
                          <p className="text-xs text-green-700">Good exit, maintained professional standards</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold text-red-900">Not Eligible for Rehire</p>
                          <p className="text-xs text-red-700">Performance or policy violations</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes if available */}
                {exitCase.notes && (
                  <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">HR Notes</h3>
                    <p className="text-xs text-gray-700">{exitCase.notes}</p>
                  </div>
                )}

                {/* Exit Documents */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Exit Documents</h3>
                    <AddButton onClick={handleCreateDocument} label="Upload Document" size="sm" />
                  </div>
                  <div className="space-y-2">
                    {(exitCase.documents || [
                      {
                        documentId: '1',
                        fileName: 'Resignation_Letter.pdf',
                        fileUrl: '/sample-docs/resignation.pdf',
                        fileType: 'resignation_letter',
                        uploadedDate: exitCase.resignationSubmittedDate,
                        uploadedBy: `${exitCase.employee.firstName} ${exitCase.employee.lastName}`,
                        size: '245 KB',
                      },
                      {
                        documentId: '2',
                        fileName: 'No_Dues_Certificate.pdf',
                        fileUrl: '/sample-docs/no-dues.pdf',
                        fileType: 'no_dues_certificate',
                        uploadedDate: new Date().toISOString(),
                        uploadedBy: 'HR Department',
                        size: '180 KB',
                      },
                      {
                        documentId: '3',
                        fileName: 'Experience_Letter.pdf',
                        fileUrl: '/sample-docs/experience.pdf',
                        fileType: 'experience_letter',
                        uploadedDate: new Date().toISOString(),
                        uploadedBy: 'HR Department',
                        size: '320 KB',
                      },
                    ]).map((doc) => (
                      <div
                        key={doc.documentId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{doc.fileType?.replace(/_/g, ' ').toUpperCase()}</span>
                              <span>•</span>
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span>Uploaded by {doc.uploadedBy}</span>
                              <span>•</span>
                              <span>{doc.uploadedDate ? new Date(doc.uploadedDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (doc.fileUrl) {
                                window.open(doc.fileUrl, '_blank');
                              }
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Download
                          </button>
                          <EditButton onClick={() => handleEditDocument(doc)} />
                          <DeleteButton onClick={() => setDeleteDocumentId(doc.documentId!)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clearances' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Department Clearances</h3>
                  <AddButton onClick={handleCreateClearance} label="Add Clearance" size="sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(exitCase.clearances || [
                  { clearanceId: '1', department: 'HR', status: 'completed', clearedBy: 'Sarah Johnson', clearedDate: '2024-03-01', notes: 'All documents verified' },
                  { clearanceId: '2', department: 'IT', status: 'completed', clearedBy: 'Mike Chen', clearedDate: '2024-03-01', notes: 'Access revoked' },
                  { clearanceId: '3', department: 'Finance', status: 'pending', notes: 'Pending final settlement approval' },
                  { clearanceId: '4', department: 'Admin', status: 'completed', clearedBy: 'Lisa Park', clearedDate: '2024-03-02', notes: 'ID card returned' },
                  { clearanceId: '5', department: 'Manager', status: 'completed', clearedBy: 'David Smith', clearedDate: '2024-02-28', notes: 'Knowledge transfer completed' },
                  { clearanceId: '6', department: 'Facilities', status: 'pending', notes: 'Pending desk clearance verification' },
                ]).map((clearance) => (
                  <div
                    key={clearance.clearanceId}
                    className={`rounded-lg border-2 p-3 ${
                      clearance.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {clearance.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-yellow-600" />
                        )}
                        <h4 className="font-semibold text-gray-900 text-sm">{clearance.department}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            clearance.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {clearance.status === 'completed' ? 'Cleared' : 'Pending'}
                        </span>
                        <EditButton onClick={() => handleEditClearance(clearance)} />
                        <DeleteButton onClick={() => setDeleteClearanceId(clearance.clearanceId)} />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      {clearance.clearedBy && (
                        <p className="text-gray-600">
                          Cleared by: <span className="text-gray-900 font-medium">{clearance.clearedBy}</span>
                        </p>
                      )}
                      {clearance.clearedDate && (
                        <p className="text-gray-600">
                          Date: <span className="text-gray-900 font-medium">{new Date(clearance.clearedDate).toLocaleDateString()}</span>
                        </p>
                      )}
                      {clearance.notes && (
                        <p className="text-gray-600 italic">{clearance.notes}</p>
                      )}
                    </div>
                    {clearance.status === 'pending' && (
                      <button className="mt-2 w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                        Mark as Cleared
                      </button>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Company Assets</h3>
                  <AddButton onClick={handleCreateAsset} label="Record Asset" size="sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(exitCase.assets || [
                  { assetId: '1', assetName: 'MacBook Pro 16"', assetType: 'Laptop', serialNumber: 'MBP-2023-1542', assignedDate: '2023-01-15', status: 'returned', returnedDate: '2024-03-01', condition: 'Good' },
                  { assetId: '2', assetName: 'Dell Monitor 27"', assetType: 'Monitor', serialNumber: 'MON-2023-8834', assignedDate: '2023-01-15', status: 'returned', returnedDate: '2024-03-01', condition: 'Good' },
                  { assetId: '3', assetName: 'Wireless Mouse', assetType: 'Peripheral', serialNumber: 'MS-2023-4421', assignedDate: '2023-01-15', status: 'returned', returnedDate: '2024-03-01', condition: 'Good' },
                  { assetId: '4', assetName: 'Employee ID Card', assetType: 'Access Card', serialNumber: 'EMP-5678', assignedDate: '2023-01-15', status: 'returned', returnedDate: '2024-03-02', condition: 'Good' },
                  { assetId: '5', assetName: 'Access Card - Floor 3', assetType: 'Access Card', serialNumber: 'ACC-2023-9912', assignedDate: '2023-01-15', status: 'pending' },
                  { assetId: '6', assetName: 'Mobile Phone', assetType: 'Mobile', serialNumber: 'IPH-2023-7745', assignedDate: '2023-06-20', status: 'pending' },
                ]).map((asset) => (
                  <div
                    key={asset.assetId}
                    className={`rounded-lg border-2 p-3 ${
                      asset.status === 'returned'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {asset.status === 'returned' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{asset.assetName}</h4>
                          <p className="text-xs text-gray-600">{asset.assetType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            asset.status === 'returned'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {asset.status === 'returned' ? 'Returned' : 'Pending'}
                        </span>
                        <EditButton onClick={() => handleEditAsset(asset)} />
                        <DeleteButton onClick={() => setDeleteAssetId(asset.assetId)} />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      {asset.serialNumber && (
                        <p className="text-gray-600">
                          Serial: <span className="text-gray-900 font-medium">{asset.serialNumber}</span>
                        </p>
                      )}
                      <p className="text-gray-600">
                        Assigned: <span className="text-gray-900 font-medium">{new Date(asset.assignedDate).toLocaleDateString()}</span>
                      </p>
                      {asset.returnedDate && (
                        <p className="text-gray-600">
                          Returned: <span className="text-gray-900 font-medium">{new Date(asset.returnedDate).toLocaleDateString()}</span>
                        </p>
                      )}
                      {asset.condition && (
                        <p className="text-gray-600">
                          Condition: <span className="text-gray-900 font-medium">{asset.condition}</span>
                        </p>
                      )}
                    </div>
                    {asset.status === 'pending' && (
                      <button className="mt-2 w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                        Mark as Returned
                      </button>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}

            {activeTab === 'interview' && (
              <div>
                {exitCase.exitInterviewCompleted || exitCase.exitInterview?.completed ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-green-900 text-sm">Exit Interview Completed</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <p className="text-gray-600">
                            Conducted by: <span className="text-gray-900 font-medium">{exitCase.exitInterview?.conductedBy || 'HR Manager'}</span>
                          </p>
                          <p className="text-gray-600">
                            Date: <span className="text-gray-900 font-medium">{exitCase.exitInterview?.conductedDate ? new Date(exitCase.exitInterview.conductedDate).toLocaleDateString() : 'March 1, 2024'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="ml-3">
                        <button
                          onClick={handleEditExitInterview}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Interview
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Overall Experience</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (exitCase.exitInterview?.overallRating || 4) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Management</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (exitCase.exitInterview?.managementRating || 4) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Culture & Values</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (exitCase.exitInterview?.cultureRating || 5) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Growth</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (exitCase.exitInterview?.growthRating || 4) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                        <p className="text-xs text-gray-600">Compensation</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= (exitCase.exitInterview?.compensationRating || 3) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Would Recommend Company</h4>
                        <p className="text-lg font-bold text-green-600">
                          {exitCase.exitInterview?.wouldRecommend !== false ? 'Yes ✓' : 'No ✗'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Reasons for Leaving</h4>
                      <div className="flex flex-wrap gap-2">
                        {(exitCase.exitInterview?.reasonsForLeaving || ['Better Opportunity', 'Career Growth']).map((reason, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Feedback</h4>
                      <p className="text-xs text-gray-700">
                        {exitCase.exitInterview?.feedback || 'Great learning experience. Management was supportive. Looking for new challenges and better compensation package. Would definitely recommend the company to others.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 inline-block">
                      <ExclamationTriangleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-900">Exit Interview Not Completed</p>
                      <p className="text-xs text-gray-600 mt-1">Click below to submit the exit interview</p>
                    </div>
                    <button
                      onClick={handleSubmitInterview}
                      className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Submit Exit Interview
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settlement' && (
              <div>
                {exitCase.settlement ? (
                  <div className="space-y-3">
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={handleEditSettlement}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Settlement
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Earnings */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                          <span className="text-green-600 mr-1">+</span> Earnings
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.salary.basic || 45000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">HRA</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.salary.hra || 22500).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Other Allowances</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.salary.allowances || 12500).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Leave Encashment</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.leaveEncashment || 12000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Pro-rated Bonus</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.bonus || 5000).toLocaleString()}</span>
                          </div>
                          <div className="border-t-2 border-green-300 pt-1.5 mt-1.5 flex justify-between items-center">
                            <span className="text-sm font-semibold text-green-900">Total Earnings</span>
                            <span className="text-sm font-bold text-green-600">
                              ₹{((exitCase.settlement?.salary.basic || 45000) + (exitCase.settlement?.salary.hra || 22500) + (exitCase.settlement?.salary.allowances || 12500) + (exitCase.settlement?.leaveEncashment || 12000) + (exitCase.settlement?.bonus || 5000)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                          <span className="text-red-600 mr-1">-</span> Deductions
                        </h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Notice Period Shortfall</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.deductions.noticePeriodShortfall || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Assets Not Returned</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.deductions.assetsNotReturned || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Outstanding Loans</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.deductions.loans || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-700">Other Deductions</span>
                            <span className="font-semibold text-gray-900">₹{(exitCase.settlement?.deductions.other || 2500).toLocaleString()}</span>
                          </div>
                          <div className="border-t-2 border-red-300 pt-1.5 mt-1.5 flex justify-between items-center">
                            <span className="text-sm font-semibold text-red-900">Total Deductions</span>
                            <span className="text-sm font-bold text-red-600">
                              ₹{((exitCase.settlement?.deductions.noticePeriodShortfall || 0) + (exitCase.settlement?.deductions.assetsNotReturned || 0) + (exitCase.settlement?.deductions.loans || 0) + (exitCase.settlement?.deductions.other || 2500)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Net Settlement - Full width */}
                      <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">Net Settlement Amount</h3>
                            <p className="text-xs text-gray-600">Total earnings minus deductions</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              ₹{(exitCase.settlement?.netSettlement || 94500).toLocaleString()}
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                (exitCase.settlement?.paymentStatus || 'pending') === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : (exitCase.settlement?.paymentStatus || 'pending') === 'processed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {(exitCase.settlement?.paymentStatus || 'pending') === 'completed'
                                ? '✓ Paid'
                                : (exitCase.settlement?.paymentStatus || 'pending') === 'processed'
                                ? 'Processing'
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-600">Payment Status</p>
                            <p className="font-semibold text-gray-900">{exitCase.settlement?.paymentStatus?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Payment Date</p>
                            <p className="font-semibold text-gray-900">
                              {exitCase.settlement?.paymentDate ? new Date(exitCase.settlement.paymentDate).toLocaleDateString() : 'To be scheduled'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Processing Time</p>
                            <p className="font-semibold text-gray-900">2-3 business days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 inline-block">
                      <BanknotesIcon className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-900">Settlement Not Created</p>
                      <p className="text-xs text-gray-600 mt-1">Click below to create the settlement details</p>
                    </div>
                    <button
                      onClick={() => setSettlementModalOpen(true)}
                      className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Settlement
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Available Actions */}
        {(exitCase.currentState === 'resignation_submitted' || exitCase.currentState === 'resignation_approved') && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Available Actions</h3>
            <div className="flex gap-2">
              {exitCase.currentState === 'resignation_submitted' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                    Approve Resignation
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1.5" />
                    Reject Resignation
                  </button>
                </>
              )}
              {exitCase.currentState === 'resignation_approved' && (
                <button
                  onClick={() => setShowBuyoutModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <BanknotesIcon className="h-4 w-4 mr-1.5" />
                  Process Notice Period Buyout
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modals remain the same as before */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Approve Resignation</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about the approval..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveResignation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Resignation</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the reason for rejection..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectResignation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {showBuyoutModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Notice Period Buyout</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyout Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={buyoutAmount}
                  onChange={(e) => setBuyoutAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter buyout amount"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Amount to be paid by employee to waive notice period</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBuyoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyoutNoticePeriod}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Process Buyout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CRUD Modals for Clearances */}
        <FormModal
          isOpen={clearanceModalOpen}
          onClose={() => {
            setClearanceModalOpen(false);
            setEditingClearance(null);
          }}
          title={editingClearance ? 'Edit Clearance' : 'Add Clearance'}
          onSubmit={() => {
            const form = document.querySelector('#clearance-form') as HTMLFormElement;
            if (form) {
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              form.dispatchEvent(submitEvent);
            }
          }}
          isSubmitting={isSubmitting}
        >
          <form id="clearance-form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitClearance(Object.fromEntries(formData));
          }}>
            <ClearanceForm
              clearance={editingClearance}
              onSubmit={handleSubmitClearance}
              isSubmitting={isSubmitting}
            />
          </form>
        </FormModal>

        <DeleteConfirmModal
          isOpen={deleteClearanceId !== null}
          onClose={() => setDeleteClearanceId(null)}
          onConfirm={handleDeleteClearance}
          title="Delete Clearance"
          message="Are you sure you want to delete this clearance record?"
          itemName="Clearance"
          isDeleting={isSubmitting}
        />

        {/* CRUD Modals for Assets */}
        <FormModal
          isOpen={assetModalOpen}
          onClose={() => {
            setAssetModalOpen(false);
            setEditingAsset(null);
          }}
          title={editingAsset ? 'Edit Asset Return' : 'Record Asset Return'}
          onSubmit={() => {
            const form = document.querySelector('#asset-form') as HTMLFormElement;
            if (form) {
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              form.dispatchEvent(submitEvent);
            }
          }}
          isSubmitting={isSubmitting}
        >
          <form id="asset-form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitAsset(Object.fromEntries(formData));
          }}>
            <AssetReturnForm
              asset={editingAsset}
              onSubmit={handleSubmitAsset}
              isSubmitting={isSubmitting}
            />
          </form>
        </FormModal>

        <DeleteConfirmModal
          isOpen={deleteAssetId !== null}
          onClose={() => setDeleteAssetId(null)}
          onConfirm={handleDeleteAsset}
          title="Delete Asset"
          message="Are you sure you want to delete this asset record?"
          itemName="Asset"
          isDeleting={isSubmitting}
        />

        {/* CRUD Modals for Exit Interview */}
        <FormModal
          isOpen={interviewModalOpen}
          onClose={() => {
            setInterviewModalOpen(false);
            setEditingInterview(false);
          }}
          title={editingInterview ? 'Edit Exit Interview' : 'Submit Exit Interview'}
          onSubmit={() => {
            const form = document.querySelector('#interview-form') as HTMLFormElement;
            if (form) {
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              form.dispatchEvent(submitEvent);
            }
          }}
          isSubmitting={isSubmitting}
        >
          <form id="interview-form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitExitInterview(Object.fromEntries(formData));
          }}>
            <ExitInterviewForm
              interview={exitCase?.exitInterview}
              onSubmit={handleSubmitExitInterview}
              isSubmitting={isSubmitting}
            />
          </form>
        </FormModal>

        {/* CRUD Modals for Settlement */}
        <FormModal
          isOpen={settlementModalOpen}
          onClose={() => {
            setSettlementModalOpen(false);
            setEditingSettlement(false);
          }}
          title={editingSettlement ? 'Edit Settlement' : 'Create Settlement'}
          onSubmit={() => {
            const form = document.querySelector('#settlement-form') as HTMLFormElement;
            if (form) {
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              form.dispatchEvent(submitEvent);
            }
          }}
          isSubmitting={isSubmitting}
        >
          <form id="settlement-form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmitSettlement(Object.fromEntries(formData));
          }}>
            <SettlementForm
              settlement={exitCase?.settlement}
              onSubmit={handleSubmitSettlement}
              isSubmitting={isSubmitting}
            />
          </form>
        </FormModal>

        {/* CRUD Modals for Documents */}
        <FormModal
          isOpen={documentModalOpen}
          onClose={() => {
            setDocumentModalOpen(false);
            setEditingDocument(null);
          }}
          title={editingDocument ? 'Edit Document' : 'Upload Document'}
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
            />
          </form>
        </FormModal>

        <DeleteConfirmModal
          isOpen={deleteDocumentId !== null}
          onClose={() => setDeleteDocumentId(null)}
          onConfirm={handleDeleteDocument}
          title="Delete Document"
          message="Are you sure you want to delete this document? This action cannot be undone."
          itemName="Document"
          isDeleting={isSubmitting}
        />
      </div>
    </ModernLayout>
  );
}
