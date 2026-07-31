import assistantDraftService from '../../src/services/assistantDraftService';

const employee = {
  employeeId: 'employee-1',
  employeeCode: 'ACV/EMP/0012',
  fullName: 'Pooja Gaud',
  department: 'IT',
  designation: 'Software Developer',
  workLocation: 'Mumbai',
  dateOfJoining: '2025-01-02',
  manager: 'Anupama Bhat',
  managerEmployeeId: 'manager-1',
  managerEmployeeCode: 'ACV/EMP/0001',
  managerDesignation: 'Director HR',
};

describe('Manu draft service', () => {
  it('creates a substantive appointment letter with review controls', () => {
    const draft = assistantDraftService.createDraft({
      intentId: 'draft_appointment_letter',
      employee,
      companyName: 'ACV Solutions',
      compensation: {
        found: true,
        annualCtc: 720000,
        currency: 'INR',
        payFrequency: 'monthly',
      },
    });

    expect(draft?.type).toBe('appointment_letter');
    expect(draft?.content).toContain('Pooja Gaud');
    expect(draft?.content).toContain('Software Developer');
    expect(draft?.content).toContain('INR 7,20,000');
    expect(draft?.reviewChecklist.length).toBeGreaterThanOrEqual(3);
    expect(draft?.assumptions).toContain('This is a review draft and has not been issued, saved, or sent.');
  });

  it('surfaces missing appointment-letter inputs instead of inventing them', () => {
    const draft = assistantDraftService.createDraft({
      intentId: 'draft_appointment_letter',
      employee: {
        ...employee,
        designation: null,
        workLocation: null,
      },
      companyName: 'ACV Solutions',
    });

    expect(draft?.missingInputs).toEqual(
      expect.arrayContaining(['designation', 'work location', 'approved compensation terms'])
    );
    expect(draft?.content).toContain('[designation]');
  });

  it('creates document, attendance, and leave drafts without mutating records', () => {
    const intents = [
      'draft_document_request',
      'draft_attendance_clarification',
      'draft_leave_note',
    ];
    const drafts = intents.map((intentId) =>
      assistantDraftService.createDraft({ intentId, employee, companyName: 'ACV Solutions' })
    );

    expect(drafts.map((draft) => draft?.type)).toEqual([
      'document_request_email',
      'attendance_clarification',
      'leave_note',
    ]);
    expect(drafts.every((draft) => draft?.content.length && draft.content.length > 200)).toBe(true);
  });

  it('creates a manager-addressed email draft from the reporting relationship', () => {
    const draft = assistantDraftService.createDraft({
      intentId: 'draft_manager_email',
      employee,
      companyName: 'ACV Solutions',
    });

    expect(draft?.type).toBe('manager_email');
    expect(draft?.title).toBe('Email to Anupama Bhat');
    expect(draft?.content).toContain('Dear Anupama Bhat');
    expect(draft?.content).toContain('regarding Pooja Gaud');
    expect(draft?.missingInputs).toContain('email purpose');
  });

  it('refuses a manager email draft when no reporting manager is recorded', () => {
    const draft = assistantDraftService.createDraft({
      intentId: 'draft_manager_email',
      employee: { ...employee, manager: null },
      companyName: 'ACV Solutions',
    });

    expect(draft).toBeNull();
  });
});
