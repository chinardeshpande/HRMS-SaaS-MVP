import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';
import employeeDocumentService from '../services/employeeDocumentService';
import { config } from '../config/config';
import { employeeDocumentKey, storageProvider, streamStoredObject } from '../services/storage';
import {
  EmployeeDocumentCategory,
  EmployeeDocumentStatus,
  EmployeeDocumentVerificationStatus,
} from '../models/EmployeeDocument';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { EmployeeDocumentRequest, EmployeeDocumentRequestStatus } from '../models/EmployeeDocumentRequest';
import { EmployeeDocument } from '../models/EmployeeDocument';

const router = Router();
router.use(authenticate);

const hrOnly = authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, image, and Word files are allowed.'));
  },
  limits: { fileSize: config.upload.maxSize },
});

const isHrUser = (req: Request) =>
  req.user!.role === UserRole.HR_ADMIN || req.user!.role === UserRole.SYSTEM_ADMIN;

const canReadEmployeeDocuments = (req: Request, employeeId: string) =>
  isHrUser(req) || Boolean(req.user!.employeeId && req.user!.employeeId === employeeId);

const deny = (res: Response) =>
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message: 'You do not have permission to access these employee documents' },
  });

const actorFromRequest = (req: Request) => ({
  tenantId: req.user!.tenantId,
  userId: req.user!.userId,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

const parseDate = (value: unknown) => {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date value');
  return parsed;
};

const parseMetadata = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return {};
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('metadata must be valid JSON');
  }
};

const parsePayload = (body: Record<string, any>) => ({
  title: body.title,
  category: body.category as EmployeeDocumentCategory,
  description: body.description,
  documentNumber: body.documentNumber,
  issueDate: parseDate(body.issueDate),
  expiryDate: parseDate(body.expiryDate),
  status: body.status as EmployeeDocumentStatus,
  verificationStatus: body.verificationStatus as EmployeeDocumentVerificationStatus,
  notes: body.notes,
  metadata: parseMetadata(body.metadata),
});

const documentRequestRepo = () => AppDataSource.getRepository(EmployeeDocumentRequest);

router.get('/requests/my', async (req: Request, res: Response) => {
  if (!req.user!.employeeId) return deny(res);
  const requests = await documentRequestRepo().find({
    where: { tenantId: req.user!.tenantId, employeeId: req.user!.employeeId },
    relations: ['fulfilledDocument'],
    order: { createdAt: 'DESC' },
  });
  return res.json({ success: true, data: { requests } });
});

router.get('/requests', hrOnly, async (req: Request, res: Response) => {
  const where: any = { tenantId: req.user!.tenantId };
  if (req.query.status) where.status = req.query.status;
  if (req.query.employeeId) where.employeeId = req.query.employeeId;
  const requests = await documentRequestRepo().find({
    where,
    relations: ['employee', 'fulfilledDocument'],
    order: { createdAt: 'DESC' },
  });
  return res.json({ success: true, data: { requests } });
});

router.post('/requests', async (req: Request, res: Response) => {
  try {
    const employeeId = isHrUser(req) && req.body.employeeId ? req.body.employeeId : req.user!.employeeId;
    if (!employeeId) return deny(res);
    if (!req.body.documentType) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Document type is required' } });
    }
    if (!['employment', 'exit'].includes(req.body.purpose || 'employment')) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Purpose must be employment or exit' } });
    }
    const employee = await AppDataSource.getRepository(Employee).findOne({
      where: { tenantId: req.user!.tenantId, employeeId },
    });
    if (!employee) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    const request = await documentRequestRepo().save(documentRequestRepo().create({
      tenantId: req.user!.tenantId,
      employeeId,
      requestedBy: req.user!.userId,
      documentType: String(req.body.documentType).trim(),
      purpose: req.body.purpose || 'employment',
      details: req.body.details || null,
      status: EmployeeDocumentRequestStatus.REQUESTED,
    }));
    return res.status(201).json({ success: true, data: request, message: 'Document request submitted to HR' });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { code: 'DOCUMENT_REQUEST_ERROR', message: error.message } });
  }
});

router.put('/requests/:requestId', hrOnly, async (req: Request, res: Response) => {
  const request = await documentRequestRepo().findOne({
    where: { tenantId: req.user!.tenantId, requestId: req.params.requestId },
  });
  if (!request) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document request not found' } });
  const allowed = Object.values(EmployeeDocumentRequestStatus);
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid document request status' } });
  }
  request.status = req.body.status;
  request.responseNotes = req.body.responseNotes ?? request.responseNotes;
  if (req.body.fulfilledDocumentId) {
    const fulfilledDocument = await AppDataSource.getRepository(EmployeeDocument).findOne({
      where: {
        tenantId: req.user!.tenantId,
        employeeId: request.employeeId,
        documentId: req.body.fulfilledDocumentId,
      },
    });
    if (!fulfilledDocument) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Fulfilled document must belong to this employee and tenant' } });
    }
    request.fulfilledDocumentId = fulfilledDocument.documentId;
  }
  if ([EmployeeDocumentRequestStatus.FULFILLED, EmployeeDocumentRequestStatus.REJECTED, EmployeeDocumentRequestStatus.CANCELLED].includes(request.status)) {
    request.resolvedBy = req.user!.userId;
    request.resolvedAt = new Date();
  }
  const saved = await documentRequestRepo().save(request);
  return res.json({ success: true, data: saved, message: 'Document request updated' });
});

