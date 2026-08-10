import api from './api';
import { API_BASE_URL } from '../config/runtime';

export type EmployeeDocumentCategory =
  | 'identity'
  | 'address_proof'
  | 'education'
  | 'experience'
  | 'employment_letter'
  | 'compensation'
  | 'payslip'
  | 'form16'
  | 'policy_acknowledgement'
  | 'performance'
  | 'exit'
  | 'other';

export type EmployeeDocumentStatus = 'active' | 'archived' | 'needs_review';
export type EmployeeDocumentVerificationStatus = 'unverified' | 'verified' | 'rejected';

export interface EmployeeDocument {
  documentId: string;
  tenantId: string;
  employeeId: string;
  title: string;
  category: EmployeeDocumentCategory;
  description?: string | null;
  documentNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: EmployeeDocumentStatus;
  verificationStatus: EmployeeDocumentVerificationStatus;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocumentStats {
  total: number;
  active: number;
  needsReview: number;
  byCategory: Record<string, number>;
}

export interface EmployeeDocumentPayload {
  title: string;
  category: EmployeeDocumentCategory;
  description?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: EmployeeDocumentStatus;
  verificationStatus?: EmployeeDocumentVerificationStatus;
  notes?: string;
}

export type EmployeeDocumentRequestStatus = 'requested' | 'in_progress' | 'fulfilled' | 'rejected' | 'cancelled';
export interface EmployeeDocumentRequest {
  requestId: string;
  employeeId: string;
  documentType: string;
  purpose: 'employment' | 'exit';
  details?: string | null;
  status: EmployeeDocumentRequestStatus;
  responseNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  employee?: { employeeId: string; employeeCode: string; firstName: string; lastName: string; email: string };
  fulfilledDocument?: EmployeeDocument | null;
}

class EmployeeDocumentService {
  async list(employeeId: string, params?: {
    category?: EmployeeDocumentCategory | 'all';
    status?: EmployeeDocumentStatus | 'all';
    verificationStatus?: EmployeeDocumentVerificationStatus | 'all';
    searchTerm?: string;
  }): Promise<EmployeeDocument[]> {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value && value !== 'all')
    );
    const response = await api.get(`/employee-documents/employees/${employeeId}`, { params: cleanParams });
    return response.data?.documents || [];
  }

  async stats(employeeId: string): Promise<EmployeeDocumentStats> {
    const response = await api.get(`/employee-documents/employees/${employeeId}/stats`);
    return response.data;
  }

  async upload(employeeId: string, file: File, payload: EmployeeDocumentPayload): Promise<EmployeeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    const response = await api.post(`/employee-documents/employees/${employeeId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async verify(documentId: string, verificationStatus: EmployeeDocumentVerificationStatus): Promise<EmployeeDocument> {
    const response = await api.post(`/employee-documents/${documentId}/verify`, { verificationStatus });
    return response.data;
  }

  async archive(documentId: string): Promise<EmployeeDocument> {
    const response = await api.delete(`/employee-documents/${documentId}`);
    return response.data;
  }

  async getBlob(document: EmployeeDocument): Promise<Blob> {
    const apiBase = API_BASE_URL;
    const tokens = localStorage.getItem('tokens');
    const headers: HeadersInit = {};
    if (tokens) {
      const { token } = JSON.parse(tokens);
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${apiBase}/employee-documents/${document.documentId}/download`, { headers });
    if (!response.ok) throw new Error('Unable to download employee document');

    return response.blob();
  }

  async download(document: EmployeeDocument): Promise<void> {
    const blob = await this.getBlob(document);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.originalFileName || document.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async getMyRequests(): Promise<EmployeeDocumentRequest[]> {
    const response = await api.get('/employee-documents/requests/my');
    return response.data?.requests || [];
  }

  async requestDocument(payload: { documentType: string; purpose: 'employment' | 'exit'; details?: string }): Promise<EmployeeDocumentRequest> {
    const response = await api.post('/employee-documents/requests', payload);
    return response.data!;
  }

  async getRequests(params?: { status?: EmployeeDocumentRequestStatus; employeeId?: string }): Promise<EmployeeDocumentRequest[]> {
    const response = await api.get('/employee-documents/requests', { params });
    return response.data?.requests || [];
  }

  async updateRequest(requestId: string, payload: { status: EmployeeDocumentRequestStatus; responseNotes?: string; fulfilledDocumentId?: string }): Promise<EmployeeDocumentRequest> {
    const response = await api.put(`/employee-documents/requests/${requestId}`, payload);
    return response.data!;
  }
}

export const employeeDocumentService = new EmployeeDocumentService();
export default employeeDocumentService;
