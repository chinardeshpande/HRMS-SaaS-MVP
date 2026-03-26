import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import exitService from '../services/exitService';
import { FormModal } from '../components/common/FormModal';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditButton, DeleteButton, AddButton } from '../components/common/ActionButtons';
import { ClearanceForm } from '../components/exit/ClearanceForm';
import { AssetReturnForm } from '../components/exit/AssetReturnForm';
import { ExitInterviewForm } from '../components/exit/ExitInterviewForm';
import { SettlementForm } from '../components/exit/SettlementForm';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function ExitCaseDetailsCRUD() {
  const { exitId } = useParams<{ exitId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'clearances' | 'assets' | 'interview' | 'settlement'>('clearances');
  const [loading, setLoading] = useState(false);

  // Clearances data
  const [clearances, setClearances] = useState<any[]>([]);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [editingClearance, setEditingClearance] = useState<any | null>(null);
  const [deleteClearanceId, setDeleteClearanceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assets data
  const [assets, setAssets] = useState<any[]>([]);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  // Interview data
  const [interview, setInterview] = useState<any | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  // Settlement data
  const [settlement, setSettlement] = useState<any | null>(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);

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
  }, [exitId, activeTab]);

  const fetchData = async () => {
    if (!exitId) return;

    try {
      setLoading(true);
      if (activeTab === 'clearances') {
        const response = await exitService.getClearancesByExitId(exitId);
        setClearances(response.data || []);
      } else if (activeTab === 'assets') {
        const response = await exitService.getAssetsByExitId(exitId);
        setAssets(response.data || []);
      } else if (activeTab === 'interview') {
        const response = await exitService.getExitInterviewByExitId(exitId);
        setInterview(response.data);
      } else if (activeTab === 'settlement') {
        const response = await exitService.getSettlementByExitId(exitId);
        setSettlement(response.data);
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

  // Clearance CRUD
  const handleCreateClearance = () => {
    setEditingClearance(null);
    setClearanceModalOpen(true);
  };

  const handleEditClearance = (clearance: any) => {
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete clearance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asset CRUD
  const handleCreateAsset = () => {
    setEditingAsset(null);
    setAssetModalOpen(true);
  };

  const handleEditAsset = (asset: any) => {
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to delete asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interview CRUD
  const handleEditInterview = () => {
    setInterviewModalOpen(true);
  };

  const handleSubmitInterview = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (interview) {
        await exitService.updateExitInterview(interview.exitInterviewId, data);
        showNotification('Exit interview updated successfully', 'success');
      } else {
        await exitService.scheduleExitInterview(exitId!, data);
        showNotification('Exit interview scheduled successfully', 'success');
      }
      setInterviewModalOpen(false);
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save interview', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settlement CRUD
  const handleEditSettlement = () => {
    setSettlementModalOpen(true);
  };

  const handleSubmitSettlement = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (settlement) {
        await exitService.updateSettlement(settlement.settlementId, data);
        showNotification('Settlement updated successfully', 'success');
      } else {
        await exitService.calculateSettlement(exitId!, data);
        showNotification('Settlement calculated successfully', 'success');
      }
      setSettlementModalOpen(false);
      fetchData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to save settlement', 'error');
    } finally {
      setIsSubmitting(false);
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
            onClick={() => navigate('/exit')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Exit Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Exit Case Details - CRUD Demo</h1>
          <p className="text-sm text-gray-600 mt-1">Fully functional create, edit, and delete operations</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'clearances', label: 'Clearances', icon: ShieldCheckIcon },
                { id: 'assets', label: 'Assets', icon: CubeIcon },
                { id: 'interview', label: 'Exit Interview', icon: ChatBubbleLeftRightIcon },
                { id: 'settlement', label: 'Settlement', icon: BanknotesIcon },
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
            {/* Clearances Tab */}
            {activeTab === 'clearances' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Department Clearances</h3>
                  <AddButton onClick={handleCreateClearance} label="Add Clearance" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : clearances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No clearances found. Click "Add Clearance" to create one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clearances.map((clearance) => (
                      <div
                        key={clearance.clearanceId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{clearance.department}</h4>
                            <p className="text-sm text-gray-600">Approver: {clearance.approverName}</p>
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditClearance(clearance)} />
                            <DeleteButton onClick={() => setDeleteClearanceId(clearance.clearanceId)} />
                          </div>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              clearance.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : clearance.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {clearance.status}
                          </span>
                        </div>
                        {clearance.remarks && (
                          <p className="text-xs text-gray-600 mt-2 italic">{clearance.remarks}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Company Assets</h3>
                  <AddButton onClick={handleCreateAsset} label="Record Asset" size="sm" />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No assets found. Click "Record Asset" to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assets.map((asset) => (
                      <div
                        key={asset.assetId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{asset.assetName}</h4>
                            <p className="text-sm text-gray-600">Type: {asset.assetType}</p>
                            {asset.assetTag && (
                              <p className="text-xs text-gray-500">Tag: {asset.assetTag}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <EditButton onClick={() => handleEditAsset(asset)} />
                            <DeleteButton onClick={() => setDeleteAssetId(asset.assetId)} />
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              asset.condition === 'good'
                                ? 'bg-green-100 text-green-800'
                                : asset.condition === 'fair'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {asset.condition}
                          </span>
                          {asset.isReturned && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Returned
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interview Tab */}
            {activeTab === 'interview' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exit Interview</h3>
                  <AddButton
                    onClick={handleEditInterview}
                    label={interview ? 'Edit Interview' : 'Schedule Interview'}
                    size="sm"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : interview ? (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold">{interview.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Scheduled Date</p>
                        <p className="font-semibold">
                          {interview.scheduledDate
                            ? new Date(interview.scheduledDate).toLocaleDateString()
                            : 'Not scheduled'}
                        </p>
                      </div>
                      {interview.satisfactionRating && (
                        <div>
                          <p className="text-sm text-gray-600">Satisfaction Rating</p>
                          <p className="font-semibold">{interview.satisfactionRating} / 5</p>
                        </div>
                      )}
                      {interview.feedback && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Feedback</p>
                          <p className="text-sm text-gray-900">{interview.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No exit interview scheduled. Click "Schedule Interview" to create one.
                  </div>
                )}
              </div>
            )}

            {/* Settlement Tab */}
            {activeTab === 'settlement' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Final Settlement</h3>
                  <AddButton
                    onClick={handleEditSettlement}
                    label={settlement ? 'Edit Settlement' : 'Calculate Settlement'}
                    size="sm"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : settlement ? (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Gross Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{settlement.grossAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Deductions</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{settlement.totalDeductions?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Net Payable</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{settlement.netAmount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          settlement.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : settlement.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {settlement.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No settlement calculated. Click "Calculate Settlement" to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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

      <FormModal
        isOpen={assetModalOpen}
        onClose={() => {
          setAssetModalOpen(false);
          setEditingAsset(null);
        }}
        title={editingAsset ? 'Edit Asset' : 'Record Asset'}
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

      <FormModal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        title={interview ? 'Edit Exit Interview' : 'Schedule Exit Interview'}
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
          handleSubmitInterview(Object.fromEntries(formData));
        }}>
          <ExitInterviewForm
            interview={interview}
            onSubmit={handleSubmitInterview}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      <FormModal
        isOpen={settlementModalOpen}
        onClose={() => setSettlementModalOpen(false)}
        title={settlement ? 'Edit Settlement' : 'Calculate Settlement'}
        onSubmit={() => {
          const form = document.querySelector('#settlement-form') as HTMLFormElement;
          if (form) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            form.dispatchEvent(submitEvent);
          }
        }}
        isSubmitting={isSubmitting}
        maxWidth="4xl"
      >
        <form id="settlement-form" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSubmitSettlement(Object.fromEntries(formData));
        }}>
          <SettlementForm
            settlement={settlement}
            onSubmit={handleSubmitSettlement}
            isSubmitting={isSubmitting}
          />
        </form>
      </FormModal>

      <DeleteConfirmModal
        isOpen={deleteClearanceId !== null}
        onClose={() => setDeleteClearanceId(null)}
        onConfirm={handleDeleteClearance}
        title="Delete Clearance"
        message="Are you sure you want to delete this clearance?"
        itemName="Clearance record"
        isDeleting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={deleteAssetId !== null}
        onClose={() => setDeleteAssetId(null)}
        onConfirm={handleDeleteAsset}
        title="Delete Asset"
        message="Are you sure you want to delete this asset?"
        itemName="Asset record"
        isDeleting={isSubmitting}
      />
    </ModernLayout>
  );
}
