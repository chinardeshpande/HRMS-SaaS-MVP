import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  SalaryApprovalStatus,
  SalaryStructure,
  SalaryStructureStatus,
} from '../models/SalaryStructure';
import { SalaryComponent, SalaryComponentType } from '../models/SalaryComponent';
import { Payslip, PayslipStatus } from '../models/Payslip';
import { PayslipComponent } from '../models/PayslipComponent';
import { PayslipAttachment } from '../models/PayslipAttachment';
import {
  CompensationShareChannel,
  CompensationShareLog,
  CompensationShareStatus,
} from '../models/CompensationShareLog';
import { Employee } from '../models/Employee';
import { CompensationHistory, CompensationChangeType, CompensationComponent } from '../models/CompensationHistory';

export interface SalaryComponentInput {
  componentName: string;
  componentType: SalaryComponentType;
  monthlyAmount: number;
  annualAmount?: number;
  taxable?: boolean;
  statutory?: boolean;
  displayOrder?: number;
}

export interface SalaryStructureInput {
  structureName?: string;
  effectiveFrom: Date;
  annualCtc: number;
  monthlyGross: number;
  monthlyNetEstimate: number;
  currency?: string;
  payFrequency?: string;
  paymentMode?: string;
  status?: SalaryStructureStatus;
  approvalStatus?: SalaryApprovalStatus;
  employeeVisible?: boolean;
  remarks?: string | null;
  components?: SalaryComponentInput[];
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface PayslipComponentInput {
  componentName: string;
  componentType: SalaryComponentType;
  amount: number;
  displayOrder?: number;
}

export interface PayslipInput {
  salaryStructureId?: string | null;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidDays?: number;
  lopDays?: number;
  paymentDate?: Date | null;
  status?: PayslipStatus;
  employeeVisible?: boolean;
  remarks?: string | null;
  internalNotes?: string | null;
  components?: PayslipComponentInput[];
  generatedBy?: string | null;
}

export interface MonthlyPayslipGenerationInput {
  month: number;
  year: number;
  paidDays?: number;
  lopDays?: number;
  paymentDate?: Date | null;
  status?: PayslipStatus;
  employeeVisible?: boolean;
  remarks?: string | null;
  generatedBy?: string | null;
}

export interface BulkPayslipImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

class CompensationService {
  private employeeRepo: Repository<Employee>;
  private salaryStructureRepo: Repository<SalaryStructure>;
  private salaryComponentRepo: Repository<SalaryComponent>;
  private payslipRepo: Repository<Payslip>;
  private payslipComponentRepo: Repository<PayslipComponent>;
  private payslipAttachmentRepo: Repository<PayslipAttachment>;
  private shareLogRepo: Repository<CompensationShareLog>;
  private compensationHistoryRepo: Repository<CompensationHistory>;

  constructor() {
    this.employeeRepo = AppDataSource.getRepository(Employee);
    this.salaryStructureRepo = AppDataSource.getRepository(SalaryStructure);
    this.salaryComponentRepo = AppDataSource.getRepository(SalaryComponent);
    this.payslipRepo = AppDataSource.getRepository(Payslip);
    this.payslipComponentRepo = AppDataSource.getRepository(PayslipComponent);
    this.payslipAttachmentRepo = AppDataSource.getRepository(PayslipAttachment);
    this.shareLogRepo = AppDataSource.getRepository(CompensationShareLog);
    this.compensationHistoryRepo = AppDataSource.getRepository(CompensationHistory);
  }

  async getEmployeeCompensation(tenantId: string, employeeId: string, includeHrOnly: boolean) {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);

    const structureWhere: any = { tenantId, employeeId };
    const payslipWhere: any = { tenantId, employeeId };

    if (!includeHrOnly) {
      structureWhere.employeeVisible = true;
      payslipWhere.employeeVisible = true;
    }

    const [salaryStructures, payslips, revisions, shareLogs] = await Promise.all([
      this.salaryStructureRepo.find({
        where: structureWhere,
        relations: ['components'],
        order: { effectiveFrom: 'DESC', createdAt: 'DESC' },
      }),
      this.payslipRepo.find({
        where: payslipWhere,
        relations: ['components', 'attachments'],
        order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' },
      }),
      this.compensationHistoryRepo.find({
        where: { tenantId, employeeId },
        order: { effectiveDate: 'DESC', createdAt: 'DESC' },
      }),
      this.shareLogRepo.find({
        where: { tenantId, employeeId },
        order: { sharedOn: 'DESC' },
      }),
    ]);

