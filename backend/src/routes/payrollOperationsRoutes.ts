import { Request, Response, Router } from 'express';
import { UserRole } from '../../../shared/types';
import { authenticate, authorize } from '../middleware/auth';
import { PayrollCycleStatus } from '../models/PayrollCycle';
import payrollOperationsService, { PAYROLL_EXCHANGE_FORMAT } from '../services/payrollOperationsService';

const router = Router();
router.use(authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN));

const sendError = (res: Response, error: any, status = 400) => res.status(status).json({
  success: false,
  error: { code: status === 404 ? 'NOT_FOUND' : 'PAYROLL_OPERATIONS_ERROR', message: error.message },
});

router.get('/exchange-format', (_req, res) => res.json({ success: true, data: PAYROLL_EXCHANGE_FORMAT }));

router.get('/cycles', async (req, res) => {
  res.json({ success: true, data: await payrollOperationsService.listCycles(req.user!.tenantId) });
});

router.get('/cycles/:cycleId', async (req, res) => {
  const data = await payrollOperationsService.getCycle(req.user!.tenantId, req.params.cycleId);
  if (!data) return sendError(res, new Error('Payroll cycle not found'), 404);
  res.json({ success: true, data });
});

router.post('/cycles', async (req, res) => {
  try {
    const data = await payrollOperationsService.createCycle(req.user!.tenantId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.post('/cycles/:cycleId/revisions', async (req, res) => {
  try {
    const data = await payrollOperationsService.reviseCycle(req.user!.tenantId, req.params.cycleId, req.user!.userId, req.body.note);
    if (!data) return sendError(res, new Error('Payroll cycle not found'), 404);
    res.status(201).json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.post('/cycles/:cycleId/transitions', async (req: Request, res: Response) => {
  try {
    const target = req.body.status as PayrollCycleStatus;
    if (!Object.values(PayrollCycleStatus).includes(target)) throw new Error('A valid target status is required');
    if ([PayrollCycleStatus.APPROVED_FOR_PARTNER, PayrollCycleStatus.PAID, PayrollCycleStatus.CLOSED].includes(target)
      && req.user!.role !== UserRole.SYSTEM_ADMIN) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Owner approval is required for this payroll milestone' } });
    }
    const data = await payrollOperationsService.transitionCycle(
      req.user!.tenantId, req.params.cycleId, req.user!.userId, target, req.body
    );
    if (!data) return sendError(res, new Error('Payroll cycle not found'), 404);
    res.json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.get('/tax-statements', async (req, res) => {
  const financialYear = typeof req.query.financialYear === 'string' ? req.query.financialYear : undefined;
  res.json({ success: true, data: await payrollOperationsService.listTaxStatements(req.user!.tenantId, financialYear) });
});

router.put('/tax-statements', async (req, res) => {
  try {
    const data = await payrollOperationsService.upsertTaxStatement(req.user!.tenantId, req.user!.userId, req.body);
    res.json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

export default router;
