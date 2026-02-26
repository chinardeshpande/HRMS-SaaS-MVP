import { useState, useRef } from 'react';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import onboardingService from '../../services/onboardingService';

interface BulkEmployeeUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (results: any) => void;
}

interface UploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string; data: any }>;
  successfulCandidates: Array<{ candidateId: string; name: string; email: string }>;
}

export default function BulkEmployeeUpload({ isOpen, onClose, onSuccess }: BulkEmployeeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'departmentId',
      'designationId',
      'offeredSalary',
      'expectedJoinDate',
      'employmentType',
      'workLocation',
      'address',
      'city',
      'state',
      'pincode',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
    ];

    const sampleData = [
      'John',
      'Doe',
      'john.doe@company.com',
      '+1-555-0100',
      '1990-01-15',
      'male',
      'dept-uuid-here',
      'desig-uuid-here',
      '75000',
      '2026-03-15',
      'full-time',
      'New York Office',
      '123 Main St',
      'New York',
      'NY',
      '10001',
      'Jane Doe',
      '+1-555-0101',
      'Spouse',
    ];

    const instructions = [
      '# BULK EMPLOYEE UPLOAD TEMPLATE',
      '# Instructions:',
      '# 1. Fill in employee details in rows below the header',
      '# 2. Required fields: firstName, lastName, email, phone, departmentId, designationId, offeredSalary, expectedJoinDate',
      '# 3. Get Department IDs and Designation IDs from the Master Data section',
      '# 4. Date format: YYYY-MM-DD (e.g., 2026-03-15)',
      '# 5. Employment types: full-time, part-time, contract, intern',
      '# 6. Gender options: male, female, other, prefer_not_to_say',
      '# 7. Remove these instruction lines before uploading',
      '',
    ];

    const csvContent = [
      ...instructions,
      headers.join(','),
      sampleData.map(cell => `"${cell}"`).join(','),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_bulk_upload_template_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const response = await onboardingService.bulkUploadEmployees(selectedFile);
      setUploadResult(response.data);

      if (response.data.successCount > 0) {
        onSuccess(response.data);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Failed to upload file. Please check the format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Bulk Employee Upload</h2>
              <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Instructions */}
            {!uploadResult && (
              <div className="mb-6">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Instructions</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Download the CSV template below</li>
                    <li>Fill in employee details (required fields marked in template)</li>
                    <li>Get Department and Designation IDs from Master Data section</li>
                    <li>Upload the completed CSV file</li>
                    <li>Successfully added employees will be enrolled in onboarding workflow</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Template Download */}
            {!uploadResult && (
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary w-full"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download CSV Template
                </button>
              </div>
            )}

            {/* File Upload */}
            {!uploadResult && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleReset}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-danger-50 border border-danger-200 p-4">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-danger-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-danger-800">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResult && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="card bg-blue-50 border-blue-200">
                    <div className="card-body">
                      <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                      <p className="text-2xl font-bold text-blue-900">{uploadResult.totalRows}</p>
                    </div>
                  </div>
                  <div className="card bg-success-50 border-success-200">
                    <div className="card-body">
                      <p className="text-sm text-success-600 font-medium">Successful</p>
                      <p className="text-2xl font-bold text-success-900">{uploadResult.successCount}</p>
                    </div>
                  </div>
                  <div className="card bg-danger-50 border-danger-200">
                    <div className="card-body">
                      <p className="text-sm text-danger-600 font-medium">Failed</p>
                      <p className="text-2xl font-bold text-danger-900">{uploadResult.failureCount}</p>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {uploadResult.successCount > 0 && (
                  <div className="rounded-lg bg-success-50 border border-success-200 p-4">
                    <div className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success-900">
                          {uploadResult.successCount} employee{uploadResult.successCount !== 1 ? 's' : ''} successfully added to onboarding workflow
                        </p>
                        {uploadResult.successfulCandidates.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            <ul className="text-sm text-success-800 space-y-1">
                              {uploadResult.successfulCandidates.map((candidate, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                  {candidate.name} ({candidate.email})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {uploadResult.failureCount > 0 && (
                  <div className="rounded-lg bg-danger-50 border border-danger-200 p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-danger-900 mb-2">
                          {uploadResult.failureCount} row{uploadResult.failureCount !== 1 ? 's' : ''} failed to process
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {uploadResult.errors.map((err, index) => (
                            <div key={index} className="text-sm text-danger-800 bg-white rounded p-2">
                              <p className="font-medium">Row {err.row}: {err.error}</p>
                              <p className="text-xs text-danger-600 mt-1">
                                Data: {JSON.stringify(err.data)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              {uploadResult ? (
                <>
                  <button onClick={handleReset} className="btn btn-secondary">
                    Upload Another File
                  </button>
                  <button onClick={handleClose} className="btn btn-primary">
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleClose} className="btn btn-secondary" disabled={uploading}>
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn btn-primary"
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
