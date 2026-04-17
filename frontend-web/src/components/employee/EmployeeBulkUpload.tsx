import { useState, useRef } from 'react';
import api from '../../services/api';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface UploadResult {
  totalRows: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    employeeCode?: string;
    email?: string;
    error: string;
  }>;
  createdEmployees: Array<{
    employeeId: string;
    employeeCode: string;
    fullName: string;
    email: string;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeBulkUpload({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Generate CSV template directly in frontend
      const csvContent = `employeeCode,firstName,lastName,email,phone,dateOfBirth,gender,department,designation,dateOfJoining,employmentType,managerEmail
EMP001,Aarav,Sharma,aarav.sharma@campuslife.com,+919876543201,1990-01-15,Male,Engineering,Senior Frontend Engineer,2024-01-01,Full-Time,
EMP002,Priya,Patel,priya.patel@campuslife.com,+919876543202,1992-03-22,Female,Engineering,Software Engineer,2024-01-05,Full-Time,
EMP003,Rohan,Kumar,rohan.kumar@campuslife.com,+919876543203,1988-07-10,Male,Engineering,Frontend Engineer,2024-01-10,Full-Time,
EMP004,Ananya,Singh,ananya.singh@campuslife.com,+919876543204,1991-05-18,Female,Engineering,Product Manager,2024-01-15,Full-Time,
EMP005,Arjun,Reddy,arjun.reddy@campuslife.com,+919876543205,1987-09-25,Male,Engineering,Engineering Lead,2024-01-20,Full-Time,
EMP006,Ishita,Mehta,ishita.mehta@campuslife.com,+919876543206,1993-11-30,Female,Engineering,Frontend Developer,2024-02-01,Full-Time,
EMP007,Karthik,Rao,karthik.rao@campuslife.com,+919876543207,1989-04-12,Male,Engineering,Sage X3 Consultant,2024-02-05,Full-Time,
EMP008,Neha,Gupta,neha.gupta@campuslife.com,+919876543208,1994-08-20,Female,Engineering,Software Engineer (Mobile),2024-02-10,Full-Time,
EMP009,Aditya,Joshi,aditya.joshi@campuslife.com,+919876543209,1986-12-05,Male,Engineering,Sage X3 Developer,2024-02-15,Full-Time,
EMP010,Pooja,Desai,pooja.desai@campuslife.com,+919876543210,1992-02-14,Female,Engineering,Platform Engineer,2024-02-20,Full-Time,
EMP011,Vikram,Iyer,vikram.iyer@campuslife.com,+919876543211,1985-06-08,Male,Engineering,Senior Machine Learning Engineer,2024-03-01,Full-Time,
EMP012,Divya,Nair,divya.nair@campuslife.com,+919876543212,1990-10-22,Female,Engineering,Machine Learning Engineer II,2024-03-05,Full-Time,
EMP013,Rahul,Kapoor,rahul.kapoor@campuslife.com,+919876543213,1991-03-17,Male,Engineering,Machine Learning Engineer I,2024-03-10,Full-Time,
EMP014,Sneha,Pillai,sneha.pillai@campuslife.com,+919876543214,1993-07-09,Female,Engineering,Digital Analyst,2024-03-15,Full-Time,
EMP015,Siddharth,Shah,siddharth.shah@campuslife.com,+919876543215,1988-11-28,Male,Engineering,Network Engineer,2024-03-20,Full-Time,
EMP016,Kavya,Menon,kavya.menon@campuslife.com,+919876543216,1992-05-03,Female,Engineering,Talent Partner,2024-04-01,Full-Time,
EMP017,Nikhil,Agarwal,nikhil.agarwal@campuslife.com,+919876543217,1987-09-15,Male,Engineering,Full Stack Engineer,2024-04-05,Full-Time,
EMP018,Ritika,Bhat,ritika.bhat@campuslife.com,+919876543218,1994-01-21,Female,Engineering,UX Designer,2024-04-10,Full-Time,
EMP019,Varun,Malhotra,varun.malhotra@campuslife.com,+919876543219,1989-06-11,Male,Engineering,Data Engineer II,2024-04-15,Full-Time,
EMP020,Tanya,Kulkarni,tanya.kulkarni@campuslife.com,+919876543220,1991-10-07,Female,Engineering,Senior ML Ops Engineer,2024-04-20,Full-Time,
EMP021,Akash,Verma,akash.verma@campuslife.com,+919876543221,1986-02-19,Male,Engineering,Senior Vulnerability Analyst,2024-05-01,Full-Time,
EMP022,Meera,Saxena,meera.saxena@campuslife.com,+919876543222,1993-08-26,Female,Engineering,Staff Technology Engineer,2024-05-05,Full-Time,
EMP023,Kunal,Chopra,kunal.chopra@campuslife.com,+919876543223,1990-12-13,Male,Engineering,Lead Talent Partner,2024-05-10,Full-Time,
EMP024,Shruti,Bansal,shruti.bansal@campuslife.com,+919876543224,1992-04-29,Female,Engineering,Software Engineer (Backend),2024-05-15,Full-Time,
EMP025,Abhinav,Sinha,abhinav.sinha@campuslife.com,+919876543225,1988-08-16,Male,Engineering,Principal Security Engineer,2024-05-20,Full-Time,
EMP026,Anjali,Yadav,anjali.yadav@campuslife.com,+919876543226,1991-11-04,Female,Engineering,Head Of Delivery,2024-06-01,Full-Time,
EMP027,Saurabh,Pandey,saurabh.pandey@campuslife.com,+919876543227,1989-03-23,Male,Engineering,Web Analyst,2024-06-05,Full-Time,
EMP028,Riya,Mishra,riya.mishra@campuslife.com,+919876543228,1994-07-18,Female,Engineering,Senior Platform Engineer,2024-06-10,Full-Time,`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_bulk_upload_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/employees/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);

      if (response.data.successful > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check your file and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-4xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="card-body p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <CloudArrowUpIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bulk Employee Upload</h3>
                <p className="text-sm text-gray-600">Upload multiple employees via CSV file</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!result ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Instructions
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 ml-7 list-decimal">
                  <li>Download the CSV template</li>
                  <li>Fill in employee details (max 500 rows)</li>
                  <li>Ensure departments and designations exist in system</li>
                  <li>Use existing employee emails for manager assignment</li>
                  <li>Upload the completed CSV file</li>
                </ol>
              </div>

              {/* Download Template */}
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full bg-white border-2 border-purple-300 text-purple-700 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all flex items-center justify-center"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Download CSV Template
                </button>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select CSV File *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    file
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      <span className="text-green-700 font-medium">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">Click to select CSV file</p>
                      <p className="text-sm text-gray-500">or drag and drop here</p>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Upload Employees
                  </>
                )}
              </button>
            </>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Rows</p>
                  <p className="text-3xl font-bold text-blue-900">{result.totalRows}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium mb-1">Successful</p>
                  <p className="text-3xl font-bold text-green-900">{result.successful}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 font-medium mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-900">{result.failed}</p>
                </div>
              </div>

              {/* Success Message */}
              {result.successful > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    <p className="font-semibold text-green-900">
                      Successfully created {result.successful} employee{result.successful > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-green-800">Code</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-green-800">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-green-800">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.createdEmployees.map((emp) => (
                          <tr key={emp.employeeId} className="border-t border-green-200">
                            <td className="px-3 py-2 text-green-900">{emp.employeeCode}</td>
                            <td className="px-3 py-2 text-green-900">{emp.fullName}</td>
                            <td className="px-3 py-2 text-green-900">{emp.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                    <p className="font-semibold text-red-900">
                      {result.failed} row{result.failed > 1 ? 's' : ''} failed
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-red-800">Row</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-red-800">Code/Email</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-red-800">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="border-t border-red-200">
                            <td className="px-3 py-2 text-red-900">{err.row}</td>
                            <td className="px-3 py-2 text-red-900">
                              {err.employeeCode || err.email || '-'}
                            </td>
                            <td className="px-3 py-2 text-red-900">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
