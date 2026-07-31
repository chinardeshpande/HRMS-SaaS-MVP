import { UserRole } from '../../../shared/types';
import {
  ManuIntentDefinition,
  ManuIntentMatch,
  ManuScreenContext,
} from './types';

const ALL_ROLES = [
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.HR_ADMIN,
  UserRole.SYSTEM_ADMIN,
];
const HR_ROLES = [UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN];

export const MANU_INTENT_REGISTRY: ManuIntentDefinition[] = [
  {
    id: 'unsafe_or_prohibited_action',
    description: 'Destructive, permission-changing, termination, or policy-bypassing request.',
    patterns: [
      /\b(delete|remove permanently|terminate|termination|bypass|override permission|change role permission)\b/i,
      /\b(approve|change)\b.*\b(salary|compensation)\b/i,
    ],
    autonomyLevel: 'L4',
    answerKind: 'refusal',
    outputMode: 'confirmation_gate',
    dataNeeds: ['employees'],
    modules: ['employee', 'compensation', 'settings'],
    allowedRoles: HR_ROLES,
    priority: 100,
  },
  {
    id: 'bulk_approval_action',
    description: 'Bulk approval or rejection that must remain in an audited module workflow.',
    patterns: [/\b(approve|reject)\b.*\b(all|every|bulk)\b/i],
    autonomyLevel: 'L4',
    answerKind: 'refusal',
    outputMode: 'confirmation_gate',
    dataNeeds: ['leave'],
    modules: ['leave'],
    allowedRoles: [UserRole.MANAGER, ...HR_ROLES],
    priority: 98,
  },
  {
    id: 'draft_manager_email',
    description: 'Prepare a reviewable email to the reporting manager of a resolved employee.',
    patterns: [
      /\b(draft|prepare|write)\b.*\b(email|message)\b.*\b(manager|reporting manager)\b/i,
      /\b(draft|prepare|write)\b.*\b(manager|reporting manager)\b.*\b(email|message)\b/i,
    ],
    autonomyLevel: 'L2',
    answerKind: 'draft',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'application_knowledge'],
    modules: ['employee'],
    allowedRoles: [UserRole.MANAGER, ...HR_ROLES],
    preferredRoutes: [/^\/employees/],
    priority: 96,
  },
  {
    id: 'draft_appointment_letter',
    description: 'Prepare a reviewable appointment, offer, joining, or employment letter.',
    patterns: [/\b(draft|prepare|write|create)\b.*\b(appointment|offer|joining|employment)\s+letter\b/i],
    autonomyLevel: 'L2',
    answerKind: 'draft',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'documents', 'compensation', 'application_knowledge'],
    modules: ['employee', 'documents', 'compensation'],
    allowedRoles: HR_ROLES,
    preferredRoutes: [/^\/employees/, /^\/documents/],
    priority: 95,
  },
  {
    id: 'draft_document_request',
    description: 'Prepare a document request email for a named employee.',
    patterns: [/\b(draft|prepare|write)\b.*\b(document|evidence|proof)\b.*\b(email|request|message)\b/i],
    autonomyLevel: 'L2',
    answerKind: 'draft',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'documents', 'application_knowledge'],
    modules: ['employee', 'documents'],
    allowedRoles: [UserRole.MANAGER, ...HR_ROLES],
    preferredRoutes: [/^\/employees/, /^\/documents/],
    priority: 94,
  },
  {
    id: 'draft_attendance_clarification',
    description: 'Prepare a traceable attendance clarification note.',
    patterns: [/\b(draft|prepare|write)\b.*\b(attendance|punch|clock|regulari[sz]ation)\b/i],
    autonomyLevel: 'L2',
    answerKind: 'draft',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'attendance', 'application_knowledge'],
    modules: ['attendance'],
    allowedRoles: ALL_ROLES,
    preferredRoutes: [/^\/attendance/],
    priority: 93,
  },
  {
    id: 'draft_leave_note',
    description: 'Prepare a leave review or decision note without approving the request.',
    patterns: [/\b(draft|prepare|write)\b.*\b(leave|absence)\b.*\b(note|response|message|email)\b/i],
    autonomyLevel: 'L2',
    answerKind: 'draft',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'leave', 'application_knowledge'],
    modules: ['leave'],
    allowedRoles: ALL_ROLES,
    preferredRoutes: [/^\/leave/],
    priority: 92,
  },
  {
    id: 'controlled_record_action',
    description: 'A record-changing request that requires a module workflow and confirmation.',
    patterns: [/\b(send|update|assign|close|escalate|create task|create record|mark verified|regulari[sz]e)\b/i],
    autonomyLevel: 'L3',
    answerKind: 'action_confirmation',
    outputMode: 'confirmation_gate',
    dataNeeds: ['employees'],
    modules: ['employee'],
    priority: 90,
  },
  {
    id: 'navigation_help',
    description: 'Find or open the right AuroraHR screen.',
    patterns: [/\b(take me|open|navigate|where (is|can)|which screen)\b/i],
    autonomyLevel: 'L1',
    answerKind: 'guided_workflow',
    outputMode: 'guided_tour',
    dataNeeds: ['application_knowledge'],
    modules: ['application'],
    priority: 80,
  },
  {
    id: 'guided_process',
    description: 'Explain an AuroraHR workflow step by step.',
    patterns: [/\b(how do i|how to|guide me|step by step|correct process|right process|what is the process)\b/i],
    autonomyLevel: 'L1',
    answerKind: 'guided_workflow',
    outputMode: 'guided_tour',
    dataNeeds: ['application_knowledge'],
    modules: ['application'],
    priority: 91,
  },
  {
    id: 'compensation_insight',
    description: 'Read role-permitted salary structure and payslip coverage.',
    patterns: [/\b(salary|compensation|payslip|pay slip|ctc|gross pay|net pay)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'compensation', 'application_knowledge'],
    modules: ['compensation'],
    allowedRoles: HR_ROLES,
    preferredRoutes: [/^\/compensation/, /^\/employees/],
    priority: 70,
  },
  {
    id: 'document_insight',
    description: 'Read employee document and company vault readiness.',
    patterns: [/\b(document|documents|vault|evidence|certificate|letter|preview|verification)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'documents', 'application_knowledge'],
    modules: ['documents'],
    preferredRoutes: [/^\/documents/, /^\/employees/],
    priority: 68,
  },
  {
    id: 'attendance_insight',
    description: 'Read attendance status, gaps, and regularisation context.',
    patterns: [/\b(attendance|clock|punch|present|absent|regulari[sz]ation|wfh|work from|biometric)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'attendance', 'application_knowledge'],
    modules: ['attendance'],
    preferredRoutes: [/^\/attendance/],
    priority: 66,
  },
  {
    id: 'leave_insight',
    description: 'Read leave balances, policies, eligibility, and pending requests.',
    patterns: [/\b(leave|maternity|paternity|sick leave|casual leave|earned leave|leave balance)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'leave', 'application_knowledge'],
    modules: ['leave'],
    preferredRoutes: [/^\/leave/],
    priority: 64,
  },
  {
    id: 'analytics_insight',
    description: 'Explain or produce tenant-safe HR aggregates.',
    patterns: [/\b(headcount|head count|attrition|analytics|hr report|workforce report|trend|chart|department breakdown|designation breakdown)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'analytics', 'application_knowledge'],
    modules: ['analytics'],
    preferredRoutes: [/^\/reports/, /^\/analytics/],
    priority: 62,
  },
  {
    id: 'acv_implementation_knowledge',
    description: 'Answer questions from ACV implementation plans, evidence, reports, and decisions.',
    patterns: [/\b(acv|customer zero|readiness|uat|implementation|blocker|cleanup|validation|product gap|active employees)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'focused_modal',
    dataNeeds: ['employees', 'application_knowledge', 'acv_knowledge'],
    modules: ['implementation'],
    priority: 60,
  },
  {
    id: 'employee_insight',
    description: 'Read employee master, manager mapping, and lifecycle data.',
    patterns: [/\b(employee|manager|reports?|reporting|department|designation|joining|work location|profile|people)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'data_answer',
    outputMode: 'tray',
    dataNeeds: ['employees', 'application_knowledge'],
    modules: ['employee'],
    preferredRoutes: [/^\/employees/, /^\/dashboard/],
    priority: 55,
  },
  {
    id: 'application_help',
    description: 'Answer a general question about AuroraHR capabilities, screens, or boundaries.',
    patterns: [/\b(aurorahr|application|app|feature|module|screen|can manu|can aurora|what can|random question)\b/i],
    autonomyLevel: 'L0',
    answerKind: 'simple_answer',
    outputMode: 'tray',
    dataNeeds: ['application_knowledge'],
    modules: ['application'],
    priority: 30,
  },
  {
    id: 'general_hr_question',
    description: 'Fallback conversational HR question grounded in the current screen.',
    patterns: [/.+/],
    autonomyLevel: 'L0',
    answerKind: 'simple_answer',
    outputMode: 'tray',
    dataNeeds: ['employees', 'application_knowledge'],
    modules: ['application'],
    priority: 0,
  },
];

const promptScore = (definition: ManuIntentDefinition, prompt: string) =>
  definition.patterns.some((pattern) => pattern.test(prompt)) ? 1 : 0;

const screenScore = (definition: ManuIntentDefinition, screen?: ManuScreenContext) => {
  if (!screen?.pathname || !definition.preferredRoutes?.length) return 0;
  const pathname = screen.pathname;
  return definition.preferredRoutes.some((route) => route.test(pathname)) ? 0.18 : 0;
};

export const resolveManuIntent = (
  prompt: string,
  screen?: ManuScreenContext
): ManuIntentMatch => {
  const ranked = MANU_INTENT_REGISTRY
    .map((intent) => {
      const promptMatch = promptScore(intent, prompt);
      const routeMatch = screenScore(intent, screen);
      return {
        intent,
        score: promptMatch + routeMatch + intent.priority / 1000,
        promptMatch,
        routeMatch,
      };
    })
    .filter((candidate) => candidate.promptMatch > 0)
    .sort((left, right) => right.score - left.score);

  const selected = ranked[0] || {
    intent: MANU_INTENT_REGISTRY[MANU_INTENT_REGISTRY.length - 1],
    score: 0.2,
    promptMatch: 0,
    routeMatch: 0,
  };

  return {
    intent: selected.intent,
    confidence: Math.min(0.99, Math.max(0.35, selected.score / 1.15)),
    matchedBy: selected.promptMatch ? 'prompt' : selected.routeMatch ? 'screen' : 'fallback',
  };
};

export const roleCanUseIntent = (intent: ManuIntentDefinition, role: UserRole) =>
  !intent.allowedRoles || intent.allowedRoles.includes(role);
