import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { DocumentWizard } from '../components/documents/DocumentWizard';
import { TemplateManager } from '../components/documents/TemplateManager';
import { TemplateEditor } from '../components/documents/TemplateEditor';
import { TemplatePreview } from '../components/documents/TemplatePreview';
import documentService from '../services/documentService';
import api from '../services/api';
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

type ViewMode = 'templates' | 'manager';

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

export default function ModernDocuments() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Calculate category counts dynamically
  const categories = [
    { id: 'all', name: 'All Documents', count: templates.length },
    { id: 'offer', name: 'Offer', count: templates.filter(t => t.category === 'offer').length },
    { id: 'appointment', name: 'Appointment', count: templates.filter(t => t.category === 'appointment').length },
    { id: 'confirmation', name: 'Confirmation', count: templates.filter(t => t.category === 'confirmation').length },
    { id: 'probation', name: 'Probation', count: templates.filter(t => t.category === 'probation').length },
    { id: 'promotion', name: 'Promotion', count: templates.filter(t => t.category === 'promotion').length },
    { id: 'transfer', name: 'Transfer', count: templates.filter(t => t.category === 'transfer').length },
    { id: 'exit', name: 'Exit', count: templates.filter(t => t.category === 'exit').length },
    { id: 'policy', name: 'Policy', count: templates.filter(t => t.category === 'policy').length },
  ].filter(cat => cat.id === 'all' || cat.count > 0);

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

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
              {viewMode === 'templates' ? 'Document Templates' : 'Template Manager'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {viewMode === 'templates'
                ? 'Generate professional HR documents with automated data filling'
                : 'View, edit, and customize document templates'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setViewMode('templates')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'manager'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CogIcon className="h-4 w-4" />
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Templates View */}
        {viewMode === 'templates' && (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                  {category.count > 0 && (
                    <span className={`ml-2 ${selectedCategory === category.id ? 'text-white' : 'text-gray-500'}`}>
                      ({category.count})
                    </span>
                  )}
                </button>
              ))}
            </div>

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
      </div>
    </ModernLayout>
  );
}
