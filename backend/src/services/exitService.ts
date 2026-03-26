import { AppDataSource } from '../config/database';
import { ExitCase } from '../models/ExitCase';
import { ExitInterview } from '../models/ExitInterview';
import { AssetReturn } from '../models/AssetReturn';
import { Clearance } from '../models/Clearance';
import { FinalSettlement } from '../models/FinalSettlement';
import { Employee } from '../models/Employee';
import { ExitState } from '../models/enums/ExitState';
import { ResignationType } from '../models/enums/ResignationType';
import { ClearanceStatus } from '../models/enums/ClearanceStatus';
import { AssetReturnStatus } from '../models/enums/AssetReturnStatus';
import { SettlementStatus } from '../models/enums/SettlementStatus';
import exitFSMService from './ExitFSMService';
import logger from '../utils/logger';

export class ExitService {
  private exitCaseRepo = AppDataSource.getRepository(ExitCase);
  private interviewRepo = AppDataSource.getRepository(ExitInterview);
  private assetReturnRepo = AppDataSource.getRepository(AssetReturn);
  private clearanceRepo = AppDataSource.getRepository(Clearance);
  private settlementRepo = AppDataSource.getRepository(FinalSettlement);
  private employeeRepo = AppDataSource.getRepository(Employee);

  async submitResignation(
    employeeId: string,
    tenantId: string,
    data: {
      resignationType: ResignationType;
      resignationReason: string;
      detailedReason?: string;
      lastWorkingDate: Date;
      noticePeriodDays?: number;
    }
  ): Promise<ExitCase> {
    const employee = await this.employeeRepo.findOne({ where: { employeeId, tenantId } });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const existingExitCase = await this.exitCaseRepo.findOne({ where: { employeeId, tenantId } });

    if (existingExitCase) {
      throw new Error('Exit case already exists for this employee');
    }

    const exitCase = this.exitCaseRepo.create({
      tenantId,
      employeeId,
      resignationType: data.resignationType,
      resignationReason: data.resignationReason,
      detailedReason: data.detailedReason,
      lastWorkingDate: data.lastWorkingDate,
      noticePeriodDays: data.noticePeriodDays || 30,
      resignationSubmittedDate: new Date(),
      currentState: ExitState.RESIGNATION_SUBMITTED,
    });

    const savedExitCase = await this.exitCaseRepo.save(exitCase);
    logger.info(`Resignation submitted for employee ${employeeId}`);
    return savedExitCase;
  }

  async approveResignation(exitId: string, userId: string, notes?: string): Promise<void> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    if (exitCase.currentState !== ExitState.RESIGNATION_SUBMITTED) {
      throw new Error('Resignation can only be approved from RESIGNATION_SUBMITTED state');
    }

    exitCase.approvedBy = userId;

    if (notes) {
      exitCase.notes = notes;
    }

    await this.exitCaseRepo.save(exitCase);

    const result = await exitFSMService.transition(
      exitId,
      ExitState.RESIGNATION_APPROVED,
      userId,
      'Resignation approved by manager/HR'
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to approve resignation');
    }

