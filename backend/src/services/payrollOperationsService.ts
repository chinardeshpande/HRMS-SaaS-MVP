import { AppDataSource } from '../config/database';
import { PayrollCycle, PayrollCycleStatus } from '../models/PayrollCycle';
import { PayrollCycleEvent } from '../models/PayrollCycleEvent';
import { PayrollTaxStatement, PayrollTaxStatementStatus } from '../models/PayrollTaxStatement';
import { Employee } from '../models/Employee';

export const PAYROLL_EXCHANGE_FORMAT = {
  name: 'AuraHR external payroll exchange',
  version: '1.0',
  purpose: 'Operational handoff to and result receipt from an external payroll partner.',
  boundary: 'AuraHR stores approved inputs, partner-returned totals, references and evidence statuses. It does not calculate payroll or statutory liabilities.',
  columns: [
    { key: 'employeeCode', required: true, classification: 'identity' },
    { key: 'payPeriod', required: true, format: 'YYYY-MM' },
    { key: 'paidDays', required: true, source: 'approved HR input' },
    { key: 'lopDays', required: true, source: 'approved HR input' },
    { key: 'earningAdjustments', required: false, source: 'approved HR input' },
    { key: 'deductionAdjustments', required: false, source: 'approved HR input' },
    { key: 'reimbursementAdjustments', required: false, source: 'approved HR input' },
    { key: 'partnerGross', required: false, direction: 'partner_to_aurahr' },
    { key: 'partnerDeductions', required: false, direction: 'partner_to_aurahr' },
    { key: 'partnerNet', required: false, direction: 'partner_to_aurahr' },
    { key: 'partnerEmployeeReference', required: false, direction: 'both' },
    { key: 'validationMessage', required: false, direction: 'partner_to_aurahr' },
  ],
} as const;

const transitions: Record<PayrollCycleStatus, PayrollCycleStatus[]> = {
  [PayrollCycleStatus.DRAFT]: [PayrollCycleStatus.UNDER_REVIEW],
  [PayrollCycleStatus.UNDER_REVIEW]: [PayrollCycleStatus.CHANGES_REQUESTED, PayrollCycleStatus.APPROVED_FOR_PARTNER],
  [PayrollCycleStatus.CHANGES_REQUESTED]: [],
  [PayrollCycleStatus.APPROVED_FOR_PARTNER]: [PayrollCycleStatus.PARTNER_PROCESSING],
  [PayrollCycleStatus.PARTNER_PROCESSING]: [PayrollCycleStatus.BANK_APPROVAL_PENDING],
  [PayrollCycleStatus.BANK_APPROVAL_PENDING]: [PayrollCycleStatus.PAID],
  [PayrollCycleStatus.PAID]: [PayrollCycleStatus.PAYSLIPS_PUBLISHED],
  [PayrollCycleStatus.PAYSLIPS_PUBLISHED]: [PayrollCycleStatus.CLOSED],
  [PayrollCycleStatus.CLOSED]: [],
};

const clean = (value: unknown, max = 1000) => String(value || '').trim().slice(0, max) || null;

class PayrollOperationsService {
  private cycleRepo = AppDataSource.getRepository(PayrollCycle);
  private eventRepo = AppDataSource.getRepository(PayrollCycleEvent);
  private statementRepo = AppDataSource.getRepository(PayrollTaxStatement);

  async listCycles(tenantId: string) {
    return this.cycleRepo.find({ where: { tenantId }, order: { year: 'DESC', month: 'DESC', version: 'DESC' } });
  }

  async getCycle(tenantId: string, payrollCycleId: string) {
    const cycle = await this.cycleRepo.findOne({ where: { tenantId, payrollCycleId } });
    if (!cycle) return null;
    const timeline = await this.eventRepo.find({
      where: { tenantId, payrollCycleId },
      order: { createdAt: 'ASC' },
    });
    return { cycle, timeline, comparison: await this.previousMonthComparison(tenantId, cycle) };
  }

