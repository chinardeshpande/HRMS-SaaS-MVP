import api from './api';

export type CompanyDocumentCategory =
  | 'incorporation_identity'
  | 'tax_registration'
  | 'labor_hr_compliance'
  | 'hr_policy'
  | 'insurance_benefits'
  | 'statutory_return'
  | 'board_governance'
  | 'hr_template'
  | 'vendor_partner_agreement'
  | 'other';

export type CompanyDocumentStatus = 'active' | 'expired' | 'archived' | 'needs_review';
export type CompanyDocumentVerificationStatus = 'unverified' | 'verified' | 'rejected';

export interface CompanyDocument {
  documentId: string;
  tenantId: string;
  title: string;
  category: CompanyDocumentCategory;
  description?: string | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  renewalOwner?: string | null;
  status: CompanyDocumentStatus;
  verificationStatus: CompanyDocumentVerificationStatus;
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

export interface CompanyDocumentStats {
  total: number;
  active: number;
  needsReview: number;
  expiringSoon: number;
  byCategory: Record<string, number>;
}

export interface CompanyDocumentPayload {
  title: string;
  category: CompanyDocumentCategory;
  description?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  renewalOwner?: string;
  status?: CompanyDocumentStatus;
  verificationStatus?: CompanyDocumentVerificationStatus;
  notes?: string;
}

class CompanyDocumentService {
  async list(params?: {
    category?: CompanyDocumentCategory | 'all';
    status?: CompanyDocumentStatus | 'all';
    verificationStatus?: CompanyDocumentVerificationStatus | 'all';
    searchTerm?: string;
    expiringWithinDays?: number;
  }): Promise<CompanyDocument[]> {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value && value !== 'all')
    );
    const response = await api.get('/company-documents', { params: cleanParams });
    return response.data?.documents || [];
  }

  async stats(): Promise<CompanyDocumentStats> {
    const response = await api.get('/company-documents/stats');
    return response.data;
  }

  async upload(file: File, payload: CompanyDocumentPayload): Promise<CompanyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await api.post('/company-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async update(documentId: string, payload: CompanyDocumentPayload): Promise<CompanyDocument> {
    const response = await api.put(`/company-documents/${documentId}`, payload);
    return response.data;
  }

  async verify(documentId: string, verificationStatus: CompanyDocumentVerificationStatus): Promise<CompanyDocument> {
    const response = await api.post(`/company-documents/${documentId}/verify`, { verificationStatus });
    return response.data;
  }

  async archive(documentId: string): Promise<CompanyDocument> {
    const response = await api.delete(`/company-documents/${documentId}`);
    return response.data;
  }

  async download(document: CompanyDocument): Promise<void> {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const tokens = localStorage.getItem('tokens');
    const headers: HeadersInit = {};
    if (tokens) {
      const { token } = JSON.parse(tokens);
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}/company-documents/${document.documentId}/download`, {
      headers,
    });
    if (!response.ok) {
      throw new Error('Unable to download company document');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.originalFileName || document.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const companyDocumentService = new CompanyDocumentService();
export default companyDocumentService;

