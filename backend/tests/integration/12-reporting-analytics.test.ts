import { TEST_ACCOUNTS, authGet, authPost, loginAs, requireAuth } from '../helpers/testSetup';

const isoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const today = new Date();
const todayIso = isoDateOnly(today);
const yesterday = new Date(today);
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const yesterdayIso = isoDateOnly(yesterday);

describe('HR Analytics and Reporting Sanity', () => {
  describe('role visibility', () => {
    it('employee cannot access company reporting endpoints', async () => {
      const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
      requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);

      const reportEndpoints = [
        '/reports/headcount',
        '/reports/demographics',
        '/reports/lifecycle',
        `/reports/attendance-summary?startDate=${yesterdayIso}&endDate=${todayIso}`,
        '/reports/leave-balance',
        '/reports/memory-readiness',
      ];

      for (const endpoint of reportEndpoints) {
        const res = await authGet(endpoint, employee.token);
        expect(res.status).toBe(403);
      }
    });

    it('manager is blocked from HR-only analytics reports', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const restrictedEndpoints = [
        `/reports/attrition?startDate=2026-01-01&endDate=2026-12-31`,
        `/reports/joiners-leavers?startDate=2026-01-01&endDate=2026-12-31`,
        '/reports/missing-documents',
        '/reports/memory-readiness',
      ];

      for (const endpoint of restrictedEndpoints) {
        const res = await authGet(endpoint, manager.token);
        expect(res.status).toBe(403);
      }
    });
  });

  describe('tenant and manager scoping', () => {
    it('provides dedicated demographics and lifecycle reports with manager-scoped employee rows', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const demographics = await authGet('/reports/demographics', manager.token);
      const lifecycle = await authGet('/reports/lifecycle', manager.token);

      expect(demographics.status).toBe(200);
      expect(demographics.body.data.report).toBe('Workforce Demographics');
      expect(demographics.body.data.totalRecords).toBe(2);
      expect(demographics.body.data.results.every((row: any) => row.employeeName !== 'Anupama Bhat')).toBe(true);

      expect(lifecycle.status).toBe(200);
      expect(lifecycle.body.data.report).toBe('Employee Lifecycle Register');
      expect(lifecycle.body.data.totalRecords).toBe(2);
      expect(lifecycle.body.data.results.every((row: any) => row.lifecycleStage)).toBe(true);
    });

    it('headcount is tenant scoped for ACV and second tenant', async () => {
      const acv = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      const orbit = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
      requireAuth(acv, TEST_ACCOUNTS.HR_ADMIN.label);
      requireAuth(orbit, TEST_ACCOUNTS.SECOND_TENANT_ADMIN.label);

      const acvRes = await authGet('/reports/headcount', acv.token);
      const orbitRes = await authGet('/reports/headcount', orbit.token);

      expect(acvRes.status).toBe(200);
      expect(orbitRes.status).toBe(200);

      expect(acvRes.body.data.summary.totalHeadcount).toBe(4);
      expect(orbitRes.body.data.summary.totalHeadcount).toBe(2);

      const acvRows = acvRes.body.data.results;
      const orbitRows = orbitRes.body.data.results;
      expect(acvRows.some((row: any) => String(row.department).includes('Technology'))).toBe(true);
      expect(orbitRows.every((row: any) => !String(row.department).includes('HR Operations'))).toBe(true);
    });

    it('manager headcount is limited to manager plus direct reports', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const res = await authGet('/reports/headcount?status=active', manager.token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalHeadcount).toBe(2);
    });

    it('manager attendance summary is limited to manager plus direct reports', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const res = await authGet(
        `/reports/attendance-summary?startDate=${yesterdayIso}&endDate=${todayIso}`,
        manager.token
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRecords).toBe(2);

      const names = res.body.data.results.map((row: any) => row.employeeName);
      expect(names.some((name: string) => name.includes('Aniket'))).toBe(true);
      expect(names.some((name: string) => name.includes('Surekha'))).toBe(true);
      expect(names.some((name: string) => name.includes('Anupama'))).toBe(false);
      expect(names.some((name: string) => name.includes('Chinar'))).toBe(false);
    });
  });

  describe('core metric correctness and empty states', () => {
    it('missing-document report is restricted to active employees and exposes master-data gaps', async () => {
      const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);

      const res = await authGet('/reports/missing-documents', hr.token);
      expect(res.status).toBe(200);
      expect(res.body.data.results.every((row: any) => row.employeeStatus === undefined || row.employeeStatus === 'active')).toBe(true);
      expect(res.body.data.results.every((row: any) => Array.isArray(row.missingInformation))).toBe(true);
      expect(res.body.data.results.every((row: any) => Number(row.totalGapCount) === Number(row.informationGapCount) + Number(row.documentCount))).toBe(true);
    });

    it('leave balance respects gender-restricted leave eligibility', async () => {
      const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);

      const res = await authGet('/reports/leave-balance', hr.token);
      expect(res.status).toBe(200);

      const rows = res.body.data.results;
      const paternityForFemaleEmployee = rows.find(
        (row: any) => row.employeeName.includes('Surekha') && row.leaveType === 'Paternity Leave'
      );
      const maternityForFemaleEmployee = rows.find(
        (row: any) => row.employeeName.includes('Surekha') && row.leaveType === 'Maternity Leave'
      );

      expect(paternityForFemaleEmployee).toBeTruthy();
      expect(Number(paternityForFemaleEmployee.totalEntitlement)).toBe(0);
      expect(maternityForFemaleEmployee).toBeTruthy();
      expect(Number(maternityForFemaleEmployee.totalEntitlement)).toBeGreaterThan(0);
    });

    it('attendance summary returns an empty result, not a crash, when no rows match', async () => {
      const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);

      const res = await authGet('/reports/attendance-summary?startDate=1999-01-01&endDate=1999-01-31', hr.token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toEqual([]);
      expect(res.body.data.totalRecords).toBe(0);
    });

    it('memory readiness handles incomplete implementation data without crashing', async () => {
      const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);

      const res = await authGet('/reports/memory-readiness', hr.token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalEmployees).toBe(4);
      expect(Array.isArray(res.body.data.results)).toBe(true);
      expect(Array.isArray(res.body.data.companyDocumentFindings)).toBe(true);
    });
  });

  describe('saved reports guardrails', () => {
    it('manager cannot create a saved report for an HR-only report type', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const res = await authPost('/reports/saved', manager.token).send({
        reportName: 'Unsafe manager attrition report',
        category: 'exit',
        reportType: 'attrition',
        filterConfig: {
          dateRange: { startDate: '2026-01-01', endDate: '2026-12-31' },
        },
        outputFormat: 'json',
        isPublic: false,
      });

      expect(res.status).toBe(403);
    });

    it('manager can create and execute an allowed saved report without tenant leakage', async () => {
      const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
      requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);

      const create = await authPost('/reports/saved', manager.token).send({
        reportName: 'Manager team headcount',
        category: 'workforce',
        reportType: 'headcount',
        filterConfig: { status: ['active'] },
        outputFormat: 'json',
        isPublic: false,
      });

      expect(create.status).toBe(201);
      expect(create.body.success).toBe(true);

      const execute = await authPost(`/reports/saved/${create.body.data.reportId}/execute`, manager.token).send({});

      expect(execute.status).toBe(200);
      expect(execute.body.success).toBe(true);
      const total = execute.body.data.reduce((sum: number, row: any) => sum + Number(row.count), 0);
      expect(total).toBe(2);
    });
  });

  describe('semantic analytics endpoint', () => {
    it('answers a headcount query with tenant-scoped synthetic data', async () => {
      const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
      requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);

      const res = await authPost('/analytics/query', hr.token).send({
        question: 'What is the current headcount?',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.length).toBeGreaterThan(0);
      expect(res.body.data.metrics[0].metricName).toBe('headcount');
      expect(Number(res.body.data.metrics[0].value)).toBe(4);
    });
  });
});
