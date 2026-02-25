import { AppDataSource } from '../config/database';
import { ExitCase } from '../models/ExitCase';
import { Clearance } from '../models/Clearance';
import { AssetReturn } from '../models/AssetReturn';
import { ExitInterview } from '../models/ExitInterview';
import { FinalSettlement } from '../models/FinalSettlement';
import { StatusTransition } from '../models/StatusTransition';
import { AuditLog } from '../models/AuditLog';
import { ExitState } from '../models/enums/ExitState';
import { ClearanceStatus } from '../models/enums/ClearanceStatus';
import { AssetReturnStatus } from '../models/enums/AssetReturnStatus';
import logger from '../utils/logger';

type TransitionGuard = (exitCase: ExitCase) => Promise<boolean | string>;
type TransitionAction = (exitCase: ExitCase, userId: string) => Promise<void>;

interface StateTransitionConfig {
  from: ExitState;
  to: ExitState;
  guards?: TransitionGuard[];
  actions?: TransitionAction[];
  requiresApproval?: boolean;
  approvalType?: string;
}

class ExitFSMService {
  private exitCaseRepo = AppDataSource.getRepository(ExitCase);
  private clearanceRepo = AppDataSource.getRepository(Clearance);
  private assetReturnRepo = AppDataSource.getRepository(AssetReturn);
  private exitInterviewRepo = AppDataSource.getRepository(ExitInterview);
  private settlementRepo = AppDataSource.getRepository(FinalSettlement);
  private transitionRepo = AppDataSource.getRepository(StatusTransition);
  private auditLogRepo = AppDataSource.getRepository(AuditLog);

  private transitions: StateTransitionConfig[] = [
    {
      from: ExitState.RESIGNATION_SUBMITTED,
      to: ExitState.RESIGNATION_APPROVED,
      actions: [this.actionRecordApprovalDate],
    },
    {
      from: ExitState.RESIGNATION_SUBMITTED,
      to: ExitState.RESIGNATION_REJECTED,
      actions: [this.actionRecordRejectionDate],
    },
    {
      from: ExitState.RESIGNATION_APPROVED,
      to: ExitState.NOTICE_PERIOD_ACTIVE,
      actions: [this.actionStartNoticePeriod, this.actionCreateClearanceRecords],
    },
    {
      from: ExitState.RESIGNATION_APPROVED,
      to: ExitState.NOTICE_PERIOD_BUYOUT,
      actions: [this.actionRecordBuyout],
    },
    {
      from: ExitState.NOTICE_PERIOD_ACTIVE,
      to: ExitState.CLEARANCE_INITIATED,
      actions: [this.actionInitiateClearances],
    },
    {
      from: ExitState.NOTICE_PERIOD_BUYOUT,
      to: ExitState.CLEARANCE_INITIATED,
      actions: [this.actionInitiateClearances],
    },
    {
      from: ExitState.CLEARANCE_INITIATED,
      to: ExitState.CLEARANCE_IN_PROGRESS,
      actions: [this.actionNotifyDepartmentHeads],
    },
    {
      from: ExitState.CLEARANCE_IN_PROGRESS,
      to: ExitState.ASSETS_PENDING,
      guards: [this.guardAllClearancesCleared],
      actions: [this.actionInitiateAssetReturn],
    },
    {
      from: ExitState.ASSETS_PENDING,
      to: ExitState.ASSETS_RETURNED,
      guards: [this.guardAllAssetsReturned],
      actions: [],
    },
    {
      from: ExitState.ASSETS_RETURNED,
      to: ExitState.EXIT_INTERVIEW_PENDING,
      actions: [this.actionScheduleExitInterview],
    },
    {
      from: ExitState.EXIT_INTERVIEW_PENDING,
      to: ExitState.EXIT_INTERVIEW_COMPLETED,
      guards: [this.guardExitInterviewCompleted],
      actions: [],
    },
    {
      from: ExitState.EXIT_INTERVIEW_COMPLETED,
      to: ExitState.SETTLEMENT_CALCULATED,
      actions: [this.actionCalculateSettlement],
    },
    {
      from: ExitState.SETTLEMENT_CALCULATED,
      to: ExitState.SETTLEMENT_APPROVED,
      guards: [this.guardSettlementApproved],
      actions: [],
    },
    {
      from: ExitState.SETTLEMENT_APPROVED,
      to: ExitState.EXIT_COMPLETED,
      guards: [this.guardSettlementPaid],
      actions: [this.actionCompleteExit],
    },
  ];

