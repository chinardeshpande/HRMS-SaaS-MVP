import { LeaveStatus } from '../../src/models/LeaveRequest';
import { TEST_ACCOUNTS, loginAs, authGet, authPost, authPut, requireAuth } from '../helpers/testSetup';

const singleWorkingDay = '2026-12-15';

describe('Leave Basic Flow', () => {
  it('unauthenticated request to leave is rejected', async () => {
    const res = await authGet('/leave/my-requests', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('employee can view own leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/my-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view own leave balance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/my-balance', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee can view leave policies', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/policies', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('employee cannot view all leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(403);
  });

  it('employee cannot view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(403);
  });

  it('manager CAN view pending approvals', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);

    const res = await authGet('/leave/pending-approvals', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('manager can view complete leave history for their team', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('HR admin CAN view all leave requests', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await authGet('/leave/all-requests', ctx.token);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('leave apply rejects invalid payload', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authPost('/leave/apply', ctx.token).send({});
    expect([400, 422]).toContain(res.status);
  });

  it('employee can apply for leave and manager can approve it', async () => {
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

    const beforeBalance = await authGet('/leave/my-balance', employee.token);
    expect(beforeBalance.status).toBe(200);
    const sickBefore = beforeBalance.body.data.find((balance: any) => balance.leaveType === 'sick');
    expect(sickBefore).toBeTruthy();

    const apply = await authPost('/leave/apply', employee.token).send({
      leaveType: 'sick',
      startDate: singleWorkingDay,
      endDate: singleWorkingDay,
      reason: 'QA functional solidity leave approval path',
    });

    expect(apply.status).toBe(200);
    expect(apply.body.success).toBe(true);
    expect(apply.body.data.status).toBe(LeaveStatus.PENDING);
    expect(apply.body.data.numberOfDays).toBe(1);

    const pending = await authGet('/leave/pending-approvals', manager.token);
    expect(pending.status).toBe(200);
    expect(
      pending.body.data.some((request: any) => request.leaveId === apply.body.data.leaveId)
    ).toBe(true);

    const approve = await authPut(`/leave/${apply.body.data.leaveId}/approve`, manager.token).send({
      status: LeaveStatus.APPROVED,
      comments: 'QA approval',
    });

    expect(approve.status).toBe(200);
    expect(approve.body.success).toBe(true);
    expect(approve.body.data.status).toBe(LeaveStatus.APPROVED);

    const afterBalance = await authGet('/leave/my-balance', employee.token);
    expect(afterBalance.status).toBe(200);
    const sickAfter = afterBalance.body.data.find((balance: any) => balance.leaveType === 'sick');
    expect(Number(sickAfter.used)).toBe(Number(sickBefore.used) + 1);
    expect(Number(sickAfter.pending)).toBe(Number(sickBefore.pending));
  });

  it('employee can cancel their own pending leave and recover pending balance', async () => {
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

    const beforeBalance = await authGet('/leave/my-balance', employee.token);
    const casualBefore = beforeBalance.body.data.find((balance: any) => balance.leaveType === 'casual');

    const apply = await authPost('/leave/apply', employee.token).send({
      leaveType: 'casual',
      startDate: '2026-12-17',
      endDate: '2026-12-17',
      reason: 'QA pending cancellation path',
    });
    expect(apply.status).toBe(200);

    const unauthorizedCancel = await authPut(`/leave/${apply.body.data.leaveId}/cancel`, manager.token).send({});
    expect(unauthorizedCancel.status).toBe(400);

    const cancel = await authPut(`/leave/${apply.body.data.leaveId}/cancel`, employee.token).send({});
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe(LeaveStatus.CANCELLED);

    const afterBalance = await authGet('/leave/my-balance', employee.token);
    const casualAfter = afterBalance.body.data.find((balance: any) => balance.leaveType === 'casual');
    expect(Number(casualAfter.pending)).toBe(Number(casualBefore.pending));
  });

  it('rejected leave does not block a new request for the same date', async () => {
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

    const first = await authPost('/leave/apply', employee.token).send({
      leaveType: 'sick',
      startDate: '2026-12-18',
      endDate: '2026-12-18',
      reason: 'Initial request requiring correction',
    });
    expect(first.status).toBe(200);

    const reject = await authPut(`/leave/${first.body.data.leaveId}/approve`, manager.token).send({
      status: LeaveStatus.REJECTED,
      comments: 'Please use the correct leave category',
    });
    expect(reject.status).toBe(200);
    expect(reject.body.data.status).toBe(LeaveStatus.REJECTED);

    const managerHistory = await authGet('/leave/all-requests', manager.token);
    expect(managerHistory.status).toBe(200);
    expect(
      managerHistory.body.data.some(
        (request: any) => request.leaveId === first.body.data.leaveId && request.status === LeaveStatus.REJECTED
      )
    ).toBe(true);

    const reapplied = await authPost('/leave/apply', employee.token).send({
      leaveType: 'casual',
      startDate: '2026-12-18',
      endDate: '2026-12-18',
      reason: 'Corrected leave category',
    });
    expect(reapplied.status).toBe(200);
    expect(reapplied.body.data.status).toBe(LeaveStatus.PENDING);
    expect(reapplied.body.data.leaveId).not.toBe(first.body.data.leaveId);

    await authPut(`/leave/${reapplied.body.data.leaveId}/cancel`, employee.token).send({});
  });

  it('employee cannot apply for leave beyond available balance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authPost('/leave/apply', ctx.token).send({
      leaveType: 'sick',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      reason: 'QA insufficient balance check',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Insufficient leave balance');
  });

  it('gender-restricted leave types reject mismatched employees', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(ctx, TEST_ACCOUNTS.EMPLOYEE.label);

    const res = await authPost('/leave/apply', ctx.token).send({
      leaveType: 'paternity',
      startDate: '2026-10-05',
      endDate: '2026-10-05',
      reason: 'QA gender eligibility check',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Paternity leave is only applicable to male employees');
  });
});
