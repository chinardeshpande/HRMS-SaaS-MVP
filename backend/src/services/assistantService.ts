import { randomUUID } from 'crypto';
import { Between, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { EmployeeDocument, EmployeeDocumentCategory, EmployeeDocumentVerificationStatus } from '../models/EmployeeDocument';
import { CompanyDocument, CompanyDocumentVerificationStatus } from '../models/CompanyDocument';
import { SalaryStructure, SalaryStructureStatus } from '../models/SalaryStructure';
import { Payslip } from '../models/Payslip';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { LeaveRequest, LeaveStatus } from '../models/LeaveRequest';
import { UserRole } from '../../../shared/types';
import managerTeamService from './managerTeamService';
import auditService from './auditService';
import { config } from '../config/config';

type AutonomyLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
type AssistantAnswerKind =
  | 'simple_answer'
  | 'data_answer'
  | 'guided_workflow'
  | 'draft'
  | 'action_confirmation'
  | 'refusal'
  | 'unsupported';
type AssistantOutputMode = 'tray' | 'focused_modal' | 'guided_tour' | 'confirmation_gate';

interface AssistantActor {
  tenantId: string;
  userId: string;
  role: UserRole;
  employeeId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AssistantAskInput {
  prompt: string;
  pathname?: string;
  pageTitle?: string;
}

interface AssistantConfirmInput {
  proposalId: string;
  prompt?: string;
  pathname?: string;
  pageTitle?: string;
}

interface AssistantExecutionInput extends AssistantConfirmInput {
  confirmationText?: string;
}

interface AssistantInsight {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'good' | 'warning' | 'critical';
}

interface AnswerContext {
  userPrompt: string;
  normalizedPrompt: string;
  actor: AssistantActor;
  employeeQuality: ReturnType<AssistantService['buildEmployeeQuality']>;
  data: Record<string, any>;
  visibleScope: 'tenant-wide' | 'manager-team' | 'self-service';
  checkedSections: string[];
}

interface AssistantActionProposal {
  id: string;
  module: 'employee' | 'documents' | 'compensation' | 'attendance' | 'leave';
  title: string;
  autonomyLevel: AutonomyLevel;
  purpose: string;
  steps: string[];
  requiresConfirmation: boolean;
  writesRecords: false;
}

interface AssistantConfirmationPreview {
  proposal: AssistantActionProposal;
  executionState: 'not_executed';
  confirmationRequired: true;
  canProceedToControlledExecution: boolean;
  requiredConfirmationText: string;
  permissionScope: 'tenant-wide' | 'manager-team' | 'self-service';
  blockingReasons: string[];
  confirmationChecklist: string[];
  auditNote: string;
  guardrails: string[];
}

interface AssistantArtifact {
  artifactId: string;
  type: 'employee_master_gap_review';
  title: string;
  generatedAt: string;
  summary: Record<string, number>;
  rows: Array<Record<string, any>>;
  recommendedNextSteps: string[];
}

interface AssistantExecutionResult {
  proposal: AssistantActionProposal;
  executionState: 'blocked_not_implemented' | 'completed_artifact_created';
  acceptedConfirmation: boolean;
  requiredConfirmationText: string;
  permissionScope: 'tenant-wide' | 'manager-team' | 'self-service';
  blockingReasons: string[];
  artifact?: AssistantArtifact;
  auditNote: string;
  guardrails: string[];
}

interface AssistantResponse {
  persona: {
    name: 'Manu';
    label: 'Ask Manu';
    subtitle: 'HR Operations Angel';
  };
  autonomyLevel: AutonomyLevel;
  mode: 'read_only';
  answerKind: AssistantAnswerKind;
  outputMode: AssistantOutputMode;
  answer: string;
  insights: AssistantInsight[];
  suggestedActions: string[];
  actionProposals: AssistantActionProposal[];
  data?: Record<string, any>;
  guardrails: string[];
}

interface AssistantAiContext {
  prompt: string;
  pathname?: string;
  pageTitle?: string;
  autonomyLevel: AutonomyLevel;
  visibleScope: 'tenant-wide' | 'manager-team' | 'self-service';
  checkedSections: string[];
  deterministicAnswer: string;
  insights: AssistantInsight[];
  suggestedActions: string[];
  data: Record<string, any>;
  guardrails: string[];
}

const classifyLevel = (input: string): AutonomyLevel => {
  const normalized = input.toLowerCase();
  if (/(block|violate|unsafe|breach|unauthori[sz]ed)/.test(normalized)) return 'L5';
  if (/(salary change|terminate|termination|exit action|delete|role permission|approve salary)/.test(normalized)) return 'L4';
  if (/(send|update|assign|close|escalate|create task|create record)/.test(normalized)) return 'L3';
  if (/(draft|prepare|write|summari[sz]e|letter|email)/.test(normalized)) return 'L2';
  if (/(take me|open|where|navigate|guide)/.test(normalized)) return 'L1';
  return 'L0';
};

const normalize = (value?: string | null) => value?.trim().toLowerCase() || '';

interface ResolvedEmployee {
  employeeId: string;
  employeeCode?: string | null;
  fullName: string;
  status?: string | null;
  gender?: string | null;
  department?: string | null;
  designation?: string | null;
  manager?: string | null;
  workLocation?: string | null;
  dateOfJoining?: string | null;
}

interface EmployeeResolution {
  status: 'none' | 'exact' | 'unique_partial' | 'ambiguous';
  matches: ResolvedEmployee[];
  reason?: string;
}

class AssistantService {
  private employeeRepo = AppDataSource.getRepository(Employee);
  private employeeDocumentRepo = AppDataSource.getRepository(EmployeeDocument);
  private companyDocumentRepo = AppDataSource.getRepository(CompanyDocument);
  private salaryStructureRepo = AppDataSource.getRepository(SalaryStructure);
  private payslipRepo = AppDataSource.getRepository(Payslip);
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
  private leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
  private leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);

  async ask(input: AssistantAskInput, actor: AssistantActor): Promise<AssistantResponse> {
    const prompt = input.prompt.trim();
    const autonomyLevel = classifyLevel(prompt);
    const accessibleEmployees = await this.getAccessibleEmployees(actor);
    const employeeIds = accessibleEmployees.map((employee) => employee.employeeId);
    const userPrompt = normalize(prompt);
    const normalizedPrompt = normalize(`${prompt} ${input.pathname || ''} ${input.pageTitle || ''}`);

    const employeeQuality = this.buildEmployeeQuality(accessibleEmployees);
    const insights: AssistantInsight[] = [
      { label: 'Visible employees', value: accessibleEmployees.length, tone: 'neutral' },
      { label: 'Active', value: employeeQuality.activeEmployees, tone: 'good' },
      { label: 'Exited/inactive', value: employeeQuality.nonActiveEmployees, tone: 'neutral' },
    ];

    const data: Record<string, any> = { employeeQuality };
    const suggestedActions: string[] = [];

    if (this.shouldIncludeDocumentMemory(normalizedPrompt)) {
      const documentMemory = await this.buildDocumentMemory(actor, employeeIds);
      data.documentMemory = documentMemory;
      if (/(appointment letter|appointment letters|employment letter|employment letters|joining letter|joining letters)/.test(userPrompt)) {
        data.appointmentLetterGaps = await this.buildAppointmentLetterGaps(actor, accessibleEmployees);
      }
      insights.push(
        { label: 'Employee documents', value: documentMemory.employeeDocuments.total, tone: 'neutral' },
        { label: 'Unverified documents', value: documentMemory.employeeDocuments.unverified, tone: documentMemory.employeeDocuments.unverified ? 'warning' : 'good' }
      );
      if (documentMemory.companyDocuments) {
        insights.push({
          label: 'Company documents',
          value: documentMemory.companyDocuments.total,
          tone: 'neutral',
        });
      }
      suggestedActions.push('Review unverified documents before treating the tenant memory as implementation-complete.');
    }

    if (this.shouldIncludeCompensation(normalizedPrompt) && this.canReadCompensation(actor.role)) {
      const compensationMemory = await this.buildCompensationMemory(actor.tenantId, employeeIds);
      data.compensationMemory = compensationMemory;
      const mentionedEmployees = this.findMentionedEmployees(userPrompt, employeeQuality.employees);
      if (mentionedEmployees.length > 0) {
        data.namedCompensation = await this.buildNamedCompensationFacts(
          actor.tenantId,
          mentionedEmployees.map((employee) => employee.employeeId)
        );
      }
      insights.push(
        { label: 'Salary structures', value: compensationMemory.activeSalaryStructures, tone: compensationMemory.missingActiveSalaryStructure ? 'warning' : 'good' },
        { label: 'Payslip records', value: compensationMemory.payslipRecords, tone: 'neutral' }
      );
      suggestedActions.push('Check employees missing active salary structure or payslip attachments before final ACV sign-off.');
    }

    if (this.shouldIncludeAttendance(normalizedPrompt)) {
      const attendanceMemory = await this.buildAttendanceMemory(actor.tenantId, accessibleEmployees);
      data.attendanceMemory = attendanceMemory;
      insights.push(
        { label: 'Attendance today', value: `${attendanceMemory.today.present}/${attendanceMemory.today.activeEmployees}`, tone: attendanceMemory.today.missingRecords ? 'warning' : 'good' },
        { label: 'Missing today records', value: attendanceMemory.today.missingRecords, tone: attendanceMemory.today.missingRecords ? 'warning' : 'good' },
        { label: '30-day records', value: attendanceMemory.last30Days.records, tone: 'neutral' }
      );
      suggestedActions.push('Use attendance regularisation for corrections; Manu should not overwrite biometric or manual attendance records silently.');
    }

    if (this.shouldIncludeLeave(normalizedPrompt)) {
      const leaveMemory = await this.buildLeaveMemory(actor.tenantId, accessibleEmployees);
      data.leaveMemory = leaveMemory;
      insights.push(
        { label: 'Active leave policies', value: leaveMemory.policies.activePolicies, tone: leaveMemory.policies.activePolicies ? 'good' : 'warning' },
        { label: 'Current-year balances', value: leaveMemory.balances.currentYearBalances, tone: leaveMemory.balances.missingBalanceEmployees ? 'warning' : 'good' },
        { label: 'Pending leave requests', value: leaveMemory.requests.pending, tone: leaveMemory.requests.pending ? 'warning' : 'good' }
      );
      if (leaveMemory.balances.genderMismatchAllocations > 0) {
        insights.push({
          label: 'Gender mismatch allocations',
          value: leaveMemory.balances.genderMismatchAllocations,
          tone: 'critical',
        });
      }
      suggestedActions.push('Treat leave approval, balance edits, and policy activation as separate audited workflows.');
    }

    if (this.shouldIncludeAnalytics(normalizedPrompt)) {
      data.analytics = {
        headcountByDepartment: this.buildHeadcountByDimension(employeeQuality.employees, 'department'),
        headcountByDesignation: this.buildHeadcountByDimension(employeeQuality.employees, 'designation'),
        headcountByLocation: this.buildHeadcountByDimension(employeeQuality.employees, 'workLocation'),
        attritionByMonth: this.buildAttritionByMonth(employeeQuality.employees),
      };
    }

    if (employeeQuality.missingManager > 0) {
      suggestedActions.push('Validate reporting manager mapping for active employees with missing manager references.');
    }
    if (employeeQuality.missingCoreFields > 0) {
      suggestedActions.push('Complete missing department, designation, work location, joining date, and gender fields.');
    }
    if (suggestedActions.length === 0) {
      suggestedActions.push('Use this as a read-only check, then open the relevant module for any confirmed edits.');
    }

    const actionProposals = this.buildActionProposals(normalizedPrompt, data, employeeQuality, autonomyLevel);

    const guardrails = [
      'Tenant scoped: all data is filtered by the authenticated tenant.',
      'Role aware: employees see only self data, managers see team data, HR/Admin see tenant data.',
      'Read only: this endpoint does not create, update, delete, approve, send, or share records.',
      'Sensitive operations require explicit confirmation and separate audited workflows.',
    ];
    const deterministicAnswer = this.composeAnswer(userPrompt, normalizedPrompt, actor, employeeQuality, data);
    const answerKind = this.classifyAnswerKind(userPrompt, deterministicAnswer, data);
    const outputMode = this.resolveOutputMode(answerKind);
    const aiAnswer = await this.composeAiAnswer({
      prompt,
      pathname: input.pathname,
      pageTitle: input.pageTitle,
      autonomyLevel,
      visibleScope: this.getPermissionScope(actor.role),
      checkedSections: Object.keys(data),
      deterministicAnswer,
      insights,
      suggestedActions,
      data,
      guardrails,
    });
    insights.push({
      label: 'Reasoning mode',
      value: aiAnswer ? 'AI + tenant data' : 'Tenant data fallback',
      tone: aiAnswer ? 'good' : 'neutral',
    });

    const response: AssistantResponse = {
      persona: {
        name: 'Manu',
        label: 'Ask Manu',
        subtitle: 'HR Operations Angel',
      },
      autonomyLevel,
      mode: 'read_only',
      answerKind,
      outputMode,
      answer: aiAnswer || deterministicAnswer,
      insights,
      suggestedActions,
      actionProposals,
      data,
      guardrails,
    };

    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'assistant.query',
      entityType: 'assistant',
      newValue: {
        prompt: prompt.slice(0, 500),
        pathname: input.pathname,
        pageTitle: input.pageTitle,
        autonomyLevel,
        visibleEmployees: accessibleEmployees.length,
        includedSections: Object.keys(data),
        answerKind,
        outputMode,
        proposedActions: actionProposals.map((proposal) => proposal.id),
      },
      description: `Manu read-only query at ${input.pathname || 'unknown route'}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return response;
  }

  async previewConfirmation(input: AssistantConfirmInput, actor: AssistantActor): Promise<AssistantConfirmationPreview> {
    const proposal = this.getProposalById(input.proposalId);

    if (!proposal) {
      throw new Error(`Unknown Manu proposal: ${input.proposalId}`);
    }

    const requiredConfirmationText = `CONFIRM ${proposal.id}`;
    const blockingReasons = this.getProposalBlockingReasons(proposal, actor);
    const preview: AssistantConfirmationPreview = {
      proposal,
      executionState: 'not_executed',
      confirmationRequired: true,
      canProceedToControlledExecution: blockingReasons.length === 0,
      requiredConfirmationText,
      permissionScope: this.getPermissionScope(actor.role),
      blockingReasons,
      confirmationChecklist: this.getConfirmationChecklist(proposal),
      auditNote:
        'This is a confirmation preview only. AuroraHR has not created, updated, deleted, approved, sent, shared, or regularised any record.',
      guardrails: [
        'The proposal is tenant-scoped and role-checked before any future execution workflow.',
        'This endpoint deliberately performs no business-data mutation.',
        'A later execution endpoint must re-check permissions, required evidence, and confirmation text immediately before acting.',
        'Sensitive HR actions must remain separately audited with actor, timestamp, reason, affected records, and before/after state.',
      ],
    };

    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'assistant.proposal.confirmation_preview',
      entityType: 'assistant',
      newValue: {
        proposalId: proposal.id,
        module: proposal.module,
        pathname: input.pathname,
        pageTitle: input.pageTitle,
        canProceedToControlledExecution: preview.canProceedToControlledExecution,
        blockingReasons,
      },
      description: `Manu confirmation preview for ${proposal.id}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return preview;
  }

  async requestControlledExecution(input: AssistantExecutionInput, actor: AssistantActor): Promise<AssistantExecutionResult> {
    const proposal = this.getProposalById(input.proposalId);

    if (!proposal) {
      throw new Error(`Unknown Manu proposal: ${input.proposalId}`);
    }

    const requiredConfirmationText = `CONFIRM ${proposal.id}`;
    const acceptedConfirmation = input.confirmationText?.trim() === requiredConfirmationText;
    const blockingReasons = this.getProposalBlockingReasons(proposal, actor);

    if (!acceptedConfirmation) {
      blockingReasons.unshift(`Explicit confirmation text required: ${requiredConfirmationText}`);
    }

    if (acceptedConfirmation && blockingReasons.length === 0 && proposal.id === 'employee-master-gap-review') {
      const artifact = await this.createEmployeeMasterGapReviewArtifact(actor);
      const result: AssistantExecutionResult = {
        proposal,
        executionState: 'completed_artifact_created',
        acceptedConfirmation,
        requiredConfirmationText,
        permissionScope: this.getPermissionScope(actor.role),
        blockingReasons: [],
        artifact,
        auditNote:
          'Controlled action completed. Manu created a read-only employee master gap review artifact in the audit trail. No employee record was changed.',
        guardrails: [
          'The artifact is tenant-scoped and role-scoped.',
          'This action created review evidence only; it did not create, update, delete, approve, send, share, or regularise any HR business record.',
          'Employee master corrections must still be made manually from verified source evidence.',
        ],
      };

      await auditService.record({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'assistant.proposal.execution_completed',
        entityType: 'assistant_artifact',
        entityId: artifact.artifactId,
        newValue: {
          proposalId: proposal.id,
          module: proposal.module,
          pathname: input.pathname,
          pageTitle: input.pageTitle,
          acceptedConfirmation,
          executionState: result.executionState,
          artifact,
        },
        description: `Manu created employee master gap review artifact ${artifact.artifactId}`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });

      return result;
    }

    if (acceptedConfirmation && blockingReasons.length === 0) {
      blockingReasons.push('Controlled execution is not implemented for this proposal yet.');
    }

    const result: AssistantExecutionResult = {
      proposal,
      executionState: 'blocked_not_implemented',
      acceptedConfirmation,
      requiredConfirmationText,
      permissionScope: this.getPermissionScope(actor.role),
      blockingReasons,
      auditNote:
        'Execution was requested but deliberately blocked. No AuroraHR business record was created, updated, deleted, approved, sent, shared, or regularised.',
      guardrails: [
        'Execution requests are tenant-scoped and role-checked.',
        'Each future executable proposal must have a dedicated handler, validation contract, evidence requirements, and rollback notes.',
        'The generic assistant execution gate must never mutate HR records directly.',
        'Sensitive HR mutations require confirmation text, reason capture, before/after audit state, and module-specific authorization.',
      ],
    };

    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'assistant.proposal.execution_requested',
      entityType: 'assistant',
      newValue: {
        proposalId: proposal.id,
        module: proposal.module,
        pathname: input.pathname,
        pageTitle: input.pageTitle,
        acceptedConfirmation,
        executionState: result.executionState,
        blockingReasons,
      },
      description: `Manu controlled execution request blocked for ${proposal.id}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return result;
  }

  private async createEmployeeMasterGapReviewArtifact(actor: AssistantActor): Promise<AssistantArtifact> {
    const employees = await this.getAccessibleEmployees(actor);
    const employeeQuality = this.buildEmployeeQuality(employees);
    const rows = employees
      .map((employee) => {
        const missingFields = this.getMissingEmployeeMasterFields(employee);
        return {
          employeeId: employee.employeeId,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
          status: employee.status,
          department: employee.department?.name || null,
          designation: employee.designation?.name || null,
          manager: employee.manager?.fullName || null,
          workLocation: employee.workLocation || null,
          dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().slice(0, 10) : null,
          gender: employee.gender || null,
          missingFields,
          needsReview: missingFields.length > 0,
        };
      })
      .sort((left, right) => {
        if (left.status === 'active' && right.status !== 'active') return -1;
        if (left.status !== 'active' && right.status === 'active') return 1;
        return left.fullName.localeCompare(right.fullName);
      });

    const reviewRows = rows.filter((row) => row.needsReview);

    return {
      artifactId: randomUUID(),
      type: 'employee_master_gap_review',
      title: 'Employee Master Gap Review',
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmployees: employeeQuality.totalEmployees,
        activeEmployees: employeeQuality.activeEmployees,
        inactiveOrExitedEmployees: employeeQuality.nonActiveEmployees,
        recordsNeedingReview: reviewRows.length,
        missingCoreFields: employeeQuality.missingCoreFields,
        activeRecordsMissingManager: employeeQuality.missingManager,
        duplicateNameRisks: employeeQuality.duplicateNameRisks,
      },
      rows: reviewRows,
      recommendedNextSteps: [
        'Review active employees first because attendance, leave, documents, and compensation depend on active master data.',
        'Correct manager, department, designation, work location, joining date, and gender only after HR validates source evidence.',
        'Keep exited historical employee corrections separate from active employee operating-data corrections.',
      ],
    };
  }

  private getMissingEmployeeMasterFields(employee: Employee): string[] {
    const missing: string[] = [];

    if (!employee.employeeCode) missing.push('employeeCode');
    if (!employee.firstName) missing.push('firstName');
    if (!employee.lastName) missing.push('lastName');
    if (!employee.email) missing.push('email');
    if (!employee.departmentId) missing.push('department');
    if (!employee.designationId) missing.push('designation');
    if (!employee.workLocation) missing.push('workLocation');
    if (!employee.dateOfJoining) missing.push('dateOfJoining');
    if (!employee.gender) missing.push('gender');
    if (employee.status === 'active' && !employee.managerId) missing.push('manager');

    return missing;
  }

  private async getAccessibleEmployees(actor: AssistantActor): Promise<Employee[]> {
    const allEmployees = await this.employeeRepo.find({
      where: { tenantId: actor.tenantId },
      relations: ['department', 'designation', 'manager'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    return managerTeamService.filterEmployeesByRole(
      actor.userId,
      actor.role,
      actor.employeeId || null,
      actor.tenantId,
      allEmployees
    );
  }

  private buildEmployeeQuality(employees: Employee[]) {
    const activeEmployees = employees.filter((employee) => employee.status === 'active');
    const duplicateNames = new Map<string, number>();
    employees.forEach((employee) => {
      const key = normalize(`${employee.firstName} ${employee.lastName}`);
      if (key) duplicateNames.set(key, (duplicateNames.get(key) || 0) + 1);
    });

    const missingDepartment = employees.filter((employee) => !employee.departmentId).length;
    const missingDesignation = employees.filter((employee) => !employee.designationId).length;
    const missingWorkLocation = employees.filter((employee) => !employee.workLocation).length;
    const missingJoiningDate = employees.filter((employee) => !employee.dateOfJoining).length;
    const missingGender = employees.filter((employee) => !employee.gender).length;
    const missingManager = activeEmployees.filter((employee) => !employee.managerId).length;

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      nonActiveEmployees: employees.length - activeEmployees.length,
      missingManager,
      missingDepartment,
      missingDesignation,
      missingWorkLocation,
      missingJoiningDate,
      missingGender,
      missingCoreFields:
        missingDepartment + missingDesignation + missingWorkLocation + missingJoiningDate + missingGender,
      duplicateNameRisks: Array.from(duplicateNames.entries()).filter(([, count]) => count > 1).length,
      employees: employees.map((employee) => ({
        employeeId: employee.employeeId,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        status: employee.status,
        gender: employee.gender || null,
        department: employee.department?.name || null,
        designation: employee.designation?.name || null,
        manager: employee.manager?.fullName || null,
        workLocation: employee.workLocation || null,
        dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().slice(0, 10) : null,
      })),
    };
  }

  private async buildDocumentMemory(actor: AssistantActor, employeeIds: string[]) {
    const employeeDocuments = employeeIds.length
      ? await this.employeeDocumentRepo.find({
          where: { tenantId: actor.tenantId, employeeId: In(employeeIds) },
        })
      : [];

    const companyDocuments = this.canReadCompanyDocuments(actor.role)
      ? await this.companyDocumentRepo.find({ where: { tenantId: actor.tenantId } })
      : null;

    return {
      employeeDocuments: {
        total: employeeDocuments.length,
        unverified: employeeDocuments.filter(
          (document) => document.verificationStatus !== EmployeeDocumentVerificationStatus.VERIFIED
        ).length,
        employeesWithDocuments: new Set(employeeDocuments.map((document) => document.employeeId)).size,
      },
      companyDocuments: companyDocuments
        ? {
            total: companyDocuments.length,
            unverified: companyDocuments.filter(
              (document) => document.verificationStatus !== CompanyDocumentVerificationStatus.VERIFIED
            ).length,
          }
        : null,
    };
  }

  private async buildAppointmentLetterGaps(actor: AssistantActor, employees: Employee[]) {
    const visibleEmployees = employees.filter((employee) => employee.status === 'active');
    const employeeIds = visibleEmployees.map((employee) => employee.employeeId);
    const documents = employeeIds.length
      ? await this.employeeDocumentRepo.find({
          where: { tenantId: actor.tenantId, employeeId: In(employeeIds) },
        })
      : [];

    const appointmentDocumentEmployeeIds = new Set(
      documents
        .filter((document) => {
          const title = normalize(`${document.title} ${document.fileName} ${document.originalFileName} ${document.description || ''}`);
          return (
            document.category === EmployeeDocumentCategory.EMPLOYMENT_LETTER &&
            /(appointment|employment|joining|offer|letter)/.test(title)
          ) || /(appointment letter|appointment|joining letter)/.test(title);
        })
        .map((document) => document.employeeId)
    );

    const missing = visibleEmployees
      .filter((employee) => !appointmentDocumentEmployeeIds.has(employee.employeeId))
      .map((employee) => ({
        employeeId: employee.employeeId,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        department: employee.department?.name || null,
        designation: employee.designation?.name || null,
        manager: employee.manager?.fullName || null,
        status: employee.status,
      }));

    return {
      activeEmployeesChecked: visibleEmployees.length,
      employeesWithAppointmentLetter: appointmentDocumentEmployeeIds.size,
      missingCount: missing.length,
      missing,
    };
  }

  private async buildCompensationMemory(tenantId: string, employeeIds: string[]) {
    if (!employeeIds.length) {
      return {
        activeSalaryStructures: 0,
        missingActiveSalaryStructure: 0,
        payslipRecords: 0,
        employeesWithPayslips: 0,
      };
    }

    const activeStructures = await this.salaryStructureRepo.find({
      where: {
        tenantId,
        employeeId: In(employeeIds),
        status: SalaryStructureStatus.ACTIVE,
      },
    });
    const payslips = await this.payslipRepo.find({
      where: { tenantId, employeeId: In(employeeIds) },
    });

    return {
      activeSalaryStructures: activeStructures.length,
      missingActiveSalaryStructure: Math.max(employeeIds.length - new Set(activeStructures.map((item) => item.employeeId)).size, 0),
      payslipRecords: payslips.length,
      employeesWithPayslips: new Set(payslips.map((item) => item.employeeId)).size,
    };
  }

  private async buildNamedCompensationFacts(tenantId: string, employeeIds: string[]) {
    if (!employeeIds.length) return [];

    const structures = await this.salaryStructureRepo.find({
      where: {
        tenantId,
        employeeId: In(employeeIds),
        status: SalaryStructureStatus.ACTIVE,
      },
      relations: ['employee', 'components'],
      order: { effectiveFrom: 'DESC' },
    });

    const latestByEmployee = new Map<string, SalaryStructure>();
    structures.forEach((structure) => {
      if (!latestByEmployee.has(structure.employeeId)) {
        latestByEmployee.set(structure.employeeId, structure);
      }
    });

    return employeeIds.map((employeeId) => {
      const structure = latestByEmployee.get(employeeId);
      if (!structure) {
        return {
          employeeId,
          found: false,
        };
      }

      const components = [...(structure.components || [])]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .slice(0, 8)
        .map((component) => ({
          name: component.componentName,
          type: component.componentType,
          monthlyAmount: Number(component.monthlyAmount || 0),
          annualAmount: Number(component.annualAmount || 0),
        }));

      return {
        employeeId,
        employeeName: structure.employee?.fullName || null,
        found: true,
        structureName: structure.structureName,
        effectiveFrom: structure.effectiveFrom ? new Date(structure.effectiveFrom).toISOString().slice(0, 10) : null,
        annualCtc: Number(structure.annualCtc || 0),
        monthlyGross: Number(structure.monthlyGross || 0),
        monthlyNetEstimate: Number(structure.monthlyNetEstimate || 0),
        currency: structure.currency,
        payFrequency: structure.payFrequency,
        employeeVisible: structure.employeeVisible,
        approvalStatus: structure.approvalStatus,
        components,
      };
    });
  }

  private buildHeadcountByDimension(
    employees: ReturnType<AssistantService['buildEmployeeQuality']>['employees'],
    field: 'department' | 'designation' | 'workLocation'
  ) {
    const activeEmployees = employees.filter((employee) => employee.status === 'active');
    const groups = new Map<string, number>();
    activeEmployees.forEach((employee) => {
      const key = (employee[field] || 'Not set').toString();
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Array.from(groups.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  }

  private buildAttritionByMonth(employees: ReturnType<AssistantService['buildEmployeeQuality']>['employees']) {
    const exitedEmployees = employees.filter((employee) => employee.status === 'exited' || employee.status === 'inactive');
    return {
      supported: false,
      availableExitedOrInactiveCount: exitedEmployees.length,
      reason:
        'Monthly attrition trend requires reliable exit effective dates. The current employee quality snapshot does not expose exit dates to Manu yet.',
    };
  }

  private async buildAttendanceMemory(tenantId: string, employees: Employee[]) {
    const activeEmployeeIds = employees
      .filter((employee) => employee.status === 'active')
      .map((employee) => employee.employeeId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const todayRecords = activeEmployeeIds.length
      ? await this.attendanceRepo.find({
          where: { tenantId, employeeId: In(activeEmployeeIds), date: today },
        })
      : [];

    const last30DayRecords = activeEmployeeIds.length
      ? await this.attendanceRepo.find({
          where: {
            tenantId,
            employeeId: In(activeEmployeeIds),
            date: Between(thirtyDaysAgo, today),
          },
        })
      : [];

    const presentToday = todayRecords.filter((record) => record.status === AttendanceStatus.PRESENT).length;
    const absentToday = todayRecords.filter((record) => record.status === AttendanceStatus.ABSENT).length;
    const onLeaveToday = todayRecords.filter((record) => record.status === AttendanceStatus.ON_LEAVE).length;
    const halfDayToday = todayRecords.filter((record) => record.status === AttendanceStatus.HALF_DAY).length;
    const manualOverrides = last30DayRecords.filter((record) => record.isManualOverride).length;
    const incompleteClockPairs = last30DayRecords.filter((record) => record.checkIn && !record.checkOut).length;
    const locationMissingForPresent = last30DayRecords.filter(
      (record) =>
        [AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY].includes(record.status) &&
        !record.location
    ).length;

    return {
      today: {
        date: today.toISOString().slice(0, 10),
        activeEmployees: activeEmployeeIds.length,
        records: todayRecords.length,
        present: presentToday,
        absent: absentToday,
        onLeave: onLeaveToday,
        halfDay: halfDayToday,
        missingRecords: Math.max(activeEmployeeIds.length - todayRecords.length, 0),
      },
      last30Days: {
        from: thirtyDaysAgo.toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
        records: last30DayRecords.length,
        manualOverrides,
        incompleteClockPairs,
        locationMissingForPresent,
      },
    };
  }

  private async buildLeaveMemory(tenantId: string, employees: Employee[]) {
    const activeEmployees = employees.filter((employee) => employee.status === 'active');
    const activeEmployeeIds = activeEmployees.map((employee) => employee.employeeId);
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const [policies, balances, requests] = await Promise.all([
      this.leavePolicyRepo.find({ where: { tenantId, isActive: true } }),
      activeEmployeeIds.length
        ? this.leaveBalanceRepo.find({
            where: { tenantId, employeeId: In(activeEmployeeIds), year: currentYear },
          })
        : Promise.resolve([]),
      activeEmployeeIds.length
        ? this.leaveRequestRepo.find({
            where: {
              tenantId,
              employeeId: In(activeEmployeeIds),
              startDate: Between(yearStart, yearEnd),
            },
          })
        : Promise.resolve([]),
    ]);

    const employeesWithBalances = new Set(balances.map((balance) => balance.employeeId));
    const genderMismatchAllocations = balances.filter((balance) => {
      const employee = activeEmployees.find((item) => item.employeeId === balance.employeeId);
      if (!employee) return false;
      return !this.isGenderEligibleForLeave(balance.leaveType, employee) && Number(balance.totalAllocated) > 0;
    }).length;

    const policyTypes = new Set(policies.map((policy) => policy.leaveType));

    return {
      policies: {
        activePolicies: policies.length,
        activeTypes: Array.from(policyTypes),
        hasMaternity: policyTypes.has(LeaveType.MATERNITY),
        hasPaternity: policyTypes.has(LeaveType.PATERNITY),
      },
      balances: {
        year: currentYear,
        activeEmployees: activeEmployeeIds.length,
        currentYearBalances: balances.length,
        employeesWithBalances: employeesWithBalances.size,
        missingBalanceEmployees: Math.max(activeEmployeeIds.length - employeesWithBalances.size, 0),
        genderMismatchAllocations,
      },
      requests: {
        year: currentYear,
        total: requests.length,
        pending: requests.filter((request) => request.status === LeaveStatus.PENDING).length,
        approved: requests.filter((request) => request.status === LeaveStatus.APPROVED).length,
        rejected: requests.filter((request) => request.status === LeaveStatus.REJECTED).length,
        cancelled: requests.filter((request) => request.status === LeaveStatus.CANCELLED).length,
      },
    };
  }

  private async composeAiAnswer(context: AssistantAiContext): Promise<string | null> {
    if (!config.openai.enabled || !config.openai.apiKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.openai.timeoutMs);

    try {
      const payload = {
        model: config.openai.model,
        instructions: [
          'You are Manu, AuroraHR’s HR Operations Angel.',
          'Answer the user’s HR operations question using only the provided AuroraHR tenant-scoped data.',
          'Be specific, concise, and operational. Prefer exact counts, names, statuses, and next checks when available.',
          'Do not invent data, policies, employee facts, legal advice, payroll calculations, tax/PF/ESI/TDS logic, or statutory filing guidance.',
          'Do not say you changed, approved, deleted, sent, shared, regularised, or updated anything. This endpoint is read-only.',
          'If the supplied data is insufficient, say what is missing and what HR should verify next.',
          'If the deterministic baseline already answers the question correctly, improve wording and structure without changing facts.',
        ].join('\n'),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  userQuestion: context.prompt,
                  screen: {
                    pathname: context.pathname,
                    pageTitle: context.pageTitle,
                  },
                  autonomyLevel: context.autonomyLevel,
                  visibleScope: context.visibleScope,
                  checkedSections: context.checkedSections,
                  deterministicBaselineAnswer: context.deterministicAnswer,
                  insights: context.insights,
                  suggestedActions: context.suggestedActions,
                  guardrails: context.guardrails,
                  data: this.buildAiSafeDataSnapshot(context.data),
                }),
              },
            ],
          },
        ],
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json() as any;
      const outputText = this.extractResponseText(result);
      return outputText || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildAiSafeDataSnapshot(data: Record<string, any>) {
    const employeeQuality = data.employeeQuality;

    return {
      employeeQuality: employeeQuality
        ? {
            totalEmployees: employeeQuality.totalEmployees,
            activeEmployees: employeeQuality.activeEmployees,
            nonActiveEmployees: employeeQuality.nonActiveEmployees,
            missingManager: employeeQuality.missingManager,
            missingDepartment: employeeQuality.missingDepartment,
            missingDesignation: employeeQuality.missingDesignation,
            missingWorkLocation: employeeQuality.missingWorkLocation,
            missingJoiningDate: employeeQuality.missingJoiningDate,
            missingGender: employeeQuality.missingGender,
            missingCoreFields: employeeQuality.missingCoreFields,
            duplicateNameRisks: employeeQuality.duplicateNameRisks,
            employees: employeeQuality.employees,
          }
        : null,
      documentMemory: data.documentMemory || null,
      compensationMemory: data.compensationMemory || null,
      attendanceMemory: data.attendanceMemory || null,
      leaveMemory: data.leaveMemory || null,
    };
  }

  private extractResponseText(result: any): string {
    if (typeof result?.output_text === 'string') return result.output_text.trim();

    const output = Array.isArray(result?.output) ? result.output : [];
    const textParts: string[] = [];
    for (const item of output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const contentItem of content) {
        if (typeof contentItem?.text === 'string') textParts.push(contentItem.text);
      }
    }

    return textParts.join('\n').trim();
  }

  private composeAnswer(
    userPrompt: string,
    normalizedPrompt: string,
    actor: AssistantActor,
    employeeQuality: ReturnType<AssistantService['buildEmployeeQuality']>,
    data: Record<string, any>
  ): string {
    const visibleScope =
      actor.role === UserRole.SYSTEM_ADMIN || actor.role === UserRole.HR_ADMIN
        ? 'tenant-wide'
        : actor.role === UserRole.MANAGER
          ? 'manager-team'
          : 'self-service';

    const checkedSections = Object.keys(data);
    const context: AnswerContext = {
      userPrompt,
      normalizedPrompt,
      actor,
      employeeQuality,
      data,
      visibleScope,
      checkedSections,
    };

    const directAnswer = this.composeDirectQuestionAnswer(context);
    if (directAnswer) return directAnswer;

    if (checkedSections.includes('attendanceMemory') && checkedSections.includes('leaveMemory')) {
      return 'I checked HR operations readiness in read-only mode across attendance and leave. This covers active-employee attendance coverage, recent attendance data quality, active leave policies, current-year balances, request status, and gender-specific entitlement risks. I will not regularise attendance, approve leave, or edit balances from this answer.';
    }

    if (checkedSections.includes('attendanceMemory')) {
      return 'I checked attendance memory in read-only mode. This covers today’s active-employee coverage, 30-day attendance records, manual overrides, missing work-location values, and incomplete clock pairs. Regularisation remains a separate audited workflow.';
    }

    if (checkedSections.includes('leaveMemory')) {
      return 'I checked leave memory in read-only mode. This covers active policies, current-year balances, request status, and gender-specific entitlement risks. I will not approve, reject, or edit leave balances from this answer.';
    }

    if (normalizedPrompt.includes('/employees') || normalizedPrompt.includes('employee register') || normalizedPrompt.includes('employee profile')) {
      return `I checked employee master quality in ${visibleScope} scope. There are ${employeeQuality.totalEmployees} visible employees, ${employeeQuality.activeEmployees} active, ${employeeQuality.nonActiveEmployees} inactive or exited, ${employeeQuality.missingManager} active records without manager mapping, and ${employeeQuality.missingCoreFields} missing core-field instances. Document and compensation signals are included only as supporting readiness evidence.`;
    }

    if (normalizedPrompt.includes('document')) {
      return `I checked document memory in ${visibleScope} scope. Employee documents are separated from company-vault records, and unverified items should be reviewed before migration sign-off. I am not changing files or verification status from this read-only answer.`;
    }

    if (normalizedPrompt.includes('salary') || normalizedPrompt.includes('compensation') || normalizedPrompt.includes('payslip')) {
      if (!this.canReadCompensation(actor.role)) {
        return 'Compensation memory is protected. I can explain the workflow, but salary structure and payslip coverage checks are restricted to HR/Admin roles in this foundation version.';
      }
      return 'I checked compensation memory in HR/Admin scope. This covers salary structures and payslip records only. It does not calculate payroll, taxes, PF, ESI, TDS, or statutory filings.';
    }

    if (normalizedPrompt.includes('gap') || normalizedPrompt.includes('quality') || normalizedPrompt.includes('employee')) {
      return `I checked employee master quality in ${visibleScope} scope. There are ${employeeQuality.totalEmployees} visible employees, ${employeeQuality.activeEmployees} active, ${employeeQuality.missingManager} active records without manager mapping, and ${employeeQuality.missingCoreFields} missing core-field instances.`;
    }

    return `I am running in read-only foundation mode. In ${visibleScope} scope, I can inspect employee master quality, document memory, and HR readiness signals without making record changes.`;
  }

  private composeDirectQuestionAnswer(context: AnswerContext): string | null {
    const { userPrompt, normalizedPrompt, data, employeeQuality, visibleScope } = context;
    const intentPrompt = userPrompt || normalizedPrompt;
    const employeeResolution = this.resolveEmployeeMention(intentPrompt, employeeQuality.employees);
    const mentionedEmployees =
      employeeResolution.status === 'exact' || employeeResolution.status === 'unique_partial'
        ? employeeResolution.matches
        : [];

    const guidedAnswer = this.composeGuidedProcessAnswer(context);
    if (guidedAnswer) return guidedAnswer;

    if (/(delete|remove|physically delete|erase|destroy)/.test(intentPrompt)) {
      if (employeeResolution.status !== 'exact') {
        const matchText = employeeResolution.matches.length
          ? ` I found possible non-exact match(es): ${employeeResolution.matches.map((employee) => employee.fullName).join(', ')}.`
          : '';
        return `I will not delete an employee from a free-text request. I also do not have an exact employee match for this prompt.${matchText} Open Employee Register, search the exact employee record, verify source evidence, and use the audited module workflow if deletion or deactivation is truly required.`;
      }

      const employee = employeeResolution.matches[0];
      return `I found an exact employee match for ${employee.fullName}, but I will not delete employee records from Manu. Deletion/deactivation must happen inside the Employee Register with role permission, reason capture, source evidence, and audit trail.`;
    }

    if (/(approve all|approve.*leave|reject.*leave|bulk approve|bulk reject)/.test(intentPrompt)) {
      return 'I will not approve or reject leave requests from a free-text assistant prompt. Leave decisions must be made in Team Approvals or the Leave module after checking requester, dates, leave type, balance, overlap, reason, approver authority, and audit trail. I can list pending leave requests when that data handler is available, but I will not perform bulk approval.';
    }

    if (/(draft|prepare|write).*(confirmation letter|appointment letter|offer letter|email|hr connect note|letter)/.test(intentPrompt)) {
      if (employeeResolution.status === 'ambiguous') {
        return `I cannot draft this safely because the employee reference is ambiguous. Possible matches: ${employeeResolution.matches.map((employee) => employee.fullName).join(', ')}. Please use employee code or exact full name.`;
      }
      if (employeeResolution.status === 'none') {
        return 'I can draft HR letters only after resolving the employee record. Please provide the exact full name or employee code, then I can prepare a draft in a focused view without sending or saving it.';
      }
      const employee = employeeResolution.matches[0];
      return [
        `Draft confirmation letter context for ${employee.fullName}:`,
        `Employee code: ${employee.employeeCode || 'not set'}.`,
        `Designation: ${employee.designation || 'not set'}. Department: ${employee.department || 'not set'}. Manager: ${employee.manager || 'not set'}.`,
        'Drafting is still a controlled output in this foundation slice; I can prepare the draft content next, but I will not generate, save, email, or issue the letter without a dedicated document workflow and confirmation.',
      ].join(' ');
    }

    if (/(headcount|head count).*(department|dept)|department.*(headcount|head count)/.test(intentPrompt) && data.analytics?.headcountByDepartment) {
      const groups = data.analytics.headcountByDepartment as Array<{ label: string; count: number }>;
      const summary = groups.map((group) => `${group.label}: ${group.count}`).join('; ') || 'no active department grouping available';
      return `Headcount by department for active employees: ${summary}. This is a report-style answer from employee master data; use HR Analytics for column selection, grouping, charting, saving, or download.`;
    }

    if (/(attrition|exit trend|exited.*month|month.*exited)/.test(intentPrompt)) {
      const attrition = data.analytics?.attritionByMonth;
      return attrition?.supported
        ? 'Attrition trend data is available.'
        : `I cannot generate a reliable monthly attrition trend yet. ${attrition?.reason || 'Exit effective dates are not available in the current Manu data snapshot.'} I can still report current active versus inactive/exited count: ${employeeQuality.activeEmployees} active and ${employeeQuality.nonActiveEmployees} inactive or exited.`;
    }

    if (/(missing|not uploaded|gap).*(appointment letter|appointment letters|employment letter|joining letter)|appointment letter.*(missing|gap|not uploaded)/.test(intentPrompt) && data.appointmentLetterGaps) {
      const gaps = data.appointmentLetterGaps;
      if (gaps.missingCount === 0) {
        return `Appointment letter coverage looks complete for ${gaps.activeEmployeesChecked} active employee(s) visible to this role.`;
      }

      const names = gaps.missing
        .slice(0, 12)
        .map((employee: any) => `${employee.fullName}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`)
        .join('; ');
      const extra = gaps.missing.length > 12 ? ` Showing first 12 of ${gaps.missing.length}.` : '';
      return `Appointment letter gaps: ${gaps.missingCount} of ${gaps.activeEmployeesChecked} active employee(s) do not have an appointment/employment letter identified in document memory. Missing: ${names || 'none'}.${extra}`;
    }

    if (mentionedEmployees.length > 0) {
      if (/(salary|compensation|payslip|pay slip|ctc|gross|net|salary structure)/.test(intentPrompt)) {
        if (!this.canReadCompensation(context.actor.role)) {
          return 'Compensation memory is protected. Salary structure and payslip answers are restricted to HR/Admin roles. I can explain the workflow, but I will not expose salary values for this role.';
        }

        const namedCompensation = Array.isArray(data.namedCompensation) ? data.namedCompensation : [];
        const salaryFacts = mentionedEmployees
          .slice(0, 3)
          .map((employee) => {
            const compensation = namedCompensation.find((item: any) => item.employeeId === employee.employeeId);
            if (!compensation?.found) {
              return `${employee.fullName}: no active salary structure is available in compensation memory.`;
            }

            const currency = compensation.currency || 'INR';
            const formatMoney = (value: number) => `${currency} ${Number(value || 0).toLocaleString('en-IN')}`;
            const components = Array.isArray(compensation.components) && compensation.components.length
              ? ` Components: ${compensation.components
                  .slice(0, 5)
                  .map((component: any) => `${component.name} ${formatMoney(component.monthlyAmount)}/month`)
                  .join('; ')}.`
              : '';

            return `${employee.fullName}: annual CTC ${formatMoney(compensation.annualCtc)}, monthly gross ${formatMoney(compensation.monthlyGross)}, monthly net estimate ${formatMoney(compensation.monthlyNetEstimate)}, effective from ${compensation.effectiveFrom || 'not set'}.${components}`;
          })
          .join(' ');

        return `${salaryFacts} This is compensation tracking data only; I am not calculating payroll, tax, PF, ESI, TDS, or statutory deductions from this answer.`;
      }

      const employeeFacts = mentionedEmployees
        .slice(0, 3)
        .map((employee) => {
          const missing = [
            !employee.gender ? 'gender' : null,
            !employee.department ? 'department' : null,
            !employee.designation ? 'designation' : null,
            !employee.manager && employee.status === 'active' ? 'manager' : null,
            !employee.workLocation ? 'work location' : null,
            !employee.dateOfJoining ? 'joining date' : null,
          ].filter(Boolean);

          return [
            `${employee.fullName}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`,
            `status: ${employee.status || 'not set'}`,
            `gender: ${employee.gender || 'not set'}`,
            `department: ${employee.department || 'not set'}`,
            `designation: ${employee.designation || 'not set'}`,
            `manager: ${employee.manager || 'not set'}`,
            `work location: ${employee.workLocation || 'not set'}`,
            missing.length ? `missing: ${missing.join(', ')}` : 'missing: none of the core checked fields',
          ].join('; ');
        })
        .join(' | ');

      if (/(gender|female|male|maternity|paternity)/.test(intentPrompt)) {
        return `I checked the live employee master record. ${employeeFacts}. Gender-specific leave eligibility should use this stored gender value. If the stored gender is wrong or missing, the leave cards and entitlement logic will be wrong until HR updates the employee master.`;
      }

      return `I found the named employee record in live tenant data. ${employeeFacts}.`;
    }

    if (
      /(leave|policy|balance|maternity|paternity|sick|casual|earned|approval)/.test(intentPrompt) &&
      /(what.*check|check.*first|what.*review|priority|next step|focus)/.test(intentPrompt) &&
      data.leaveMemory
    ) {
      const leave = data.leaveMemory;
      const priorities: string[] = [
        `${leave.policies.activePolicies} active leave polic${leave.policies.activePolicies === 1 ? 'y' : 'ies'}`,
        `${leave.balances.missingBalanceEmployees} active employee(s) missing current-year balances`,
        `${leave.requests.pending} pending leave request(s)`,
        `${leave.balances.genderMismatchAllocations} gender-mismatch entitlement allocation(s)`,
      ];

      return `For leave management, review these first: ${priorities.join('; ')}. Then verify that maternity and paternity cards are gender-filtered, and that balances come from the active leave policy rather than unused business-rule drafts.`;
    }

    if (
      /(attendance|present|absent|clock|wfh|office|off-site|regularisation|regularization)/.test(intentPrompt) &&
      /(what.*check|check.*first|what.*review|priority|next step|focus)/.test(intentPrompt) &&
      data.attendanceMemory
    ) {
      const attendance = data.attendanceMemory;
      return `For attendance, review today first: ${attendance.today.present}/${attendance.today.activeEmployees} active employee(s) present, ${attendance.today.absent} absent, ${attendance.today.missingRecords} missing today record(s). Then check last 30 days for ${attendance.last30Days.incompleteClockPairs} incomplete clock pair(s), ${attendance.last30Days.manualOverrides} manual override(s), and ${attendance.last30Days.locationMissingForPresent} present/half-day record(s) missing work-from location.`;
    }

    if (/(why|not answer|hardcoded|generic|main question|actual question|specific)/.test(intentPrompt)) {
      return [
        'The previous tray content was too generic because the UI was showing local screen guidance alongside backend answers.',
        'The live assistant service is available and this response is generated from tenant-scoped AuroraHR data.',
        `For this request I can see ${employeeQuality.totalEmployees} employee records in ${visibleScope} scope, including ${employeeQuality.activeEmployees} active and ${employeeQuality.nonActiveEmployees} inactive or exited records.`,
        'Ask a concrete question such as “How many active employees?”, “What document gaps exist?”, or “What is Anupama Bhat’s gender?” and I will answer against the loaded data instead of returning generic screen text.',
      ].join(' ');
    }

    if (/(what.*check|check.*first|what.*review|priority|next step|focus)/.test(intentPrompt)) {
      const priorities: string[] = [];
      if (employeeQuality.missingManager > 0) priorities.push(`${employeeQuality.missingManager} active employee(s) without manager mapping`);
      if (employeeQuality.missingCoreFields > 0) priorities.push(`${employeeQuality.missingCoreFields} missing employee-master field instance(s)`);
      if (data.documentMemory?.employeeDocuments?.unverified > 0) priorities.push(`${data.documentMemory.employeeDocuments.unverified} unverified employee document(s)`);
      if (data.documentMemory?.companyDocuments?.unverified > 0) priorities.push(`${data.documentMemory.companyDocuments.unverified} unverified company vault document(s)`);
      if (data.compensationMemory?.missingActiveSalaryStructure > 0) priorities.push(`${data.compensationMemory.missingActiveSalaryStructure} employee(s) without active salary structure`);
      if (data.attendanceMemory?.today?.missingRecords > 0) priorities.push(`${data.attendanceMemory.today.missingRecords} active employee(s) without today attendance record`);
      if (data.leaveMemory?.balances?.missingBalanceEmployees > 0) priorities.push(`${data.leaveMemory.balances.missingBalanceEmployees} active employee(s) without current-year leave balance`);

      if (!priorities.length) {
        return `I checked the live ${visibleScope} data available for this screen. No immediate priority gap is visible from the loaded employee, document, compensation, attendance, or leave signals. The next step is manual verification of source evidence before sign-off.`;
      }

      return `The first items to check are: ${priorities.slice(0, 5).join('; ')}. I would handle these as review items first, not as automatic edits.`;
    }

    if (/(how many|count|number|headcount|active|inactive|exited)/.test(intentPrompt)) {
      return `Current ${visibleScope} workforce count is ${employeeQuality.totalEmployees}: ${employeeQuality.activeEmployees} active and ${employeeQuality.nonActiveEmployees} inactive or exited. Active records missing manager mapping: ${employeeQuality.missingManager}. Duplicate-name risk groups: ${employeeQuality.duplicateNameRisks}.`;
    }

    if (/(manager|reporting|mapping|manager mapping|reports to)/.test(intentPrompt)) {
      if (employeeQuality.missingManager > 0) {
        return `Manager mapping needs attention. ${employeeQuality.missingManager} active employee record(s) are missing manager assignment. This should be corrected from verified HR reporting-line evidence because leave approvals, attendance reviews, performance workflows, and team views depend on it.`;
      }
      return 'Manager mapping looks complete for active employees visible to this role. I would still validate it against the latest ACV reporting structure before implementation sign-off.';
    }

    if (/(missing field|data gap|data quality|completeness|accuracy|migration)/.test(intentPrompt)) {
      return [
        `Employee-master quality: ${employeeQuality.missingCoreFields} missing core-field instance(s).`,
        `Breakup: department ${employeeQuality.missingDepartment}, designation ${employeeQuality.missingDesignation}, work location ${employeeQuality.missingWorkLocation}, joining date ${employeeQuality.missingJoiningDate}, gender ${employeeQuality.missingGender}.`,
        `Active records missing manager: ${employeeQuality.missingManager}.`,
        'Treat this as migration-readiness evidence and correct only from source documents or HR confirmation.',
      ].join(' ');
    }

    if (/(document|vault|company document|employee document|verification|preview|download)/.test(intentPrompt) && data.documentMemory) {
      const employeeDocs = data.documentMemory.employeeDocuments;
      const companyDocs = data.documentMemory.companyDocuments;
      const companyText = companyDocs
        ? ` Company vault has ${companyDocs.total} document(s), with ${companyDocs.unverified} unverified.`
        : ' Company vault access is restricted for this role.';

      return `Document memory currently shows ${employeeDocs.total} employee document(s) across ${employeeDocs.employeesWithDocuments} employee(s), with ${employeeDocs.unverified} unverified.${companyText} The operating rule is: classify first, preview/download second, verify only after human source review.`;
    }

    if (/(salary|compensation|payslip|pay slip|ctc|salary structure)/.test(intentPrompt)) {
      const compensation = data.compensationMemory;
      if (!compensation) {
        return 'Compensation is restricted for this role or was not requested in the current screen context. I can explain compensation memory, but salary structures and payslip coverage are HR/Admin-readable only.';
      }

      return `Compensation memory shows ${compensation.activeSalaryStructures} active salary structure(s), ${compensation.missingActiveSalaryStructure} employee(s) missing active salary structure, ${compensation.payslipRecords} payslip record(s), and ${compensation.employeesWithPayslips} employee(s) with payslips. This remains tracking and evidence storage only, not payroll computation.`;
    }

    if (/(attendance|present|absent|clock|wfh|office|off-site|regularisation|regularization)/.test(intentPrompt) && data.attendanceMemory) {
      const attendance = data.attendanceMemory;
      return `Attendance today has ${attendance.today.records} record(s) for ${attendance.today.activeEmployees} active employee(s): ${attendance.today.present} present, ${attendance.today.absent} absent, ${attendance.today.onLeave} on leave, ${attendance.today.halfDay} half-day, and ${attendance.today.missingRecords} missing. Last 30 days: ${attendance.last30Days.records} records, ${attendance.last30Days.incompleteClockPairs} incomplete clock pair(s), ${attendance.last30Days.manualOverrides} manual override(s), and ${attendance.last30Days.locationMissingForPresent} present/half-day record(s) without work-from location.`;
    }

    if (/(leave|policy|balance|maternity|paternity|sick|casual|earned|approval)/.test(intentPrompt) && data.leaveMemory) {
      const leave = data.leaveMemory;
      return `Leave readiness shows ${leave.policies.activePolicies} active leave polic${leave.policies.activePolicies === 1 ? 'y' : 'ies'} covering ${leave.policies.activeTypes.join(', ') || 'no active types'}, ${leave.balances.currentYearBalances} current-year balance record(s), ${leave.balances.missingBalanceEmployees} active employee(s) missing current-year balances, ${leave.requests.pending} pending request(s), and ${leave.balances.genderMismatchAllocations} gender-mismatch entitlement allocation(s). Maternity and paternity must remain gender-eligible and zero when not applicable.`;
    }

    if (/(navigate|take me|open|where)/.test(intentPrompt)) {
      return 'I can guide navigation from here. Use the quick action chip if available, or open the relevant module from the left menu. Navigation is safe and does not modify HR records.';
    }

    return null;
  }

  private composeGuidedProcessAnswer(context: AnswerContext): string | null {
    const { normalizedPrompt, visibleScope } = context;
    const isHowToPrompt = /(how do i|how to|guide me|step by step|right process|correct process|what is the process|use this screen)/.test(
      normalizedPrompt
    );

    if (!isHowToPrompt) return null;

    if (/(employee register|employee master|employee profile|employee data|employees|\/employees)/.test(normalizedPrompt)) {
      return [
        'Use Employee Register like this:',
        '1. Start with active employees; historical/exited records should be reviewed separately.',
        '2. Search by name, email, or employee code before creating or editing any record.',
        '3. Open the employee profile and verify personal, professional, history, documents, and compensation tabs.',
        '4. Correct manager, department, designation, work location, joining date, and gender only from verified HR evidence.',
        '5. Use documents and compensation tabs to close missing-memory gaps before implementation sign-off.',
        `Scope applied: ${visibleScope}. I will not create, delete, or overwrite employee records from this guidance answer.`,
      ].join('\n');
    }

    if (/(document|vault|company vault|employee document|\/documents)/.test(normalizedPrompt)) {
      return [
        'Use Document Library like this:',
        '1. Decide whether the file belongs to an employee record or the company vault.',
        '2. Pick the correct category before upload; category drives governance and future reporting.',
        '3. Use preview/download to inspect the file before marking it verified.',
        '4. Record expiry where applicable for compliance, insurance, policy, and statutory documents.',
        '5. Verify only after HR confirms the document source and owner.',
        `Scope applied: ${visibleScope}. I will not upload, delete, share, or verify files from this guidance answer.`,
      ].join('\n');
    }

    if (/(attendance|clock|regularisation|regularization|\/attendance)/.test(normalizedPrompt)) {
      return [
        'Use Attendance like this:',
        '1. Start with My Attendance for the employee’s own clock-in, clock-out, work-from status, and history.',
        '2. Use Company Attendance for HR/Admin review of active employees only.',
        '3. For a single date, verify present/absent, Office/WFH/Off-site, in time, out time, and hours worked.',
        '4. For a date range, review the grid horizontally by day and vertically by employee.',
        '5. Missing or incorrect punches should become attendance regularisation requests, not silent edits.',
        `Scope applied: ${visibleScope}. I will not regularise or overwrite attendance records from this guidance answer.`,
      ].join('\n');
    }

    if (/(leave|policy|balance|approve leave|reject leave|\/leave)/.test(normalizedPrompt)) {
      return [
        'Use Leave Management like this:',
        '1. Start with My Leaves to inspect eligibility, taken leave, and the employee leave register.',
        '2. Use Company Leaves to compare leave consumption across active employees.',
        '3. Use Team Approvals only for requests routed to the authorised manager or HR role.',
        '4. Check active policy, balance, dates, reason, overlap, and supporting evidence before approval.',
        '5. Maternity and paternity eligibility must follow employee gender; mismatched entitlement should be zero.',
        `Scope applied: ${visibleScope}. I will not approve, reject, or edit balances from this guidance answer.`,
      ].join('\n');
    }

    if (/(dashboard|hr workspace|implementation console|owner implementation console|\/dashboard)/.test(normalizedPrompt)) {
      return [
        'Use the HR workspace dashboard like this:',
        '1. Start with the compact cards to spot active employees, attendance, upcoming joiners, holidays, and salary-date signals.',
        '2. Review Recent Activity for employee lifecycle events that may need HR attention.',
        '3. Check HR Connect feeds for employee communication requiring response.',
        '4. Use Calendar Reminders for due dates, follow-ups, and operational events.',
        '5. Open the specific module only after deciding what needs action.',
        `Scope applied: ${visibleScope}. I will not change dashboard data or HR records from this guidance answer.`,
      ].join('\n');
    }

    if (/(analytics|report|visual|\/reports)/.test(normalizedPrompt)) {
      return [
        'Use HR Analytics like this:',
        '1. Select the HR or business perspective first.',
        '2. Build the source dataset before changing columns, grouping, or chart type.',
        '3. Use column selection to keep only fields required for the current decision.',
        '4. Add grouping only when the selected field exists in the fetched dataset.',
        '5. Use table for audit, summary for management review, and visual charts for pattern discovery.',
        `Scope applied: ${visibleScope}. I will not save or distribute reports from this guidance answer.`,
      ].join('\n');
    }

    return [
      'Use this AuroraHR screen like this:',
      '1. Confirm the purpose of the screen before changing data.',
      '2. Review the visible records and filters first.',
      '3. Open the relevant detail view for evidence-sensitive changes.',
      '4. Use Manu for explanation, navigation, and safe drafts.',
      '5. Confirm sensitive actions through the module workflow, not through a free-text answer.',
      `Scope applied: ${visibleScope}. I will not mutate HR records from this guidance answer.`,
    ].join('\n');
  }

  private findMentionedEmployees(
    normalizedPrompt: string,
    employees: ReturnType<AssistantService['buildEmployeeQuality']>['employees']
  ) {
    const resolution = this.resolveEmployeeMention(normalizedPrompt, employees);
    if (resolution.status === 'exact' || resolution.status === 'unique_partial') return resolution.matches;
    return [];
  }

  private resolveEmployeeMention(
    normalizedPrompt: string,
    employees: ReturnType<AssistantService['buildEmployeeQuality']>['employees']
  ): EmployeeResolution {
    const promptTokens = new Set(
      normalizedPrompt
        .split(/[^a-z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
    );

    const exactMatches: ResolvedEmployee[] = [];
    const uniquePartialCandidates: ResolvedEmployee[] = [];
    const weakLastNameCandidates: ResolvedEmployee[] = [];

    employees.forEach((employee) => {
      const name = normalize(employee.fullName);
      const employeeCode = normalize(employee.employeeCode);
      const nameTokens = name.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
      const firstName = nameTokens[0];
      const lastName = nameTokens[nameTokens.length - 1];

      if (employeeCode && normalizedPrompt.includes(employeeCode)) {
        exactMatches.push(employee);
        return;
      }
      if (name && normalizedPrompt.includes(name)) {
        exactMatches.push(employee);
        return;
      }
      if (nameTokens.length > 0 && nameTokens.every((token) => promptTokens.has(token))) {
        exactMatches.push(employee);
        return;
      }

      if (firstName && firstName.length >= 4 && promptTokens.has(firstName)) {
        uniquePartialCandidates.push(employee);
        return;
      }

      if (lastName && lastName.length >= 4 && promptTokens.has(lastName)) {
        weakLastNameCandidates.push(employee);
      }
    });

    if (exactMatches.length === 1) {
      return { status: 'exact', matches: exactMatches };
    }
    if (exactMatches.length > 1) {
      return {
        status: 'ambiguous',
        matches: exactMatches,
        reason: 'Multiple exact employee references matched the prompt.',
      };
    }
    if (uniquePartialCandidates.length === 1) {
      return {
        status: 'unique_partial',
        matches: uniquePartialCandidates,
        reason: 'A unique first-name match was found.',
      };
    }
    if (uniquePartialCandidates.length > 1) {
      return {
        status: 'ambiguous',
        matches: uniquePartialCandidates,
        reason: 'Multiple first-name matches were found.',
      };
    }
    if (weakLastNameCandidates.length > 0) {
      return {
        status: 'ambiguous',
        matches: weakLastNameCandidates,
        reason: 'Only a weak last-name match was found. Use exact full name or employee code.',
      };
    }

    return { status: 'none', matches: [] };
  }

  private buildActionProposals(
    normalizedPrompt: string,
    data: Record<string, any>,
    employeeQuality: ReturnType<AssistantService['buildEmployeeQuality']>,
    autonomyLevel: AutonomyLevel
  ): AssistantActionProposal[] {
    const proposals: AssistantActionProposal[] = [];

    if (
      employeeQuality.missingManager > 0 ||
      employeeQuality.missingCoreFields > 0 ||
      normalizedPrompt.includes('employee') ||
      normalizedPrompt.includes('data gap')
    ) {
      proposals.push({
        id: 'employee-master-gap-review',
        module: 'employee',
        title: 'Prepare employee master gap review',
        autonomyLevel: autonomyLevel === 'L0' ? 'L1' : autonomyLevel,
        purpose: 'Create a focused review path for missing manager mapping and core employee fields before implementation sign-off.',
        steps: [
          'Open Employee Register and filter active employees first.',
          'Review missing manager, department, designation, work location, joining date, and gender fields.',
          'Use manual employee profile edits only after HR validates the source evidence.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      });
    }

    if (data.documentMemory) {
      proposals.push({
        id: 'document-verification-checklist',
        module: 'documents',
        title: 'Prepare document verification checklist',
        autonomyLevel: 'L2',
        purpose: 'Draft a verification checklist for unverified employee and company documents without changing verification status.',
        steps: [
          'Separate employee documents from company vault documents.',
          'Check category, owner, date, expiry, previewability, and verification status.',
          'Mark records for HR review; do not verify documents until a human confirms source accuracy.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      });
    }

    if (data.compensationMemory) {
      proposals.push({
        id: 'compensation-coverage-review',
        module: 'compensation',
        title: 'Prepare compensation coverage review',
        autonomyLevel: 'L2',
        purpose: 'Draft a coverage review for salary structures, salary transactions, and payslip records while preserving payroll boundary.',
        steps: [
          'Compare active employees against active salary structures.',
          'Review payslip coverage by employee and month.',
          'Flag missing evidence only; do not compute payroll, tax, PF, ESI, or TDS.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      });
    }

    if (data.attendanceMemory) {
      proposals.push({
        id: 'attendance-regularisation-draft',
        module: 'attendance',
        title: 'Prepare attendance regularisation draft',
        autonomyLevel: 'L2',
        purpose: 'Draft a review list for missing attendance records, incomplete clock pairs, and missing work-from status.',
        steps: [
          'Review today’s missing records for active employees.',
          'Check 30-day incomplete clock pairs and manual overrides.',
          'Prepare regularisation candidates for HR review; do not overwrite source attendance.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      });
    }

    if (data.leaveMemory) {
      proposals.push({
        id: 'leave-balance-policy-review',
        module: 'leave',
        title: 'Prepare leave balance and policy review',
        autonomyLevel: 'L2',
        purpose: 'Draft a leave readiness review covering active policies, current-year balances, pending requests, and gender-specific entitlement risks.',
        steps: [
          'Confirm active leave policies and expected leave types.',
          'Check active employees with missing current-year balances.',
          'Review maternity and paternity allocations against employee gender before any entitlement change.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      });
    }

    return proposals.slice(0, 4);
  }

  private getProposalById(proposalId: string): AssistantActionProposal | null {
    const proposals = this.getProposalCatalog();
    return proposals.find((proposal) => proposal.id === proposalId) || null;
  }

  private getProposalCatalog(): AssistantActionProposal[] {
    return [
      {
        id: 'employee-master-gap-review',
        module: 'employee',
        title: 'Prepare employee master gap review',
        autonomyLevel: 'L1',
        purpose: 'Create a focused review path for missing manager mapping and core employee fields before implementation sign-off.',
        steps: [
          'Open Employee Register and filter active employees first.',
          'Review missing manager, department, designation, work location, joining date, and gender fields.',
          'Use manual employee profile edits only after HR validates the source evidence.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      },
      {
        id: 'document-verification-checklist',
        module: 'documents',
        title: 'Prepare document verification checklist',
        autonomyLevel: 'L2',
        purpose: 'Draft a verification checklist for unverified employee and company documents without changing verification status.',
        steps: [
          'Separate employee documents from company vault documents.',
          'Check category, owner, date, expiry, previewability, and verification status.',
          'Mark records for HR review; do not verify documents until a human confirms source accuracy.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      },
      {
        id: 'compensation-coverage-review',
        module: 'compensation',
        title: 'Prepare compensation coverage review',
        autonomyLevel: 'L2',
        purpose: 'Draft a coverage review for salary structures, salary transactions, and payslip records while preserving payroll boundary.',
        steps: [
          'Compare active employees against active salary structures.',
          'Review payslip coverage by employee and month.',
          'Flag missing evidence only; do not compute payroll, tax, PF, ESI, or TDS.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      },
      {
        id: 'attendance-regularisation-draft',
        module: 'attendance',
        title: 'Prepare attendance regularisation draft',
        autonomyLevel: 'L2',
        purpose: 'Draft a review list for missing attendance records, incomplete clock pairs, and missing work-from status.',
        steps: [
          'Review today’s missing records for active employees.',
          'Check 30-day incomplete clock pairs and manual overrides.',
          'Prepare regularisation candidates for HR review; do not overwrite source attendance.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      },
      {
        id: 'leave-balance-policy-review',
        module: 'leave',
        title: 'Prepare leave balance and policy review',
        autonomyLevel: 'L2',
        purpose: 'Draft a leave readiness review covering active policies, current-year balances, pending requests, and gender-specific entitlement risks.',
        steps: [
          'Confirm active leave policies and expected leave types.',
          'Check active employees with missing current-year balances.',
          'Review maternity and paternity allocations against employee gender before any entitlement change.',
        ],
        requiresConfirmation: false,
        writesRecords: false,
      },
    ];
  }

  private getProposalBlockingReasons(proposal: AssistantActionProposal, actor: AssistantActor): string[] {
    const reasons: string[] = [];

    if (proposal.module === 'compensation' && !this.canReadCompensation(actor.role)) {
      reasons.push('Current role is not allowed to review compensation coverage.');
    }

    if (proposal.module === 'documents' && !this.canReadCompanyDocuments(actor.role) && actor.role !== UserRole.MANAGER) {
      reasons.push('Current role can only review self-service document guidance, not tenant/company document governance.');
    }

    if (proposal.module === 'employee' && ![UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER].includes(actor.role)) {
      reasons.push('Current role can only inspect self data, not employee master gap review.');
    }

    if (proposal.module === 'attendance' && ![UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE].includes(actor.role)) {
      reasons.push('Current role is not mapped to attendance review.');
    }

    if (proposal.module === 'leave' && ![UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE].includes(actor.role)) {
      reasons.push('Current role is not mapped to leave review.');
    }

    return reasons;
  }

  private getConfirmationChecklist(proposal: AssistantActionProposal): string[] {
    const common = [
      'Confirm tenant and user role are correct.',
      'Confirm source data/evidence is available.',
      'Confirm this proposal is still relevant to the current screen and workflow.',
    ];

    if (proposal.module === 'attendance') {
      return [
        ...common,
        'Confirm no biometric/source attendance record will be overwritten.',
        'Confirm regularisation candidates are only drafted for HR review.',
      ];
    }

    if (proposal.module === 'leave') {
      return [
        ...common,
        'Confirm active leave policy and year are correct.',
        'Confirm maternity/paternity eligibility is checked against employee gender.',
      ];
    }

    if (proposal.module === 'compensation') {
      return [
        ...common,
        'Confirm this remains compensation memory only, not payroll computation.',
        'Confirm payslip and salary coverage gaps are treated as review items.',
      ];
    }

    if (proposal.module === 'documents') {
      return [
        ...common,
        'Confirm documents are separated by employee memory and company vault.',
        'Confirm verification status is not changed without human review.',
      ];
    }

    return [
      ...common,
      'Confirm employee master edits are performed only from verified HR source evidence.',
      'Confirm inactive and active employee records are not mixed during review.',
    ];
  }

  private getPermissionScope(role: UserRole): AssistantConfirmationPreview['permissionScope'] {
    if (role === UserRole.SYSTEM_ADMIN || role === UserRole.HR_ADMIN) return 'tenant-wide';
    if (role === UserRole.MANAGER) return 'manager-team';
    return 'self-service';
  }

  private shouldIncludeDocumentMemory(input: string) {
    return /(document|vault|memory|evidence|readiness|gap|missing|quality|appointment letter|employment letter|joining letter|offer letter)/.test(input);
  }

  private shouldIncludeCompensation(input: string) {
    return /(salary|compensation|payslip|pay slip|ctc|memory|readiness|gap|quality)/.test(input);
  }

  private shouldIncludeAttendance(input: string) {
    return /(attendance|clock|present|absent|regulari[sz]ation|work from|wfh|office|off-site|onsite|biometric)/.test(input);
  }

  private shouldIncludeLeave(input: string) {
    return /(leave|policy|balance|maternity|paternity|sick|casual|earned|approval)/.test(input);
  }

  private shouldIncludeAnalytics(input: string) {
    return /(headcount|head count|department|designation|location|attrition|trend|report|analytics|chart|group)/.test(input);
  }

  private classifyAnswerKind(
    prompt: string,
    answer: string,
    data: Record<string, any>
  ): AssistantAnswerKind {
    const normalizedPrompt = normalize(prompt);
    const normalizedAnswer = normalize(answer);

    if (/^(how do i|how to|guide me|step by step|explain the correct|what is the process)/.test(normalizedPrompt)) {
      return 'guided_workflow';
    }
    if (/(draft|prepare|write).*(letter|email|note)/.test(normalizedPrompt) && /^draft /.test(normalizedAnswer)) {
      return 'draft';
    }
    if (/(will not|cannot|restricted|not allowed|refuse|blocked|no exact employee match)/.test(normalizedAnswer)) {
      return 'refusal';
    }
    if (/(approve|reject|delete|remove|send|verify all|mark all|update|assign|regularise|regularize)/.test(normalizedPrompt)) {
      return 'action_confirmation';
    }
    if (data.appointmentLetterGaps || data.analytics || data.namedCompensation) {
      return 'data_answer';
    }
    if (/(report|analytics|headcount|attrition|trend|chart|download)/.test(normalizedPrompt)) {
      return 'data_answer';
    }

    return 'simple_answer';
  }

  private resolveOutputMode(answerKind: AssistantAnswerKind): AssistantOutputMode {
    if (answerKind === 'guided_workflow') return 'guided_tour';
    if (answerKind === 'action_confirmation') return 'confirmation_gate';
    if (answerKind === 'data_answer' || answerKind === 'draft') return 'focused_modal';
    return 'tray';
  }

  private normalizeGender(gender?: string | null): string | undefined {
    const normalized = gender?.trim().toLowerCase();
    if (!normalized) return undefined;
    if (['m', 'male'].includes(normalized)) return 'male';
    if (['f', 'female'].includes(normalized)) return 'female';
    return normalized;
  }

  private isGenderEligibleForLeave(leaveType: LeaveType, employee: Employee) {
    if (leaveType === LeaveType.MATERNITY) return this.normalizeGender(employee.gender) === 'female';
    if (leaveType === LeaveType.PATERNITY) return this.normalizeGender(employee.gender) === 'male';
    return true;
  }

  private canReadCompanyDocuments(role: UserRole) {
    return role === UserRole.HR_ADMIN || role === UserRole.SYSTEM_ADMIN;
  }

  private canReadCompensation(role: UserRole) {
    return role === UserRole.HR_ADMIN || role === UserRole.SYSTEM_ADMIN;
  }
}

export const assistantService = new AssistantService();
export default assistantService;