  async transition(
    exitId: string,
    toState: ExitState,
    userId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; message?: string }> {
    const exitCase = await this.exitCaseRepo.findOne({
      where: { exitId },
      relations: ['tenant', 'employee'],
    });

    if (!exitCase) {
      return { success: false, message: 'Exit case not found' };
    }

    const fromState = exitCase.currentState;

    // Find transition config
    const transitionConfig = this.transitions.find(
      (t) => t.from === fromState && t.to === toState
    );

    if (!transitionConfig) {
      return {
        success: false,
        message: `Invalid transition from ${fromState} to ${toState}`,
      };
    }

    // Execute guards
    if (transitionConfig.guards) {
      for (const guard of transitionConfig.guards) {
        const guardResult = await guard.call(this, exitCase);
        if (guardResult !== true) {
          return {
            success: false,
            message: typeof guardResult === 'string' ? guardResult : 'Transition guard failed',
          };
        }
      }
    }

    // Execute transition
    try {
      exitCase.currentState = toState;
      await this.exitCaseRepo.save(exitCase);

      // Log transition
      await this.logTransition(exitCase, fromState, toState, userId, reason || 'State transition', metadata);

      // Execute actions
      if (transitionConfig.actions) {
        for (const action of transitionConfig.actions) {
          await action.call(this, exitCase, userId);
        }
      }

      logger.info(`Exit state transition: ${exitId} from ${fromState} to ${toState}`);

      return { success: true };
    } catch (error: any) {
      logger.error('Exit state transition failed:', error);
      return { success: false, message: error.message };
    }
  }

  private async logTransition(
    exitCase: ExitCase,
    fromState: ExitState,
    toState: ExitState,
    userId: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Create StatusTransition record
    const transition = this.transitionRepo.create({
      tenantId: exitCase.tenantId,
      entityType: 'exit_case',
      entityId: exitCase.exitId,
      employeeId: exitCase.employeeId,
      fromState,
      toState,
      triggeredBy: userId,
      triggerType: 'manual',
      reason,
      metadata,
    });

    await this.transitionRepo.save(transition);

    // Create AuditLog entry
    const auditLog = this.auditLogRepo.create({
      tenantId: exitCase.tenantId,
      userId,
      action: 'STATE_TRANSITION',
      entityType: 'exit_case',
      entityId: exitCase.exitId,
      oldValue: { currentState: fromState },
      newValue: { currentState: toState },
      description: `Exit state changed from ${fromState} to ${toState}. Reason: ${reason}`,
    });

    await this.auditLogRepo.save(auditLog);
  }

  // Guards
  private async guardAllClearancesCleared(exitCase: ExitCase): Promise<boolean | string> {
    const pendingClearances = await this.clearanceRepo.count({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
        isRequired: true,
        isCleared: false,
      },
    });

    if (pendingClearances > 0) {
      return `${pendingClearances} required clearances are still pending`;
    }

