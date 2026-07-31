import { api, API_PREFIX, loginAs, requireAuth, TEST_ACCOUNTS } from '../helpers/testSetup';

const attendanceCsv = [
  'employeeCode,date,status,checkIn,checkOut,workMinutes,location,notes',
  'QA/ACV/0004,2031-01-06,P,09:00,18:00,540,Office,Daily import',
  'QA/ACV/0004,2031-01-07,half day,09:00,13:00,240,WFH,Weekly import',
  'QA/ACV/0004,2031-01-31,weekend,,,,,Monthly import',
].join('\n');

const postImportFile = (
  path: '/attendance/import/preview' | '/attendance/import/commit',
  token: string,
  csv: string,
  conflictPolicy: 'skip' | 'overwrite' = 'skip'
) =>
  api
    .post(`${API_PREFIX}${path}`)
    .set('Authorization', `Bearer ${token}`)
    .field('conflictPolicy', conflictPolicy)
    .attach('file', Buffer.from(csv), {
      filename: 'attendance.csv',
      contentType: 'text/csv',
    });

describe('Attendance CSV import', () => {
  it('allows HR to preview one file spanning daily, weekly, and monthly dates', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const res = await postImportFile('/attendance/import/preview', ctx.token, attendanceCsv);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRows).toBe(3);
    expect(res.body.data.dateRange).toEqual({ from: '2031-01-06', to: '2031-01-31' });
    expect(res.body.data.summary).toMatchObject({ creates: 3, errors: 0, ready: 3 });
    expect(res.body.data.rows.map((row: any) => row.status)).toEqual(['present', 'half_day', 'weekend']);
  });

  it('reports row-level validation errors without changing attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);
    const invalidCsv = [
      'employeeCode,date,status',
      'UNKNOWN,31-01-2031,present',
      'QA/ACV/0004,2031-01-08,not-a-status',
    ].join('\n');

    const res = await postImportFile('/attendance/import/preview', ctx.token, invalidCsv);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.errors).toBe(2);
    expect(res.body.data.summary.ready).toBe(0);
    expect(res.body.data.rows[0].messages.join(' ')).toContain('not found');
    expect(res.body.data.rows[1].messages.join(' ')).toContain('not supported');
  });

  it('commits valid rows and recognizes the same file as unchanged', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    requireAuth(ctx, TEST_ACCOUNTS.HR_ADMIN.label);

    const commit = await postImportFile('/attendance/import/commit', ctx.token, attendanceCsv);
    expect(commit.status).toBe(200);
    expect(commit.body.data.imported).toBe(3);

    const secondPreview = await postImportFile('/attendance/import/preview', ctx.token, attendanceCsv);
    expect(secondPreview.status).toBe(200);
    expect(secondPreview.body.data.summary).toMatchObject({
      creates: 0,
      updates: 0,
      unchanged: 3,
      errors: 0,
      ready: 0,
    });
  });

  it('does not allow managers to import company attendance', async () => {
    const ctx = await loginAs(TEST_ACCOUNTS.MANAGER);
    requireAuth(ctx, TEST_ACCOUNTS.MANAGER.label);

    const res = await postImportFile('/attendance/import/preview', ctx.token, attendanceCsv);
    expect(res.status).toBe(403);
  });
});
