import { AppDataSource } from '../../src/config/database';
import { Employee } from '../../src/models/Employee';
import { PayrollCycleStatus } from '../../src/models/PayrollCycle';
import { api, API_PREFIX, authGet, authPost, authPut, loginAs, requireAuth, TEST_ACCOUNTS } from '../helpers/testSetup';

describe('External payroll partner operations', () => {
  it('publishes a versioned exchange contract without claiming payroll calculation', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(hr, 'HR admin');
    const res = await authGet('/payroll-operations/exchange-format', hr.token);
    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe('1.0');
    expect(res.body.data.boundary).toMatch(/does not calculate payroll/i);
  });

  it('runs review, owner approval, partner, bank and payslip milestones with history', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const owner = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    requireAuth(hr, 'HR admin');
    requireAuth(owner, 'Owner');

    const created = await authPost('/payroll-operations/cycles', hr.token).send({
      month: 8, year: 2026, partnerName: 'Synthetic Payroll Partner', employeeCount: 4,
      grossTotal: 400000, deductionTotal: 40000, netTotal: 360000,
    });
    expect(created.status).toBe(201);
    const cycleId = created.body.data.payrollCycleId;

    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.UNDER_REVIEW })).status).toBe(200);
    const deniedApproval = await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.APPROVED_FOR_PARTNER });
    expect(deniedApproval.status).toBe(403);
    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, owner.token)
      .send({ status: PayrollCycleStatus.APPROVED_FOR_PARTNER })).status).toBe(200);
    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.PARTNER_PROCESSING, partnerReference: 'PARTNER-SYNTHETIC-1' })).status).toBe(200);
    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.BANK_APPROVAL_PENDING })).status).toBe(200);
    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, owner.token)
      .send({ status: PayrollCycleStatus.PAID, bankReference: 'BANK-SYNTHETIC-1' })).status).toBe(200);
    expect((await authPost(`/payroll-operations/cycles/${cycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.PAYSLIPS_PUBLISHED, payslipSummary: { published: 4, pending: 0 } })).status).toBe(200);

    const detail = await authGet(`/payroll-operations/cycles/${cycleId}`, hr.token);
    expect(detail.status).toBe(200);
    expect(detail.body.data.cycle.status).toBe(PayrollCycleStatus.PAYSLIPS_PUBLISHED);
    expect(detail.body.data.timeline).toHaveLength(7);
    expect(detail.body.data.cycle.payslipSummary.published).toBe(4);
  });

  it('creates a controlled revision and compares a month with the previous month', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(hr, 'HR admin');
    const july = await authPost('/payroll-operations/cycles', hr.token).send({
      month: 7, year: 2026, partnerName: 'Synthetic Payroll Partner', employeeCount: 3,
      grossTotal: 300000, deductionTotal: 30000, netTotal: 270000,
    });
    expect(july.status).toBe(201);
    const august = (await authGet('/payroll-operations/cycles', hr.token)).body.data
      .find((cycle: any) => cycle.month === 8 && cycle.year === 2026);
    const detail = await authGet(`/payroll-operations/cycles/${august.payrollCycleId}`, hr.token);
    expect(detail.body.data.comparison.employeeCount.amount).toBe(1);
    expect(detail.body.data.comparison.netTotal.percent).toBeCloseTo(33.33, 2);

    const review = await authPost(`/payroll-operations/cycles/${july.body.data.payrollCycleId}/transitions`, hr.token)
      .send({ status: PayrollCycleStatus.UNDER_REVIEW });
    expect(review.status).toBe(200);
    const revision = await authPost(`/payroll-operations/cycles/${july.body.data.payrollCycleId}/revisions`, hr.token)
      .send({ note: 'Partner validation correction requested' });
    expect(revision.status).toBe(201);
    expect(revision.body.data.version).toBe(2);
    expect(revision.body.data.status).toBe(PayrollCycleStatus.DRAFT);
  });

  it('tracks annual statements and keeps cycles tenant and role isolated', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const otherTenant = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    requireAuth(hr, 'HR admin');
    requireAuth(employee, 'Employee');
    requireAuth(otherTenant, 'Other tenant owner');
    const target = await AppDataSource.getRepository(Employee).findOneByOrFail({ tenantId: hr.tenantId, email: TEST_ACCOUNTS.EMPLOYEE.email });

    const statement = await authPut('/payroll-operations/tax-statements', hr.token).send({
      employeeId: target.employeeId, financialYear: '2026-27', statementType: 'form16',
      status: 'received', partnerReference: 'FORM16-SYNTHETIC',
    });
    expect(statement.status).toBe(200);
    expect((await authGet('/payroll-operations/tax-statements?financialYear=2026-27', hr.token)).body.data).toHaveLength(1);
    expect((await authGet('/payroll-operations/cycles', otherTenant.token)).body.data).toHaveLength(0);

    const otherEmployee = await AppDataSource.getRepository(Employee).findOneByOrFail({ tenantId: otherTenant.tenantId });
    const crossTenantStatement = await authPut('/payroll-operations/tax-statements', hr.token).send({
      employeeId: otherEmployee.employeeId, financialYear: '2026-27', statementType: 'form16', status: 'received',
    });
    expect(crossTenantStatement.status).toBe(400);
    expect(crossTenantStatement.body.error.message).toMatch(/not found in this organization/i);

    const denied = await api.get(`${API_PREFIX}/payroll-operations/cycles`)
      .set('Authorization', `Bearer ${employee.token}`);
    expect(denied.status).toBe(403);
  });
});
