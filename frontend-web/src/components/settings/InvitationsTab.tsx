import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserPlusIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Invitation {
  invitationId: string;
  email: string;
  fullName: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
  tokenExpiry: string;
}

interface InviteFormData {
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
}

const InvitationsTab: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    fullName: '',
    role: 'employee',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invitations');
      if (response.data.success) {
        setInvitations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.fullName || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/invitations', formData);

      if (response.data.success) {
        alert('Invitation sent successfully!');
        setShowModal(false);
        setFormData({ email: '', fullName: '', role: 'employee' });
        await loadInvitations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await api.post(`/invitations/resend/${invitationId}`);
      if (response.data.success) {
        alert('Invitation resent successfully!');
        await loadInvitations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const response = await api.delete(`/invitations/${invitationId}`);
      if (response.data.success) {
        alert('Invitation cancelled successfully!');
        await loadInvitations();
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; text: string }> = {
      pending: {
        icon: ClockIcon,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Pending',
      },
      accepted: {
        icon: CheckCircleIcon,
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Accepted',
      },
      expired: {
        icon: XCircleIcon,
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Expired',
      },
      cancelled: {
        icon: XCircleIcon,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        text: 'Cancelled',
      },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap: Record<string, string> = {
      system_admin: 'System Admin',
      hr_admin: 'HR Admin',
      manager: 'Manager',
      employee: 'Employee',
    };
    return roleMap[role] || role;
  };

  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch =
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    accepted: invitations.filter((i) => i.status === 'accepted').length,
    expired: invitations.filter((i) => i.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards and Send Invitation Button in One Row */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3">
        {/* Stats Cards */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Invitations */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md hover:scale-105 p-3 text-left ${
              statusFilter === 'all' ? 'border-purple-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Invitations</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
              </div>
              <EnvelopeIcon className="w-8 h-8 text-gray-400" />
            </div>
          </button>

          {/* Pending */}
          <button
            onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md hover:scale-105 p-3 text-left ${
              statusFilter === 'pending' ? 'border-yellow-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-xl font-bold text-yellow-600 mt-0.5">{stats.pending}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </button>

          {/* Accepted */}
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md hover:scale-105 p-3 text-left ${
              statusFilter === 'accepted' ? 'border-green-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Accepted</p>
                <p className="text-xl font-bold text-green-600 mt-0.5">{stats.accepted}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            </div>
          </button>

          {/* Expired */}
          <button
            onClick={() => setStatusFilter('expired')}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md hover:scale-105 p-3 text-left ${
              statusFilter === 'expired' ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Expired</p>
                <p className="text-xl font-bold text-red-600 mt-0.5">{stats.expired}</p>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-400" />
            </div>
          </button>
        </div>

        {/* Send Invitation Button */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all hover:shadow-lg flex items-center justify-center gap-2 shadow-sm whitespace-nowrap lg:w-auto"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span className="font-medium">Send Invitation</span>
        </button>
      </div>

      {/* Search Only */}
      <div>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No invitations found</p>
            <p className="text-gray-400 text-sm mt-2">Send your first invitation to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.invitationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invitation.fullName}</div>
                        <div className="text-sm text-gray-500">{invitation.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getRoleDisplayName(invitation.role)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invitation.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.tokenExpiry).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResendInvitation(invitation.invitationId)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="Resend invitation"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(invitation.invitationId)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              title="Cancel invitation"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                        {invitation.status === 'expired' && (
                          <button
                            onClick={() => handleResendInvitation(invitation.invitationId)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                            Resend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Invitation</h3>
              <p className="text-sm text-gray-600 mt-1">Invite a new user to join your organization</p>
            </div>

            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr_admin">HR Admin</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <PaperAirplaneIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Invitation will be sent via email</p>
                    <p className="mt-1">The recipient will receive an email with a link to set up their account. The invitation will be valid for 7 days.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ email: '', fullName: '', role: 'employee' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationsTab;