    const activeStructure =
      salaryStructures.find((structure) => structure.status === SalaryStructureStatus.ACTIVE) ||
      salaryStructures[0] ||
      null;

    const lastPayslip = payslips[0] || null;

    return {
      summary: {
        currentCtc: Number(activeStructure?.annualCtc || 0),
        monthlyGross: Number(activeStructure?.monthlyGross || 0),
        monthlyNetEstimate: Number(activeStructure?.monthlyNetEstimate || 0),
        effectiveFrom: activeStructure?.effectiveFrom || null,
        lastRevision: revisions[0]?.effectiveDate || null,
        lastPayslip: lastPayslip ? `${lastPayslip.month}/${lastPayslip.year}` : null,
        payslipStatus: lastPayslip?.status || null,
        paymentMode: activeStructure?.paymentMode || null,
        currency: activeStructure?.currency || 'INR',
      },
      activeStructure,
      salaryStructures,
      payslips,
      revisions,
      shareLogs,
      timeline: this.buildTimeline(salaryStructures, payslips, revisions, shareLogs),
    };
  }

  async createSalaryStructure(
    tenantId: string,
    employeeId: string,
    input: SalaryStructureInput
  ): Promise<SalaryStructure> {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);
    this.validateSalaryStructureInput(input);

    if (input.status === SalaryStructureStatus.ACTIVE) {
      await this.closeExistingActiveStructures(tenantId, employeeId, input.effectiveFrom);
    }

    const structure = this.salaryStructureRepo.create({
      tenantId,
      employeeId,
      structureName: input.structureName?.trim() || 'Current Salary Structure',
      effectiveFrom: input.effectiveFrom,
      annualCtc: input.annualCtc,
      monthlyGross: input.monthlyGross,
      monthlyNetEstimate: input.monthlyNetEstimate,
      currency: input.currency?.trim().toUpperCase() || 'INR',
      payFrequency: input.payFrequency || 'monthly',
      paymentMode: input.paymentMode || 'bank_transfer',
      status: input.status || SalaryStructureStatus.ACTIVE,
      approvalStatus: input.approvalStatus || SalaryApprovalStatus.APPROVED,
      employeeVisible: Boolean(input.employeeVisible),
      remarks: this.cleanText(input.remarks),
      createdBy: input.createdBy || null,
      updatedBy: input.updatedBy || null,
    });

    const saved = await this.salaryStructureRepo.save(structure);
    await this.replaceSalaryComponents(tenantId, saved.structureId, input.components || []);
    await this.createCompensationHistoryForStructure(tenantId, employeeId, saved, input.createdBy);