  async createCycle(tenantId: string, actorUserId: string, input: Partial<PayrollCycle>) {
    const month = Number(input.month);
    const year = Number(input.year);
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Month must be between 1 and 12');
    if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error('Year is invalid');
    if (!clean(input.partnerName, 160)) throw new Error('Payroll partner name is required');
    const existing = await this.cycleRepo.findOne({ where: { tenantId, year, month }, order: { version: 'DESC' } });
    if (existing) throw new Error('A payroll cycle already exists for this month; create a revision instead');

    return AppDataSource.transaction(async (manager) => {
      const cycle = manager.getRepository(PayrollCycle).create({
        tenantId, month, year, version: 1, status: PayrollCycleStatus.DRAFT,
        exchangeFormatVersion: PAYROLL_EXCHANGE_FORMAT.version,
        partnerName: clean(input.partnerName, 160)!,
        employeeCount: Math.max(0, Number(input.employeeCount) || 0),
        grossTotal: Math.max(0, Number(input.grossTotal) || 0),
        deductionTotal: Math.max(0, Number(input.deductionTotal) || 0),
        netTotal: Math.max(0, Number(input.netTotal) || 0),
        notes: clean(input.notes), createdBy: actorUserId, payslipSummary: {},
      });
      const saved = await manager.getRepository(PayrollCycle).save(cycle);
      await manager.getRepository(PayrollCycleEvent).save(manager.getRepository(PayrollCycleEvent).create({
        tenantId, payrollCycleId: saved.payrollCycleId, action: 'cycle_created',
        toStatus: saved.status, actorUserId, note: 'Monthly payroll operations cycle created', details: { version: 1 },
      }));
      return saved;
    });
  }

  async reviseCycle(tenantId: string, payrollCycleId: string, actorUserId: string, note?: string) {
    const source = await this.cycleRepo.findOne({ where: { tenantId, payrollCycleId } });
    if (!source) return null;
    if (![PayrollCycleStatus.CHANGES_REQUESTED, PayrollCycleStatus.UNDER_REVIEW].includes(source.status)) {
      throw new Error('Only a reviewed cycle can be revised');
    }
    const latest = await this.cycleRepo.findOne({
      where: { tenantId, year: source.year, month: source.month }, order: { version: 'DESC' },
    });
    return AppDataSource.transaction(async (manager) => {
      const revision = manager.getRepository(PayrollCycle).create({
        ...source,
        payrollCycleId: undefined,
        version: (latest?.version || source.version) + 1,
        status: PayrollCycleStatus.DRAFT,
        approvedBy: null, approvedAt: null, executedAt: null,
        partnerReference: null, bankReference: null,
        createdBy: actorUserId, createdAt: undefined, updatedAt: undefined,
      });
      const saved = await manager.getRepository(PayrollCycle).save(revision);
      await manager.getRepository(PayrollCycleEvent).save(manager.getRepository(PayrollCycleEvent).create({
        tenantId, payrollCycleId: saved.payrollCycleId, action: 'revision_created',
        fromStatus: source.status, toStatus: saved.status, actorUserId, note: clean(note),
        details: { sourceCycleId: source.payrollCycleId, sourceVersion: source.version, version: saved.version },
      }));
      return saved;
    });
  }

