import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
import employeeDocumentService from '../services/employeeDocumentService';
import { uploadDir } from '../utils/uploadPaths';
import {
  EmployeeDocumentCategory,
  EmployeeDocumentStatus,
  EmployeeDocumentVerificationStatus,
} from '../models/EmployeeDocument';

const router = Router();
router.use(authenticate);
router.use(tenantIsolation);

const hrOnly = authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const targetDir = uploadDir('employee-documents');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext).replace(/[^\w.-]+/g, '-');
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
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
  limits: { fileSize: 15 * 1024 * 1024 },
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

    const document = await employeeDocumentService.create(
      {
        ...parsePayload(req.body),
        tenantId: req.user!.tenantId,
        employeeId: req.params.employeeId,
        uploadedBy: req.user!.userId,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileUrl: `/uploads/employee-documents/${req.file.filename}`,
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
    if (!employeeDocumentService.fileExists(document.fileUrl)) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found on server' } });
    }
    await employeeDocumentService.logDownload(document, actorFromRequest(req));
    res.download(employeeDocumentService.resolveFilePath(document.fileUrl), document.originalFileName);
  } catch (error: any) {
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
