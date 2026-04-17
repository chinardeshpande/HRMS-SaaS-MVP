import { useState, useEffect, useRef } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import invitationService, { Invitation, InviteUserData } from '../services/invitationService';
import departmentService, { Department } from '../services/departmentService';
import {
  EnvelopeIcon,
  UserPlusIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export default function ModernInvitations() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'tracking'>('single');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Single Invite State
  const [singleFormData, setSingleFormData] = useState<InviteUserData>({
    email: '',
    fullName: '',
    role: 'EMPLOYEE',
    departmentId: undefined,
  });

  // Bulk Invite State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDepartments();
    fetchInvitations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationService.getInvitations();
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await invitationService.sendInvitation(singleFormData);
      setSuccess(`Invitation sent to ${singleFormData.email} successfully!`);
      setSingleFormData({
        email: '',
        fullName: '',
        role: 'EMPLOYEE',
        departmentId: undefined,
      });
      await fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');
    setBulkResult(null);

    try {
      // Parse CSV
      const fileContent = await bulkFile.text();
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one data row');
      }

      // Skip header row
      const users: InviteUserData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 3) {
          users.push({
            email: parts[0],
            fullName: parts[1],
            role: parts[2] || 'EMPLOYEE',
            departmentId: parts[3] || undefined,
          });
        }
      }

      const result = await invitationService.bulkInvite(users);
      setBulkResult(result);
      await fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Bulk invite failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvTemplate = [
      'email,fullName,role,departmentId',
      'john.doe@company.com,John Doe,EMPLOYEE,dept-id-optional',
      'jane.smith@company.com,Jane Smith,MANAGER,dept-id-optional',
    ].join('\n');

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invitation_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResend = async (invitationId: string) => {
    try {
      await invitationService.resendInvitation(invitationId);
      setSuccess('Invitation resent successfully');
      await fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to resend invitation');
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await invitationService.cancelInvitation(invitationId);
      setSuccess('Invitation cancelled');
      await fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { className: 'badge-warning', icon: ClockIcon },
      accepted: { className: 'badge-success', icon: CheckCircleIcon },
      expired: { className: 'badge-danger', icon: XCircleIcon },
      cancelled: { className: 'badge-gray', icon: XCircleIcon },
    };
    const config = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`badge ${config.className} flex items-center`}>
        <config.icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Invitations</h1>
                <p className="text-sm text-gray-600">Invite users to join your organization</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 mt-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'single' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Single Invite</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'bulk' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              <span>Bulk Invite</span>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'tracking' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              <span>Track Invitations</span>
              {invitations.filter(i => i.status === 'pending').length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  {invitations.filter(i => i.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'single' && (
            <form onSubmit={handleSingleInvite} className="max-w-2xl space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Send Invitation</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={singleFormData.fullName}
                    onChange={(e) => setSingleFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={singleFormData.email}
                    onChange={(e) => setSingleFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={singleFormData.role}
                    onChange={(e) => setSingleFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department (Optional)
                  </label>
                  <select
                    value={singleFormData.departmentId || ''}
                    onChange={(e) => setSingleFormData(prev => ({ ...prev, departmentId: e.target.value || undefined }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">No department</option>
                    {departments.map(dept => (
                      <option key={dept.departmentId} value={dept.departmentId}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}

          {activeTab === 'bulk' && (
            <div className="max-w-3xl space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Invite via CSV</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>CSV Format:</strong> email, fullName, role, departmentId (optional)
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                  Download Template
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  bulkFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {bulkFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    <span className="text-green-700 font-medium">{bulkFile.name}</span>
                  </div>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Click to select CSV file</p>
                  </>
                )}
              </div>

              <button
                onClick={handleBulkUpload}
                disabled={!bulkFile || loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send Bulk Invitations'}
              </button>

              {bulkResult && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Successful</p>
                      <p className="text-2xl font-bold text-green-900">{bulkResult.successful}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600 font-medium">Failed</p>
                      <p className="text-2xl font-bold text-red-900">{bulkResult.failed}</p>
                    </div>
                  </div>

                  {bulkResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-semibold text-red-900 mb-2">Errors:</p>
                      <div className="space-y-1">
                        {bulkResult.errors.map((err: any, idx: number) => (
                          <p key={idx} className="text-sm text-red-800">
                            {err.email}: {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">All Invitations</h3>
                <button
                  onClick={fetchInvitations}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Invited</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((inv) => (
                      <tr key={inv.invitationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.fullName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{inv.role}</td>
                        <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(inv.invitedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {inv.status === 'pending' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleResend(inv.invitationId)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => handleCancel(inv.invitationId)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {invitations.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No invitations found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}
