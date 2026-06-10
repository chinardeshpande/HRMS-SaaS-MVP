import api from './api';

export type ManuAutonomyLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ManuAnswerKind =
  | 'simple_answer'
  | 'data_answer'
  | 'guided_workflow'
  | 'draft'
  | 'action_confirmation'
  | 'refusal'
  | 'unsupported';
export type ManuOutputMode = 'tray' | 'focused_modal' | 'guided_tour' | 'confirmation_gate';

export interface ManuInsight {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'good' | 'warning' | 'critical';
}

export interface ManuActionProposal {
  id: string;
  module: 'employee' | 'documents' | 'compensation' | 'attendance' | 'leave';
  title: string;
  autonomyLevel: ManuAutonomyLevel;
  purpose: string;
  steps: string[];
  requiresConfirmation: boolean;
  writesRecords: false;
}

export interface ManuAskResponse {
  persona: {
    name: 'Manu';
    label: 'Ask Manu';
    subtitle: 'HR Operations Angel';
  };
  autonomyLevel: ManuAutonomyLevel;
  mode: 'read_only';
  answerKind: ManuAnswerKind;
  outputMode: ManuOutputMode;
  answer: string;
  insights: ManuInsight[];
  suggestedActions: string[];
  actionProposals: ManuActionProposal[];
  data?: Record<string, any>;
  guardrails: string[];
}

export interface ManuConfirmationPreview {
  proposal: ManuActionProposal;
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

export interface ManuArtifact {
  artifactId: string;
  type: 'employee_master_gap_review';
  title: string;
  generatedAt: string;
  summary: Record<string, number>;
  rows: Array<Record<string, any>>;
  recommendedNextSteps: string[];
}

export interface ManuExecutionResult {
  proposal: ManuActionProposal;
  executionState: 'blocked_not_implemented' | 'completed_artifact_created';
  acceptedConfirmation: boolean;
  requiredConfirmationText: string;
  permissionScope: 'tenant-wide' | 'manager-team' | 'self-service';
  blockingReasons: string[];
  artifact?: ManuArtifact;
  auditNote: string;
  guardrails: string[];
}

export interface ManuAskPayload {
  prompt: string;
  pathname?: string;
  pageTitle?: string;
}

export interface ManuConfirmationPreviewPayload {
  proposalId: string;
  prompt?: string;
  pathname?: string;
  pageTitle?: string;
}

export interface ManuExecutionPayload extends ManuConfirmationPreviewPayload {
  confirmationText?: string;
}

export const assistantService = {
  async ask(payload: ManuAskPayload): Promise<ManuAskResponse> {
    const response = await api.post<ManuAskResponse>('/assistant/ask', payload);
    if (!response.data) throw new Error(response.error?.message || 'Manu response was empty.');
    return response.data;
  },

  async previewConfirmation(payload: ManuConfirmationPreviewPayload): Promise<ManuConfirmationPreview> {
    const response = await api.post<ManuConfirmationPreview>('/assistant/proposals/preview-confirmation', payload);
    if (!response.data) throw new Error(response.error?.message || 'Manu confirmation preview was empty.');
    return response.data;
  },

  async requestExecution(payload: ManuExecutionPayload): Promise<ManuExecutionResult> {
    const response = await api.post<ManuExecutionResult>('/assistant/proposals/request-execution', payload);
    if (!response.data) throw new Error(response.error?.message || 'Manu execution response was empty.');
    return response.data;
  },
};

export default assistantService;
