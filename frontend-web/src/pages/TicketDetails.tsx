import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import ticketService, { HRTicket, TicketComment } from '../services/ticketService';
import {
  ArrowLeftIcon,
  PaperClipIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<HRTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicketById(ticketId!);
      setTicket(data);
      // Mock comments - in real app, fetch from API
      setComments([
        {
          commentId: '1',
          ticketId: data.ticketId,
          userId: 'hr-agent',
          userName: 'Sarah Williams (HR)',
          comment: 'Thank you for raising this ticket. I\'m looking into this matter and will update you shortly.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          commentId: '2',
          ticketId: data.ticketId,
          userId: 'current',
          userName: 'You',
          comment: 'Thanks! I really need this resolved urgently as it\'s affecting my work.',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await ticketService.addComment(ticketId!, newComment);
      const newCommentObj: TicketComment = {
        commentId: Date.now().toString(),
        ticketId: ticketId!,
        userId: 'current',
        userName: 'You',
        comment: newComment,
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus || !ticket) return;

    try {
      await ticketService.updateTicket(ticket.ticketId, { status: selectedStatus });
      setTicket({ ...ticket, status: selectedStatus as any });
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_response: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffMs = now.getTime() - commentTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return formatDate(timestamp);
  };

  if (loading) {
    return (
      <ModernLayout title="Ticket Details">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
        </div>
      </ModernLayout>
    );
  }

  if (!ticket) {
    return (
      <ModernLayout title="Ticket Details">
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket not found</p>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout title="Ticket Details">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/hr-connect?tab=helpdesk')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Helpdesk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">{ticket.ticketId}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 capitalize">{ticket.category}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{ticket.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.attachmentId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            {attachment.fileSize && (
                              <p className="text-xs text-gray-500">{attachment.fileSize}</p>
                            )}
                          </div>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700">
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Comments ({comments.length})
                </h2>
              </div>
            </div>
            <div className="card-body">
              {/* Comments List */}
              <div className="space-y-4 mb-6">
                {comments.map((comment) => {
                  const isCurrentUser = comment.userId === 'current';
                  return (
                    <div key={comment.commentId} className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-pink-500 to-rose-600'
                      }`}>
                        {comment.userName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                          <span className="text-xs text-gray-500">{getRelativeTime(comment.createdAt)}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    Y
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || submitting}
                        className={`btn btn-primary ${
                          !newComment.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        {submitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="btn btn-primary w-full justify-start"
                  disabled={ticket.status === 'closed'}
                >
                  {getStatusIcon(ticket.status)}
                  <span className="ml-2">Change Status</span>
                </button>

                <button
                  className="btn btn-secondary w-full justify-start"
                >
                  <PaperClipIcon className="h-5 w-5" />
                  <span className="ml-2">Add Attachment</span>
                </button>

                {ticket.status !== 'closed' && (
                  <button
                    onClick={() => {
                      setSelectedStatus('closed');
                      handleStatusChange();
                    }}
                    className="btn btn-outline-danger w-full justify-start"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    <span className="ml-2">Close Ticket</span>
                  </button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Ticket created</p>
                      <p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                  {ticket.status === 'in_progress' && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Status changed to In Progress</p>
                        <p className="text-xs text-gray-500">{formatDate(ticket.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  {ticket.resolvedAt && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Ticket resolved</p>
                        <p className="text-xs text-gray-500">{formatDate(ticket.resolvedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Ticket Status</h3>
            <div className="space-y-2 mb-6">
              {['open', 'in_progress', 'waiting_response', 'resolved', 'closed'].map((status) => (
                <label
                  key={status}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3"
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus}
                className="btn btn-primary flex-1"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
