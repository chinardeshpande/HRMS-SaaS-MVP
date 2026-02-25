import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import exitService from '../services/exitService';
import ExitStatusChip from '../components/exit/ExitStatusChip';
import ExitProgressTracker from '../components/exit/ExitProgressTracker';
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
      <div className="space-y-6">
        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
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
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Exit Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {exitCase.employee.firstName} {exitCase.employee.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                {exitCase.employee.employeeCode} • {exitCase.employee.email}
              </p>
            </div>
            <div className="flex gap-2">
              <ExitStatusChip state={exitCase.currentState} />
            </div>
          </div>
        </div>

        {/* Exit Progress Tracker */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Exit Progress Tracker</h2>
          <p className="text-sm text-gray-600 mb-6">Track milestones and exit completion status</p>
          <ExitProgressTracker currentState={exitCase.currentState} lastWorkingDate={exitCase.lastWorkingDate} />
        </div>

        {/* Summary Cards - 3 column grid like probation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clearances Progress */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-gray-600">Clearances Progress</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {exitCase.totalClearances > 0
                    ? Math.round((exitCase.completedClearances / exitCase.totalClearances) * 100)
                    : 0}
                  %
                </div>
              </div>
              <ShieldCheckIcon className="h-12 w-12 text-indigo-400" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
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
            className={`rounded-lg border-2 p-6 ${
              daysRemaining < 0
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                : daysRemaining < 7
                ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-gray-600">Days Remaining</div>
                <div
                  className={`text-3xl font-bold ${
                    daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  {daysRemaining}
                </div>
              </div>
              <ClockIcon
                className={`h-12 w-12 ${
                  daysRemaining < 0 ? 'text-red-400' : daysRemaining < 7 ? 'text-orange-400' : 'text-green-400'
                }`}
              />
            </div>
            <div className="text-xs text-gray-600">Until {new Date(exitCase.lastWorkingDate).toLocaleDateString()}</div>
          </div>

          {/* Assets Returned */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-medium text-gray-600">Assets Returned</div>
                <div className="text-3xl font-bold text-orange-600">
                  {exitCase.returnedAssets}/{exitCase.totalAssets}
                </div>
              </div>
              <CubeIcon className="h-12 w-12 text-orange-400" />
            </div>
            {exitCase.allAssetsReturned && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Employee Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department</p>
                      <p className="text-base text-gray-900">{exitCase.employee.department?.departmentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Designation</p>
                      <p className="text-base text-gray-900">{exitCase.employee.designation?.designationName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resignation Type</p>
                      <p className="text-base text-gray-900">{exitCase.resignationType.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notice Period</p>
                      <p className="text-base text-gray-900">{exitCase.noticePeriodDays} days</p>
                    </div>
                  </div>
                </div>

                {/* Resignation Reason */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resignation Reason</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Primary Reason</p>
                      <p className="text-base text-gray-900">{exitCase.resignationReason}</p>
                    </div>
                    {exitCase.detailedReason && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Detailed Reason</p>
                        <p className="text-base text-gray-900">{exitCase.detailedReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Resignation Submitted</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(exitCase.resignationSubmittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Working Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(exitCase.lastWorkingDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rehire Eligibility */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rehire Eligibility</h3>
                  <div className="flex items-center gap-3">
                    {exitCase.isEligibleForRehire ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <span className="text-base text-gray-900">Eligible for Rehire</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                        <span className="text-base text-gray-900">Not Eligible for Rehire</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clearances' && (
              <div className="text-center py-12">
                <ShieldCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Clearance tracking view</p>
                <p className="text-gray-400 text-sm mt-2">Department-wise clearance status will be shown here</p>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="text-center py-12">
                <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Asset return tracking view</p>
                <p className="text-gray-400 text-sm mt-2">List of assets to be returned will be shown here</p>
              </div>
            )}

            {activeTab === 'interview' && (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Exit interview form</p>
                <p className="text-gray-400 text-sm mt-2">
                  {exitCase.exitInterviewCompleted ? 'Interview completed' : 'Schedule or conduct exit interview'}
                </p>
              </div>
            )}

            {activeTab === 'settlement' && (
              <div className="text-center py-12">
                <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Final settlement calculation</p>
                <p className="text-gray-400 text-sm mt-2">Settlement breakdown and payment details will be shown here</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Actions */}
        {(exitCase.currentState === 'resignation_submitted' || exitCase.currentState === 'resignation_approved') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>
            <div className="flex gap-3">
              {exitCase.currentState === 'resignation_submitted' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Resignation
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Reject Resignation
                  </button>
                </>
              )}
              {exitCase.currentState === 'resignation_approved' && (
                <button
                  onClick={() => setShowBuyoutModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
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
      </div>
    </ModernLayout>
  );
}
