import { AppDataSource } from '../../src/config/database';
import { Employee } from '../../src/models/Employee';
import { User } from '../../src/models/User';
import assistantKnowledgeService from '../../src/services/assistantKnowledgeService';
import identityMappingService from '../../src/services/identityMappingService';
import { EmploymentStatus, UserRole } from '../../../shared/types';
import {
  api,
  API_PREFIX,
  TEST_ACCOUNTS,
  authGet,
  authPost,
  loginAs,
  requireAuth,
} from '../helpers/testSetup';
import { TEST_PASSWORD } from '../setup/seedTestData';

describe('Manu conversational intelligence', () => {
  it('requires authentication', async () => {
    const response = await api.post(`${API_PREFIX}/assistant/ask`).send({ prompt: 'Hello Manu' });
    expect(response.status).toBe(401);
  });

  it('returns a typed intent, screen-aware answer, and application citations', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'What can I do on this screen?',
      context: {
        screen: {
          pathname: '/documents',
          pageTitle: 'Document Library',
          activeTab: 'Company Vault',
          visibleSections: ['Company Document Vault'],
          visibleColumns: ['Document', 'Category', 'Verification'],
        },
        conversation: [{ role: 'user', content: 'We are reviewing ACV readiness.' }],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.intent.id).toBe('application_help');
    expect(response.body.data.citations.length).toBeGreaterThan(0);
    expect(response.body.data.citations[0].sourceType).toBe('application');
    expect(response.body.data.data.knowledge.screen.activeTab).toBe('Company Vault');
  });

  it('retrieves cited ACV implementation knowledge only for the ACV tenant', async () => {
    const acv = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    const orbit = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    requireAuth(acv, 'ACV admin');
    requireAuth(orbit, 'Orbit admin');

    const acvResponse = await authPost('/assistant/ask', acv.token).send({
      prompt: 'What does the ACV readiness cockpit say about active employees and blockers?',
      context: { screen: { pathname: '/acv-readiness', pageTitle: 'ACV Readiness' } },
    });
    const orbitResponse = await authPost('/assistant/ask', orbit.token).send({
      prompt: 'What does the ACV readiness cockpit say about active employees and blockers?',
    });

    expect(acvResponse.status).toBe(200);
    expect(acvResponse.body.data.citations.some((item: any) => item.sourceType === 'acv_document')).toBe(true);
    expect(orbitResponse.status).toBe(200);
    expect(orbitResponse.body.data.citations.some((item: any) => item.sourceType === 'acv_document')).toBe(false);
  });

  it('creates a real appointment-letter draft for an exact employee code', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Draft an appointment letter for QA/ACV/0004',
      context: { screen: { pathname: '/employees', pageTitle: 'Employee Register' } },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.intent.id).toBe('draft_appointment_letter');
    expect(response.body.data.answerKind).toBe('draft');
    expect(response.body.data.draft.type).toBe('appointment_letter');
    expect(response.body.data.draft.employeeCode).toBe('QA/ACV/0004');
    expect(response.body.data.answer).toContain('Surekha Employee');
    expect(response.body.data.draft.reviewChecklist.length).toBeGreaterThan(2);
  });

  it('does not draft for an unresolved employee', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Draft an appointment letter for Unknown Person',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.draft).toBeUndefined();
    expect(response.body.data.answer).toMatch(/exact employee code|exact full name/i);
  });

  it('blocks compensation exposure for employee role', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, 'Employee');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Show salary and compensation for QA/ACV/0004',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answerKind).toBe('refusal');
    expect(response.body.data.data.compensationMemory).toBeUndefined();
    expect(response.body.data.answer).toMatch(/outside the permissions/i);
  });

  it('classifies bulk leave approval as high impact and refuses execution', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Approve all leave requests',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.intent.id).toBe('bulk_approval_action');
    expect(response.body.data.autonomyLevel).toBe('L4');
    expect(response.body.data.answerKind).toBe('refusal');
  });

  it('answers a reporting-line question directly with manager designation', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Who does Surekha report to?',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toBe('Surekha Employee reports to Aniket Manager, Technical Lead.');
    expect(response.body.data.answerPlan).toMatchObject({
      questionType: 'reporting_manager',
      subjectEmployeeName: 'Surekha Employee',
      resolvedFrom: 'current_prompt',
    });
    expect(response.body.data.outputMode).toBe('tray');
    expect(response.body.data.answerKind).toBe('simple_answer');
    expect(response.body.data.presentation).toMatchObject({
      density: 'compact',
      showInsights: false,
      showSuggestions: false,
    });
  });

  it('answers employee field questions with only the requested fact', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const cases = [
      ['What is Surekha’s designation?', 'Surekha Employee is Software Engineer.', 'designation'],
      ['Which department is Surekha in?', 'Surekha Employee works in the Technology department.', 'department'],
      ['When did Surekha join?', 'Surekha Employee joined on 1 June 2024.', 'joining_date'],
    ];

    for (const [prompt, answer, questionType] of cases) {
      const response = await authPost('/assistant/ask', ctx.token).send({ prompt });
      expect(response.status).toBe(200);
      expect(response.body.data.answer).toBe(answer);
      expect(response.body.data.answerPlan.questionType).toBe(questionType);
      expect(response.body.data.answer).not.toMatch(/missing core|visible employees|read-only foundation/i);
    }
  });

  it('carries the employee subject into pronoun follow-ups', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const conversation = [
      { role: 'user', content: 'Who does Surekha report to?' },
      { role: 'assistant', content: 'Surekha Employee reports to Aniket Manager, Technical Lead.' },
    ];
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'What is her designation?',
      context: { conversation },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toBe('Surekha Employee is Software Engineer.');
    expect(response.body.data.answerPlan.resolvedFrom).toBe('conversation');
  });

  it('lets a new explicit employee name replace the previous conversational subject', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'What is Surekha’s salary?',
      context: {
        conversation: [
          { role: 'user', content: 'Who does Aniket report to?' },
          { role: 'assistant', content: 'Aniket Manager reports to Anupama Bhat.' },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answerPlan).toMatchObject({
      questionType: 'employee_compensation',
      subjectEmployeeName: 'Surekha Employee',
      resolvedFrom: 'current_prompt',
    });
    expect(response.body.data.answer).toMatch(/^Surekha Employee’s annual CTC is /);
    expect(response.body.data.answer).not.toContain('Aniket Manager');
  });

  it('does not reuse the previous employee when a new explicit name is unresolved', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'What is Lopamudraa’s salary?',
      context: {
        conversation: [
          { role: 'user', content: 'Who does Aniket report to?' },
          { role: 'assistant', content: 'Aniket Manager reports to Anupama Bhat.' },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answerPlan).toMatchObject({
      questionType: 'employee_compensation',
      resolvedFrom: 'none',
    });
    expect(response.body.data.answer).toMatch(/could not identify the employee/i);
    expect(response.body.data.answer).not.toContain('Aniket Manager');
    expect(response.body.data.data.namedCompensation).toBeUndefined();
  });

  it('lists direct reports through the employee relationship graph', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Who reports to Aniket?',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toBe(
      '1 employee reports directly to Aniket Manager: Surekha Employee, Software Engineer.'
    );
    expect(response.body.data.answerPlan.questionType).toBe('direct_reports');
  });

  it('uses selected-screen employee context when the prompt omits a name', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const employee = await AppDataSource.getRepository(Employee).findOneByOrFail({
      tenantId: ctx.tenantId,
      employeeCode: 'QA/ACV/0004',
    });
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Who is the reporting manager?',
      context: {
        screen: {
          pathname: `/employees/${employee.employeeId}`,
          pageTitle: 'Employee Profile',
          selectedEntity: {
            type: 'employee',
            id: employee.employeeId,
            label: 'Surekha Employee',
          },
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toBe('Surekha Employee reports to Aniket Manager, Technical Lead.');
    expect(response.body.data.answerPlan.resolvedFrom).toBe('screen');
  });

  it('drafts an email to the remembered employee’s manager', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const response = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Draft an email to her manager',
      context: {
        conversation: [
          { role: 'user', content: 'Show me Surekha’s profile' },
          { role: 'assistant', content: 'Surekha Employee is a Software Engineer.' },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.intent.id).toBe('draft_manager_email');
    expect(response.body.data.draft.type).toBe('manager_email');
    expect(response.body.data.draft.title).toBe('Email to Aniket Manager');
    expect(response.body.data.answer).toContain('Dear Aniket Manager');
    expect(response.body.data.outputMode).toBe('focused_modal');
    expect(response.body.data.presentation.density).toBe('workspace');
  });

  it('answers named leave and document questions from employee-specific records', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, 'HR admin');
    const leave = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'What is Surekha’s leave balance?',
    });
    const documents = await authPost('/assistant/ask', ctx.token).send({
      prompt: 'Which documents does Surekha have?',
    });

    expect(leave.status).toBe(200);
    expect(leave.body.data.answer).toMatch(/^Surekha Employee’s \d{4} leave balance is /);
    expect(leave.body.data.answer).toMatch(/available/);
    expect(documents.status).toBe(200);
    expect(documents.body.data.answer).toMatch(/^Surekha Employee has \d+ employee document/);
    expect(documents.body.data.answer).toMatch(/verified|unverified/i);
  });

  it('exposes identity mapping diagnostics only to system admin', async () => {
    const owner = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(owner, 'Owner');
    requireAuth(employee, 'Employee');

    const allowed = await authGet('/settings/identity-mappings', owner.token);
    const denied = await authGet('/settings/identity-mappings', employee.token);

    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body.data.mappings)).toBe(true);
    expect(denied.status).toBe(403);
  });
});

