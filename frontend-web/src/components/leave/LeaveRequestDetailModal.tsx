import { useState } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface LeaveRequest {
  leaveId: string;  // Backend uses leaveId
  employeeId: string;
  tenantId: string;
  employee?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
    designation?: { name: string };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  emergencyContact?: string;
  attachmentUrl?: string;
  status: string;
  approverId?: string;
  approvedAt?: string;
  approverComments?: string;  // Backend uses approverComments
  createdAt: string;
  updatedAt: string;
}

interface LeaveRequestDetailModalProps {
  isOpen: boolean;
  request: LeaveRequest | null;
  onClose: () => void;
  onApprove?: (comments?: string) => void;
  onReject?: (comments?: string) => void;
  onCancel?: () => void;
  canApprove: boolean;
  canCancel?: boolean;
}

export const LeaveRequestDetailModal = ({
  isOpen,
  request,
  onClose,
  onApprove,
  onReject,
  onCancel,
  canApprove,
  canCancel = false,
}: LeaveRequestDetailModalProps) => {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  // Debug logging
  console.log('📋 Modal received request:', request);
  console.log('📋 Request keys:', Object.keys(request));
  console.log('📋 LeaveId:', request.leaveId);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApprove = () => {
    setShowApproveConfirm(false);
    const approvalComments = comments;
    setComments('');
    onApprove?.(approvalComments);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setShowRejectConfirm(false);
    const rejectComments = rejectionReason;
    setRejectionReason('');
    setError('');
    onReject?.(rejectComments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Leave Request Details</h2>
                <p className="text-sm text-purple-100">Request ID: {request.leaveId?.slice(0, 8) || 'N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                request.status
              )}`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>

          {/* Employee Info */}
          {request.employee && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {request.employee.firstName?.charAt(0)}
                    {request.employee.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {request.employee.firstName} {request.employee.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{request.employee.email}</p>
                  {request.employee.department && (
                    <p className="text-sm text-gray-500">{request.employee.department.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Leave Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Leave Type</p>
              <p className="font-semibold text-gray-900">{request.leaveType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-semibold text-gray-900">{request.numberOfDays} days</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Start Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(request.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">End Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(request.endDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Reason for Leave</p>
            <p className="text-gray-900">{request.reason}</p>
          </div>

          {/* Emergency Contact */}
          {request.emergencyContact && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Emergency Contact</p>
              <p className="text-gray-900">{request.emergencyContact}</p>
            </div>
          )}

          {/* Applied On */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Applied On</p>
            <p className="text-gray-900">
              {new Date(request.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Approval/Rejection Info */}
          {request.status === 'approved' && request.approvedAt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Approved</p>
                  <p className="text-sm text-green-700">
                    {new Date(request.approvedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {request.approverComments && (
                    <p className="text-sm text-green-700 mt-2 italic">"{request.approverComments}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {request.status === 'rejected' && request.approverComments && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">Rejected</p>
                  <p className="text-sm text-red-700">{request.approverComments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canCancel && request.status === 'pending' && (
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (window.confirm('Cancel this pending leave request? The reserved leave balance will be restored.')) {
                    onCancel?.();
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel request
              </button>
            </div>
          )}

          {canApprove && request.status === 'pending' && !showApproveConfirm && !showRejectConfirm && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <XCircleIcon className="w-5 h-5" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>Approve</span>
              </button>
            </div>
          )}

          {/* Approve Confirmation */}
          {showApproveConfirm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <p className="font-semibold text-green-900">Approve this leave request?</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Add any comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setComments('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>Confirm Approval</span>
                </button>
              </div>
            </div>
          )}

          {/* Reject Confirmation */}
          {showRejectConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <p className="font-semibold text-red-900">Reject this leave request?</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
