import { TEST_ACCOUNTS, loginAs, authGet, authPost, requireAuth } from '../helpers/testSetup';

describe('Employee onboarding entry', () => {
  it('keeps complete onboarding as a candidate workflow by default', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);
    const suffix = Date.now().toString(36);
    const email = `onboarding.${suffix}@acv.test`;

    const createRes = await authPost('/onboarding/candidates', ctx.token).send({
      firstName: 'Onboarding',
      lastName: 'Candidate',
      email,
      phone: '7777777777',
      offeredSalary: 500000,
      expectedJoinDate: '2026-09-01',
      employmentType: 'full-time',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toEqual(expect.objectContaining({
      tenantId: ctx.tenantId,
      email,
      currentState: 'offer_approved',
    }));

    const candidateId = createRes.body.data.candidateId;
    const documentsRes = await authGet(`/onboarding/candidates/${candidateId}/documents`, ctx.token);
    expect(documentsRes.status).toBe(200);
    expect(documentsRes.body.data).toHaveLength(4);

    const employeesRes = await authGet('/employees', ctx.token);
    const employees = employeesRes.body.data?.employees || employeesRes.body.data || [];
    expect(employees.some((employee: { email: string }) => employee.email === email)).toBe(false);
  });
});