describe('Identity mapping safety', () => {
  let employeeId = '';
  let userId = '';

  afterAll(async () => {
    if (userId) await AppDataSource.getRepository(User).delete({ userId });
    if (employeeId) await AppDataSource.getRepository(Employee).delete({ employeeId });
  });

  it('auto-links only a unique exact email match inside the tenant', async () => {
    const admin = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    requireAuth(admin, 'Owner');
    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);
    const email = 'manu.identity.qa@acv.test';

    const employee = await employeeRepo.save(employeeRepo.create({
      tenantId: admin.tenantId,
      employeeCode: 'QA/ACV/MANU-ID',
      firstName: 'Manu',
      lastName: 'Identity QA',
      email,
      dateOfJoining: new Date('2026-01-01'),
      status: EmploymentStatus.ACTIVE,
    }));
    employeeId = employee.employeeId;

    const user = userRepo.create({
      tenantId: admin.tenantId,
      email,
      fullName: 'Manu Identity QA',
      role: UserRole.EMPLOYEE,
      isActive: true,
    });
    user.password = TEST_PASSWORD;
    const saved = await userRepo.save(user);
    userId = saved.userId;

    const result = await identityMappingService.resolveUser(saved, true);
    const reloaded = await userRepo.findOneByOrFail({ userId: saved.userId });

    expect(result.status).toBe('auto_linked');
    expect(result.employeeId).toBe(employee.employeeId);
    expect(reloaded.employeeId).toBe(employee.employeeId);
  });

  it('does not expose ACV document chunks through direct retrieval for another tenant', async () => {
    const orbit = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    requireAuth(orbit, 'Orbit owner');
    assistantKnowledgeService.resetCache();
    const citations = await assistantKnowledgeService.retrieve({
      tenantId: orbit.tenantId,
      role: UserRole.SYSTEM_ADMIN,
      query: 'ACV blockers readiness validation',
      includeAcvDocuments: true,
    });

    expect(citations.some((citation) => citation.sourceType === 'acv_document')).toBe(false);
  });
});
