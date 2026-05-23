import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type SalaryComponentType = 'earning' | 'deduction' | 'employer_contribution';
export type SalaryStructureStatus = 'draft' | 'active' | 'superseded' | 'archived';
export type PayslipStatus = 'draft' | 'uploaded' | 'final' | 'shared' | 'corrected';
export type ShareChannel = 'email' | 'whatsapp' | 'hr_connect';

export interface SalaryComponent {
  componentId?: string;
  componentName: string;
  componentType: SalaryComponentType;
  monthlyAmount: number;
  annualAmount?: number;
  taxable?: boolean;
  statutory?: boolean;
  displayOrder?: number;
}

export interface SalaryStructure {
  structureId: string;
  structureName: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  annualCtc: number;
  monthlyGross: number;
  monthlyNetEstimate: number;
  currency: string;
  payFrequency: string;
  paymentMode: string;
  status: SalaryStructureStatus;
  approvalStatus: string;
  employeeVisible: boolean;
  remarks?: string;
  components?: SalaryComponent[];
}

export interface PayslipAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  isPrimary: boolean;
  version: number;
  uploadedOn: string;
}

export interface PayslipComponent {
  componentId?: string;
  componentName: string;
  componentType: SalaryComponentType;
  amount: number;
  displayOrder?: number;
}

export interface Payslip {
  payslipId: string;
  salaryStructureId?: string | null;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidDays: number;
  lopDays: number;
  paymentDate?: string | null;
  status: PayslipStatus;
  employeeVisible: boolean;
  remarks?: string;
  internalNotes?: string;
  components?: PayslipComponent[];
  attachments?: PayslipAttachment[];
}

export interface CompensationTimelineItem {
  id: string;
  type: 'salary_structure' | 'payslip' | 'revision' | 'share';
  date: string;
  title: string;
  description: string;
  amount?: number;
  status?: string;
}

export interface CompensationShareLog {
  shareLogId: string;
  payslipId?: string | null;
  channel: ShareChannel;
  recipient?: string | null;
  status: string;
  remarks?: string | null;
  sharedOn: string;
}

export interface CompensationProfile {
  summary: {
    currentCtc: number;
    monthlyGross: number;
    monthlyNetEstimate: number;
    effectiveFrom?: string | null;
    lastRevision?: string | null;
    lastPayslip?: string | null;
    payslipStatus?: string | null;
    paymentMode?: string | null;
    currency: string;
  };
  activeStructure?: SalaryStructure | null;
  salaryStructures: SalaryStructure[];
  payslips: Payslip[];
  revisions: any[];
  shareLogs: CompensationShareLog[];
  timeline: CompensationTimelineItem[];
}

export interface SalaryStructurePayload {
  structureName?: string;
  effectiveFrom: string;
  annualCtc: number;
  monthlyGross: number;
  monthlyNetEstimate: number;
  currency?: string;
  payFrequency?: string;
  paymentMode?: string;
  status?: SalaryStructureStatus;
  approvalStatus?: string;
  employeeVisible?: boolean;
  remarks?: string;
  components?: SalaryComponent[];
}

export interface PayslipPayload {
  salaryStructureId?: string | null;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidDays?: number;
  lopDays?: number;
  paymentDate?: string | null;
  status?: PayslipStatus;
  employeeVisible?: boolean;
  remarks?: string;
  internalNotes?: string;
  components?: PayslipComponent[];
}

export interface MonthlyPayslipGenerationPayload {
  month: number;
  year: number;
  paidDays?: number;
  lopDays?: number;
  paymentDate?: string | null;
  status?: PayslipStatus;
  employeeVisible?: boolean;
  remarks?: string;
}

export interface BulkPayslipImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

class CompensationService {
  async getEmployeeCompensation(employeeId: string): Promise<CompensationProfile> {
    const response = await api.get(`/compensation/employees/${employeeId}`);
    return response.data;
  }

  async createSalaryStructure(employeeId: string, payload: SalaryStructurePayload): Promise<SalaryStructure> {
    const response = await api.post(`/compensation/employees/${employeeId}/salary-structures`, payload);
    return response.data;
  }

  async updateSalaryStructure(structureId: string, payload: SalaryStructurePayload): Promise<SalaryStructure> {
    const response = await api.put(`/compensation/salary-structures/${structureId}`, payload);
    return response.data;
  }

  async archiveSalaryStructure(structureId: string): Promise<SalaryStructure> {
    const response = await api.delete(`/compensation/salary-structures/${structureId}`);
    return response.data;
  }

  async createPayslip(employeeId: string, payload: PayslipPayload): Promise<Payslip> {
    const response = await api.post(`/compensation/employees/${employeeId}/payslips`, payload);
    return response.data;
  }

  async generateMonthlyPayslip(employeeId: string, payload: MonthlyPayslipGenerationPayload): Promise<Payslip> {
    const response = await api.post(`/compensation/employees/${employeeId}/payslips/generate-monthly`, payload);
    return response.data;
  }

  async bulkImportPayslips(
    employeeId: string,
    rows: any[],
    mode: 'create_only' | 'upsert' = 'create_only'
  ): Promise<BulkPayslipImportResult> {
    const response = await api.post(`/compensation/employees/${employeeId}/payslips/bulk-import`, { rows, mode });
    return response.data;
  }

  async updatePayslip(payslipId: string, payload: PayslipPayload): Promise<Payslip> {
    const response = await api.put(`/compensation/payslips/${payslipId}`, payload);
    return response.data;
  }

  async deletePayslip(payslipId: string): Promise<{ payslipId: string }> {
    const response = await api.delete(`/compensation/payslips/${payslipId}`);
    return response.data;
  }

  async uploadPayslipAttachment(payslipId: string, file: File): Promise<PayslipAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPrimary', 'true');

    const tokens = localStorage.getItem('tokens');
    const token = tokens ? JSON.parse(tokens).token : undefined;

    const response = await fetch(`${API_BASE_URL}/compensation/payslips/${payslipId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || result.message || 'Failed to upload payslip attachment');
    }

    return result.data;
  }

  getAttachmentDownloadUrl(attachmentId: string): string {
    return `${API_BASE_URL}/compensation/attachments/${attachmentId}/download`;
  }

  async getAttachmentBlob(attachmentId: string): Promise<Blob> {
    const tokens = localStorage.getItem('tokens');
    const token = tokens ? JSON.parse(tokens).token : undefined;
    const response = await fetch(this.getAttachmentDownloadUrl(attachmentId), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error('Unable to load payslip attachment');
    }

    return response.blob();
  }

  async downloadAttachment(attachment: PayslipAttachment): Promise<void> {
    const blob = await this.getAttachmentBlob(attachment.attachmentId);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async logPayslipShare(
    payslipId: string,
    employeeId: string,
    channel: ShareChannel,
    recipient?: string,
    remarks?: string
  ): Promise<CompensationShareLog> {
    const response = await api.post(`/compensation/payslips/${payslipId}/share`, {
      employeeId,
      channel,
      recipient,
      remarks,
    });
    return response.data;
  }
}

export const compensationService = new CompensationService();
export default compensationService;