    logger.info(`Resignation approved for exit case ${exitId}`);
  }

  async rejectResignation(exitId: string, userId: string, reason: string): Promise<void> {
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    if (exitCase.currentState !== ExitState.RESIGNATION_SUBMITTED) {
      throw new Error('Resignation can only be rejected from RESIGNATION_SUBMITTED state');
    }

    exitCase.rejectionReason = reason;
    await this.exitCaseRepo.save(exitCase);

    const result = await exitFSMService.transition(
      exitId,
      ExitState.RESIGNATION_REJECTED,
      userId,
      reason
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to reject resignation');
    }

    logger.info(`Resignation rejected for exit case ${exitId}`);
  }

  async buyoutNoticePeriod(exitId: string, userId: string, buyoutAmount: number): Promise<void> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    exitCase.buyoutAmount = buyoutAmount;
    await this.exitCaseRepo.save(exitCase);

    const result = await exitFSMService.transition(
      exitId,
      ExitState.NOTICE_PERIOD_BUYOUT,
      userId,
      `Notice period buyout for ${buyoutAmount}`
    );

    if (!result.success) {
      throw new Error(result.message || 'Failed to process notice period buyout');
    }

    logger.info(`Notice period buyout processed for exit case ${exitId}`);
  }

  async updateClearance(
    clearanceId: string,
    userId: string,
    data: {
      status?: ClearanceStatus;
      isCleared?: boolean;
      clearerComments?: string;
      completedChecklistItems?: string[];
    }
  ): Promise<void> {
    const clearance = await this.clearanceRepo.findOne({ where: { clearanceId } });

    if (!clearance) {
      throw new Error('Clearance not found');
    }

    if (data.status) {
      clearance.status = data.status;
    }

    if (data.isCleared !== undefined) {
      clearance.isCleared = data.isCleared;
      clearance.completedDate = new Date();
    }

    if (data.clearerComments) {
      clearance.clearerComments = data.clearerComments;
    }

    if (data.completedChecklistItems) {
      clearance.completedChecklistItems = data.completedChecklistItems;
    }

    await this.clearanceRepo.save(clearance);
    logger.info(`Clearance updated: ${clearanceId}`);

    // Check if all clearances are completed and update exit case
    await this.checkAndUpdateClearanceStatus(clearance.exitId);
  }

  async approveClearance(clearanceId: string, userId: string): Promise<void> {
    const clearance = await this.clearanceRepo.findOne({ where: { clearanceId } });

    if (!clearance) {
      throw new Error('Clearance not found');
    }

    clearance.status = ClearanceStatus.CLEARED;
    clearance.isCleared = true;
    clearance.approvedBy = userId;
    clearance.approvedDate = new Date();
    clearance.completedDate = new Date();

    await this.clearanceRepo.save(clearance);
    logger.info(`Clearance approved: ${clearanceId}`);

    await this.checkAndUpdateClearanceStatus(clearance.exitId);
  }

  private async checkAndUpdateClearanceStatus(exitId: string): Promise<void> {
    const totalClearances = await this.clearanceRepo.count({
      where: { exitId, isRequired: true },
    });

    const completedClearances = await this.clearanceRepo.count({
      where: { exitId, isRequired: true, isCleared: true },
    });

    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (exitCase) {
      exitCase.totalClearances = totalClearances;
      exitCase.completedClearances = completedClearances;
      exitCase.allClearancesCleared = totalClearances === completedClearances;

      if (exitCase.allClearancesCleared && !exitCase.clearanceCompletedDate) {
        exitCase.clearanceCompletedDate = new Date();
      }

      await this.exitCaseRepo.save(exitCase);
    }
  }

  async recordAssetReturn(
    exitId: string,
    assetData: {
      assetType: string;
      assetName?: string;
      assetId?: string;
      make?: string;
      model?: string;
      status: AssetReturnStatus;
      isDamaged?: boolean;
      damageDescription?: string;
      damageCharge?: number;
      isMissing?: boolean;
      replacementCost?: number;
    },
    userId: string
  ): Promise<AssetReturn> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    const asset = this.assetReturnRepo.create({
      tenantId: exitCase.tenantId,
      exitId,
      employeeId: exitCase.employeeId,
      ...assetData,
      verifiedBy: userId,
      verifiedDate: new Date(),
      isReturned: assetData.status === AssetReturnStatus.RETURNED,
    });

    const savedAsset = await this.assetReturnRepo.save(asset);
    logger.info(`Asset return recorded: ${savedAsset.assetReturnId}`);

    await this.checkAndUpdateAssetReturnStatus(exitId);
    return savedAsset;
  }

  private async checkAndUpdateAssetReturnStatus(exitId: string): Promise<void> {
    const totalAssets = await this.assetReturnRepo.count({ where: { exitId } });

    const returnedAssets = await this.assetReturnRepo.count({
      where: { exitId, isReturned: true },
    });

    const damagedAssets = await this.assetReturnRepo
      .createQueryBuilder('asset')
      .where('asset.exitId = :exitId', { exitId })
      .andWhere('asset.isDamaged = :isDamaged', { isDamaged: true })
      .getMany();

    const totalDamageCharges = damagedAssets.reduce((sum, asset) => sum + (Number(asset.damageCharge) || 0), 0);

    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (exitCase) {
      exitCase.totalAssets = totalAssets;
      exitCase.returnedAssets = returnedAssets;
      exitCase.allAssetsReturned = totalAssets === returnedAssets;
      exitCase.assetDamageDeduction = totalDamageCharges;

      if (exitCase.allAssetsReturned && !exitCase.assetsReturnedDate) {
        exitCase.assetsReturnedDate = new Date();
      }

      await this.exitCaseRepo.save(exitCase);
    }
  }

  async scheduleExitInterview(
    exitId: string,
    scheduledDate: Date,
    conductedBy: string
  ): Promise<ExitInterview> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    const interview = this.interviewRepo.create({
      tenantId: exitCase.tenantId,
      exitId,
      employeeId: exitCase.employeeId,
      conductedBy,
      scheduledDate,
      status: 'scheduled',
    });

    const savedInterview = await this.interviewRepo.save(interview);
    logger.info(`Exit interview scheduled: ${savedInterview.exitInterviewId}`);
    return savedInterview;
  }

  async submitExitInterview(
    exitInterviewId: string,
    data: Partial<ExitInterview>
  ): Promise<ExitInterview> {
    const interview = await this.interviewRepo.findOne({ where: { exitInterviewId } });

    if (!interview) {
      throw new Error('Exit interview not found');
    }

    Object.assign(interview, data);
    interview.completedDate = new Date();
    interview.status = 'completed';

    const savedInterview = await this.interviewRepo.save(interview);

    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId: interview.exitId } });

    if (exitCase) {
      exitCase.exitInterviewCompleted = true;
      exitCase.exitInterviewCompletedDate = new Date();
      await this.exitCaseRepo.save(exitCase);
    }

    logger.info(`Exit interview completed: ${exitInterviewId}`);
    return savedInterview;
  }

  async calculateSettlement(
    exitId: string,
    settlementData: Partial<FinalSettlement>,
    userId: string
  ): Promise<FinalSettlement> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    let settlement = await this.settlementRepo.findOne({ where: { exitId } });

    if (!settlement) {
      settlement = this.settlementRepo.create({
        tenantId: exitCase.tenantId,
        exitId,
        employeeId: exitCase.employeeId,
        status: SettlementStatus.CALCULATED,
      });
    }

    Object.assign(settlement, settlementData);
    settlement.calculatedBy = userId;
    settlement.calculatedDate = new Date();

    // Calculate totals
    const totalEarnings =
      (Number(settlement.basicSalaryDue) || 0) +
      (Number(settlement.allowancesDue) || 0) +
      (Number(settlement.bonusDue) || 0) +
      (Number(settlement.leaveEncashmentAmount) || 0) +
      (Number(settlement.gratuityAmount) || 0);

    const totalDeductions =
      (Number(settlement.noticePeriodRecovery) || 0) +
      (Number(settlement.loanRecovery) || 0) +
      (Number(settlement.advanceRecovery) || 0) +
      (Number(settlement.assetDamageDeduction) || 0) +
      (Number(settlement.tdsDeducted) || 0) +
      (Number(settlement.otherDeductions) || 0);

    settlement.totalEarnings = totalEarnings;
    settlement.totalDeductions = totalDeductions;
    settlement.netPayable = totalEarnings - totalDeductions;

    const savedSettlement = await this.settlementRepo.save(settlement);
    logger.info(`Settlement calculated for exit case ${exitId}`);
    return savedSettlement;
  }

  async approveSettlement(settlementId: string, userId: string, notes?: string): Promise<void> {
    const settlement = await this.settlementRepo.findOne({ where: { settlementId } });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    settlement.approvedBy = userId;
    settlement.approvedDate = new Date();
    settlement.approvalNotes = notes;
    settlement.status = SettlementStatus.APPROVED;

    await this.settlementRepo.save(settlement);
    logger.info(`Settlement approved: ${settlementId}`);
  }

  async markSettlementPaid(
    settlementId: string,
    userId: string,
    paymentData: {
      paymentDate: Date;
      paymentMode: string;
      paymentReferenceNumber: string;
    }
  ): Promise<void> {
    const settlement = await this.settlementRepo.findOne({ where: { settlementId } });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== SettlementStatus.APPROVED) {
      throw new Error('Settlement must be approved before marking as paid');
    }

    settlement.paymentDate = paymentData.paymentDate;
    settlement.paymentMode = paymentData.paymentMode;
    settlement.paymentReferenceNumber = paymentData.paymentReferenceNumber;
    settlement.paymentProcessedBy = userId;
    settlement.paymentProcessedDate = new Date();
    settlement.isPaid = true;
    settlement.status = SettlementStatus.PAID;

    await this.settlementRepo.save(settlement);
    logger.info(`Settlement marked as paid: ${settlementId}`);
  }

  async getExitCase(exitId: string): Promise<ExitCase | null> {
    return this.exitCaseRepo.findOne({
      where: { exitId },
      relations: ['employee', 'employee.department', 'employee.designation'],
    });
  }

  async getAllExitCases(tenantId: string, filters?: { state?: string }): Promise<ExitCase[]> {
    const query: any = { tenantId };

    if (filters?.state) {
      query.currentState = filters.state;
    }

    return this.exitCaseRepo.find({
      where: query,
      relations: ['employee', 'employee.department', 'employee.designation'],
      order: { lastWorkingDate: 'ASC' },
    });
  }

  async getPendingClearances(tenantId: string, departmentType?: string): Promise<Clearance[]> {
    const query: any = {
      tenantId,
      isCleared: false,
    };

    if (departmentType) {
      query.departmentType = departmentType;
    }

    return this.clearanceRepo.find({
      where: query,
      relations: ['exitCase', 'employee'],
      order: { dueDate: 'ASC' },
    });
  }

  async getPendingAssetReturns(tenantId: string): Promise<AssetReturn[]> {
    return this.assetReturnRepo.find({
      where: {
        tenantId,
        isReturned: false,
      },
      relations: ['exitCase', 'employee'],
      order: { expectedReturnDate: 'ASC' },
    });
  }

  async getExitStatistics(tenantId: string): Promise<Record<string, number>> {
    const stats: Record<string, number> = {
      total: 0,
      pending_approval: 0,
      notice_period: 0,
      clearance_pending: 0,
      assets_pending: 0,
      exit_completed: 0,
    };

    stats.total = await this.exitCaseRepo.count({ where: { tenantId } });
    stats.pending_approval = await this.exitCaseRepo.count({
      where: { tenantId, currentState: ExitState.RESIGNATION_SUBMITTED },
    });
    stats.notice_period = await this.exitCaseRepo.count({
      where: { tenantId, currentState: ExitState.NOTICE_PERIOD_ACTIVE },
    });
    stats.clearance_pending = await this.exitCaseRepo.count({
      where: { tenantId, currentState: ExitState.CLEARANCE_IN_PROGRESS },
    });
    stats.assets_pending = await this.exitCaseRepo.count({
      where: { tenantId, currentState: ExitState.ASSETS_PENDING },
    });
    stats.exit_completed = await this.exitCaseRepo.count({
      where: { tenantId, currentState: ExitState.EXIT_COMPLETED },
    });

    return stats;
  }

  // ==================== EXIT CASE CRUD OPERATIONS ====================

  async updateExitCase(exitId: string, data: Partial<ExitCase>, userId: string): Promise<ExitCase> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    Object.assign(exitCase, data);
    const updated = await this.exitCaseRepo.save(exitCase);
    logger.info(`Exit case updated: ${exitId} by user ${userId}`);
    return updated;
  }

  async deleteExitCase(exitId: string, userId: string): Promise<void> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    await this.exitCaseRepo.remove(exitCase);
    logger.info(`Exit case deleted: ${exitId} by user ${userId}`);
  }

  // ==================== CLEARANCE CRUD OPERATIONS ====================

  async createClearance(exitId: string, data: Partial<Clearance>, userId: string): Promise<Clearance> {
    const exitCase = await this.exitCaseRepo.findOne({ where: { exitId } });

    if (!exitCase) {
      throw new Error('Exit case not found');
    }

    const clearance = this.clearanceRepo.create({
      ...data,
      tenantId: exitCase.tenantId,
      exitId,
      employeeId: exitCase.employeeId,
      isCleared: false,
    });

    const saved = await this.clearanceRepo.save(clearance);
    logger.info(`Clearance created: ${saved.clearanceId} for exit ${exitId} by user ${userId}`);
    return saved;
  }

  async getClearancesByExitId(exitId: string): Promise<Clearance[]> {
    return this.clearanceRepo.find({
      where: { exitId },
      order: { dueDate: 'ASC' },
    });
  }

  async deleteClearance(clearanceId: string, userId: string): Promise<void> {
    const clearance = await this.clearanceRepo.findOne({ where: { clearanceId } });

    if (!clearance) {
      throw new Error('Clearance not found');
    }

    await this.clearanceRepo.remove(clearance);
    logger.info(`Clearance deleted: ${clearanceId} by user ${userId}`);
  }

  // ==================== ASSET RETURN CRUD OPERATIONS ====================

  async updateAssetReturn(assetId: string, data: Partial<AssetReturn>, userId: string): Promise<AssetReturn> {
    const asset = await this.assetReturnRepo.findOne({ where: { assetId } });

    if (!asset) {
      throw new Error('Asset return record not found');
    }

    Object.assign(asset, data);
    const updated = await this.assetReturnRepo.save(asset);
    logger.info(`Asset return updated: ${assetId} by user ${userId}`);
    return updated;
  }

  async getAssetsByExitId(exitId: string): Promise<AssetReturn[]> {
    return this.assetReturnRepo.find({
      where: { exitId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteAssetReturn(assetId: string, userId: string): Promise<void> {
    const asset = await this.assetReturnRepo.findOne({ where: { assetId } });

    if (!asset) {
      throw new Error('Asset return record not found');
    }

    await this.assetReturnRepo.remove(asset);
    logger.info(`Asset return deleted: ${assetId} by user ${userId}`);
  }

  // ==================== EXIT INTERVIEW CRUD OPERATIONS ====================

  async updateExitInterview(exitInterviewId: string, data: Partial<ExitInterview>, userId: string): Promise<ExitInterview> {
    const interview = await this.interviewRepo.findOne({ where: { exitInterviewId } });

    if (!interview) {
      throw new Error('Exit interview not found');
    }

    Object.assign(interview, data);
    const updated = await this.interviewRepo.save(interview);
    logger.info(`Exit interview updated: ${exitInterviewId} by user ${userId}`);
    return updated;
  }

  async getExitInterviewByExitId(exitId: string): Promise<ExitInterview | null> {
    return this.interviewRepo.findOne({
      where: { exitId },
    });
  }

  async deleteExitInterview(exitInterviewId: string, userId: string): Promise<void> {
    const interview = await this.interviewRepo.findOne({ where: { exitInterviewId } });

    if (!interview) {
      throw new Error('Exit interview not found');
    }

    await this.interviewRepo.remove(interview);
    logger.info(`Exit interview deleted: ${exitInterviewId} by user ${userId}`);
  }

  // ==================== SETTLEMENT CRUD OPERATIONS ====================

  async updateSettlement(settlementId: string, data: Partial<FinalSettlement>, userId: string): Promise<FinalSettlement> {
    const settlement = await this.settlementRepo.findOne({ where: { settlementId } });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    Object.assign(settlement, data);
    const updated = await this.settlementRepo.save(settlement);
    logger.info(`Settlement updated: ${settlementId} by user ${userId}`);
    return updated;
  }

  async getSettlementByExitId(exitId: string): Promise<FinalSettlement | null> {
    return this.settlementRepo.findOne({
      where: { exitId },
    });
  }

  async deleteSettlement(settlementId: string, userId: string): Promise<void> {
    const settlement = await this.settlementRepo.findOne({ where: { settlementId } });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    await this.settlementRepo.remove(settlement);
    logger.info(`Settlement deleted: ${settlementId} by user ${userId}`);
  }
}

export default new ExitService();
