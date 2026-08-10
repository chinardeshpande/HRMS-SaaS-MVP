import api from './api';
import { API_BASE_URL } from '../config/runtime';

export type PayrollCycleStatus = 'draft' | 'under_review' | 'changes_requested' | 'approved_for_partner' |
  'partner_processing' | 'bank_approval_pending' | 'paid' | 'payslips_published' | 'closed';

export interface PayrollCycle {
  payrollCycleId: string; month: number; year: number; version: number; status: PayrollCycleStatus;
  partnerName: string; employeeCount: number; grossTotal: number; deductionTotal: number; netTotal: number;
  partnerReference?: string; bankReference?: string; payslipSummary: Record<string, number>; notes?: string;
}

export interface PayrollCycleDetail {
  cycle: PayrollCycle;
  timeline: Array<{ payrollCycleEventId: string; action: string; fromStatus?: string; toStatus?: string; note?: string; details?: Record<string, unknown>; actorUserId?: string; createdAt: string }>;
  comparison: null | Record<string, { amount: number; percent: number | null } | string>;
}

export interface PayrollTaxStatement {
  payrollTaxStatementId: string; employeeId: string; financialYear: string; statementType: string;
  status: 'pending' | 'received' | 'verified' | 'shared'; partnerReference?: string; notes?: string;
}

const payrollOperationsService = {
  async listCycles(): Promise<PayrollCycle[]> { return (await api.get<PayrollCycle[]>('/payroll-operations/cycles')).data; },
  async getCycle(id: string): Promise<PayrollCycleDetail> { return (await api.get<PayrollCycleDetail>(`/payroll-operations/cycles/${id}`)).data; },
  async createCycle(payload: Partial<PayrollCycle>): Promise<PayrollCycle> { return (await api.post<PayrollCycle>('/payroll-operations/cycles', payload)).data; },
  async transition(id: string, status: PayrollCycleStatus, payload: Record<string, unknown> = {}): Promise<PayrollCycle> {
    return (await api.post<PayrollCycle>(`/payroll-operations/cycles/${id}/transitions`, { ...payload, status })).data;
  },
  async revise(id: string, note: string): Promise<PayrollCycle> {
    return (await api.post<PayrollCycle>(`/payroll-operations/cycles/${id}/revisions`, { note })).data;
  },
  async addNote(id: string, note: string, category = 'general'): Promise<unknown> {
    return (await api.post(`/payroll-operations/cycles/${id}/notes`, { note, category })).data;
  },
  async uploadArtifact(id: string, file: File): Promise<unknown> {
    return (await api.upload(`/payroll-operations/cycles/${id}/artifacts`, file)).data;
  },
  async downloadArtifact(cycleId: string, eventId: string, fileName: string): Promise<void> {
    const tokens = localStorage.getItem('tokens');
    const headers: HeadersInit = {};
    if (tokens) headers.Authorization = `Bearer ${JSON.parse(tokens).token}`;
    const response = await fetch(`${API_BASE_URL}/payroll-operations/cycles/${cycleId}/artifacts/${eventId}/download`, { headers });
    if (!response.ok) throw new Error('Unable to download payroll artifact');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
  },
  async listTaxStatements(): Promise<PayrollTaxStatement[]> { return (await api.get<PayrollTaxStatement[]>('/payroll-operations/tax-statements')).data; },
  async saveTaxStatement(payload: Partial<PayrollTaxStatement>): Promise<PayrollTaxStatement> {
    return (await api.put<PayrollTaxStatement>('/payroll-operations/tax-statements', payload)).data;
  },
};

export default payrollOperationsService;
