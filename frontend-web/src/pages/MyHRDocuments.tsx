import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import DocumentViewerModal from '../components/common/DocumentViewerModal';
import { digitalLibraryService, LibraryItem } from '../services/digitalLibraryService';
import { documentCategoryService, DocumentCategory } from '../services/documentCategoryService';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const MyHRDocuments: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<LibraryItem[]>([]);
  const [allDocuments, setAllDocuments] = useState<LibraryItem[]>([]); // Store all docs for counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [dbCategories, setDbCategories] = useState<DocumentCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [viewingDocument, setViewingDocument] = useState<LibraryItem | null>(null);

  const fileFormats = [
    { id: 'all', label: 'All Formats' },
    { id: 'image', label: 'Images' },
    { id: 'document', label: 'Documents' },
    { id: 'video', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory, selectedFormat, searchTerm]);

  useEffect(() => {
    loadAllDocuments();
    loadStats();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await documentCategoryService.getCategories();
      setDbCategories(fetchedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await documentCategoryService.createCategory({
        name: newCategoryName,
        description: newCategoryDescription || undefined,
      });

      // Reload categories
      await loadCategories();

      // Close modal and reset form
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
    } catch (error: any) {
      console.error('Failed to create category:', error);
      alert(error.message || 'Failed to create category');
    }
  };

  const loadAllDocuments = async () => {
    try {
      const response = await digitalLibraryService.getLibraryItems({});
      setAllDocuments(response.items || []);
    } catch (error) {
      console.error('Failed to load all documents for counts:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.searchTerm = searchTerm;
      }

      const response = await digitalLibraryService.getLibraryItems(params);
      let filteredDocs = response.items || [];

      // Client-side filtering by format
      if (selectedFormat !== 'all') {
        filteredDocs = filteredDocs.filter(doc => doc.resourceType === selectedFormat);
      }

      setDocuments(filteredDocs);

      // Update all documents if no filters applied
      if (selectedCategory === 'all' && !searchTerm && selectedFormat === 'all') {
        setAllDocuments(response.items || []);
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      setError(error.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await digitalLibraryService.getLibraryStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Don't set error for stats failure, just log it
    }
  };

  const handleDownload = async (doc: LibraryItem) => {
    try {
      const response = await digitalLibraryService.downloadFromLibrary(doc.libraryId);

      // Download file
      const link = document.createElement('a');
      link.href = response.fileUrl.startsWith('http')
        ? response.fileUrl
        : new URL(response.fileUrl, window.location.origin).toString();
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Reload to update download count
      loadDocuments();
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (doc: LibraryItem) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
      return;
    }

    try {
      await digitalLibraryService.deleteLibraryItem(doc.libraryId);
      loadDocuments();
      loadStats();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'image':
        return <PhotoIcon className="w-6 h-6" />;
      case 'video':
        return <VideoCameraIcon className="w-6 h-6" />;
      case 'audio':
        return <MusicalNoteIcon className="w-6 h-6" />;
      default:
        return <DocumentIcon className="w-6 h-6" />;
    }
  };

  const getResourceIconColor = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'image':
        return 'bg-green-50 text-green-600';
      case 'video':
        return 'bg-purple-50 text-purple-600';
      case 'audio':
        return 'bg-orange-50 text-orange-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return allDocuments.length;
    return allDocuments.filter(doc => doc.category === categoryId).length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ModernLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My HR Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Access and manage all your saved HR documents</p>
        </div>

        {/* Compact Filters Row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:min-w-[160px]"
            >
              <option value="all">All Categories ({getCategoryCount('all')})</option>
              {dbCategories.map((cat) => (
                <option key={cat.categoryId} value={cat.name}>
                  {cat.name} ({getCategoryCount(cat.name)})
                </option>
              ))}
            </select>

            {/* Format Filter Dropdown */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:min-w-[140px]"
            >
              {fileFormats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>

            {/* Add Category Button */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              title="Add Category"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Category</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-10 h-10 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to Load Documents</h3>
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <button
              onClick={loadDocuments}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Documents Grid */}
        {!error && loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : !error && documents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No documents found</h3>
            <p className="text-sm text-gray-500 mb-3">
              {searchTerm || selectedCategory !== 'all' || selectedFormat !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start saving documents from HR Connect to build your library'}
            </p>
            <button
              onClick={() => navigate('/hr-connect')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to HR Connect
            </button>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.libraryId}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  {/* Icon */}
                  <div className="flex justify-center mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getResourceIconColor(doc.resourceType)}`}>
                      {getResourceIcon(doc.resourceType)}
                    </div>
                  </div>

                  {/* Category Badge */}
                  {doc.category && (
                    <div className="flex justify-center mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                        {doc.category}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-center font-semibold text-sm text-gray-900 mb-2 line-clamp-1" title={doc.fileName}>
                    {doc.fileName}
                  </h3>

                  {/* Description */}
                  <p className="text-center text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">
                    {doc.description || 'No description'}
                  </p>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium text-gray-700">{formatFileSize(doc.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saved:</span>
                      <span className="font-medium text-gray-700">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-base font-semibold text-gray-900">Add New Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Payroll, Training"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Add a brief description..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${
                  newCategoryName.trim()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentViewerModal
        document={
          viewingDocument
            ? {
                title: viewingDocument.fileName,
                fileName: viewingDocument.fileName,
                fileType: viewingDocument.fileType,
                fileSize: viewingDocument.fileSize,
                uploadedAt: viewingDocument.createdAt,
                category: viewingDocument.category || viewingDocument.resourceType,
                status: viewingDocument.accessLevel,
                description: viewingDocument.description,
                metadata: [
                  { label: 'Downloads', value: viewingDocument.downloadCount },
                  { label: 'Views', value: viewingDocument.viewCount },
                  { label: 'Source', value: viewingDocument.sourceType },
                ],
              }
            : null
        }
        loadBlob={viewingDocument ? () => digitalLibraryService.getBlob(viewingDocument) : null}
        onClose={() => setViewingDocument(null)}
        onDownload={viewingDocument ? () => handleDownload(viewingDocument) : undefined}
      />
    </ModernLayout>
  );
};

export default MyHRDocuments;
