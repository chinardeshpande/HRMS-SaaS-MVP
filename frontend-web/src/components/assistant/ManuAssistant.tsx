import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '../../types';
import assistantService, {
  ManuAskResponse,
  ManuAnswerPlan,
  ManuAnswerPresentation,
  ManuConfirmationPreview,
  ManuDraftArtifact,
  ManuExecutionResult,
  ManuKnowledgeCitation,
} from '../../services/assistantService';
import { collectManuScreenContext } from '../../utils/manuScreenContext';

interface ManuAssistantProps {
  user?: User | null;
  tenantName?: string;
}

type AutonomyLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
type PromptKind = 'question' | 'howto' | 'action' | 'typed';

interface QuickPrompt {
  label: string;
  prompt: string;
  route?: string;
  level?: AutonomyLevel;
  kind?: Exclude<PromptKind, 'typed'>;
}

interface AssistantMessage {
  id: string;
  role: 'manu' | 'user';
  text: string;
  level?: AutonomyLevel;
  insights?: ManuAskResponse['insights'];
  suggestedActions?: string[];
  actionProposals?: ManuAskResponse['actionProposals'];
  data?: ManuAskResponse['data'];
  guardrails?: string[];
  answerKind?: ManuAskResponse['answerKind'];
  outputMode?: ManuAskResponse['outputMode'];
  confirmationPreview?: ManuConfirmationPreview;
  executionResult?: ManuExecutionResult;
  citations?: ManuKnowledgeCitation[];
  draft?: ManuDraftArtifact;
  intent?: ManuAskResponse['intent'];
  answerPlan?: ManuAnswerPlan;
  presentation?: ManuAnswerPresentation;
  source?: 'backend' | 'local';
  intentKind?: PromptKind;
}

interface ManuFocusedOutput {
  title: string;
  subtitle: string;
  message?: AssistantMessage;
  artifact?: ManuExecutionResult['artifact'];
}

interface PageContext {
  title: string;
  purpose: string;
  summary: string;
  pulse: string;
  risk: string;
  howTo: string[];
  prompts: QuickPrompt[];
}

const MANU_AVATAR = '/images/assistant/manu-avatar.png';

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const formatFactLabel = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (match) => match.toUpperCase());

const formatFactValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-IN') : 'Not set';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length.toLocaleString('en-IN')} item${value.length === 1 ? '' : 's'}`;
  return 'Available';
};

const compactFactValue = (value: unknown) => {
  const formatted = formatFactValue(value);
  return formatted.length > 80 ? `${formatted.slice(0, 77)}...` : formatted;
};

