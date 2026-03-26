import React, { useState } from 'react';
import {
  DocumentIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface Document {
  documentId: string;
  documentType: string;
  category: string;
  fileName: string;
  filePath: string;
  isRequired: boolean;
  requiresSignature: boolean;
  isSigned: boolean;
  signedDate?: Date;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedDate?: Date;
  createdAt: Date;
}

interface DocumentVaultProps {
  documents: Document[];
  onUpload?: (file: File, documentType: string) => void;
  onVerify?: (documentId: string, status: string, notes?: string) => void;
  onSign?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  isHR?: boolean;
  isCandidate?: boolean;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  onUpload,
  onVerify,
  onSign,
  onDownload,
  isHR = false,
  isCandidate = false,
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const getStatusIcon = (doc: Document) => {
    if (doc.verificationStatus === 'verified') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (doc.verificationStatus === 'rejected') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    } else if (doc.verificationStatus === 'uploaded') {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <DocumentIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      verified: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      uploaded: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      missing: 'bg-orange-100 text-orange-800 border-orange-300',
    };

    return badges[status] || badges.pending;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file, documentType);
    }
  };

  const handleVerify = (documentId: string, status: 'verified' | 'rejected') => {
    if (onVerify) {
      onVerify(documentId, status, verificationNotes);
      setSelectedDocument(null);
      setVerificationNotes('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Document Vault</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {documents.filter(d => d.verificationStatus === 'verified').length} / {documents.filter(d => d.isRequired).length} Required Docs
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.documentId}
            className={`border rounded-lg p-4 ${doc.isRequired ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Icon */}
                <div className="mt-1">{getStatusIcon(doc)}</div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {doc.fileName || doc.documentType.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    {doc.isRequired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Required
                      </span>
                    )}
                    {doc.requiresSignature && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Signature Required
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="capitalize">{doc.category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getStatusBadge(doc.verificationStatus)}`}>
                      {doc.verificationStatus.charAt(0).toUpperCase() + doc.verificationStatus.slice(1)}
                    </span>
                    {doc.isSigned && (
                      <>
                        <span>•</span>
                        <span className="flex items-center text-green-600">
                          <DocumentCheckIcon className="h-4 w-4 mr-1" />
                          Signed
                        </span>
                      </>
                    )}
                  </div>

                  {doc.verifiedDate && (
                    <p className="mt-1 text-xs text-gray-500">
                      Verified on {new Date(doc.verifiedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Upload (Candidate) */}
                {isCandidate && doc.verificationStatus === 'pending' && onUpload && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, doc.documentType)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                      Upload
                    </button>
                  </label>
                )}

                {/* Sign */}
                {doc.requiresSignature && !doc.isSigned && doc.verificationStatus === 'verified' && onSign && (
                  <button
                    onClick={() => onSign(doc.documentId)}
                    className="inline-flex items-center px-3 py-1.5 border border-purple-300 shadow-sm text-xs font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
                  >
                    <DocumentCheckIcon className="h-4 w-4 mr-1" />
                    Sign
                  </button>
                )}

                {/* Download */}
                {doc.verificationStatus !== 'pending' && onDownload && (
                  <button
                    onClick={() => onDownload(doc.documentId)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                )}

                {/* Verify (HR) */}
                {isHR && doc.verificationStatus === 'uploaded' && onVerify && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVerify(doc.documentId, 'verified')}
                      className="inline-flex items-center px-2 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
                      title="Approve"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedDocument(doc.documentId)}
                      className="inline-flex items-center px-2 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      title="Reject"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Notes */}
            {selectedDocument === doc.documentId && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter reason for rejection..."
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDocument(null);
                      setVerificationNotes('');
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerify(doc.documentId, 'rejected')}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Documents will appear here once uploaded
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
