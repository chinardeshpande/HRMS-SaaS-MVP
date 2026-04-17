import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ArrowPathIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface Template {
  templateId: string;
  displayName: string;
  availableFields: string[];
}

interface TemplatePreviewProps {
  template: Template;
  htmlContent?: string;
  onClose: () => void;
}

export const TemplatePreview = ({ template, htmlContent, onClose }: TemplatePreviewProps) => {
  const [sampleData, setSampleData] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingSample, setGeneratingSample] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Initialize sample data with defaults
    const defaults: Record<string, string> = {};
    template.availableFields.forEach((field) => {
      defaults[field] = getSampleValue(field);
    });
    setSampleData(defaults);
  }, [template]);

  useEffect(() => {
    if (Object.keys(sampleData).length > 0) {
      generatePreview();
    }
  }, [sampleData]);

  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

  const getSampleValue = (field: string): string => {
    const lowerField = field.toLowerCase();

    // Date fields
    if (lowerField.includes('date')) {
      return new Date().toISOString().split('T')[0];
    }

    // Name fields
    if (lowerField.includes('firstname') || field === 'firstName') {
      return 'John';
    }
    if (lowerField.includes('lastname') || field === 'lastName') {
      return 'Doe';
    }
    if (lowerField.includes('name') && !lowerField.includes('company')) {
      return 'John Doe';
    }

    // Company
    if (lowerField.includes('company')) {
      return 'Aurora HR';
    }

    // Salary/Money
    if (lowerField.includes('salary') || lowerField.includes('ctc')) {
      return '75,000';
    }
    if (lowerField.includes('currency')) {
      return 'USD';
    }

    // Position/Role
    if (lowerField.includes('position') || lowerField.includes('designation')) {
      return 'Senior Software Engineer';
    }

    // Department
    if (lowerField.includes('department')) {
      return 'Engineering';
    }

    // Location
    if (lowerField.includes('location')) {
      return 'San Francisco, CA';
    }

    // Manager
    if (lowerField.includes('manager')) {
      return 'Jane Smith';
    }

    // Employee Code
    if (lowerField.includes('code')) {
      return 'EMP001';
    }

    // Email
    if (lowerField.includes('email')) {
      return 'john.doe@company.com';
    }

    // Period
    if (lowerField.includes('period')) {
      return '90 days';
    }

    // Reason/Description
    if (lowerField.includes('reason') || lowerField.includes('description') || lowerField.includes('responsibilities')) {
      return 'Performance review and alignment with organizational goals';
    }

    // Gender
    if (lowerField.includes('gender')) {
      return 'he/she';
    }

    // Experience
    if (lowerField.includes('experience')) {
      return '3 years 6 months';
    }

    // Clearance
    if (lowerField.includes('clearance')) {
      return 'Approved';
    }

    // Default
    return `[${field}]`;
  };

  const generatePreview = async () => {
    try {
      setLoading(true);

      let html = htmlContent || '';

      // If no HTML content provided, fetch from backend
      if (!html) {
        const response = await api.post(`/document-templates/${template.templateId}/preview`, {
          sampleData,
        });
        html = response.data.html;
      } else {
        // Replace placeholders locally
        Object.entries(sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, value);
        });
      }

      setPreviewHtml(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewHtml('<p style="color: red;">Error generating preview. Please check the template.</p>');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSample = () => {
    setGeneratingSample(true);
    const newData: Record<string, string> = {};
    template.availableFields.forEach((field) => {
      newData[field] = getSampleValue(field);
    });
    setSampleData(newData);
    setTimeout(() => setGeneratingSample(false), 500);
  };

  const handleFieldChange = (field: string, value: string) => {
    setSampleData({
      ...sampleData,
      [field]: value,
    });
  };

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
            <p className="mt-1 text-sm text-gray-500">{template.displayName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Sample Data Form */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sample Data</h3>
              <button
                onClick={handleGenerateSample}
                disabled={generatingSample}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <ArrowPathIcon className={`h-4 w-4 ${generatingSample ? 'animate-spin' : ''}`} />
                Reset
              </button>
            </div>

            <div className="space-y-4">
              {template.availableFields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  {field.toLowerCase().includes('reason') ||
                  field.toLowerCase().includes('responsibilities') ||
                  field.toLowerCase().includes('description') ? (
                    <textarea
                      value={sampleData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  ) : (
                    <input
                      type={field.toLowerCase().includes('date') ? 'date' : 'text'}
                      value={sampleData[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Generating preview...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Preview Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">
                    Live Preview
                  </span>
                  <button
                    onClick={handlePrint}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Print Preview
                  </button>
                </div>

                {/* HTML Preview in iframe */}
                <div className="p-8">
                  <iframe
                    ref={iframeRef}
                    className="w-full border-0"
                    style={{ minHeight: '800px', height: '100%' }}
                    title="Document Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Adjust the sample data on the left to see changes in the preview
          </div>
          <button onClick={onClose} className="btn-primary">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