router.get('/employees/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!canReadEmployeeDocuments(req, employeeId)) return deny(res);

    const documents = await employeeDocumentService.list(req.user!.tenantId, employeeId, {
      category: req.query.category as EmployeeDocumentCategory,
      status: req.query.status as EmployeeDocumentStatus,
      verificationStatus: req.query.verificationStatus as EmployeeDocumentVerificationStatus,
      searchTerm: req.query.searchTerm as string,
    });
    res.json({ success: true, data: { documents } });
  } catch (error: any) {
    const status = error.message === 'Employee not found' ? 404 : 500;
    res.status(status).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_LIST_ERROR', message: error.message } });
  }
});

router.get('/employees/:employeeId/stats', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    if (!canReadEmployeeDocuments(req, employeeId)) return deny(res);

    const stats = await employeeDocumentService.stats(req.user!.tenantId, employeeId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    const status = error.message === 'Employee not found' ? 404 : 500;
    res.status(status).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_STATS_ERROR', message: error.message } });
  }
});

router.post('/employees/:employeeId', hrOnly, upload.single('file') as any, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Document file is required' } });
    }

    const storageKey = employeeDocumentKey(
      req.user!.tenantId,
      req.params.employeeId,
      req.file.originalname
    );
    await storageProvider.put(storageKey, req.file.buffer, req.file.mimetype);
    const document = await employeeDocumentService.create(
      {
        ...parsePayload(req.body),
        tenantId: req.user!.tenantId,
        employeeId: req.params.employeeId,
        uploadedBy: req.user!.userId,
        fileName: storageKey.split('/').pop()!,
        originalFileName: req.file.originalname,
        fileUrl: storageKey,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      actorFromRequest(req)
    );

    res.status(201).json({ success: true, data: document, message: 'Employee document uploaded successfully' });
  } catch (error: any) {
    const status = error.message === 'Employee not found' ? 404 : 400;
    res.status(status).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_UPLOAD_ERROR', message: error.message } });
  }
});

router.put('/:documentId', hrOnly, async (req: Request, res: Response) => {
  try {
    const document = await employeeDocumentService.update(
      req.user!.tenantId,
      req.params.documentId,
      parsePayload(req.body),
      actorFromRequest(req)
    );
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee document not found' } });
    }
    res.json({ success: true, data: document, message: 'Employee document updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_UPDATE_ERROR', message: error.message } });
  }
});

router.post('/:documentId/verify', hrOnly, async (req: Request, res: Response) => {
  try {
    const status =
      req.body.verificationStatus === EmployeeDocumentVerificationStatus.REJECTED
        ? EmployeeDocumentVerificationStatus.REJECTED
        : EmployeeDocumentVerificationStatus.VERIFIED;
    const document = await employeeDocumentService.verify(
      req.user!.tenantId,
      req.params.documentId,
      status,
      actorFromRequest(req)
    );
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee document not found' } });
    }
    res.json({ success: true, data: document, message: 'Employee document verification updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_VERIFY_ERROR', message: error.message } });
  }
});

router.get('/:documentId/download', async (req: Request, res: Response) => {
  try {
    const document = await employeeDocumentService.getById(req.user!.tenantId, req.params.documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee document not found' } });
    }
    if (!canReadEmployeeDocuments(req, document.employeeId)) return deny(res);
    if (!(await storageProvider.exists(document.fileUrl))) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found on server' } });
    }
    await employeeDocumentService.logDownload(document, actorFromRequest(req));
    await streamStoredObject(res, document.fileUrl, document.fileName, document.fileType);
  } catch (error: any) {
    if (res.headersSent) return res.destroy(error);
    res.status(500).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_DOWNLOAD_ERROR', message: error.message } });
  }
});

router.delete('/:documentId', hrOnly, async (req: Request, res: Response) => {
  try {
    const document = await employeeDocumentService.archive(req.user!.tenantId, req.params.documentId, actorFromRequest(req));
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee document not found' } });
    }
    res.json({ success: true, data: document, message: 'Employee document archived successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'EMPLOYEE_DOCUMENT_DELETE_ERROR', message: error.message } });
  }
});

export default router;
