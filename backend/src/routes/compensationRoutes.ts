import { Router, Request, Response } from 'express';
import multer from 'multer';
import compensationService from '../services/compensationService';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import { SalaryApprovalStatus, SalaryStructureStatus } from '../models/SalaryStructure';
import { SalaryComponentType } from '../models/SalaryComponent';
import { PayslipStatus } from '../models/Payslip';
import { CompensationShareChannel } from '../models/CompensationShareLog';
import auditService from '../services/auditService';
import { config } from '../config/config';
import { storageProvider, tenantDocumentKey } from '../services/storage';

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image payslip files are allowed.'));
    }
  },
  limits: { fileSize: config.upload.maxSize },
});

const hrOnly = authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);

const isHrUser = (req: Request) =>
  req.user!.role === UserRole.HR_ADMIN || req.user!.role === UserRole.SYSTEM_ADMIN;

const canReadEmployeeCompensation = (req: Request, employeeId: string) => {
  if (isHrUser(req)) return true;
  return Boolean(req.user!.employeeId && req.user!.employeeId === employeeId);
};

const deny = (res: Response) =>
  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this compensation data',
    },
  });

const toNumber = (value: any, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error('Numeric field contains an invalid value');
  return parsed;
};

const toDate = (value: any, required = false) => {
  if (!value) {
    if (required) throw new Error('A valid date is required');
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('A valid date is required');
  return parsed;
};

const enumValue = <T extends Record<string, string>>(enumObject: T, value: any, fallback: T[keyof T]) => {
  const values = Object.values(enumObject);
  return values.includes(value) ? value : fallback;
};

const parseComponents = (components: any[] = []) =>
  components
    .filter((component) => component.componentName || component.name)
    .map((component, index) => ({
      componentName: String(component.componentName || component.name).trim(),
      componentType: enumValue(
        SalaryComponentType,
        component.componentType || component.type,
        SalaryComponentType.EARNING
      ),
      monthlyAmount: toNumber(component.monthlyAmount ?? component.amount, 0),
      annualAmount:
        component.annualAmount === undefined || component.annualAmount === null || component.annualAmount === ''
          ? undefined
          : toNumber(component.annualAmount, 0),
      taxable: component.taxable ?? true,
      statutory: component.statutory ?? false,
      displayOrder: component.displayOrder ?? index + 1,
    }));

const parseSalaryStructurePayload = (body: any) => ({
  structureName: body.structureName,
  effectiveFrom: toDate(body.effectiveFrom, true)!,
  annualCtc: toNumber(body.annualCtc, 0),
  monthlyGross: toNumber(body.monthlyGross, 0),
  monthlyNetEstimate: toNumber(body.monthlyNetEstimate, 0),
  currency: body.currency || 'INR',
  payFrequency: body.payFrequency || 'monthly',
  paymentMode: body.paymentMode || 'bank_transfer',
  status: enumValue(SalaryStructureStatus, body.status, SalaryStructureStatus.ACTIVE),
  approvalStatus: enumValue(SalaryApprovalStatus, body.approvalStatus, SalaryApprovalStatus.APPROVED),
  employeeVisible: Boolean(body.employeeVisible),
  remarks: body.remarks,
  components: Array.isArray(body.components) ? parseComponents(body.components) : undefined,
});

const parsePayslipPayload = (body: any) => ({
  salaryStructureId: body.salaryStructureId || null,
  month: toNumber(body.month),
  year: toNumber(body.year),
  grossEarnings: toNumber(body.grossEarnings, 0),
  totalDeductions: toNumber(body.totalDeductions, 0),
  netPay: toNumber(body.netPay, 0),
  paidDays: toNumber(body.paidDays, 0),
  lopDays: toNumber(body.lopDays, 0),
  paymentDate: toDate(body.paymentDate),
  status: enumValue(PayslipStatus, body.status, PayslipStatus.UPLOADED),
  employeeVisible: Boolean(body.employeeVisible),
  remarks: body.remarks,
  internalNotes: body.internalNotes,
  components: Array.isArray(body.components)
    ? parseComponents(body.components).map((component) => ({
        componentName: component.componentName,
        componentType: component.componentType,
        amount: component.monthlyAmount,
        displayOrder: component.displayOrder,
      }))
    : undefined,
});

const parseMonthlyGenerationPayload = (body: any) => ({
  month: toNumber(body.month),
  year: toNumber(body.year),
  paidDays: toNumber(body.paidDays, 30),
  lopDays: toNumber(body.lopDays, 0),
  paymentDate: toDate(body.paymentDate),
  status: enumValue(PayslipStatus, body.status, PayslipStatus.FINAL),
  employeeVisible: body.employeeVisible === undefined ? true : Boolean(body.employeeVisible),
  remarks: body.remarks,
});

router.get('/employees/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!canReadEmployeeCompensation(req, employeeId)) return deny(res);

    const data = await compensationService.getEmployeeCompensation(
      req.user!.tenantId,
      employeeId,
      isHrUser(req)
    );

    res.json({ success: true, data, message: 'Compensation data retrieved successfully' });
  } catch (error: any) {
    const status = error.message === 'Employee not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: { code: status === 404 ? 'NOT_FOUND' : 'COMPENSATION_READ_ERROR', message: error.message },
    });
  }
});

