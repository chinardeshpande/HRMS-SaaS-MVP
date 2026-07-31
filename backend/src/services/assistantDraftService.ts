import { randomUUID } from 'crypto';
import { ManuDraftArtifact } from '../assistant/types';

interface DraftEmployee {
  employeeId: string;
  employeeCode?: string | null;
  fullName: string;
  department?: string | null;
  designation?: string | null;
  manager?: string | null;
  managerEmployeeId?: string | null;
  managerEmployeeCode?: string | null;
  managerDesignation?: string | null;
  workLocation?: string | null;
  dateOfJoining?: string | null;
}

interface DraftRequest {
  intentId: string;
  employee?: DraftEmployee;
  companyName: string;
  compensation?: {
    found?: boolean;
    annualCtc?: number;
    currency?: string;
    payFrequency?: string;
  };
  documentGaps?: string[];
}

const formatDate = (value?: string | null) => {
  if (!value) return '[joining date]';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

class AssistantDraftService {
  createDraft(request: DraftRequest): ManuDraftArtifact | null {
    if (!request.employee) return null;

    switch (request.intentId) {
      case 'draft_appointment_letter':
        return this.appointmentLetter(request);
      case 'draft_document_request':
        return this.documentRequest(request);
      case 'draft_attendance_clarification':
        return this.attendanceClarification(request);
      case 'draft_leave_note':
        return this.leaveNote(request);
      case 'draft_manager_email':
        return this.managerEmail(request);
      default:
        return null;
    }
  }

  private base(
    request: DraftRequest,
    type: ManuDraftArtifact['type'],
    title: string,
    content: string,
    missingInputs: string[],
    assumptions: string[],
    reviewChecklist: string[],
    subject?: string
  ): ManuDraftArtifact {
    return {
      draftId: randomUUID(),
      type,
      title,
      subject,
      content,
      employeeId: request.employee!.employeeId,
      employeeCode: request.employee!.employeeCode,
      employeeName: request.employee!.fullName,
      generatedAt: new Date().toISOString(),
      missingInputs,
      assumptions,
      reviewChecklist,
    };
  }

  private appointmentLetter(request: DraftRequest) {
    const employee = request.employee!;
    const missingInputs = [
      !employee.designation ? 'designation' : null,
      !employee.department ? 'department' : null,
      !employee.workLocation ? 'work location' : null,
      !employee.dateOfJoining ? 'date of joining' : null,
      !request.compensation?.found ? 'approved compensation terms' : null,
    ].filter(Boolean) as string[];
    const compensation = request.compensation?.found
      ? `${request.compensation.currency || 'INR'} ${Number(request.compensation.annualCtc || 0).toLocaleString('en-IN')} per annum`
      : '[approved annual compensation]';

    const content = [
      `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      '',
      `To,`,
      employee.fullName,
      `Employee Code: ${employee.employeeCode || '[employee code]'}`,
      '',
      `Subject: Appointment as ${employee.designation || '[designation]'}`,
      '',
      `Dear ${employee.fullName},`,
      '',
      `We are pleased to appoint you as ${employee.designation || '[designation]'} in the ${employee.department || '[department]'} department of ${request.companyName}, effective ${formatDate(employee.dateOfJoining)}.`,
      '',
      `Your current work location will be ${employee.workLocation || '[work location]'}. Your annual compensation will be ${compensation}, subject to the approved salary structure and applicable company policies.`,
      '',
      'Your employment will be governed by the confidentiality, conduct, leave, attendance, information-security, and other policies applicable to your role. Detailed terms, probation conditions, notice period, benefits, and statutory clauses must be inserted from the approved company template before issue.',
      '',
      'Please sign and return the final approved copy as acceptance of the terms of appointment.',
      '',
      `For ${request.companyName}`,
      '[Authorized Signatory]',
    ].join('\n');

    return this.base(
      request,
      'appointment_letter',
      `Appointment Letter - ${employee.fullName}`,
      content,
      missingInputs,
      ['This is a review draft and has not been issued, saved, or sent.'],
      [
        'Confirm designation, department, joining date, and work location.',
        'Confirm approved compensation and salary structure.',
        'Insert approved probation, notice, benefits, statutory, and policy clauses.',
        'Obtain authorized HR/signatory approval before issue.',
      ]
    );
  }

  private documentRequest(request: DraftRequest) {
    const employee = request.employee!;
    const gaps = request.documentGaps?.length
      ? request.documentGaps
      : ['identity proof', 'address proof', 'education evidence', 'employment letter evidence'];
    const subject = `Pending HR documents - ${employee.employeeCode || employee.fullName}`;
    const content = [
      `Subject: ${subject}`,
      '',
      `Dear ${employee.fullName},`,
      '',
      'As part of completing your AuroraHR employee record, please share clear and current copies of the following:',
      ...gaps.map((gap) => `- ${gap}`),
      '',
      'Please use the approved secure HR document channel. Do not send passwords, banking credentials, or unrelated sensitive information.',
      '',
      'Once received, HR will classify and verify each document before updating its status.',
      '',
      `Regards,`,
      `${request.companyName} HR`,
    ].join('\n');

    return this.base(
      request,
      'document_request_email',
      `Document Request - ${employee.fullName}`,
      content,
      [],
      ['The listed gaps come from the currently visible document-memory check.'],
      [
        'Confirm each requested document is genuinely missing.',
        'Remove any document that is not required by ACV policy.',
        'Use only the approved secure submission channel.',
      ],
      subject
    );
  }

  private attendanceClarification(request: DraftRequest) {
    const employee = request.employee!;
    const subject = `Attendance clarification required - ${employee.employeeCode || employee.fullName}`;
    const content = [
      `Subject: ${subject}`,
      '',
      `Dear ${employee.fullName},`,
      '',
      'AuroraHR shows an attendance item that needs clarification for [date/date range]. Please confirm the correct check-in, check-out, and work location, and provide the supporting reason or evidence where applicable.',
      '',
      'This request does not change the source attendance record. HR will review your response through the regularisation workflow and retain the audit trail.',
      '',
      `Regards,`,
      `${request.companyName} HR`,
    ].join('\n');

    return this.base(
      request,
      'attendance_clarification',
      `Attendance Clarification - ${employee.fullName}`,
      content,
      ['attendance date or date range', 'specific missing or conflicting attendance fields'],
      ['No attendance record has been changed.'],
      [
        'Insert the exact date and discrepancy.',
        'Check biometric/imported source data before sending.',
        'Process any correction through attendance regularisation.',
      ],
      subject
    );
  }

  private leaveNote(request: DraftRequest) {
    const employee = request.employee!;
    const content = [
      `Employee: ${employee.fullName} (${employee.employeeCode || 'employee code not set'})`,
      'Leave request: [leave type and dates]',
      'Current balance: [verified balance]',
      'Overlap/team impact: [review]',
      'Policy eligibility: [verified policy and gender-specific rule where applicable]',
      'Recommendation: [approve / reject / seek clarification]',
      'Reason: [manager or HR rationale]',
      '',
      'This is a decision-support note only. The approver must take the final action in the Leave module so authority, comments, and audit history are retained.',
    ].join('\n');

    return this.base(
      request,
      'leave_note',
      `Leave Review Note - ${employee.fullName}`,
      content,
      ['leave request identifier', 'leave dates and type', 'verified balance', 'approver rationale'],
      ['No leave request has been approved or rejected.'],
      [
        'Verify approver authority.',
        'Check balance, overlap, dates, policy eligibility, and supporting reason.',
        'Record the decision in the Leave module.',
      ]
    );
  }

  private managerEmail(request: DraftRequest) {
    const employee = request.employee!;
    if (!employee.manager) return null;

    const subject = `Regarding ${employee.fullName} (${employee.employeeCode || 'employee'})`;
    const content = [
      `Subject: ${subject}`,
      '',
      `Dear ${employee.manager},`,
      '',
      `I am writing regarding ${employee.fullName}${employee.designation ? `, ${employee.designation}` : ''}.`,
      '',
      '[Add the purpose, relevant facts, requested response, and due date here.]',
      '',
      'Please let me know if any additional context is required.',
      '',
      'Regards,',
      `${request.companyName} HR`,
    ].join('\n');

    return this.base(
      {
        ...request,
        employee: {
          employeeId: employee.managerEmployeeId || employee.employeeId,
          employeeCode: employee.managerEmployeeCode,
          fullName: employee.manager,
          designation: employee.managerDesignation,
        },
      },
      'manager_email',
      `Email to ${employee.manager}`,
      content,
      ['email purpose', 'relevant facts or request', 'response due date if applicable'],
      [`${employee.manager} is the reporting manager stored on ${employee.fullName}'s employee record.`],
      [
        'Confirm the reporting relationship is current.',
        'Add only the minimum necessary employee information.',
        'Review tone, facts, recipients, and attachments before sending.',
      ],
      subject
    );
  }
}

export const assistantDraftService = new AssistantDraftService();
export default assistantDraftService;
