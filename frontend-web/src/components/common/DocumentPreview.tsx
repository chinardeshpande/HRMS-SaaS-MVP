import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface Document {
  documentId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadedDate?: string;
  uploadedBy?: string;
  size?: string;
}

interface DocumentPreviewProps {
  documents: Document[];
  onDownload?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  showDelete?: boolean;
}

export default function DocumentPreview({ documents, onDownload, onDelete, showDelete = false }: DocumentPreviewProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewDocument) {
        handleClosePreview();
      }
    };

    if (previewDocument) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [previewDocument]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return PhotoIcon;
    } else if (['pdf'].includes(extension || '')) {
      return DocumentTextIcon;
    }
    return DocumentIcon;
  };

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (['pdf'].includes(extension || '')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isImage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const isPDF = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  };

  const handlePreview = (document: Document) => {
    setPreviewDocument(document);
  };

  const handleClosePreview = () => {
    setPreviewDocument(null);
  };

  const handleDownload = (document: Document) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.fileName;
      link.click();
    }
  };

  return (
    <>
      {/* Document Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {documents.map((doc) => {
          const FileIcon = getFileIcon(doc.fileName);
          const colorClass = getFileTypeColor(doc.fileName);

          return (
            <div
              key={doc.documentId}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer"
              onClick={() => handlePreview(doc)}
            >
              {/* Thumbnail */}
              <div className={`aspect-square flex items-center justify-center ${colorClass}`}>
                {isImage(doc.fileName) ? (
                  <img
                    src={doc.fileUrl}
                    alt={doc.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-8 w-8" />
                )}
              </div>

              {/* File Info */}
              <div className="p-1.5">
                <p className="text-xs font-medium text-gray-900 truncate" title={doc.fileName}>
                  {doc.fileName}
                </p>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc);
                    }}
                    className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-gray-700" />
                  </button>
                  {showDelete && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.documentId);
                      }}
                      className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <XMarkIcon className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal - Rendered using Portal */}
      {previewDocument && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4"
          onClick={handleClosePreview}
        >
          <div
            ref={modalRef}
            className="relative bg-white rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{previewDocument.fileName}</h3>
                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                  {previewDocument.uploadedDate && (
                    <span>Uploaded: {new Date(previewDocument.uploadedDate).toLocaleDateString()}</span>
                  )}
                  {previewDocument.uploadedBy && <span>By: {previewDocument.uploadedBy}</span>}
                  {previewDocument.size && <span>Size: {previewDocument.size}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(previewDocument)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleClosePreview}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close (Esc)"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              {isImage(previewDocument.fileName) ? (
                <div className="flex items-center justify-center min-h-full">
                  <img
                    src={previewDocument.fileUrl}
                    alt={previewDocument.fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : isPDF(previewDocument.fileName) ? (
                <iframe
                  src={previewDocument.fileUrl}
                  className="w-full h-full min-h-[600px] rounded-lg shadow-lg"
                  title={previewDocument.fileName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-600">
                  <DocumentIcon className="h-24 w-24 mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Preview not available</p>
                  <p className="text-sm mb-4">This file type cannot be previewed in the browser</p>
                  <button
                    onClick={() => handleDownload(previewDocument)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