  async transitionCycle(tenantId: string, payrollCycleId: string, actorUserId: string, target: PayrollCycleStatus, input: any) {
    return AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PayrollCycle);
      const cycle = await repo.findOne({ where: { tenantId, payrollCycleId } });
      if (!cycle) return null;
      if (!transitions[cycle.status].includes(target)) throw new Error(`Cannot move payroll cycle from ${cycle.status} to ${target}`);
      const fromStatus = cycle.status;
      cycle.status = target;
      if (target === PayrollCycleStatus.APPROVED_FOR_PARTNER) {
        cycle.approvedBy = actorUserId;
        cycle.approvedAt = new Date();
      }
      if (target === PayrollCycleStatus.PARTNER_PROCESSING) cycle.partnerReference = clean(input.partnerReference, 160);
      if (target === PayrollCycleStatus.PAID) {
        cycle.bankReference = clean(input.bankReference, 160);
        cycle.executedAt = new Date();
      }
      if (target === PayrollCycleStatus.PAYSLIPS_PUBLISHED) {
        cycle.payslipSummary = input.payslipSummary && typeof input.payslipSummary === 'object' ? input.payslipSummary : {};
      }
      const saved = await repo.save(cycle);
      await manager.getRepository(PayrollCycleEvent).save(manager.getRepository(PayrollCycleEvent).create({
        tenantId, payrollCycleId, action: 'status_changed', fromStatus, toStatus: target,
        actorUserId, note: clean(input.note),
        details: { partnerReferenceRecorded: Boolean(cycle.partnerReference), bankReferenceRecorded: Boolean(cycle.bankReference) },
      }));
      return saved;
    });
  }

  async addCycleNote(tenantId: string, payrollCycleId: string, actorUserId: string, note: unknown, category?: unknown) {
    const cycle = await this.cycleRepo.findOne({ where: { tenantId, payrollCycleId }, select: { payrollCycleId: true } });
    if (!cycle) return null;
    const safeNote = clean(note, 4000);
    if (!safeNote) throw new Error('A collaboration message is required');
    const safeCategory = clean(category, 40) || 'general';
    return this.eventRepo.save(this.eventRepo.create({
      tenantId,
      payrollCycleId,
      actorUserId,
      action: 'collaboration_note',
      note: safeNote,
      details: { category: safeCategory },
    }));
  }

  async addCycleArtifact(tenantId: string, payrollCycleId: string, actorUserId: string, artifact: Record<string, unknown>) {
    const cycle = await this.cycleRepo.findOne({ where: { tenantId, payrollCycleId }, select: { payrollCycleId: true } });
    if (!cycle) return null;
    return this.eventRepo.save(this.eventRepo.create({
      tenantId, payrollCycleId, actorUserId, action: 'artifact_uploaded',
      note: `Payroll artifact uploaded: ${clean(artifact.fileName, 240)}`,
      details: artifact,
    }));
  }

  async getCycleArtifact(tenantId: string, payrollCycleId: string, payrollCycleEventId: string) {
    return this.eventRepo.findOne({ where: { tenantId, payrollCycleId, payrollCycleEventId, action: 'artifact_uploaded' } });
  }

  async upsertTaxStatement(tenantId: string, actorUserId: string, input: Partial<PayrollTaxStatement>) {
    if (!input.employeeId || !input.financialYear || !input.statementType) throw new Error('Employee, financial year and statement type are required');
    const employee = await AppDataSource.getRepository(Employee).findOne({
      where: { tenantId, employeeId: input.employeeId },
      select: { employeeId: true },
    });
    if (!employee) throw new Error('Employee not found in this organization');
    const status = Object.values(PayrollTaxStatementStatus).includes(input.status as PayrollTaxStatementStatus)
      ? input.status as PayrollTaxStatementStatus : PayrollTaxStatementStatus.PENDING;
    let statement = await this.statementRepo.findOne({
      where: { tenantId, employeeId: input.employeeId, financialYear: input.financialYear, statementType: input.statementType },
    });
    statement = this.statementRepo.create({
      ...statement, tenantId, employeeId: input.employeeId,
      financialYear: clean(input.financialYear, 20)!, statementType: clean(input.statementType, 50)!, status,
      partnerReference: clean(input.partnerReference, 160), notes: clean(input.notes), updatedBy: actorUserId,
    });
    return this.statementRepo.save(statement);
  }

  async listTaxStatements(tenantId: string, financialYear?: string) {
    return this.statementRepo.find({
      where: financialYear ? { tenantId, financialYear } : { tenantId },
      order: { financialYear: 'DESC', updatedAt: 'DESC' },
    });
  }

  private async previousMonthComparison(tenantId: string, cycle: PayrollCycle) {
    const date = new Date(Date.UTC(cycle.year, cycle.month - 2, 1));
    const previous = await this.cycleRepo.findOne({
      where: { tenantId, year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }, order: { version: 'DESC' },
    });
    const delta = (current: number, prior: number) => ({
      amount: current - prior,
      percent: prior === 0 ? null : Number((((current - prior) / prior) * 100).toFixed(2)),
    });
    return previous ? {
      previousCycleId: previous.payrollCycleId,
      employeeCount: delta(cycle.employeeCount, previous.employeeCount),
      grossTotal: delta(Number(cycle.grossTotal), Number(previous.grossTotal)),
      deductionTotal: delta(Number(cycle.deductionTotal), Number(previous.deductionTotal)),
      netTotal: delta(Number(cycle.netTotal), Number(previous.netTotal)),
    } : null;
  }
}

export default new PayrollOperationsService();
