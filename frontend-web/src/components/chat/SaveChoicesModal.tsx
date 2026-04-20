import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, BookmarkIcon, FolderIcon, TagIcon } from '@heroicons/react/24/outline';

interface SaveChoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileSize: number;
  fileType: string;
  isOwnedByMe: boolean;
  permissions: {
    canDownloadLocally: boolean;
    canSaveToLibrary: boolean;
    isPaid: boolean;
    accessLevel?: string;
    reason?: string;
  };
  onDownloadLocal: () => void;
  onSaveToLibrary: (options: {
    category?: string;
    tags?: string[];
    description?: string;
  }) => void;
}

const SaveChoicesModal: React.FC<SaveChoicesModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileSize,
  fileType,
  isOwnedByMe,
  permissions,
  onDownloadLocal,
  onSaveToLibrary,
}) => {
  const [selectedOption, setSelectedOption] = useState<'download' | 'library' | null>(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string>('');
  const [description, setDescription] = useState('');
  const [showLibraryFields, setShowLibraryFields] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedOption === 'download') {
      onDownloadLocal();
    } else if (selectedOption === 'library') {
      onSaveToLibrary({
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        description: description || undefined,
      });
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Save File</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* File Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {fileType.startsWith('image/') ? (
                <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
              {isOwnedByMe && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                  Your File
                </span>
              )}
              {permissions.isPaid && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1 ml-2">
                  Paid Resource
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Download Locally Option */}
          {permissions.canDownloadLocally && (
            <div
              onClick={() => setSelectedOption('download')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedOption === 'download'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <ArrowDownTrayIcon className={`w-6 h-6 flex-shrink-0 ${selectedOption === 'download' ? 'text-pink-600' : 'text-gray-600'}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Download to Device</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Save this file directly to your computer for offline access
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save to Library Option */}
          {permissions.canSaveToLibrary && (
            <div className="space-y-3">
              <div
                onClick={() => {
                  setSelectedOption('library');
                  setShowLibraryFields(true);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedOption === 'library'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <BookmarkIcon className={`w-6 h-6 flex-shrink-0 ${selectedOption === 'library' ? 'text-pink-600' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Save to Digital Library</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {permissions.isPaid
                        ? 'Keep this paid resource in your library for online access'
                        : 'Organize and access this file from your Digital Library'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Library Metadata Fields */}
              {showLibraryFields && selectedOption === 'library' && (
                <div className="pl-9 space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FolderIcon className="w-4 h-4" />
                      Category (optional)
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Work, Personal, Projects"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <TagIcon className="w-4 h-4" />
                      Tags (optional)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Separate with commas: design, mockup, ui"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a note about this file..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permission Denied Message */}
          {!permissions.canDownloadLocally && !permissions.canSaveToLibrary && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">
                {permissions.reason || 'You do not have permission to save this file.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              selectedOption
                ? 'bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {selectedOption === 'download' ? 'Download' : selectedOption === 'library' ? 'Save to Library' : 'Choose an option'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveChoicesModal;
