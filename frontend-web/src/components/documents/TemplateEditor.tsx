import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

interface Template {
  templateId: string;
  templateName: string;
  displayName: string;
  category: string;
  description: string;
  htmlTemplate: string;
  availableFields: string[];
  version: number;
  isActive: boolean;
}

interface TemplateEditorProps {
  template: Template;
  onClose: () => void;
  onSave: () => void;
  onPreview: (template: Template, htmlContent: string) => void;
}

export const TemplateEditor = ({ template, onClose, onSave, onPreview }: TemplateEditorProps) => {
  const [formData, setFormData] = useState({
    displayName: template.displayName,
    category: template.category,
    description: template.description || '',
    htmlTemplate: template.htmlTemplate,
    availableFields: [...template.availableFields],
    isActive: template.isActive,
  });
  const [newField, setNewField] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'fields' | 'settings'>('content');

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/document-templates/${template.templateId}`, formData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    onPreview(
      {
        ...template,
        ...formData,
      },
      formData.htmlTemplate
    );
  };

  const addField = () => {
    if (newField.trim() && !formData.availableFields.includes(newField.trim())) {
      setFormData({
        ...formData,
        availableFields: [...formData.availableFields, newField.trim()],
      });
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    setFormData({
      ...formData,
      availableFields: formData.availableFields.filter((f) => f !== field),
    });
  };

  const insertPlaceholder = (field: string) => {
    const textarea = document.getElementById('htmlEditor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const placeholder = `{{${field}}}`;
      const newContent =
        formData.htmlTemplate.substring(0, start) +
        placeholder +
        formData.htmlTemplate.substring(end);
      setFormData({ ...formData, htmlTemplate: newContent });
      // Set cursor after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Edit Template</h2>
            <p className="mt-1 text-sm text-gray-500">
              {template.displayName} <span className="text-gray-400">(v{template.version})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'content'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            HTML Content
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'fields'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fields ({formData.availableFields.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* HTML Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Use placeholders like <code className="bg-blue-100 px-1 rounded">{'{{fieldName}}'}</code> in your HTML. Click on fields in the Fields tab to insert them.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Template
                </label>
                <textarea
                  id="htmlEditor"
                  value={formData.htmlTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, htmlTemplate: e.target.value })
                  }
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="Enter HTML template content..."
                />
              </div>
            </div>
          )}

          {/* Fields Tab */}
          {activeTab === 'fields' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Fields</strong> are placeholders that will be replaced with actual data when generating documents. Click on a field to insert it at the cursor position in the HTML.
                </p>
              </div>

              {/* Add New Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Field
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addField()}
                    placeholder="e.g., employeeName, salary, date"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={addField}
                    className="btn-primary flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Fields ({formData.availableFields.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formData.availableFields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors group"
                    >
                      <button
                        onClick={() => insertPlaceholder(field)}
                        className="flex-1 text-left font-mono text-sm text-gray-700 hover:text-primary-600"
                        title="Click to insert placeholder"
                      >
                        {'{{' + field + '}}'}
                      </button>
                      <button
                        onClick={() => removeField(field)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove field"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {formData.availableFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No fields added yet. Add your first field above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="offer">Offer</option>
                  <option value="appointment">Appointment</option>
                  <option value="confirmation">Confirmation</option>
                  <option value="probation">Probation</option>
                  <option value="promotion">Promotion</option>
                  <option value="transfer">Transfer</option>
                  <option value="exit">Exit</option>
                  <option value="policy">Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of this template..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Template is active (visible in generation wizard)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              className="btn-outline-primary flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