    return (await this.salaryStructureRepo.findOne({
      where: { tenantId, structureId: saved.structureId },
      relations: ['components'],
    })) as SalaryStructure;
  }

  async updateSalaryStructure(
    tenantId: string,
    structureId: string,
    input: Partial<SalaryStructureInput>
  ): Promise<SalaryStructure | null> {
    const structure = await this.salaryStructureRepo.findOne({ where: { tenantId, structureId } });
    if (!structure) return null;
    this.validateSalaryStructureInput({ ...structure, ...input } as SalaryStructureInput);

    if (input.status === SalaryStructureStatus.ACTIVE) {
      await this.closeExistingActiveStructures(tenantId, structure.employeeId, input.effectiveFrom || structure.effectiveFrom, structureId);
    }

    Object.assign(structure, {
      structureName: input.structureName?.trim() || structure.structureName,
      effectiveFrom: input.effectiveFrom || structure.effectiveFrom,
      annualCtc: input.annualCtc ?? structure.annualCtc,
      monthlyGross: input.monthlyGross ?? structure.monthlyGross,
      monthlyNetEstimate: input.monthlyNetEstimate ?? structure.monthlyNetEstimate,
      currency: input.currency?.trim().toUpperCase() || structure.currency,
      payFrequency: input.payFrequency || structure.payFrequency,
      paymentMode: input.paymentMode || structure.paymentMode,
      status: input.status || structure.status,
      approvalStatus: input.approvalStatus || structure.approvalStatus,
      employeeVisible: input.employeeVisible ?? structure.employeeVisible,
      remarks: input.remarks === undefined ? structure.remarks : this.cleanText(input.remarks),
      updatedBy: input.updatedBy || structure.updatedBy,
    });

    await this.salaryStructureRepo.save(structure);
    if (input.components) {
      await this.replaceSalaryComponents(tenantId, structureId, input.components);
    }

    return await this.salaryStructureRepo.findOne({
      where: { tenantId, structureId },
      relations: ['components'],
    });
  }

  async archiveSalaryStructure(
    tenantId: string,
    structureId: string,
    updatedBy?: string | null
  ): Promise<SalaryStructure | null> {
    const structure = await this.salaryStructureRepo.findOne({ where: { tenantId, structureId } });
    if (!structure) return null;

    structure.status = SalaryStructureStatus.ARCHIVED;
    structure.effectiveTo = structure.effectiveTo || new Date();
    structure.updatedBy = updatedBy || structure.updatedBy;
    return await this.salaryStructureRepo.save(structure);
  }

  async createPayslip(tenantId: string, employeeId: string, input: PayslipInput): Promise<Payslip> {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);
    await this.validatePayslipInput(tenantId, employeeId, input);

    const existing = await this.payslipRepo.findOne({
      where: { tenantId, employeeId, month: input.month, year: input.year },
    });
    if (existing) {
      throw new Error('A payslip already exists for this employee and month. Edit the existing payslip instead.');
    }

    const payslip = this.payslipRepo.create({
      tenantId,
      employeeId,
      salaryStructureId: input.salaryStructureId || null,
      month: input.month,
      year: input.year,
      grossEarnings: input.grossEarnings,
      totalDeductions: input.totalDeductions,
      netPay: input.netPay,
      paidDays: input.paidDays || 0,
      lopDays: input.lopDays || 0,
      paymentDate: input.paymentDate || null,
      status: input.status || PayslipStatus.UPLOADED,
      employeeVisible: Boolean(input.employeeVisible),
      remarks: this.cleanText(input.remarks),
      internalNotes: this.cleanText(input.internalNotes),
      generatedBy: input.generatedBy || null,
    });

    const saved = await this.payslipRepo.save(payslip);
    await this.replacePayslipComponents(tenantId, saved.payslipId, input.components || []);

    return (await this.payslipRepo.findOne({
      where: { tenantId, payslipId: saved.payslipId },
      relations: ['components', 'attachments'],
    })) as Payslip;
  }

  async generateMonthlyPayslip(
    tenantId: string,
    employeeId: string,
    input: MonthlyPayslipGenerationInput
  ): Promise<Payslip> {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);

    const structure = await this.salaryStructureRepo.findOne({
      where: { tenantId, employeeId, status: SalaryStructureStatus.ACTIVE },
      relations: ['components'],
      order: { effectiveFrom: 'DESC', createdAt: 'DESC' },
    });

    if (!structure) {
      throw new Error('No active salary structure exists for this employee. Add the salary structure before generating monthly transactions.');
    }

    const components = (structure.components || [])
      .slice()
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .map((component, index) => ({
        componentName: component.componentName,
        componentType: component.componentType,
        amount: Number(component.monthlyAmount || 0),
        displayOrder: component.displayOrder ?? index + 1,
      }));

    const earningTotal = components
      .filter((component) => component.componentType === SalaryComponentType.EARNING)
      .reduce((sum, component) => sum + Number(component.amount || 0), 0);
    const deductionTotal = components
      .filter((component) => component.componentType === SalaryComponentType.DEDUCTION)
      .reduce((sum, component) => sum + Number(component.amount || 0), 0);

    const grossEarnings = earningTotal || Number(structure.monthlyGross || 0);
    const totalDeductions = deductionTotal;
    const netPay = grossEarnings - totalDeductions;

    return await this.createPayslip(tenantId, employeeId, {
      salaryStructureId: structure.structureId,
      month: this.normalizeMonth(input.month),
      year: Number(input.year),
      grossEarnings,
      totalDeductions,
      netPay,
      paidDays: input.paidDays ?? 30,
      lopDays: input.lopDays ?? 0,
      paymentDate: input.paymentDate || null,
      status: input.status || PayslipStatus.FINAL,
      employeeVisible: input.employeeVisible ?? true,
      remarks: input.remarks || 'Auto-generated from active salary structure',
      components,
      generatedBy: input.generatedBy || null,
    });
  }

  async bulkImportPayslips(
    tenantId: string,
    employeeId: string,
    rows: any[],
    mode: 'create_only' | 'upsert' = 'create_only',
    generatedBy?: string | null
  ): Promise<BulkPayslipImportResult> {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Import file does not contain any salary transaction rows.');
    }

    const result: BulkPayslipImportResult = { created: 0, updated: 0, failed: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      try {
        const payload = this.normalizeBulkPayslipRow(row, generatedBy);
        const existing = await this.payslipRepo.findOne({
          where: { tenantId, employeeId, month: payload.month, year: payload.year },
        });

        if (existing) {
          if (mode !== 'upsert') {
            throw new Error('A payslip already exists for this employee and month');
          }
          await this.updatePayslip(tenantId, existing.payslipId, payload);
          result.updated += 1;
        } else {
          await this.createPayslip(tenantId, employeeId, payload);
          result.created += 1;
        }
      } catch (error: any) {
        result.failed += 1;
        result.errors.push({ row: index + 1, message: error.message || 'Row could not be imported' });
      }
    }

    return result;
  }

  async updatePayslip(
    tenantId: string,
    payslipId: string,
    input: Partial<PayslipInput>
  ): Promise<Payslip | null> {
    const payslip = await this.payslipRepo.findOne({ where: { tenantId, payslipId } });
    if (!payslip) return null;
    await this.validatePayslipInput(tenantId, payslip.employeeId, { ...payslip, ...input } as PayslipInput, payslipId);

    Object.assign(payslip, {
      salaryStructureId: input.salaryStructureId === undefined ? payslip.salaryStructureId : input.salaryStructureId,
      month: input.month ?? payslip.month,
      year: input.year ?? payslip.year,
      grossEarnings: input.grossEarnings ?? payslip.grossEarnings,
      totalDeductions: input.totalDeductions ?? payslip.totalDeductions,
      netPay: input.netPay ?? payslip.netPay,
      paidDays: input.paidDays ?? payslip.paidDays,
      lopDays: input.lopDays ?? payslip.lopDays,
      paymentDate: input.paymentDate === undefined ? payslip.paymentDate : input.paymentDate,
      status: input.status || payslip.status,
      employeeVisible: input.employeeVisible ?? payslip.employeeVisible,
      remarks: input.remarks === undefined ? payslip.remarks : this.cleanText(input.remarks),
      internalNotes: input.internalNotes === undefined ? payslip.internalNotes : this.cleanText(input.internalNotes),
    });

    await this.payslipRepo.save(payslip);
    if (input.components) {
      await this.replacePayslipComponents(tenantId, payslipId, input.components);
    }

    return await this.payslipRepo.findOne({
      where: { tenantId, payslipId },
      relations: ['components', 'attachments'],
    });
  }

  async deletePayslip(tenantId: string, payslipId: string): Promise<boolean> {
    const payslip = await this.payslipRepo.findOne({
      where: { tenantId, payslipId },
      relations: ['attachments'],
    });
    if (!payslip) return false;

    await this.payslipRepo.delete({ tenantId, payslipId });
    return true;
  }

  async addPayslipAttachment(params: {
    tenantId: string;
    payslipId: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy?: string | null;
    isPrimary?: boolean;
  }): Promise<PayslipAttachment | null> {
    const payslip = await this.payslipRepo.findOne({
      where: { tenantId: params.tenantId, payslipId: params.payslipId },
    });
    if (!payslip) return null;

    if (params.isPrimary !== false) {
      await this.payslipAttachmentRepo.update(
        { tenantId: params.tenantId, payslipId: params.payslipId },
        { isPrimary: false }
      );
    }

    const currentCount = await this.payslipAttachmentRepo.count({
      where: { tenantId: params.tenantId, payslipId: params.payslipId },
    });

    const attachment = this.payslipAttachmentRepo.create({
      ...params,
      version: currentCount + 1,
      isPrimary: params.isPrimary !== false,
    });

    return await this.payslipAttachmentRepo.save(attachment);
  }

  async getAttachment(tenantId: string, attachmentId: string): Promise<PayslipAttachment | null> {
    return await this.payslipAttachmentRepo.findOne({
      where: { tenantId, attachmentId },
      relations: ['payslip'],
    });
  }

  async logShare(params: {
    tenantId: string;
    employeeId: string;
    payslipId?: string | null;
    channel: CompensationShareChannel;
    recipient?: string | null;
    remarks?: string | null;
    sharedBy?: string | null;
  }): Promise<CompensationShareLog> {
    await this.assertEmployeeBelongsToTenant(params.tenantId, params.employeeId);
    if (params.payslipId) {
      const payslip = await this.payslipRepo.findOne({
        where: { tenantId: params.tenantId, payslipId: params.payslipId },
      });
      if (!payslip || payslip.employeeId !== params.employeeId) {
        throw new Error('Payslip does not belong to this employee');
      }
    }

    const log = this.shareLogRepo.create({
      ...params,
      status: CompensationShareStatus.LOGGED,
      remarks: this.cleanText(params.remarks),
    });

    return await this.shareLogRepo.save(log);
  }

  private async replaceSalaryComponents(
    tenantId: string,
    salaryStructureId: string,
    components: SalaryComponentInput[]
  ): Promise<void> {
    await this.salaryComponentRepo.delete({ tenantId, salaryStructureId });
    if (!components.length) return;

    const entities = components.map((component, index) =>
      this.salaryComponentRepo.create({
        tenantId,
        salaryStructureId,
        componentName: component.componentName.trim(),
        componentType: component.componentType,
        monthlyAmount: component.monthlyAmount || 0,
        annualAmount: component.annualAmount ?? (component.monthlyAmount || 0) * 12,
        taxable: component.taxable ?? true,
        statutory: component.statutory ?? false,
        displayOrder: component.displayOrder ?? index + 1,
      })
    );

    await this.salaryComponentRepo.save(entities);
  }

  private async replacePayslipComponents(
    tenantId: string,
    payslipId: string,
    components: PayslipComponentInput[]
  ): Promise<void> {
    await this.payslipComponentRepo.delete({ tenantId, payslipId });
    if (!components.length) return;

    const entities = components.map((component, index) =>
      this.payslipComponentRepo.create({
        tenantId,
        payslipId,
        componentName: component.componentName.trim(),
        componentType: component.componentType,
        amount: component.amount || 0,
        displayOrder: component.displayOrder ?? index + 1,
      })
    );

    await this.payslipComponentRepo.save(entities);
  }

  private validateSalaryStructureInput(input: SalaryStructureInput): void {
    if (!input.effectiveFrom || Number.isNaN(new Date(input.effectiveFrom).getTime())) {
      throw new Error('Effective from date is required');
    }
    if (Number(input.annualCtc) < 0 || Number(input.monthlyGross) < 0 || Number(input.monthlyNetEstimate) < 0) {
      throw new Error('Salary values cannot be negative');
    }
    if (Number(input.monthlyNetEstimate) > Number(input.monthlyGross)) {
      throw new Error('Monthly net estimate cannot exceed monthly gross');
    }
    (input.components || []).forEach((component) => {
      if (!component.componentName?.trim()) throw new Error('Every salary component must have a name');
      if (Number(component.monthlyAmount) < 0) throw new Error('Salary component amounts cannot be negative');
    });
  }

  private normalizeBulkPayslipRow(row: any, generatedBy?: string | null): PayslipInput {
    const components: PayslipComponentInput[] = Array.isArray(row.components)
      ? row.components
          .filter((component: any) => component.componentName || component.name)
          .map((component: any, index: number) => ({
            componentName: String(component.componentName || component.name).trim(),
            componentType: this.normalizeComponentType(component.componentType || component.type),
            amount: this.numberOr(component.amount ?? component.monthlyAmount, 0),
            displayOrder: Number(component.displayOrder || index + 1),
          }))
      : [];

    const earningTotal = components
      .filter((component) => component.componentType === SalaryComponentType.EARNING)
      .reduce((sum, component) => sum + Number(component.amount || 0), 0);
    const deductionTotal = components
      .filter((component) => component.componentType === SalaryComponentType.DEDUCTION)
      .reduce((sum, component) => sum + Number(component.amount || 0), 0);

    const grossEarnings = this.numberOr(row.grossEarnings ?? row.gross ?? row.totalEarnings, earningTotal);
    const totalDeductions = this.numberOr(row.totalDeductions ?? row.deductions, deductionTotal);
    const netPay = this.numberOr(row.netPay ?? row.netAmount ?? row.net, grossEarnings - totalDeductions);

    return {
      salaryStructureId: row.salaryStructureId || null,
      month: this.normalizeMonth(row.month),
      year: Number(row.year),
      grossEarnings,
      totalDeductions,
      netPay,
      paidDays: this.numberOr(row.paidDays, 30),
      lopDays: this.numberOr(row.lopDays, 0),
      paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
      status: Object.values(PayslipStatus).includes(row.status as PayslipStatus) ? row.status : PayslipStatus.FINAL,
      employeeVisible: row.employeeVisible === undefined ? true : this.toBoolean(row.employeeVisible),
      remarks: row.remarks || 'Imported during compensation data migration',
      internalNotes: row.internalNotes || null,
      components,
      generatedBy: generatedBy || null,
    };
  }

  private normalizeMonth(value: any): number {
    if (typeof value === 'string' && Number.isNaN(Number(value))) {
      const monthIndex = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ].indexOf(value.trim().toLowerCase());
      if (monthIndex >= 0) return monthIndex + 1;
    }
    return Number(value);
  }

  private normalizeComponentType(value: any): SalaryComponentType {
    return Object.values(SalaryComponentType).includes(value) ? value : SalaryComponentType.EARNING;
  }

  private numberOr(value: any, fallback: number): number {
    if (value === undefined || value === null || value === '') return Number(fallback || 0);
    const parsed = Number(value);
    if (Number.isNaN(parsed)) throw new Error('Numeric field contains an invalid value');
    return parsed;
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return !['false', '0', 'no', 'n'].includes(value.trim().toLowerCase());
    return Boolean(value);
  }

  private async validatePayslipInput(
    tenantId: string,
    employeeId: string,
    input: PayslipInput,
    existingPayslipId?: string
  ): Promise<void> {
    if (!Number.isInteger(Number(input.month)) || Number(input.month) < 1 || Number(input.month) > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (!Number.isInteger(Number(input.year)) || Number(input.year) < 2000 || Number(input.year) > 2100) {
      throw new Error('Year must be valid');
    }
    if (
      Number(input.grossEarnings) < 0 ||
      Number(input.totalDeductions) < 0 ||
      Number(input.netPay) < 0 ||
      Number(input.paidDays || 0) < 0 ||
      Number(input.lopDays || 0) < 0
    ) {
      throw new Error('Payslip values cannot be negative');
    }
    if (Number(input.netPay) > Number(input.grossEarnings)) {
      throw new Error('Net pay cannot exceed gross earnings');
    }
    const expectedNetPay = Number(input.grossEarnings) - Number(input.totalDeductions);
    if (Math.abs(expectedNetPay - Number(input.netPay)) > 1) {
      throw new Error('Net pay should match gross earnings minus total deductions');
    }
    if (input.salaryStructureId) {
      const structure = await this.salaryStructureRepo.findOne({
        where: { tenantId, employeeId, structureId: input.salaryStructureId },
      });
      if (!structure) throw new Error('Selected salary structure does not belong to this employee');
    }
    const duplicate = await this.payslipRepo.findOne({
      where: { tenantId, employeeId, month: Number(input.month), year: Number(input.year) },
    });
    if (duplicate && duplicate.payslipId !== existingPayslipId) {
      throw new Error('A payslip already exists for this employee and month');
    }
  }

  private async closeExistingActiveStructures(
    tenantId: string,
    employeeId: string,
    newEffectiveFrom: Date,
    exceptStructureId?: string
  ): Promise<void> {
    const activeStructures = await this.salaryStructureRepo.find({
      where: { tenantId, employeeId, status: SalaryStructureStatus.ACTIVE },
    });

    const closeDate = new Date(newEffectiveFrom);
    closeDate.setDate(closeDate.getDate() - 1);

    await Promise.all(
      activeStructures
        .filter((structure) => structure.structureId !== exceptStructureId)
        .map((structure) => {
          structure.status = SalaryStructureStatus.SUPERSEDED;
          structure.effectiveTo = closeDate;
          return this.salaryStructureRepo.save(structure);
        })
    );
  }

  private async createCompensationHistoryForStructure(
    tenantId: string,
    employeeId: string,
    structure: SalaryStructure,
    approvedBy?: string | null
  ): Promise<void> {
    const previous = await this.compensationHistoryRepo.findOne({
      where: { tenantId, employeeId },
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
    });

    const previousAmount = previous ? Number(previous.newAmount) : undefined;
    const newAmount = Number(structure.annualCtc || 0);
    if (!newAmount) return;

    const changeType = previous
      ? CompensationChangeType.ADJUSTMENT
      : CompensationChangeType.INITIAL_SALARY;

    const changeAmount = previousAmount === undefined ? undefined : newAmount - previousAmount;
    const changePercentage =
      previousAmount && previousAmount > 0 ? ((newAmount - previousAmount) / previousAmount) * 100 : undefined;

    const history = this.compensationHistoryRepo.create({
      tenantId,
      employeeId,
      changeType,
      component: CompensationComponent.BASE_SALARY,
      previousAmount,
      newAmount,
      changeAmount,
      changePercentage,
      currency: structure.currency,
      effectiveDate: structure.effectiveFrom,
      reason: structure.remarks || 'Salary structure recorded',
      approvedBy: approvedBy || undefined,
      approvedAt: approvedBy ? new Date() : undefined,
    });

    await this.compensationHistoryRepo.save(history);
  }

  private buildTimeline(
    salaryStructures: SalaryStructure[],
    payslips: Payslip[],
    revisions: CompensationHistory[],
    shareLogs: CompensationShareLog[]
  ) {
    const salaryEvents = salaryStructures.map((structure) => ({
      id: structure.structureId,
      type: 'salary_structure',
      date: structure.effectiveFrom,
      title: structure.status === SalaryStructureStatus.ACTIVE ? 'Active salary structure' : 'Salary structure recorded',
      description: `${structure.currency} ${Number(structure.annualCtc || 0).toLocaleString('en-IN')} annual CTC`,
      amount: Number(structure.annualCtc || 0),
      status: structure.status,
    }));

    const payslipEvents = payslips.map((payslip) => ({
      id: payslip.payslipId,
      type: 'payslip',
      date: new Date(payslip.year, payslip.month - 1, 1),
      title: `Payslip ${payslip.month}/${payslip.year}`,
      description: `Net pay ${Number(payslip.netPay || 0).toLocaleString('en-IN')}`,
      amount: Number(payslip.netPay || 0),
      status: payslip.status,
    }));

    const revisionEvents = revisions.map((revision) => ({
      id: revision.historyId,
      type: 'revision',
      date: revision.effectiveDate,
      title: 'Compensation revision',
      description: `${revision.currency} ${Number(revision.previousAmount || 0).toLocaleString('en-IN')} to ${Number(revision.newAmount || 0).toLocaleString('en-IN')}`,
      amount: Number(revision.changeAmount || 0),
      status: revision.changeType,
    }));

    const shareEvents = shareLogs.map((share) => ({
      id: share.shareLogId,
      type: 'share',
      date: share.sharedOn,
      title: `Shared through ${share.channel.replace('_', ' ')}`,
      description: share.recipient || share.remarks || 'Compensation item shared',
      status: share.status,
    }));

    return [...salaryEvents, ...payslipEvents, ...revisionEvents, ...shareEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private async assertEmployeeBelongsToTenant(tenantId: string, employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({ where: { tenantId, employeeId } });
    if (!employee) {
      throw new Error('Employee not found');
    }
  }

  private cleanText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}

export default new CompensationService();