    return true;
  }

  private async guardAllAssetsReturned(exitCase: ExitCase): Promise<boolean | string> {
    const pendingAssets = await this.assetReturnRepo.count({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
        isReturned: false,
        status: AssetReturnStatus.PENDING,
      },
    });

    if (pendingAssets > 0) {
      return `${pendingAssets} assets are pending return`;
    }

    return true;
  }

  private async guardExitInterviewCompleted(exitCase: ExitCase): Promise<boolean | string> {
    const interview = await this.exitInterviewRepo.findOne({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
      },
    });

    if (!interview) {
      return 'Exit interview not scheduled';
    }

    if (interview.status !== 'completed') {
      return 'Exit interview not completed';
    }

    return true;
  }

  private async guardSettlementApproved(exitCase: ExitCase): Promise<boolean | string> {
    const settlement = await this.settlementRepo.findOne({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
      },
    });

    if (!settlement) {
      return 'Settlement not calculated';
    }

    if (!settlement.approvedBy || !settlement.approvedDate) {
      return 'Settlement not approved';
    }

    return true;
  }

  private async guardSettlementPaid(exitCase: ExitCase): Promise<boolean | string> {
    const settlement = await this.settlementRepo.findOne({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
      },
    });

    if (!settlement) {
      return 'Settlement not found';
    }

    if (!settlement.isPaid) {
      return 'Settlement not paid';
    }

    return true;
  }

  // Actions
  private async actionRecordApprovalDate(exitCase: ExitCase): Promise<void> {
    exitCase.resignationApprovedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
  }

  private async actionRecordRejectionDate(exitCase: ExitCase): Promise<void> {
    exitCase.resignationRejectedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
  }

  private async actionStartNoticePeriod(exitCase: ExitCase): Promise<void> {
    exitCase.noticePeriodStartDate = new Date();
    const noticePeriodEnd = new Date();
    noticePeriodEnd.setDate(noticePeriodEnd.getDate() + exitCase.noticePeriodDays);
    exitCase.noticePeriodEndDate = noticePeriodEnd;
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Notice period started for exit case ${exitCase.exitId}`);
  }

  private async actionRecordBuyout(exitCase: ExitCase): Promise<void> {
    exitCase.isNoticePeriodBuyout = true;
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Notice period buyout recorded for exit case ${exitCase.exitId}`);
  }

  private async actionCreateClearanceRecords(exitCase: ExitCase): Promise<void> {
    const clearanceTypes = [
      { departmentType: 'manager', clearanceName: 'Manager Clearance', description: 'Clearance from reporting manager' },
      { departmentType: 'hr', clearanceName: 'HR Clearance', description: 'HR documentation and policy clearance' },
      { departmentType: 'it', clearanceName: 'IT Clearance', description: 'Return of IT assets and access revocation' },
      { departmentType: 'finance', clearanceName: 'Finance Clearance', description: 'Loan recovery and expense settlement' },
      { departmentType: 'admin', clearanceName: 'Admin Clearance', description: 'Return of ID card, access card, keys' },
    ];

    for (const clearanceType of clearanceTypes) {
      const existingClearance = await this.clearanceRepo.findOne({
        where: {
          exitId: exitCase.exitId,
          tenantId: exitCase.tenantId,
          departmentType: clearanceType.departmentType,
        },
      });

      if (!existingClearance) {
        const clearance = this.clearanceRepo.create({
          tenantId: exitCase.tenantId,
          exitId: exitCase.exitId,
          employeeId: exitCase.employeeId,
          departmentType: clearanceType.departmentType,
          clearanceName: clearanceType.clearanceName,
          clearanceDescription: clearanceType.description,
          status: ClearanceStatus.PENDING,
          isRequired: true,
          priority: clearanceType.departmentType === 'hr' || clearanceType.departmentType === 'it' ? 2 : 1,
        });

        await this.clearanceRepo.save(clearance);
      }
    }

    logger.info(`Clearance records created for exit case ${exitCase.exitId}`);
  }

  private async actionInitiateClearances(exitCase: ExitCase): Promise<void> {
    exitCase.clearanceInitiatedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Clearances initiated for exit case ${exitCase.exitId}`);
  }

  private async actionNotifyDepartmentHeads(_exitCase: ExitCase): Promise<void> {
    logger.info('Notifying department heads for clearance');
    // Implementation will use NotificationService
  }

  private async actionInitiateAssetReturn(exitCase: ExitCase): Promise<void> {
    exitCase.assetsReturnInitiatedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Asset return initiated for exit case ${exitCase.exitId}`);
  }

  private async actionScheduleExitInterview(exitCase: ExitCase): Promise<void> {
    const existingInterview = await this.exitInterviewRepo.findOne({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
      },
    });

    if (!existingInterview) {
      const interview = this.exitInterviewRepo.create({
        tenantId: exitCase.tenantId,
        exitId: exitCase.exitId,
        employeeId: exitCase.employeeId,
        status: 'scheduled',
      });

      await this.exitInterviewRepo.save(interview);
    }

    exitCase.exitInterviewScheduledDate = new Date();
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Exit interview scheduled for exit case ${exitCase.exitId}`);
  }

  private async actionCalculateSettlement(exitCase: ExitCase): Promise<void> {
    const existingSettlement = await this.settlementRepo.findOne({
      where: {
        exitId: exitCase.exitId,
        tenantId: exitCase.tenantId,
      },
    });

    if (!existingSettlement) {
      const settlement = this.settlementRepo.create({
        tenantId: exitCase.tenantId,
        exitId: exitCase.exitId,
        employeeId: exitCase.employeeId,
        status: 'calculated' as any,
      });

      await this.settlementRepo.save(settlement);
    }

    exitCase.settlementCalculatedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Settlement calculated for exit case ${exitCase.exitId}`);
  }

  private async actionCompleteExit(exitCase: ExitCase): Promise<void> {
    exitCase.exitCompletedDate = new Date();
    await this.exitCaseRepo.save(exitCase);
    logger.info(`Exit completed for exit case ${exitCase.exitId}`);
  }
}

export default new ExitFSMService();
