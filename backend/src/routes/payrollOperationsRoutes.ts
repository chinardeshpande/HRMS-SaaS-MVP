import { Request, Response, Router } from 'express';
import multer from 'multer';
import { UserRole } from '../../../shared/types';
import { authenticate, authorize } from '../middleware/auth';
import { PayrollCycleStatus } from '../models/PayrollCycle';
import payrollOperationsService, { PAYROLL_EXCHANGE_FORMAT } from '../services/payrollOperationsService';
import { config } from '../config/config';
import { storageProvider, streamStoredObject, tenantDocumentKey } from '../services/storage';

const router = Router();
const artifactUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'];
    if (allowed.includes(file.mimetype)) callback(null, true);
    else callback(new Error('Only CSV, Excel, and PDF payroll artifacts are allowed'));
  },
  limits: { fileSize: config.upload.maxSize },
});
router.use(authenticate, authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.PAYROLL_PARTNER));

const isPartner = (req: Request) => req.user!.role === UserRole.PAYROLL_PARTNER;
const requireInternalPayrollRole = (req: Request, res: Response) => {
  if (isPartner(req)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This action belongs to the HR payroll owner' } });
    return false;
  }
  return true;
};

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
  if (!requireInternalPayrollRole(req, res)) return;
  try {
    const data = await payrollOperationsService.createCycle(req.user!.tenantId, req.user!.userId, req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.post('/cycles/:cycleId/revisions', async (req, res) => {
  if (!requireInternalPayrollRole(req, res)) return;
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
    const partnerTargets = [PayrollCycleStatus.PARTNER_PROCESSING, PayrollCycleStatus.BANK_APPROVAL_PENDING];
    if (isPartner(req) && !partnerTargets.includes(target)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Payroll partners can only acknowledge processing and submit the bank-ready handoff' } });
    }
    if (!isPartner(req) && partnerTargets.includes(target)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'This milestone must be confirmed by the payroll partner' } });
    }
    const data = await payrollOperationsService.transitionCycle(
      req.user!.tenantId, req.params.cycleId, req.user!.userId, target, req.body
    );
    if (!data) return sendError(res, new Error('Payroll cycle not found'), 404);
    res.json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.post('/cycles/:cycleId/notes', async (req, res) => {
  try {
    const data = await payrollOperationsService.addCycleNote(
      req.user!.tenantId, req.params.cycleId, req.user!.userId, req.body.note, req.body.category
    );
    if (!data) return sendError(res, new Error('Payroll cycle not found'), 404);
    res.status(201).json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

router.post('/cycles/:cycleId/artifacts', artifactUpload.single('file') as any, async (req, res) => {
  let storageKey: string | null = null;
  try {
    if (!req.file) throw new Error('A payroll artifact is required');
    storageKey = tenantDocumentKey(req.user!.tenantId, `payroll/${req.params.cycleId}`, req.file.originalname);
    await storageProvider.put(storageKey, req.file.buffer, req.file.mimetype);
    const data = await payrollOperationsService.addCycleArtifact(req.user!.tenantId, req.params.cycleId, req.user!.userId, {
      storageKey, fileName: req.file.originalname, contentType: req.file.mimetype, fileSize: req.file.size,
    });
    if (!data) {
      await storageProvider.delete(storageKey);
      return sendError(res, new Error('Payroll cycle not found'), 404);
    }
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (storageKey) await storageProvider.delete(storageKey).catch(() => undefined);
    sendError(res, error);
  }
});

router.get('/cycles/:cycleId/artifacts/:eventId/download', async (req, res) => {
  try {
    const artifact = await payrollOperationsService.getCycleArtifact(req.user!.tenantId, req.params.cycleId, req.params.eventId);
    if (!artifact) return sendError(res, new Error('Payroll artifact not found'), 404);
    const details = artifact.details as Record<string, unknown>;
    await streamStoredObject(res, String(details.storageKey), String(details.fileName), String(details.contentType));
  } catch (error: any) {
    if (res.headersSent) return res.destroy(error);
    sendError(res, error, 500);
  }
});

router.get('/tax-statements', async (req, res) => {
  const financialYear = typeof req.query.financialYear === 'string' ? req.query.financialYear : undefined;
  res.json({ success: true, data: await payrollOperationsService.listTaxStatements(req.user!.tenantId, financialYear) });
});

router.put('/tax-statements', async (req, res) => {
  try {
    if (isPartner(req) && !['pending', 'received'].includes(String(req.body.status || 'pending'))) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Payroll partners can submit evidence; HR must verify and share it' } });
    }
    const data = await payrollOperationsService.upsertTaxStatement(req.user!.tenantId, req.user!.userId, req.body);
    res.json({ success: true, data });
  } catch (error: any) { sendError(res, error); }
});

export default router;
