import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PositionHistory, PositionChangeType } from '../models/PositionHistory';
import { CompensationHistory, CompensationChangeType, CompensationComponent } from '../models/CompensationHistory';
import { Employee } from '../models/Employee';

export class ProfessionalHistoryService {
  private positionHistoryRepo: Repository<PositionHistory>;
  private compensationHistoryRepo: Repository<CompensationHistory>;
  private employeeRepo: Repository<Employee>;

  constructor() {
    this.positionHistoryRepo = AppDataSource.getRepository(PositionHistory);
    this.compensationHistoryRepo = AppDataSource.getRepository(CompensationHistory);
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
  }> {
    const [positionChanges, compensationChanges] = await Promise.all([
      this.getPositionHistory(tenantId, employeeId),
      this.getCompensationHistory(tenantId, employeeId),
    ]);

    return {
      positionChanges,
      compensationChanges,
    };
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
