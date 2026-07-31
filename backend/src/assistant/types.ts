import { UserRole } from '../../../shared/types';

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
export type ManuQuestionType =
  | 'reporting_manager'
  | 'direct_reports'
  | 'designation'
  | 'department'
  | 'joining_date'
  | 'work_location'
  | 'employee_profile'
  | 'employee_compensation'
  | 'employee_leave'
  | 'employee_documents'
  | 'draft_manager_email'
  | 'aggregate'
  | 'workflow'
  | 'general';
export type ManuDataNeed =
  | 'employees'
  | 'documents'
  | 'compensation'
  | 'attendance'
  | 'leave'
  | 'analytics'
  | 'application_knowledge'
  | 'acv_knowledge';

export interface ManuConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ManuScreenContext {
  pathname?: string;
  pageTitle?: string;
  routeParams?: Record<string, string>;
  query?: Record<string, string>;
  activeTab?: string;
  selectedEntity?: {
    type: string;
    id?: string;
    label?: string;
  };
  visibleSections?: string[];
  visibleColumns?: string[];
}

export interface ManuRequestContext {
  screen?: ManuScreenContext;
  conversation?: ManuConversationTurn[];
}

export interface ManuIntentDefinition {
  id: string;
  description: string;
  patterns: RegExp[];
  autonomyLevel: ManuAutonomyLevel;
  answerKind: ManuAnswerKind;
  outputMode: ManuOutputMode;
  dataNeeds: ManuDataNeed[];
  modules: string[];
  allowedRoles?: UserRole[];
  preferredRoutes?: RegExp[];
  priority: number;
}

export interface ManuIntentMatch {
  intent: ManuIntentDefinition;
  confidence: number;
  matchedBy: 'prompt' | 'screen' | 'fallback';
}

export interface ManuKnowledgeCitation {
  id: string;
  title: string;
  section: string;
  sourceType: 'application' | 'acv_document';
  sourcePath?: string;
  excerpt: string;
  score: number;
}

export interface ManuDraftArtifact {
  draftId: string;
  type:
    | 'appointment_letter'
    | 'document_request_email'
    | 'attendance_clarification'
    | 'leave_note'
    | 'manager_email';
  title: string;
  subject?: string;
  content: string;
  employeeId?: string;
  employeeCode?: string | null;
  employeeName?: string;
  generatedAt: string;
  missingInputs: string[];
  assumptions: string[];
  reviewChecklist: string[];
}

export interface ManuAnswerPlan {
  questionType: ManuQuestionType;
  subjectEmployeeId?: string;
  subjectEmployeeName?: string;
  resolvedFrom: 'current_prompt' | 'conversation' | 'screen' | 'none';
}

export interface ManuAnswerPresentation {
  density: 'compact' | 'standard' | 'workspace';
  showInsights: boolean;
  showSuggestions: boolean;
  factCard?: {
    title: string;
    subtitle?: string;
    facts: Array<{ label: string; value: string }>;
  };
}
