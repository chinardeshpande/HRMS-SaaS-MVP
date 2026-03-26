import React, { useState, useEffect } from 'react';

interface Document {
  documentId?: string;
  documentType: string;
  category: string;
  isRequired: boolean;
  requiresSignature: boolean;
  verificationStatus: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'missing';
  rejectionReason?: string;
}

interface DocumentFormProps {
  document?: Document;
  onSubmit: (data: Partial<Document>) => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  onSubmit,
  isSubmitting = false,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<Partial<Document>>({
    documentType: '',
    category: 'candidate_upload',
    isRequired: false,
    requiresSignature: false,
    verificationStatus: 'pending',
    rejectionReason: '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        documentType: document.documentType,
        category: document.category,
        isRequired: document.isRequired,
        requiresSignature: document.requiresSignature,
        verificationStatus: document.verificationStatus,
        rejectionReason: document.rejectionReason || '',
      });
    }
  }, [document]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting || isEditMode}
        >
          <option value="">Select document type</option>
          <option value="offer_letter">Offer Letter</option>
          <option value="appointment_letter">Appointment Letter</option>
          <option value="resume">Resume/CV</option>
          <option value="aadhar_card">Aadhar Card</option>
          <option value="pan_card">PAN Card</option>
          <option value="educational_certificate">Educational Certificate</option>
          <option value="experience_letter">Experience Letter</option>
          <option value="bank_passbook">Bank Passbook</option>
          <option value="nda">Non-Disclosure Agreement</option>
          <option value="code_of_conduct">Code of Conduct</option>
          <option value="it_policy">IT Policy</option>
          <option value="photo">Passport Photo</option>
          <option value="medical_certificate">Medical Certificate</option>
          <option value="bgv_consent">BGV Consent Form</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting || isEditMode}
        >
          <option value="system_generated">System Generated</option>
          <option value="candidate_upload">Candidate Upload</option>
          <option value="hr_upload">HR Upload</option>
        </select>
      </div>

      {isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Status *
          </label>
          <select
            name="verificationStatus"
            value={formData.verificationStatus}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="pending">Pending</option>
            <option value="uploaded">Uploaded</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      )}

      {isEditMode && formData.verificationStatus === 'rejected' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason
          </label>
          <textarea
            name="rejectionReason"
            value={formData.rejectionReason}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Specify the reason for rejection"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isRequired"
            checked={formData.isRequired}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label className="ml-2 block text-sm text-gray-700">
            This document is required for onboarding
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="requiresSignature"
            checked={formData.requiresSignature}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label className="ml-2 block text-sm text-gray-700">
            This document requires candidate signature
          </label>
        </div>
      </div>

      {!isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Once created, the document type and category cannot be changed.
            Only verification status and settings can be updated later.
          </p>
        </div>
      )}
    </form>
  );
};