const renderFactRows = (rows: unknown[], section: string) => {
  const recordRows = rows.filter(isPlainRecord).slice(0, 8);
  if (recordRows.length === 0) {
    return <p className="manu-output-muted">{rows.length.toLocaleString('en-IN')} item(s) available.</p>;
  }

  const preferredColumns = [
    'fullName',
    'employeeCode',
    'status',
    'gender',
    'department',
    'designation',
    'manager',
    'workLocation',
    'category',
    'verificationStatus',
    'month',
    'netAmount',
    'missingFields',
  ];
  const availableColumns = preferredColumns.filter((column) =>
    recordRows.some((row) => Object.prototype.hasOwnProperty.call(row, column))
  );
  const fallbackColumns = Object.keys(recordRows[0] || {}).filter((column) => !/id$/i.test(column)).slice(0, 4);
  const columns = (availableColumns.length > 0 ? availableColumns : fallbackColumns).slice(0, 5);

  return (
    <div className="manu-output-table-wrap">
      <table className="manu-output-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={`${section}-${column}`}>{formatFactLabel(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordRows.map((row, rowIndex) => (
            <tr key={`${section}-${rowIndex}`}>
              {columns.map((column) => (
                <td key={`${section}-${rowIndex}-${column}`}>
                  {Array.isArray(row[column])
                    ? row[column].length > 0
                      ? row[column].map((item) => String(item)).join(', ')
                      : 'None'
                    : compactFactValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > recordRows.length && (
        <p className="manu-output-muted">Showing {recordRows.length} of {rows.length.toLocaleString('en-IN')} record(s).</p>
      )}
    </div>
  );
};

const renderStructuredFacts = (data: Record<string, unknown>) => (
  <div className="manu-output-fact-grid">
    {Object.entries(data).map(([section, value]) => {
      const record = isPlainRecord(value) ? value : null;
      const metrics = record
        ? Object.entries(record).filter(([, metricValue]) =>
            ['string', 'number', 'boolean'].includes(typeof metricValue) || metricValue === null
          )
        : [];
      const arrays = record ? Object.entries(record).filter(([, metricValue]) => Array.isArray(metricValue)) : [];

      return (
        <article key={section} className="manu-output-fact-card">
          <h3>{formatFactLabel(section)}</h3>

          {record ? (
            <>
              {metrics.length > 0 && (
                <div className="manu-output-mini-metrics">
                  {metrics.slice(0, 8).map(([metricKey, metricValue]) => (
                    <div key={`${section}-${metricKey}`} className="manu-output-mini-metric">
                      <span>{formatFactLabel(metricKey)}</span>
                      <strong>{formatFactValue(metricValue)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {arrays.length > 0 ? (
                arrays.slice(0, 2).map(([arrayKey, arrayValue]) => (
                  <div key={`${section}-${arrayKey}`} className="manu-output-array-section">
                    <p className="manu-output-array-title">{formatFactLabel(arrayKey)}</p>
                    {renderFactRows(arrayValue as unknown[], `${section}-${arrayKey}`)}
                  </div>
                ))
              ) : metrics.length === 0 ? (
                <p className="manu-output-muted">Structured details available for this section.</p>
              ) : null}
            </>
          ) : Array.isArray(value) ? (
            renderFactRows(value, section)
          ) : (
            <p className="manu-output-muted">{formatFactValue(value)}</p>
          )}
        </article>
      );
    })}
  </div>
);

const autonomyLabels: Record<AutonomyLevel, string> = {
  L0: 'Answer',
  L1: 'Guide',
  L2: 'Draft',
  L3: 'Confirm',
  L4: 'Approve',
  L5: 'Protect',
};

const roleLabel = (role?: string) => role?.replace(/_/g, ' ').toLowerCase() || 'user';

const getPageContext = (pathname: string): PageContext => {
  if (pathname.startsWith('/employees/')) {
    return {
      title: 'Employee profile',
      purpose: 'Employee lifecycle memory',
      summary: 'I can help review employee master data, documents, compensation history, reporting line, and lifecycle timeline.',
      pulse: 'Check data completeness before editing sensitive records.',
      risk: 'Salary, documents, exit, and history changes need confirmation and audit trail.',
      howTo: [
        'Review personal and professional data first.',
        'Check documents and compensation tabs for missing evidence.',
        'Use history only for verified lifecycle events.',
      ],
      prompts: [
        { label: 'Check profile gaps', prompt: 'What should I verify on this employee profile?', level: 'L0' },
        { label: 'Review documents', prompt: 'How should I review this employee document memory?', level: 'L1' },
        { label: 'Explain compensation', prompt: 'How should I review compensation and payslip history?', level: 'L0' },
      ],
    };
  }

  if (pathname.startsWith('/employees')) {
    return {
      title: 'Employee Register',
      purpose: 'Workforce master control',
      summary: 'I can help inspect active and exited employees, manager mapping, duplicate risk, missing fields, and ACV implementation readiness.',
      pulse: 'Employee master quality drives every workflow downstream.',
      risk: 'Avoid duplicates. Status, manager, department, designation, and joining dates should be verified before migration sign-off.',
      howTo: [
        'Filter active employees before operational checks.',
        'Validate manager relationships and employee codes.',
        'Open employee profiles to complete documents and salary history.',
      ],
      prompts: [
        { label: 'Find data gaps', prompt: 'What employee master data gaps should HR check first?', level: 'L0' },
        { label: 'Manager mapping', prompt: 'How do I validate reporting manager mapping?', level: 'L0' },
        { label: 'Open documents', prompt: 'Take me to the document library.', route: '/documents', level: 'L1' },
      ],
    };
  }

  if (pathname.startsWith('/attendance')) {
    return {
      title: 'Attendance',
      purpose: 'Daily presence control',
      summary: 'I can help check today attendance, missing punches, work-from status, date-range patterns, and regularisation requests.',
      pulse: 'Start with present, absent, WFH, off-site, and missing in/out time.',
      risk: 'Regularisation should not silently overwrite source attendance; it should remain traceable.',
      howTo: [
        'Use My Attendance for self-service checks.',
        'Use Company Attendance for HR/admin daily review.',
        'Use regularisation only when biometric or source data is incomplete.',
      ],
      prompts: [
        { label: 'Daily check', prompt: 'What should HR review in today attendance?', level: 'L0' },
        { label: 'Employee self-use', prompt: 'How should an employee use attendance daily?', level: 'L0' },
        { label: 'Regularisation', prompt: 'Explain attendance regularisation workflow.', level: 'L0' },
      ],
    };
  }

  if (pathname.startsWith('/leave')) {
    return {
      title: 'Leave Management',
      purpose: 'Leave eligibility and approvals',
      summary: 'I can help interpret balances, gender-specific eligibility, company leave view, manager approvals, and policy configuration.',
      pulse: 'Check eligible, taken, pending, and approval impact before acting.',
      risk: 'Maternity and paternity eligibility must respect employee gender and active policy rules.',
      howTo: [
        'Use My Leaves for employee register and request status.',
        'Use Company Leaves to inspect entitlement versus usage.',
        'Use Team Approvals only for manager-owned decisions.',
      ],
      prompts: [
        { label: 'Explain balance', prompt: 'Explain how leave balance should be interpreted.', level: 'L0' },
        { label: 'Gender rules', prompt: 'How do maternity and paternity leave rules apply?', level: 'L0' },
        { label: 'Approvals', prompt: 'What should a manager check before approving leave?', level: 'L0' },
      ],
    };
  }

  if (pathname.startsWith('/documents')) {
    return {
      title: 'Document Library',
      purpose: 'HR memory and evidence vault',
      summary: 'I can help separate employee documents, company vault records, generated letters, templates, and verification gaps.',
      pulse: 'Documents should be classified, previewable, downloadable, verified, and tenant-isolated.',
      risk: 'Identity, compensation, company compliance, and exit documents are sensitive. Access must follow role and tenant boundaries.',
      howTo: [
        'Use Company Vault for tenant-level statutory and policy memory.',
        'Use employee profiles for person-specific documents.',
        'Verify document category, date, status, expiry, and owner.',
      ],
      prompts: [
        { label: 'Document gaps', prompt: 'What documents should be checked for ACV readiness?', level: 'L0' },
        { label: 'Company vault', prompt: 'Explain company document vault governance.', level: 'L0' },
        { label: 'Open employees', prompt: 'Take me to the employee register.', route: '/employees', level: 'L1' },
      ],
    };
  }

  if (pathname.startsWith('/reports')) {
    return {
      title: 'HR Analytics',
      purpose: 'Conversational HR intelligence',
      summary: 'I can help choose a report perspective, validate source data, explain grouping, and convert views into useful HR evidence.',
      pulse: 'Analytics quality depends on clean employee, leave, attendance, salary, and document data.',
      risk: 'Do not treat incomplete migration data as final management truth.',
      howTo: [
        'Start with a business perspective.',
        'Confirm source rows and selected columns.',
        'Use charts only after grouping is valid.',
      ],
      prompts: [
        { label: 'Build report', prompt: 'What report should I build for implementation readiness?', level: 'L0' },
        { label: 'Data quality', prompt: 'How do I assess data completeness?', level: 'L0' },
        { label: 'Document coverage', prompt: 'Show document coverage thinking.', level: 'L0' },
      ],
    };
  }

  if (pathname.startsWith('/settings') || pathname.startsWith('/master-data')) {
    return {
      title: 'Configuration',
      purpose: 'Tenant rules and master setup',
      summary: 'I can help reason through masters, leave policies, roles, approval rules, organization settings, and tenant readiness.',
      pulse: 'Configuration changes affect downstream workflow behaviour.',
      risk: 'Changing active policy or role permissions should be deliberate and auditable.',
      howTo: [
        'Keep masters simple and non-duplicated.',
        'Confirm active policies before operational testing.',
        'Review roles and permissions before production rollout.',
      ],
      prompts: [
        { label: 'Policy setup', prompt: 'What should be configured before leave operations?', level: 'L0' },
        { label: 'Masters health', prompt: 'Which masters affect employee lifecycle quality?', level: 'L0' },
        { label: 'Tenant readiness', prompt: 'What tenant configuration should ACV verify?', level: 'L0' },
      ],
    };
  }

  return {
    title: 'HR workspace',
    purpose: 'People operations cockpit',
    summary: 'I can help with daily HR priorities, employee lifecycle, documents, leave, attendance, HR Connect, and analytics.',
    pulse: 'Start with overdue approvals, missing data, document gaps, and employee-impacting tasks.',
    risk: 'Sensitive people decisions require context, permission, and audit trail.',
    howTo: [
      'Open the relevant module before making a change.',
      'Use Manu for explanation, navigation, and safe drafts.',
      'Confirm sensitive actions before execution.',
    ],
    prompts: [
      { label: 'What needs attention?', prompt: 'What should HR review first today?', level: 'L0' },
      { label: 'Open employees', prompt: 'Take me to the employee register.', route: '/employees', level: 'L1' },
      { label: 'Open analytics', prompt: 'Take me to HR Analytics.', route: '/reports', level: 'L1' },
    ],
  };
};

const getStandardPromptGroups = (pathname: string, context: PageContext) => {
  const moduleQuestions: QuickPrompt[] = context.prompts.map((prompt) => ({ ...prompt, kind: 'question' }));
  const lowerTitle = context.title.toLowerCase();

  const howToPrompts: QuickPrompt[] = [
    {
      label: 'How do I use this screen?',
      prompt: `How do I use the ${context.title} screen step by step?`,
      level: 'L1',
      kind: 'howto',
    },
    {
      label: 'What is the right process?',
      prompt: `Explain the correct Aura process for ${lowerTitle}.`,
      level: 'L1',
      kind: 'howto',
    },
  ];

  const actionPrompts: QuickPrompt[] = [
    {
      label: 'What needs action?',
      prompt: `What action or decision is pending in ${context.title}?`,
      level: 'L0',
      kind: 'action',
    },
  ];

  if (pathname.startsWith('/employees')) {
    howToPrompts.push({
      label: 'Complete employee data',
      prompt: 'Guide me step by step to clean up employee master data.',
      level: 'L1',
      kind: 'howto',
    });
    actionPrompts.push({
      label: 'Prepare gap review',
      prompt: 'Prepare employee master gap review.',
      level: 'L2',
      kind: 'action',
    });
  } else if (pathname.startsWith('/attendance')) {
    howToPrompts.push({
      label: 'Regularise attendance',
      prompt: 'Guide me step by step to handle an attendance regularisation request.',
      level: 'L1',
      kind: 'howto',
    });
    actionPrompts.push({
      label: 'Check today attendance',
      prompt: 'What attendance action is needed today?',
      level: 'L0',
      kind: 'action',
    });
  } else if (pathname.startsWith('/leave')) {
    howToPrompts.push({
      label: 'Approve leave',
      prompt: 'Guide me step by step before approving or rejecting a leave request.',
      level: 'L1',
      kind: 'howto',
    });
    actionPrompts.push({
      label: 'Check leave risks',
      prompt: 'What leave action or risk should HR handle first?',
      level: 'L0',
      kind: 'action',
    });
  } else if (pathname.startsWith('/documents')) {
    howToPrompts.push({
      label: 'Verify a document',
      prompt: 'Guide me step by step to verify an employee or company document.',
      level: 'L1',
      kind: 'howto',
    });
    actionPrompts.push({
      label: 'Find missing evidence',
      prompt: 'What document verification action should HR take first?',
      level: 'L0',
      kind: 'action',
    });
  } else if (pathname.startsWith('/reports')) {
    howToPrompts.push({
      label: 'Build a report',
      prompt: 'Guide me step by step to build a useful HR analytics report.',
      level: 'L1',
      kind: 'howto',
    });
    actionPrompts.push({
      label: 'Recommend report',
      prompt: 'What HR analytics report should I generate first?',
      level: 'L0',
      kind: 'action',
    });
  }

  return [
    { title: 'Questions', description: 'Simple answers and module facts.', prompts: moduleQuestions.slice(0, 4) },
    { title: 'How to', description: 'Guided steps for Aura processes.', prompts: howToPrompts.slice(0, 3) },
    { title: 'Actions', description: 'Decision, flagging, approval, and completion checks.', prompts: actionPrompts.slice(0, 3) },
  ];
};

const classifyLevel = (input: string): AutonomyLevel => {
  const normalized = input.toLowerCase();
  if (/(block|violate|unsafe|risk|compliance|unauthori|unauthori)/.test(normalized)) return 'L5';
  if (/(salary change|terminate|termination|exit action|delete|role permission|approve salary)/.test(normalized)) return 'L4';
  if (/(send|update|assign|close|escalate|create task)/.test(normalized)) return 'L3';
  if (/(draft|prepare|write|summarise|summarize|letter|email)/.test(normalized)) return 'L2';
  if (/(take me|open|where|navigate|guide)/.test(normalized)) return 'L1';
  return 'L0';
};

const inferPromptKind = (input: string): PromptKind => {
  const normalized = input.toLowerCase();
  if (/(how do i|how to|guide me|step by step|right process|correct process|what is the process)/.test(normalized)) {
    return 'howto';
  }
  if (/(approve|reject|complete|flag|decision|action|mark|send|update|delete|regularise|regularize|close|escalate|execute)/.test(normalized)) {
    return 'action';
  }
  return 'question';
};

const buildResponse = (input: string, context: PageContext, userRole?: string, tenantName?: string) => {
  const normalized = input.toLowerCase();
  const role = roleLabel(userRole);
  const tenant = tenantName || 'this tenant';
  const level = classifyLevel(input);

  if (level === 'L4') {
    return {
      level,
      text: 'This is a high-impact HR action. I can explain the checks and prepare a draft, but execution needs explicit approval, correct role permission, reason capture, and audit trail.',
    };
  }

  if (level === 'L5') {
    return {
      level,
      text: 'I will protect the process here. If the action conflicts with policy, tenant access, missing approval, or incomplete evidence, it should be blocked or escalated to the authorised owner.',
    };
  }

  if (normalized.includes('take me') || normalized.includes('open') || normalized.includes('where')) {
    return {
      level: 'L1' as AutonomyLevel,
      text: 'I can guide navigation safely. If a quick action chip is available, I will open the correct module. I will not make record changes through navigation.',
    };
  }

  if (normalized.includes('document')) {
    return {
      level,
      text: `For ${tenant}, review document memory by separating employee documents, company vault records, generated HR letters, compensation evidence, and exit documents. Confirm category, owner, verification, expiry, and preview/download access.`,
    };
  }

  if (normalized.includes('leave')) {
    return {
      level,
      text: 'Leave review should check eligibility, taken days, pending approvals, policy source, and gender-specific rules. Maternity and paternity should be shown only where applicable and zeroed when gender does not match.',
    };
  }

  if (normalized.includes('attendance')) {
    return {
      level,
      text: 'Attendance review should start with today status, absent employees, missing in/out times, work-from status, and regularisation requests. Present records with missing work-from status should safely default to Office until corrected.',
    };
  }

  if (normalized.includes('salary') || normalized.includes('compensation') || normalized.includes('payslip')) {
    return {
      level,
      text: 'Compensation memory can store current structure, salary transaction history, payslip files, revision letters, and audit notes. It should not compute payroll, taxes, PF, ESI, TDS, or statutory filings in this scope.',
    };
  }

  if (normalized.includes('data') || normalized.includes('gap') || normalized.includes('quality') || normalized.includes('completeness')) {
    return {
      level,
      text: 'Data quality should be checked across completeness, accuracy, and coverage: employee master, manager mapping, lifecycle dates, documents, salary months, payslips, attendance coverage, leave balances, and verification status.',
    };
  }

  if (normalized.includes('draft') || normalized.includes('summary') || normalized.includes('email')) {
    return {
      level: 'L2' as AutonomyLevel,
      text: 'I can draft HR summaries, reminders, document requests, and report narratives. In this foundation version, drafts stay in the assistant until a later confirmed-send workflow is added.',
    };
  }

  return {
    level,
    text: `I am reading the ${context.title} context for a ${role}. ${context.pulse} I can answer, guide, draft, or flag risks, but writes and sensitive changes need confirmation.`,
  };
};

export default function ManuAssistant({ user, tenantName }: ManuAssistantProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [previewingProposalId, setPreviewingProposalId] = useState<string | null>(null);
  const [executingProposalId, setExecutingProposalId] = useState<string | null>(null);
  const [confirmationTexts, setConfirmationTexts] = useState<Record<string, string>>({});
  const [focusedOutput, setFocusedOutput] = useState<ManuFocusedOutput | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const promptGroups = useMemo(() => getStandardPromptGroups(location.pathname, pageContext), [location.pathname, pageContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isThinking, isOpen]);

  const resetConversation = () => {
    setMessages([]);
    setInput('');
    setIsThinking(false);
    setFocusedOutput(null);
    setPreviewingProposalId(null);
    setExecutingProposalId(null);
    setConfirmationTexts({});
  };

  const askManu = useCallback(async (prompt: string) => {
    try {
      const screen = collectManuScreenContext(location, pageContext.title);
      const response = await assistantService.ask({
        prompt,
        pathname: location.pathname,
        pageTitle: pageContext.title,
        context: {
          screen,
          conversation: messages.slice(-8).map((message) => ({
            role: message.role === 'manu' ? 'assistant' : 'user',
            content: message.text,
          })),
        },
      });

      return {
        level: response.autonomyLevel as AutonomyLevel,
        text: response.answer,
        insights: response.insights,
        suggestedActions: response.suggestedActions,
        actionProposals: response.actionProposals,
        data: response.data,
        guardrails: response.guardrails,
        answerKind: response.answerKind,
        outputMode: response.outputMode,
        citations: response.citations,
        draft: response.draft,
        intent: response.intent,
        answerPlan: response.answerPlan,
        presentation: response.presentation,
        source: 'backend' as const,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend assistant request failed.';
      const fallback = buildResponse(prompt, pageContext, user?.role, tenantName);
      return {
        ...fallback,
        source: 'local' as const,
        text: `Backend Manu intelligence is unavailable, so this is only the local screen guide. Error: ${message}. ${fallback.text}`,
        suggestedActions: [
          'Check that the backend is running and the frontend API URL points to the Aura backend.',
          'Do not treat this local fallback as a live data answer.',
        ],
        actionProposals: [],
        citations: [],
        draft: undefined,
        intent: {
          id: 'local_screen_fallback',
          description: 'Local screen guidance only.',
          confidence: 0,
          matchedBy: 'fallback' as const,
        },
        answerPlan: {
          questionType: 'general' as const,
          resolvedFrom: 'none' as const,
        },
        presentation: {
          density: 'standard' as const,
          showInsights: false,
          showSuggestions: true,
        },
        answerKind: 'simple_answer' as const,
        outputMode: 'tray' as const,
      };
    }
  }, [location, messages, pageContext, tenantName, user?.role]);

  const toAssistantMessage = (
    response: Awaited<ReturnType<typeof askManu>>,
    overrides?: Partial<AssistantMessage>
  ): AssistantMessage => ({
    id: `manu-${Date.now()}`,
    role: 'manu',
    text: response.text,
    level: response.level,
    insights: response.insights,
    suggestedActions: response.suggestedActions,
    actionProposals: response.actionProposals,
    data: response.data,
    guardrails: response.guardrails,
    citations: response.citations,
    draft: response.draft,
    intent: response.intent,
    answerKind: response.answerKind,
    outputMode: response.outputMode,
    answerPlan: response.answerPlan,
    presentation: response.presentation,
    source: response.source,
    ...overrides,
  });

  const shouldShowFocusedOutput = (message: AssistantMessage) => {
    if (message.outputMode === 'tray' || message.outputMode === 'guided_tour') return false;
    if (message.outputMode === 'focused_modal' || message.outputMode === 'confirmation_gate') return true;
    if (message.intentKind === 'howto') return false;
    return Boolean(message.confirmationPreview || message.executionResult?.artifact);
  };

  const runPrompt = async (quickPrompt: QuickPrompt) => {
    if (quickPrompt.route) {
      navigate(quickPrompt.route);
    }

    setIsThinking(true);
    const response = await askManu(quickPrompt.prompt);
    const userMessage: AssistantMessage = { id: `user-${Date.now()}`, role: 'user', text: quickPrompt.prompt, level: quickPrompt.level };
    const manuMessage = toAssistantMessage(response, { intentKind: quickPrompt.kind ?? 'question' });
    setMessages((current) => [
      ...current,
      userMessage,
      manuMessage,
    ]);
    if (shouldShowFocusedOutput(manuMessage)) openFocusedMessage(manuMessage);
    setIsOpen(true);
    setIsThinking(false);
  };

  const submitPrompt = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setIsThinking(true);
    const response = await askManu(trimmed);
    const userMessage: AssistantMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed, level: response.level };
    const manuMessage = toAssistantMessage(response, { intentKind: inferPromptKind(trimmed) });
    setMessages((current) => [
      ...current,
      userMessage,
      manuMessage,
    ]);
    setInput('');
    if (shouldShowFocusedOutput(manuMessage)) openFocusedMessage(manuMessage);
    setIsThinking(false);
  };

  const previewProposalConfirmation = async (
    proposal: NonNullable<AssistantMessage['actionProposals']>[number],
    sourcePrompt?: string
  ) => {
    setPreviewingProposalId(proposal.id);

    try {
      const preview = await assistantService.previewConfirmation({
        proposalId: proposal.id,
        prompt: sourcePrompt,
        pathname: location.pathname,
        pageTitle: pageContext.title,
      });

      setMessages((current) => [
        ...current,
        {
          id: `manu-confirm-${Date.now()}`,
          role: 'manu',
          text: preview.canProceedToControlledExecution
            ? 'I prepared the confirmation preview. Nothing has been executed. Review the checklist before any future controlled workflow is allowed.'
            : 'I prepared the confirmation preview and found blockers. Nothing has been executed.',
          level: preview.proposal.autonomyLevel,
          confirmationPreview: preview,
          suggestedActions: preview.blockingReasons.length
            ? preview.blockingReasons
            : ['Use this preview as the pre-flight checklist before any future execution workflow.'],
          source: 'backend',
        },
      ]);
      setIsOpen(true);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `manu-confirm-error-${Date.now()}`,
          role: 'manu',
          text: 'I could not prepare a confirmation preview for this proposal. No action was executed.',
          level: 'L5',
          suggestedActions: ['Check backend availability and proposal id before retrying.'],
          source: 'local',
        },
      ]);
    } finally {
      setPreviewingProposalId(null);
    }
  };

  const requestControlledExecution = async (preview: ManuConfirmationPreview) => {
    setExecutingProposalId(preview.proposal.id);

    try {
      const result = await assistantService.requestExecution({
        proposalId: preview.proposal.id,
        confirmationText: confirmationTexts[preview.proposal.id] || '',
        pathname: location.pathname,
        pageTitle: pageContext.title,
      });

      setMessages((current) => [
        ...current,
        {
          id: `manu-execution-${Date.now()}`,
          role: 'manu',
          text:
            result.executionState === 'completed_artifact_created'
              ? 'I created the controlled review artifact. No employee record was changed.'
              : 'I checked the controlled execution gate. The request is blocked by design, and no HR record was changed.',
          level: result.proposal.autonomyLevel,
          executionResult: result,
          data: result.artifact
            ? {
                artifact: result.artifact,
              }
            : undefined,
          guardrails: result.guardrails,
          suggestedActions:
            result.blockingReasons.length > 0
              ? result.blockingReasons
              : result.artifact?.recommendedNextSteps || [],
          source: 'backend',
        },
      ]);
      setIsOpen(true);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `manu-execution-error-${Date.now()}`,
          role: 'manu',
          text: 'I could not check the controlled execution gate. No action was executed.',
          level: 'L5',
          suggestedActions: ['Check backend availability and proposal id before retrying.'],
          source: 'local',
        },
      ]);
    } finally {
      setExecutingProposalId(null);
    }
  };

  const latestLevel = messages[messages.length - 1]?.level || 'L0';
  const hasFocusedContent = (message: AssistantMessage) =>
    Boolean(
      message.outputMode === 'focused_modal' ||
        message.outputMode === 'confirmation_gate' ||
        message.confirmationPreview ||
        message.executionResult?.artifact ||
        (message.answerKind === 'data_answer' && message.insights && message.insights.length > 2)
    );

  const openFocusedMessage = (message: AssistantMessage) => {
    setFocusedOutput({
      title: message.executionResult?.artifact?.title || message.confirmationPreview?.proposal.title || pageContext.title,
      subtitle:
        message.executionResult?.artifact
          ? 'Controlled Manu output'
          : message.confirmationPreview
            ? 'Confirmation preview'
            : 'Holistic HR context',
      message,
      artifact: message.executionResult?.artifact,
    });
  };

  return (
    <div className={`manu-assistant ${isOpen ? 'manu-assistant-open' : ''} ${isThinking ? 'manu-assistant-thinking' : ''}`}>
      {isOpen && (
        <section className="manu-panel" aria-label="Ask Manu assistant">
          <header className="manu-panel-header">
            <div className="manu-avatar-frame" aria-hidden="true">
              <span className="manu-avatar-halo" />
              <img src={MANU_AVATAR} alt="" className="manu-avatar" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-gray-950">Manu</p>
                <span className="manu-level-chip">{latestLevel} {autonomyLabels[latestLevel]}</span>
              </div>
              <p className="text-xs font-bold text-gray-500">HR Operations Angel</p>
              <p className="mt-1 text-[11px] font-semibold text-gray-500">
                {tenantName || 'Tenant'} · {roleLabel(user?.role)}
              </p>
            </div>
            <div className="manu-header-actions">
              <button
                type="button"
                className="manu-icon-button"
                onClick={resetConversation}
                aria-label="Start a new Manu conversation"
                title="New conversation"
                disabled={messages.length === 0 && !input && !focusedOutput}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="manu-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Ask Manu"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="manu-scroll-body">
            {messages.length === 0 && (
              <>
                <div className="manu-empty-state">
                  <p className="manu-kicker">{pageContext.title}</p>
                  <h3>How can I help?</h3>
                </div>

                <div className="manu-starter-prompts">
                  {promptGroups
                    .flatMap((group) => group.prompts)
                    .slice(0, 6)
                    .map((quickPrompt) => (
                      <button key={quickPrompt.label} type="button" onClick={() => runPrompt(quickPrompt)}>
                        {quickPrompt.label}
                      </button>
                    ))}
                </div>
              </>
            )}

            <div className="manu-messages">
              {messages.slice(-6).map((message) => (
                <div key={message.id} className={`manu-message ${message.role === 'user' ? 'manu-message-user' : ''}`}>
                  {message.role === 'manu' && <ChatBubbleLeftRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />}
                  <div>
                    {message.level && message.presentation?.density !== 'compact' && (
                      <p className="manu-message-level">{message.level} · {autonomyLabels[message.level]}</p>
                    )}
                    <p className={`manu-message-text ${message.presentation?.density === 'compact' ? 'manu-message-text-direct' : ''}`}>
                      {message.text}
                    </p>
                    {message.presentation?.factCard && (
                      <div className="manu-fact-card">
                        <div className="manu-fact-card-heading">
                          <strong>{message.presentation.factCard.title}</strong>
                          {message.presentation.factCard.subtitle && <span>{message.presentation.factCard.subtitle}</span>}
                        </div>
                        <dl>
                          {message.presentation.factCard.facts.map((fact) => (
                            <div key={`${message.id}-${fact.label}`}>
                              <dt>{fact.label}</dt>
                              <dd>{fact.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {message.citations && message.citations.length > 0 && (
                      <details className="manu-inline-sources">
                        <summary>
                          <BookOpenIcon className="h-3.5 w-3.5" />
                          {message.citations.length} source{message.citations.length === 1 ? '' : 's'}
                        </summary>
                        <div>
                          {message.citations.slice(0, 4).map((citation) => (
                            <p key={`${message.id}-${citation.id}`}>
                              <strong>{citation.title}</strong>
                              <span>{citation.section}</span>
                            </p>
                          ))}
                        </div>
                      </details>
                    )}
                    {message.presentation?.showInsights !== false && message.insights && message.insights.length > 0 && (
                      <div className="manu-insights">
                        {message.insights.slice(0, 4).map((insight) => (
                          <span key={`${message.id}-${insight.label}`} data-tone={insight.tone || 'neutral'}>
                            {insight.label}: <strong>{insight.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    {message.presentation?.showSuggestions !== false && message.suggestedActions && message.suggestedActions.length > 0 && (
                      <ul className="manu-actions">
                        {message.suggestedActions.slice(0, 2).map((action) => (
                          <li key={`${message.id}-${action}`}>{action}</li>
                        ))}
                      </ul>
                    )}
                    {hasFocusedContent(message) && (
                      <button type="button" className="manu-focus-output-button" onClick={() => openFocusedMessage(message)}>
                        Open focused output
                      </button>
                    )}
                    {message.presentation?.showSuggestions !== false && message.actionProposals && message.actionProposals.length > 0 && (
                      <div className="manu-proposals">
                        {message.actionProposals.slice(0, 2).map((proposal) => (
                          <article key={`${message.id}-${proposal.id}`} className="manu-proposal-card">
                            <div className="manu-proposal-topline">
                              <span>{proposal.autonomyLevel}</span>
                              <strong>{proposal.module}</strong>
                            </div>
                            <p className="manu-proposal-title">{proposal.title}</p>
                            <p className="manu-proposal-purpose">{proposal.purpose}</p>
                            <ol>
                              {proposal.steps.slice(0, 3).map((step) => (
                                <li key={`${proposal.id}-${step}`}>{step}</li>
                              ))}
                            </ol>
                            <p className="manu-proposal-guardrail">
                              {proposal.writesRecords ? 'Requires controlled execution' : 'Proposal only · no record changes'}
                            </p>
                            <button
                              type="button"
                              className="manu-proposal-preview-button"
                              onClick={() => previewProposalConfirmation(proposal, message.text)}
                              disabled={previewingProposalId === proposal.id}
                            >
                              {previewingProposalId === proposal.id ? 'Checking...' : 'Preview confirmation'}
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                    {message.confirmationPreview && (
                      <div className="manu-confirmation-preview">
                        <div className="manu-confirmation-topline">
                          <span>{message.confirmationPreview.proposal.autonomyLevel}</span>
                          <strong>{message.confirmationPreview.executionState.replace(/_/g, ' ')}</strong>
                        </div>
                        <p className="manu-confirmation-title">{message.confirmationPreview.proposal.title}</p>
                        <p className="manu-confirmation-scope">
                          Scope: {message.confirmationPreview.permissionScope} · Controlled execution:{' '}
                          {message.confirmationPreview.canProceedToControlledExecution ? 'available later' : 'blocked'}
                        </p>
                        {message.confirmationPreview.blockingReasons.length > 0 && (
                          <div className="manu-confirmation-blockers">
                            {message.confirmationPreview.blockingReasons.map((reason) => (
                              <span key={reason}>{reason}</span>
                            ))}
                          </div>
                        )}
                        <ol>
                          {message.confirmationPreview.confirmationChecklist.slice(0, 5).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                        <p className="manu-confirmation-note">{message.confirmationPreview.auditNote}</p>
                        <label className="manu-confirmation-input-label" htmlFor={`manu-confirm-${message.confirmationPreview.proposal.id}`}>
                          Type exact confirmation
                        </label>
                        <input
                          id={`manu-confirm-${message.confirmationPreview.proposal.id}`}
                          className="manu-confirmation-input"
                          value={confirmationTexts[message.confirmationPreview.proposal.id] || ''}
                          onChange={(event) =>
                            setConfirmationTexts((current) => ({
                              ...current,
                              [message.confirmationPreview!.proposal.id]: event.target.value,
                            }))
                          }
                          placeholder={message.confirmationPreview.requiredConfirmationText}
                        />
                        <button
                          type="button"
                          className="manu-execution-gate-button"
                          onClick={() => requestControlledExecution(message.confirmationPreview!)}
                          disabled={executingProposalId === message.confirmationPreview.proposal.id}
                        >
                          {executingProposalId === message.confirmationPreview.proposal.id
                            ? 'Checking execution gate...'
                            : 'Check execution gate'}
                        </button>
                      </div>
                    )}
                    {message.executionResult && (
                      <div className="manu-execution-result">
                        <div className="manu-execution-topline">
                          <span>{message.executionResult.proposal.autonomyLevel}</span>
                          <strong>{message.executionResult.executionState.replace(/_/g, ' ')}</strong>
                        </div>
                        <p className="manu-execution-title">{message.executionResult.proposal.title}</p>
                        <p className="manu-execution-scope">
                          Required confirmation: <strong>{message.executionResult.requiredConfirmationText}</strong>
                        </p>
                        <div className="manu-execution-blockers">
                          {message.executionResult.blockingReasons.slice(0, 4).map((reason) => (
                            <span key={reason}>{reason}</span>
                          ))}
                        </div>
                        <p className="manu-execution-note">{message.executionResult.auditNote}</p>
                        {message.executionResult.artifact && (
                          <div className="manu-artifact-card">
                            <div className="manu-artifact-topline">
                              <strong>{message.executionResult.artifact.title}</strong>
                              <span>{message.executionResult.artifact.rows.length} rows</span>
                            </div>
                            <div className="manu-artifact-summary">
                              {Object.entries(message.executionResult.artifact.summary).slice(0, 4).map(([key, value]) => (
                                <span key={key}>
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: <strong>{value}</strong>
                                </span>
                              ))}
                            </div>
                            {message.executionResult.artifact.rows.slice(0, 3).map((row) => (
                              <div key={String(row.employeeId)} className="manu-artifact-row">
                                <strong>{row.fullName}</strong>
                                <span>{Array.isArray(row.missingFields) ? row.missingFields.join(', ') : 'Needs review'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {message.source === 'local' && (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-amber-600">Local fallback</p>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="manu-message">
                  <ChatBubbleLeftRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <div>
                    <p className="manu-message-level">Thinking</p>
                    <p>Reading tenant-safe HR context...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className="manu-input-row" onSubmit={submitPrompt}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Manu about this screen, policy, workflow, or data..."
              disabled={isThinking}
            />
            <button type="submit" aria-label="Send message to Manu" disabled={isThinking}>
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`manu-launcher ${isOpen ? 'manu-launcher-open' : ''}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Ask Manu"
      >
        <span className="manu-launcher-orbit" />
        <span className="manu-launcher-avatar" aria-hidden="true">
          <img src={MANU_AVATAR} alt="" />
        </span>
        <span className="manu-launcher-copy text-left">
          <span className="block text-sm font-black leading-tight">Ask Manu</span>
          <span className="block text-[10px] font-semibold text-violet-100">HR assistant</span>
        </span>
      </button>

      {focusedOutput && (
        <div className="manu-output-overlay" role="dialog" aria-modal="true" aria-label={focusedOutput.title}>
          <section className="manu-output-modal">
            <header className="manu-output-header">
              <div className="manu-avatar-frame" aria-hidden="true">
                <span className="manu-avatar-halo" />
                <img src={MANU_AVATAR} alt="" className="manu-avatar" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="manu-kicker">Ask Manu · {focusedOutput.subtitle}</p>
                <h2>{focusedOutput.title}</h2>
                <p>Focused view for answers, structured HR facts, and controlled outputs.</p>
              </div>
              <button type="button" className="manu-icon-button" onClick={() => setFocusedOutput(null)} aria-label="Close Manu focused output">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <div className="manu-output-body">
              {focusedOutput.message && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span>Answer</span>
                  </div>
                  <p className="manu-output-answer whitespace-pre-wrap">{focusedOutput.message.text}</p>
                </section>
              )}

              {focusedOutput.message?.draft && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Draft review</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">Missing inputs</p>
                      <ul className="manu-output-guardrails">
                        {(focusedOutput.message.draft.missingInputs.length
                          ? focusedOutput.message.draft.missingInputs
                          : ['No required input gaps detected']
                        ).map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">Human review</p>
                      <ul className="manu-output-guardrails">
                        {focusedOutput.message.draft.reviewChecklist.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {focusedOutput.message?.citations && focusedOutput.message.citations.length > 0 && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <BookOpenIcon className="h-4 w-4" />
                    <span>Sources used</span>
                  </div>
                  <div className="space-y-3">
                    {focusedOutput.message.citations.map((citation) => (
                      <article key={citation.id} className="border-l-2 border-violet-300 pl-3">
                        <p className="text-sm font-black text-gray-900">{citation.title}</p>
                        <p className="text-xs font-bold text-violet-700">{citation.section}</p>
                        <p className="mt-1 text-sm text-gray-600">{citation.excerpt}</p>
                        {citation.sourcePath && <p className="mt-1 text-[11px] text-gray-400">{citation.sourcePath}</p>}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {focusedOutput.message?.insights && focusedOutput.message.insights.length > 0 && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Key signals</span>
                  </div>
                  <div className="manu-output-metric-grid">
                    {focusedOutput.message.insights.map((insight) => (
                      <div key={insight.label} className="manu-output-metric" data-tone={insight.tone || 'neutral'}>
                        <span>{insight.label}</span>
                        <strong>{insight.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {focusedOutput.message?.data && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Structured HR facts</span>
                  </div>
                  {renderStructuredFacts(focusedOutput.message.data)}
                </section>
              )}

              {focusedOutput.artifact && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                    <span>Generated artifact</span>
                  </div>
                  <div className="manu-output-metric-grid">
                    {Object.entries(focusedOutput.artifact.summary).map(([key, value]) => (
                      <div key={key} className="manu-output-metric">
                        <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="manu-output-table-wrap">
                    <table className="manu-output-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Status</th>
                          <th>Manager</th>
                          <th>Missing fields</th>
                        </tr>
                      </thead>
                      <tbody>
                        {focusedOutput.artifact.rows.map((row) => (
                          <tr key={String(row.employeeId)}>
                            <td>
                              <strong>{row.fullName}</strong>
                              <span>{row.employeeCode}</span>
                            </td>
                            <td>{row.status}</td>
                            <td>{row.manager || 'Not mapped'}</td>
                            <td>{Array.isArray(row.missingFields) ? row.missingFields.join(', ') : 'Needs review'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {focusedOutput.message?.guardrails && focusedOutput.message.guardrails.length > 0 && (
                <section className="manu-output-section">
                  <div className="manu-output-section-title">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>Guardrails</span>
                  </div>
                  <ul className="manu-output-guardrails">
                    {focusedOutput.message.guardrails.map((guardrail) => (
                      <li key={guardrail}>{guardrail}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
