import { api } from '../helpers/testSetup';

describe('Health & Smoke', () => {
  it('GET /health returns 200 with status healthy', async () => {
    const res = await api.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api/v1 returns welcome message', async () => {
    const res = await api.get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toMatch(/HRMS/i);
  });

  it('GET /nonexistent returns 404', async () => {
    const res = await api.get('/api/v1/nonexistent-route');
    expect(res.status).toBe(404);
  });
});
