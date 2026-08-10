import api from './api';

export type PayrollCycleStatus = 'draft' | 'under_review' | 'changes_requested' | 'approved_for_partner' |
  'partner_processing' | 'bank_approval_pending' | 'paid' | 'payslips_published' | 'closed';

export interface PayrollCycle {
  payrollCycleId: string; month: number; year: number; version: number; status: PayrollCycleStatus;
  partnerName: string; employeeCount: number; grossTotal: number; deductionTotal: number; netTotal: number;
  partnerReference?: string; bankReference?: string; payslipSummary: Record<string, number>; notes?: string;
}

export interface PayrollCycleDetail {
  cycle: PayrollCycle;
  timeline: Array<{ payrollCycleEventId: string; action: string; fromStatus?: string; toStatus?: string; note?: string; createdAt: string }>;
  comparison: null | Record<string, { amount: number; percent: number | null } | string>;
}

export interface PayrollTaxStatement {
  payrollTaxStatementId: string; employeeId: string; financialYear: string; statementType: string;
  status: 'pending' | 'received' | 'verified' | 'shared'; partnerReference?: string; notes?: string;
}

const payrollOperationsService = {
  async listCycles(): Promise<PayrollCycle[]> { return (await api.get('/payroll-operations/cycles')).data.data; },
  async getCycle(id: string): Promise<PayrollCycleDetail> { return (await api.get(`/payroll-operations/cycles/${id}`)).data.data; },
  async createCycle(payload: Partial<PayrollCycle>): Promise<PayrollCycle> { return (await api.post('/payroll-operations/cycles', payload)).data.data; },
  async transition(id: string, status: PayrollCycleStatus, payload: Record<string, unknown> = {}): Promise<PayrollCycle> {
    return (await api.post(`/payroll-operations/cycles/${id}/transitions`, { ...payload, status })).data.data;
  },
  async revise(id: string, note: string): Promise<PayrollCycle> {
    return (await api.post(`/payroll-operations/cycles/${id}/revisions`, { note })).data.data;
  },
  async listTaxStatements(): Promise<PayrollTaxStatement[]> { return (await api.get('/payroll-operations/tax-statements')).data.data; },
  async saveTaxStatement(payload: Partial<PayrollTaxStatement>): Promise<PayrollTaxStatement> {
    return (await api.put('/payroll-operations/tax-statements', payload)).data.data;
  },
};

export default payrollOperationsService;
