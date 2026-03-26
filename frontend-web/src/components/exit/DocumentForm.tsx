import React, { useState, useEffect } from 'react';

export interface ExitDocument {
  documentId?: string;
  fileName: string;
  fileUrl?: string;
  fileType: string;
  uploadedDate?: string;
  uploadedBy?: string;
  size?: string;
}

interface DocumentFormProps {
  document?: ExitDocument | null;
  onSubmit: (data: Partial<ExitDocument>) => void;
  isSubmitting?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'resignation_letter', label: 'Resignation Letter' },
  { value: 'no_dues_certificate', label: 'No Dues Certificate' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'relieving_letter', label: 'Relieving Letter' },
  { value: 'clearance_form', label: 'Clearance Form' },
  { value: 'final_settlement', label: 'Final Settlement' },
  { value: 'other', label: 'Other' },
];

export const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<ExitDocument>>({
    fileName: '',
    fileType: 'resignation_letter',
    uploadedBy: '',
    size: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (document) {
      setFormData({
        fileName: document.fileName || '',
        fileType: document.fileType || 'resignation_letter',
        uploadedBy: document.uploadedBy || '',
        size: document.size || '',
      });
    }
  }, [document]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Auto-fill fileName and size
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Include file in submission if selected
    const submitData = {
      ...formData,
      file: selectedFile,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!document && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File *
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            required={!document}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File Name *
        </label>
        <input
          type="text"
          name="fileName"
          value={formData.fileName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Document name"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          name="fileType"
          value={formData.fileType}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Uploaded By
        </label>
        <input
          type="text"
          name="uploadedBy"
          value={formData.uploadedBy}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name of uploader"
          disabled={isSubmitting}
        />
      </div>

      {document && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Size
          </label>
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            placeholder="File size"
            disabled
          />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Note:</strong> Documents are important for maintaining exit records.
          Ensure all required documents are uploaded before final clearance.
        </p>
      </div>
    </form>
  );
};
