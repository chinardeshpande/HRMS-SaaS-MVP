import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PositionHistory, PositionChangeType } from '../models/PositionHistory';
import { CompensationHistory, CompensationChangeType, CompensationComponent } from '../models/CompensationHistory';
import {
  ManualEmploymentHistory,
  ManualEmploymentHistoryType,
} from '../models/ManualEmploymentHistory';
import { Employee } from '../models/Employee';

export class ProfessionalHistoryService {
  private positionHistoryRepo: Repository<PositionHistory>;
  private compensationHistoryRepo: Repository<CompensationHistory>;
  private manualEmploymentHistoryRepo: Repository<ManualEmploymentHistory>;
  private employeeRepo: Repository<Employee>;

  constructor() {
    this.positionHistoryRepo = AppDataSource.getRepository(PositionHistory);
    this.compensationHistoryRepo = AppDataSource.getRepository(CompensationHistory);
    this.manualEmploymentHistoryRepo = AppDataSource.getRepository(ManualEmploymentHistory);
    this.employeeRepo = AppDataSource.getRepository(Employee);
  }

  /**
   * Create a joining record in position history
   */
  async createJoiningRecord(
    tenantId: string,
    employeeId: string,
    departmentId: string | undefined,
    designationId: string | undefined,
    dateOfJoining: Date,
    notes?: string
  ): Promise<PositionHistory> {
    const history = this.positionHistoryRepo.create({
      tenantId,
      employeeId,
      changeType: PositionChangeType.JOINING,
      toDepartmentId: departmentId,
      toDesignationId: designationId,
      effectiveDate: dateOfJoining,
      notes: notes || 'Employee joined the organization',
    });

    return await this.positionHistoryRepo.save(history);
  }

  /**
   * Create position change record (promotion, transfer, etc.)
   */
  async createPositionChange(params: {
    tenantId: string;
    employeeId: string;
    changeType: PositionChangeType;
    fromDepartmentId?: string;
    fromDesignationId?: string;
    toDepartmentId?: string;
    toDesignationId?: string;
    effectiveDate: Date;
    reason?: string;
    notes?: string;
    approvedBy?: string;
  }): Promise<PositionHistory> {
    const history = this.positionHistoryRepo.create({
      ...params,
      approvedAt: params.approvedBy ? new Date() : undefined,
    });

    return await this.positionHistoryRepo.save(history);
  }

  /**
   * Create compensation history record
   */
  async createCompensationChange(params: {
    tenantId: string;
    employeeId: string;
    changeType: CompensationChangeType;
    component?: CompensationComponent;
    previousAmount?: number;
    newAmount: number;
    currency?: string;
    effectiveDate: Date;
    reason?: string;
    notes?: string;
    approvedBy?: string;
    performanceReviewId?: string;
    performanceRating?: number;
  }): Promise<CompensationHistory> {
    // Calculate change amount and percentage if previous amount exists
    const changeAmount = params.previousAmount
      ? params.newAmount - params.previousAmount
      : undefined;

    const changePercentage =
      params.previousAmount && params.previousAmount > 0
        ? ((params.newAmount - params.previousAmount) / params.previousAmount) * 100
        : undefined;

    const history = this.compensationHistoryRepo.create({
      ...params,
      component: params.component || CompensationComponent.BASE_SALARY,
      currency: params.currency || 'USD',
      changeAmount,
      changePercentage,
      approvedAt: params.approvedBy ? new Date() : undefined,
    });

    return await this.compensationHistoryRepo.save(history);
  }

  /**
   * Get position history for an employee
   */
  async getPositionHistory(
    tenantId: string,
    employeeId: string
  ): Promise<PositionHistory[]> {
    return await this.positionHistoryRepo.find({
      where: { tenantId, employeeId },
      relations: ['fromDepartment', 'fromDesignation', 'toDepartment', 'toDesignation', 'approver'],
      order: { effectiveDate: 'DESC' },
    });
  }

  /**
   * Get compensation history for an employee
   */
  async getCompensationHistory(
    tenantId: string,
    employeeId: string
  ): Promise<CompensationHistory[]> {
    return await this.compensationHistoryRepo.find({
      where: { tenantId, employeeId },
      relations: ['approver'],
      order: { effectiveDate: 'DESC' },
    });
  }