router.post('/employees/:employeeId/salary-structures', hrOnly, async (req: Request, res: Response) => {
  try {
    const payload = parseSalaryStructurePayload(req.body);
    const data = await compensationService.createSalaryStructure(req.user!.tenantId, req.params.employeeId, {
      ...payload,
      createdBy: req.user!.employeeId,
      updatedBy: req.user!.employeeId,
    });
    res.status(201).json({ success: true, data, message: 'Salary structure saved successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

router.put('/salary-structures/:structureId', hrOnly, async (req: Request, res: Response) => {
  try {
    const payload = parseSalaryStructurePayload(req.body);
    const data = await compensationService.updateSalaryStructure(req.user!.tenantId, req.params.structureId, {
      ...payload,
      updatedBy: req.user!.employeeId,
    });
    if (!data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salary structure not found' } });
    }
    res.json({ success: true, data, message: 'Salary structure updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

router.delete('/salary-structures/:structureId', hrOnly, async (req: Request, res: Response) => {
  try {
    const data = await compensationService.archiveSalaryStructure(
      req.user!.tenantId,
      req.params.structureId,
      req.user!.employeeId
    );
    if (!data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salary structure not found' } });
    }
    res.json({ success: true, data, message: 'Salary structure archived successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'ARCHIVE_ERROR', message: error.message } });
  }
});

router.post('/employees/:employeeId/payslips', hrOnly, async (req: Request, res: Response) => {
  try {
    const payload = parsePayslipPayload(req.body);
    if (payload.month < 1 || payload.month > 12) throw new Error('Month must be between 1 and 12');
    const data = await compensationService.createPayslip(req.user!.tenantId, req.params.employeeId, {
      ...payload,
      generatedBy: req.user!.employeeId,
    });
    res.status(201).json({ success: true, data, message: 'Payslip saved successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

router.post('/employees/:employeeId/payslips/generate-monthly', hrOnly, async (req: Request, res: Response) => {
  try {
    const payload = parseMonthlyGenerationPayload(req.body);
    if (payload.month < 1 || payload.month > 12) throw new Error('Month must be between 1 and 12');
    const data = await compensationService.generateMonthlyPayslip(req.user!.tenantId, req.params.employeeId, {
      ...payload,
      generatedBy: req.user!.employeeId,
    });
    res.status(201).json({ success: true, data, message: 'Monthly salary transaction generated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'GENERATION_ERROR', message: error.message } });
  }
});

router.post('/employees/:employeeId/payslips/bulk-import', hrOnly, async (req: Request, res: Response) => {
  try {
    const mode = req.body.mode === 'upsert' ? 'upsert' : 'create_only';
    const data = await compensationService.bulkImportPayslips(
      req.user!.tenantId,
      req.params.employeeId,
      req.body.rows,
      mode,
      req.user!.employeeId
    );
    res.status(201).json({ success: true, data, message: 'Salary transactions imported successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'IMPORT_ERROR', message: error.message } });
  }
});

router.put('/payslips/:payslipId', hrOnly, async (req: Request, res: Response) => {
  try {
    const payload = parsePayslipPayload(req.body);
    const data = await compensationService.updatePayslip(req.user!.tenantId, req.params.payslipId, payload);
    if (!data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
    }
    res.json({ success: true, data, message: 'Payslip updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

router.delete('/payslips/:payslipId', hrOnly, async (req: Request, res: Response) => {
  try {
    const deleted = await compensationService.deletePayslip(req.user!.tenantId, req.params.payslipId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
    }
    res.json({ success: true, data: { payslipId: req.params.payslipId }, message: 'Payslip deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'DELETE_ERROR', message: error.message } });
  }
});

router.post('/payslips/:payslipId/attachments', hrOnly, upload.single('file') as any, async (req: Request, res: Response) => {
  try {
    if (!req.file) throw new Error('Payslip file is required');

    const storageKey = tenantDocumentKey(
      req.user!.tenantId,
      `compensation/${req.params.payslipId}`,
      req.file.originalname
    );
    await storageProvider.put(storageKey, req.file.buffer, req.file.mimetype);
    const data = await compensationService.addPayslipAttachment({
      tenantId: req.user!.tenantId,
      payslipId: req.params.payslipId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: storageKey,
      fileSize: req.file.size,
      uploadedBy: req.user!.employeeId,
      isPrimary: req.body.isPrimary !== 'false',
    });

    if (!data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payslip not found' } });
    }

    res.status(201).json({ success: true, data, message: 'Payslip attachment uploaded successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: error.message } });
  }
});

router.get('/attachments/:attachmentId/download', async (req: Request, res: Response) => {
  try {
    const attachment = await compensationService.getAttachment(req.user!.tenantId, req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attachment not found' } });
    }
    const ownerEmployeeId = attachment.payslip?.employeeId;
    if (!ownerEmployeeId || !canReadEmployeeCompensation(req, ownerEmployeeId)) {
      return deny(res);
    }

    if (!(await storageProvider.exists(attachment.fileUrl))) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found on server' } });
    }

    await auditService.record({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: 'payslip_attachment.download',
      entityType: 'payslip_attachment',
      entityId: attachment.attachmentId,
      newValue: {
        attachmentId: attachment.attachmentId,
        payslipId: attachment.payslipId,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
      },
      description: `Downloaded payslip attachment: ${attachment.fileName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const url = await storageProvider.getSignedUrl(
      attachment.fileUrl,
      config.storage.signedUrlTtlSeconds
    );
    res.redirect(url);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DOWNLOAD_ERROR', message: error.message } });
  }
});

router.post('/payslips/:payslipId/share', hrOnly, async (req: Request, res: Response) => {
  try {
    const channel = enumValue(CompensationShareChannel, req.body.channel, CompensationShareChannel.EMAIL);
    const data = await compensationService.logShare({
      tenantId: req.user!.tenantId,
      employeeId: req.body.employeeId,
      payslipId: req.params.payslipId,
      channel,
      recipient: req.body.recipient,
      remarks: req.body.remarks,
      sharedBy: req.user!.employeeId,
    });
    res.status(201).json({ success: true, data, message: 'Share action logged successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'SHARE_ERROR', message: error.message } });
  }
});

export default router;
