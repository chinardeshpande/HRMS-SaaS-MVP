import { useState, useEffect, type FormEvent } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { DocumentWizard } from '../components/documents/DocumentWizard';
import { TemplateManager } from '../components/documents/TemplateManager';
import { TemplateEditor } from '../components/documents/TemplateEditor';
import { TemplatePreview } from '../components/documents/TemplatePreview';
import DocumentViewerModal from '../components/common/DocumentViewerModal';
import documentService from '../services/documentService';
import type { DocumentHistory } from '../services/documentService';
import companyDocumentService from '../services/companyDocumentService';
import type {
  CompanyDocument,
  CompanyDocumentCategory,
  CompanyDocumentPayload,
  CompanyDocumentStats,
  CompanyDocumentVerificationStatus,
} from '../services/companyDocumentService';
import api from '../services/api';
import employeeDocumentService, { type EmployeeDocumentRequest, type EmployeeDocumentRequestStatus } from '../services/employeeDocumentService';
import { useAuth } from '../context/AuthContext';
import {
  DocumentTextIcon,
  BriefcaseIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  HandThumbUpIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CogIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

// Icon mapping for template categories
const CATEGORY_ICONS: Record<string, typeof DocumentTextIcon> = {
  offer: BriefcaseIcon,
  appointment: DocumentCheckIcon,
  confirmation: CheckBadgeIcon,
  probation: ClockIcon,
  promotion: ArrowTrendingUpIcon,
  transfer: ArrowsRightLeftIcon,
  exit: HandThumbUpIcon,
  policy: ShieldCheckIcon,
};

// Color mapping for categories
const CATEGORY_COLORS: Record<string, string> = {
  offer: 'blue',
  appointment: 'green',
  confirmation: 'emerald',
  probation: 'amber',
  promotion: 'purple',
  transfer: 'indigo',
  exit: 'orange',
  policy: 'cyan',
};

interface ApiTemplate {
  templateId: string;
  templateName: string;
  displayName: string;
  category: string;
  description: string;
  availableFields: string[];
  isActive: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof DocumentTextIcon;
  color: string;
  category: string;
  variables: string[];
}

type ViewMode = 'templates' | 'manager' | 'history' | 'companyVault' | 'requests';
type DocumentDisplayMode = 'list' | 'cards';

interface TemplateData {
  templateId: string;
  templateName: string;
  displayName: string;
  category: string;
  description: string;
  htmlTemplate: string;
  availableFields: string[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const COMPANY_DOCUMENT_CATEGORIES: Array<{ id: CompanyDocumentCategory | 'all'; name: string }> = [
  { id: 'all', name: 'All company memory' },
  { id: 'incorporation_identity', name: 'Incorporation & identity' },
  { id: 'tax_registration', name: 'Tax registrations' },
  { id: 'labor_hr_compliance', name: 'Labor & HR compliance' },
  { id: 'hr_policy', name: 'HR policies' },
  { id: 'insurance_benefits', name: 'Insurance & benefits' },
  { id: 'statutory_return', name: 'Statutory returns' },
  { id: 'board_governance', name: 'Board & governance' },
  { id: 'hr_template', name: 'HR templates' },
  { id: 'vendor_partner_agreement', name: 'Vendor/partner agreements' },
  { id: 'other', name: 'Other' },
];

const DEFAULT_COMPANY_DOCUMENT_FORM: CompanyDocumentPayload = {
  title: '',
  category: 'incorporation_identity',
  description: '',
  documentNumber: '',
  issuingAuthority: '',
  issueDate: '',
  expiryDate: '',
  renewalOwner: '',
  status: 'active',
  verificationStatus: 'unverified',
  notes: '',
};

export default function ModernDocuments() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DocumentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>([]);
  const [companyDocumentStats, setCompanyDocumentStats] = useState<CompanyDocumentStats | null>(null);
  const [companyDocumentsLoading, setCompanyDocumentsLoading] = useState(false);
  const [showCompanyUpload, setShowCompanyUpload] = useState(false);
  const [companyDocumentForm, setCompanyDocumentForm] = useState<CompanyDocumentPayload>(DEFAULT_COMPANY_DOCUMENT_FORM);
  const [companyDocumentFile, setCompanyDocumentFile] = useState<File | null>(null);
  const [documentDisplayMode, setDocumentDisplayMode] = useState<DocumentDisplayMode>('list');
  const [viewingCompanyDocument, setViewingCompanyDocument] = useState<CompanyDocument | null>(null);
  const [viewingGeneratedDocument, setViewingGeneratedDocument] = useState<DocumentHistory | null>(null);
  const [documentRequests, setDocumentRequests] = useState<EmployeeDocumentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Template Manager States
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<TemplateData | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      // Only fetch if user is logged in
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get('/document-templates');
        const apiTemplates: ApiTemplate[] = response.data.templates || [];

        // Convert API templates to display format
        const displayTemplates: DocumentTemplate[] = apiTemplates
          .filter(t => t.isActive)
          .map(t => ({
            id: t.templateId,
            name: t.displayName,
            description: t.description,
            icon: CATEGORY_ICONS[t.category] || DocumentTextIcon,
            color: CATEGORY_COLORS[t.category] || 'blue',
            category: t.category,
            variables: t.availableFields,
          }));

        setTemplates(displayTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load templates. Please refresh the page.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [user]);

  useEffect(() => {
    if (user && viewMode === 'history') {
      fetchHistory();
    }
  }, [user, viewMode]);

  useEffect(() => {
    if (user && viewMode === 'requests') fetchDocumentRequests();
  }, [user, viewMode]);

  const fetchDocumentRequests = async () => {
    try {
      setRequestsLoading(true);
      setDocumentRequests(await employeeDocumentService.getRequests());
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to load employee document requests.' });
    } finally {
      setRequestsLoading(false);
    }
  };

  const updateDocumentRequest = async (requestId: string, status: EmployeeDocumentRequestStatus) => {
    const responseNotes = window.prompt('Optional note for the employee') || undefined;
    try {
      await employeeDocumentService.updateRequest(requestId, { status, responseNotes });
      await fetchDocumentRequests();
      setNotification({ type: 'success', message: 'Document request updated.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Unable to update this document request.' });
    }
  };

  useEffect(() => {
    if (user && viewMode === 'companyVault') {
      fetchCompanyDocuments();
    }
  }, [user, viewMode]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const rows = await documentService.getDocumentHistory();
      setHistory(rows);
    } catch (error) {
      console.error('Error fetching document history:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load generated document history.',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchCompanyDocuments = async () => {
    try {
      setCompanyDocumentsLoading(true);
      const [documents, stats] = await Promise.all([
        companyDocumentService.list(),
        companyDocumentService.stats(),
      ]);
      setCompanyDocuments(documents);
      setCompanyDocumentStats(stats);
    } catch (error) {
      console.error('Error fetching company documents:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load company document vault.',
      });
    } finally {
      setCompanyDocumentsLoading(false);
    }
  };

  const filteredTemplates = templates;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-100' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', hover: 'hover:bg-amber-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hover: 'hover:bg-red-100' },
    };
    return colors[color] || colors.blue;
  };

  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setSelectedTemplate(null);
  };

  const handleDocumentGenerate = async (data: any) => {
    try {
      console.log('handleDocumentGenerate called with data:', data);
      console.log('Selected template:', selectedTemplate);

      const fileName = `${selectedTemplate?.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Generated filename:', fileName);

      await documentService.generateAndDownload(data, fileName);
      if (viewMode === 'history') {
        await fetchHistory();
      }

      setNotification({
        type: 'success',
        message: `${selectedTemplate?.name} generated and downloaded successfully!`,
      });

      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      console.error('Error generating document:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      setNotification({
        type: 'error',
        message: error.message || error.response?.data?.message || 'Failed to generate document. Please try again.',
      });

      setTimeout(() => setNotification(null), 7000);
    }
  };

  const handleEditTemplate = (template: TemplateData) => {
    setEditingTemplate(template);
  };

  const handlePreviewTemplate = (template: TemplateData, htmlContent?: string) => {
    setPreviewingTemplate(template);
    setPreviewHtml(htmlContent || null);
  };

  const handleSaveTemplate = () => {
    setNotification({
      type: 'success',
      message: 'Template updated successfully!',
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDownloadHistory = async (doc: DocumentHistory) => {
    try {
      const blob = await documentService.downloadDocument(doc.documentId);
      documentService.downloadBlob(blob, doc.fileName);
    } catch (error) {
      console.error('Error downloading generated document:', error);
      setNotification({
        type: 'error',
        message: 'Generated document file is not available for download.',
      });
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Size unavailable';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteHistory = async (doc: DocumentHistory) => {
    try {
      await documentService.deleteDocument(doc.documentId);
      await fetchHistory();
      setNotification({
        type: 'success',
        message: 'Document removed from active history.',
      });
    } catch (error) {
      console.error('Error deleting generated document:', error);
      setNotification({
        type: 'error',
        message: 'Failed to remove document history entry.',
      });
    }
  };

  const handleCompanyDocumentUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyDocumentFile) {
      setNotification({ type: 'error', message: 'Please select a company document file.' });
      return;
    }

    try {
      await companyDocumentService.upload(companyDocumentFile, companyDocumentForm);
      setShowCompanyUpload(false);
      setCompanyDocumentForm(DEFAULT_COMPANY_DOCUMENT_FORM);
      setCompanyDocumentFile(null);
      await fetchCompanyDocuments();
      setNotification({ type: 'success', message: 'Company document added to the vault.' });
    } catch (error: any) {
      console.error('Error uploading company document:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error?.message || error.message || 'Failed to upload company document.',
      });
    }
  };

  const handleVerifyCompanyDocument = async (
    document: CompanyDocument,
    verificationStatus: CompanyDocumentVerificationStatus
  ) => {
    try {
      await companyDocumentService.verify(document.documentId, verificationStatus);
      await fetchCompanyDocuments();
      setNotification({ type: 'success', message: 'Company document verification updated.' });
    } catch (error) {
      console.error('Error verifying company document:', error);
      setNotification({ type: 'error', message: 'Failed to update verification status.' });
    }
  };

  const handleDownloadCompanyDocument = async (document: CompanyDocument) => {
    try {
      await companyDocumentService.download(document);
    } catch (error) {
      console.error('Error downloading company document:', error);
      setNotification({ type: 'error', message: 'Unable to download company document.' });
    }
  };

  const handleArchiveCompanyDocument = async (document: CompanyDocument) => {
    try {
      await companyDocumentService.archive(document.documentId);
      await fetchCompanyDocuments();
      setNotification({ type: 'success', message: 'Company document archived.' });
    } catch (error) {
      console.error('Error archiving company document:', error);
      setNotification({ type: 'error', message: 'Failed to archive company document.' });
    }
  };

  return (
    <ModernLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border-2 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className={`flex-shrink-0 ${
                  notification.type === 'success' ? 'text-green-400 hover:text-green-500' : 'text-red-400 hover:text-red-500'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Page Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === 'templates'
                ? 'Document Templates'
                : viewMode === 'manager'
                ? 'Template Manager'
                : viewMode === 'history'
                ? 'Generated Documents'
                : viewMode === 'companyVault' ? 'Company Document Vault' : 'Employee Document Requests'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {viewMode === 'templates'
                ? 'Generate professional HR documents with automated data filling'
                : viewMode === 'manager'
                ? 'View, edit, and customize document templates'
                : viewMode === 'history'
                ? 'Review document generation history and download prior output'
                : viewMode === 'companyVault' ? 'Manage tenant-level HR, statutory, policy, and compliance memory' : 'Track employment and exit document requests raised by employees'}
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            {/* View Mode Toggle */}
            <div className="inline-flex w-full max-w-full flex-wrap rounded-lg border border-gray-300 bg-white p-1 sm:w-auto">
              <button
                onClick={() => setViewMode('templates')}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'templates'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                Templates
              </button>
              <button
                onClick={() => setViewMode('manager')}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'manager'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CogIcon className="h-4 w-4" />
                Manage
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'history'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                History
              </button>
              <button
                onClick={() => setViewMode('companyVault')}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'companyVault'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                Company Vault
              </button>
              <button
                onClick={() => setViewMode('requests')}
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'requests' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <DocumentCheckIcon className="h-4 w-4" /> Requests
              </button>
            </div>
          </div>
        </div>

        {/* Templates View */}
        {viewMode === 'requests' && (
          <section className="card">
            <div className="card-body space-y-3">
              {requestsLoading ? <p className="py-8 text-center text-gray-500">Loading requests…</p> : documentRequests.length === 0 ? <p className="py-8 text-center text-gray-500">No employee document requests yet.</p> : documentRequests.map((request) => (
                <div key={request.requestId} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{request.documentType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600">{request.employee ? `${request.employee.firstName} ${request.employee.lastName} · ${request.employee.employeeCode}` : request.employeeId}</p>
                    <p className="mt-1 text-xs text-gray-500 capitalize">{request.purpose} · {new Date(request.createdAt).toLocaleDateString('en-IN')} · {request.status.replace(/_/g, ' ')}</p>
                    {request.details && <p className="mt-2 text-sm text-gray-600">{request.details}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a className="btn btn-secondary" href={`/employees/${request.employeeId}`}>Open employee</a>
                    {request.status === 'requested' && <button className="btn btn-secondary" onClick={() => updateDocumentRequest(request.requestId, 'in_progress')}>Start</button>}
                    {!['fulfilled', 'rejected', 'cancelled'].includes(request.status) && <button className="btn btn-primary" onClick={() => updateDocumentRequest(request.requestId, 'fulfilled')}>Mark fulfilled</button>}
                    {!['fulfilled', 'rejected', 'cancelled'].includes(request.status) && <button className="btn btn-secondary" onClick={() => updateDocumentRequest(request.requestId, 'rejected')}>Reject</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {viewMode === 'templates' && (
          <>
            {/* Templates Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                <p className="mt-1 text-sm text-gray-500">No templates available in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => {
                  const colors = getColorClasses(template.color);
                  const Icon = template.icon;

                  return (
                    <div
                      key={template.id}
                      className={`relative group cursor-pointer rounded-xl border-2 ${colors.border} ${colors.bg} ${colors.hover} transition-all duration-200 hover:shadow-lg overflow-hidden`}
                      onClick={() => handleGenerateDocument(template)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={`flex-shrink-0 p-3 rounded-lg ${colors.bg} ring-4 ring-white`}>
                            <Icon className={`h-6 w-6 ${colors.text}`} />
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${colors.bg} ${colors.text} capitalize`}>
                            {template.category}
                          </span>
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{template.description}</p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{template.variables.length} fields</span>
                          <button className="btn-primary text-xs py-1.5 px-3">
                            Generate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Manager View */}
        {viewMode === 'manager' && (
          <TemplateManager
            onEdit={handleEditTemplate}
            onPreview={handlePreviewTemplate}
          />
        )}

        {viewMode === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Generated HR documents</h3>
                <p className="text-xs text-gray-500">View, download, or remove generated documents from active history.</p>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setDocumentDisplayMode('list')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold ${documentDisplayMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="mr-1 inline h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setDocumentDisplayMode('cards')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold ${documentDisplayMode === 'cards' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="mr-1 inline h-4 w-4" />
                  Cards
                </button>
              </div>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No generated documents yet</h3>
                <p className="mt-1 text-sm text-gray-500">Generated HR documents will appear here.</p>
              </div>
            ) : documentDisplayMode === 'cards' ? (
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {history.map((doc) => (
                  <article key={doc.documentId} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                        <DocumentTextIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-gray-900">{doc.templateName}</h4>
                        <p className="truncate text-xs text-gray-500">{doc.fileName}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-gray-500">
                          <span>{doc.format}</span>
                          <span>{formatFileSize(doc.fileSizeBytes)}</span>
                          <span>{new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => setViewingGeneratedDocument(doc)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                        <EyeIcon className="mr-1 inline h-3.5 w-3.5" />
                        View
                      </button>
                      <button onClick={() => handleDownloadHistory(doc)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                        <ArrowDownTrayIcon className="mr-1 inline h-3.5 w-3.5" />
                        Download
                      </button>
                      <button onClick={() => handleDeleteHistory(doc)} className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Document', 'Format', 'Status', 'Generated By', 'Generated At', 'Actions'].map((heading) => (
                        <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((doc) => (
                      <tr key={doc.documentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{doc.templateName}</div>
                          <div className="text-xs text-gray-500">{doc.fileName}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{doc.format}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 capitalize">
                            {doc.status || 'generated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{doc.generatedBy}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(doc.generatedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingGeneratedDocument(doc)}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="View"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDownloadHistory(doc)}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteHistory(doc)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove from history"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewMode === 'companyVault' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setDocumentDisplayMode('list')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold ${documentDisplayMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ListBulletIcon className="mr-1 inline h-4 w-4" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentDisplayMode('cards')}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold ${documentDisplayMode === 'cards' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Squares2X2Icon className="mr-1 inline h-4 w-4" />
                    Cards
                  </button>
                </div>
                <button
                  onClick={() => setShowCompanyUpload((value) => !value)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  Add company document
                </button>
              </div>
            </div>

            {showCompanyUpload && (
              <form onSubmit={handleCompanyDocumentUpload} className="rounded-lg border border-primary-100 bg-primary-50/40 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-semibold text-gray-700">Title</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={companyDocumentForm.title}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, title: event.target.value })}
                      placeholder="Certificate of Incorporation"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Category</span>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={companyDocumentForm.category}
                      onChange={(event) =>
                        setCompanyDocumentForm({
                          ...companyDocumentForm,
                          category: event.target.value as CompanyDocumentCategory,
                        })
                      }
                    >
                      {COMPANY_DOCUMENT_CATEGORIES.filter((category) => category.id !== 'all').map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">File</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      type="file"
                      onChange={(event) => setCompanyDocumentFile(event.target.files?.[0] || null)}
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Document no.</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={companyDocumentForm.documentNumber || ''}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, documentNumber: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Authority</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={companyDocumentForm.issuingAuthority || ''}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, issuingAuthority: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Issue date</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      type="date"
                      value={companyDocumentForm.issueDate || ''}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, issueDate: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Expiry date</span>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      type="date"
                      value={companyDocumentForm.expiryDate || ''}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, expiryDate: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2 lg:col-span-4">
                    <span className="text-xs font-semibold text-gray-700">Notes</span>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      rows={2}
                      value={companyDocumentForm.notes || ''}
                      onChange={(event) => setCompanyDocumentForm({ ...companyDocumentForm, notes: event.target.value })}
                      placeholder="Migration source, renewal owner, or verification notes"
                    />
                  </label>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCompanyUpload(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                    Save to vault
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {companyDocumentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : companyDocuments.length === 0 ? (
                <div className="py-12 text-center">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No company documents yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Company HR and compliance memory will appear here.</p>
                </div>
              ) : documentDisplayMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {companyDocuments.map((document) => (
                    <article key={document.documentId} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                          <DocumentTextIcon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-gray-900">{document.title}</h4>
                          <p className="truncate text-xs text-gray-500">{document.originalFileName}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {COMPANY_DOCUMENT_CATEGORIES.find((category) => category.id === document.category)?.name || document.category}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <span className="text-gray-500">Status</span>
                        <span className="text-right font-semibold capitalize text-gray-800">{document.status.replace('_', ' ')}</span>
                        <span className="text-gray-500">Verification</span>
                        <span className="text-right font-semibold capitalize text-gray-800">{document.verificationStatus}</span>
                        <span className="text-gray-500">Expiry</span>
                        <span className="text-right font-semibold text-gray-800">{document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : 'No expiry'}</span>
                        <span className="text-gray-500">Size</span>
                        <span className="text-right font-semibold text-gray-800">{formatFileSize(document.fileSize)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setViewingCompanyDocument(document)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                          <EyeIcon className="mr-1 inline h-3.5 w-3.5" />
                          View
                        </button>
                        <button onClick={() => handleDownloadCompanyDocument(document)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                          <ArrowDownTrayIcon className="mr-1 inline h-3.5 w-3.5" />
                          Download
                        </button>
                        <button onClick={() => handleVerifyCompanyDocument(document, 'verified')} className="rounded-lg border border-green-100 bg-white px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-50">
                          Verify
                        </button>
                        <button onClick={() => handleArchiveCompanyDocument(document)} className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                          Archive
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Document', 'Category', 'Status', 'Expiry', 'Verification', 'Actions'].map((heading) => (
                          <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {companyDocuments.map((document) => (
                        <tr key={document.documentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{document.title}</div>
                            <div className="text-xs text-gray-500">{document.originalFileName}</div>
                            {document.documentNumber && (
                              <div className="mt-1 text-xs text-gray-500">No. {document.documentNumber}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {COMPANY_DOCUMENT_CATEGORIES.find((category) => category.id === document.category)?.name || document.category}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold capitalize text-blue-700">
                              {document.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : 'No expiry'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                                document.verificationStatus === 'verified'
                                  ? 'bg-green-50 text-green-700'
                                  : document.verificationStatus === 'rejected'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {document.verificationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewingCompanyDocument(document)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                title="View"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDownloadCompanyDocument(document)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                title="Download"
                              >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleVerifyCompanyDocument(document, 'verified')}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                title="Mark verified"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleArchiveCompanyDocument(document)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Archive"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Wizard Modal */}
        {showWizard && selectedTemplate && (
          <DocumentWizard
            template={selectedTemplate}
            onClose={handleCloseWizard}
            onGenerate={handleDocumentGenerate}
          />
        )}

        {/* Template Editor Modal */}
        {editingTemplate && (
          <TemplateEditor
            template={editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSave={handleSaveTemplate}
            onPreview={handlePreviewTemplate}
          />
        )}

        {/* Template Preview Modal */}
        {previewingTemplate && (
          <TemplatePreview
            template={{
              templateId: previewingTemplate.templateId,
              displayName: previewingTemplate.displayName,
              availableFields: previewingTemplate.availableFields,
            }}
            htmlContent={previewHtml || undefined}
            onClose={() => {
              setPreviewingTemplate(null);
              setPreviewHtml(null);
            }}
          />
        )}

        <DocumentViewerModal
          document={
            viewingGeneratedDocument
              ? {
                  title: viewingGeneratedDocument.templateName,
                  fileName: viewingGeneratedDocument.fileName,
                  fileType: viewingGeneratedDocument.format,
                  fileSize: viewingGeneratedDocument.fileSizeBytes,
                  uploadedAt: viewingGeneratedDocument.generatedAt,
                  status: viewingGeneratedDocument.status || 'generated',
                  metadata: [
                    { label: 'Generated by', value: viewingGeneratedDocument.generatedBy },
                    { label: 'Format', value: viewingGeneratedDocument.format },
                    { label: 'Generated at', value: new Date(viewingGeneratedDocument.generatedAt).toLocaleString() },
                  ],
                }
              : null
          }
          loadBlob={viewingGeneratedDocument ? () => documentService.downloadDocument(viewingGeneratedDocument.documentId) : null}
          onClose={() => setViewingGeneratedDocument(null)}
          onDownload={viewingGeneratedDocument ? () => handleDownloadHistory(viewingGeneratedDocument) : undefined}
        />

        <DocumentViewerModal
          document={
            viewingCompanyDocument
              ? {
                  title: viewingCompanyDocument.title,
                  fileName: viewingCompanyDocument.originalFileName || viewingCompanyDocument.fileName,
                  fileType: viewingCompanyDocument.fileType,
                  fileSize: viewingCompanyDocument.fileSize,
                  uploadedAt: viewingCompanyDocument.createdAt,
                  category: COMPANY_DOCUMENT_CATEGORIES.find((category) => category.id === viewingCompanyDocument.category)?.name || viewingCompanyDocument.category,
                  status: viewingCompanyDocument.status.replace('_', ' '),
                  description: viewingCompanyDocument.notes || viewingCompanyDocument.description,
                  metadata: [
                    { label: 'Document no.', value: viewingCompanyDocument.documentNumber },
                    { label: 'Authority', value: viewingCompanyDocument.issuingAuthority },
                    { label: 'Issue date', value: viewingCompanyDocument.issueDate ? new Date(viewingCompanyDocument.issueDate).toLocaleDateString() : null },
                    { label: 'Expiry date', value: viewingCompanyDocument.expiryDate ? new Date(viewingCompanyDocument.expiryDate).toLocaleDateString() : 'No expiry' },
                    { label: 'Verification', value: viewingCompanyDocument.verificationStatus },
                  ],
                }
              : null
          }
          loadBlob={viewingCompanyDocument ? () => companyDocumentService.getBlob(viewingCompanyDocument) : null}
          onClose={() => setViewingCompanyDocument(null)}
          onDownload={viewingCompanyDocument ? () => handleDownloadCompanyDocument(viewingCompanyDocument) : undefined}
        />
      </div>
    </ModernLayout>
  );
}