  /**
   * Get combined professional history (position + compensation + performance)
   */
  async getCombinedHistory(
    tenantId: string,
    employeeId: string
  ): Promise<{
    positionChanges: PositionHistory[];
    compensationChanges: CompensationHistory[];
    manualEntries: ManualEmploymentHistory[];
  }> {
    const [positionChanges, compensationChanges, manualEntries] = await Promise.all([
      this.getPositionHistory(tenantId, employeeId),
      this.getCompensationHistory(tenantId, employeeId),
      this.getManualEmploymentHistory(tenantId, employeeId),
    ]);

    return {
      positionChanges,
      compensationChanges,
      manualEntries,
    };
  }

  async getManualEmploymentHistory(
    tenantId: string,
    employeeId: string
  ): Promise<ManualEmploymentHistory[]> {
    return await this.manualEmploymentHistoryRepo.find({
      where: { tenantId, employeeId },
      relations: ['creator', 'updater'],
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async createManualEmploymentHistory(params: {
    tenantId: string;
    employeeId: string;
    eventType: ManualEmploymentHistoryType;
    title: string;
    effectiveDate: Date;
    description?: string;
    fromValue?: string;
    toValue?: string;
    amount?: number;
    currency?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<ManualEmploymentHistory> {
    await this.assertEmployeeBelongsToTenant(params.tenantId, params.employeeId);

    const entry = this.manualEmploymentHistoryRepo.create({
      ...params,
      title: params.title.trim(),
      description: params.description?.trim() || undefined,
      fromValue: params.fromValue?.trim() || undefined,
      toValue: params.toValue?.trim() || undefined,
      currency: params.currency?.trim().toUpperCase() || undefined,
      notes: params.notes?.trim() || undefined,
    });

    return await this.manualEmploymentHistoryRepo.save(entry);
  }

  async updateManualEmploymentHistory(
    tenantId: string,
    manualHistoryId: string,
    updates: Partial<{
      eventType: ManualEmploymentHistoryType;
      title: string;
      effectiveDate: Date;
      description: string | null;
      fromValue: string | null;
      toValue: string | null;
      amount: number | null;
      currency: string | null;
      notes: string | null;
      updatedBy: string;
    }>
  ): Promise<ManualEmploymentHistory | null> {
    const entry = await this.manualEmploymentHistoryRepo.findOne({
      where: { tenantId, manualHistoryId },
    });

    if (!entry) return null;

    Object.assign(entry, {
      ...updates,
      title: updates.title?.trim() ?? entry.title,
      description: this.cleanNullableText(updates.description, entry.description),
      fromValue: this.cleanNullableText(updates.fromValue, entry.fromValue),
      toValue: this.cleanNullableText(updates.toValue, entry.toValue),
      currency:
        updates.currency === null
          ? null
          : updates.currency?.trim().toUpperCase() || entry.currency,
      notes: this.cleanNullableText(updates.notes, entry.notes),
    });

    return await this.manualEmploymentHistoryRepo.save(entry);
  }

  async deleteManualEmploymentHistory(tenantId: string, manualHistoryId: string): Promise<boolean> {
    const result = await this.manualEmploymentHistoryRepo.delete({ tenantId, manualHistoryId });
    return Boolean(result.affected);
  }

  private async assertEmployeeBelongsToTenant(tenantId: string, employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({ where: { tenantId, employeeId } });
    if (!employee) {
      throw new Error('Employee not found');
    }
  }

  private cleanNullableText(value: string | null | undefined, fallback?: string): string | null | undefined {
    if (value === undefined) return fallback;
    if (value === null) return null;

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  /**
   * Get current position for an employee
   */
  async getCurrentPosition(
    tenantId: string,
    employeeId: string
  ): Promise<PositionHistory | null> {
    const history = await this.positionHistoryRepo.findOne({
      where: { tenantId, employeeId },
      relations: ['toDepartment', 'toDesignation'],
      order: { effectiveDate: 'DESC' },
    });

    return history;
  }

  /**
   * Get current compensation for an employee
   */
  async getCurrentCompensation(
    tenantId: string,
    employeeId: string,
    component: CompensationComponent = CompensationComponent.BASE_SALARY
  ): Promise<CompensationHistory | null> {
    const history = await this.compensationHistoryRepo.findOne({
      where: { tenantId, employeeId, component },
      order: { effectiveDate: 'DESC' },
    });

    return history;
  }
}

export default new ProfessionalHistoryService();
