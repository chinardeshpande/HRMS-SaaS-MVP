import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';
import companyDocumentService from '../services/companyDocumentService';
import { uploadDir } from '../utils/uploadPaths';
import {
  CompanyDocumentCategory,
  CompanyDocumentStatus,
  CompanyDocumentVerificationStatus,
} from '../models/CompanyDocument';

const router = Router();
router.use(authenticate);
router.use(tenantIsolation);

const hrOnly = authorize(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const targetDir = uploadDir('company-documents');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, image, Word, and Excel files are allowed.'));
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 },
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
  category: body.category as CompanyDocumentCategory,
  description: body.description,
  documentNumber: body.documentNumber,
  issuingAuthority: body.issuingAuthority,
  issueDate: parseDate(body.issueDate),
  expiryDate: parseDate(body.expiryDate),
  renewalOwner: body.renewalOwner,
  status: body.status as CompanyDocumentStatus,
  verificationStatus: body.verificationStatus as CompanyDocumentVerificationStatus,
  notes: body.notes,
  metadata: parseMetadata(body.metadata),
});

router.get('/', hrOnly, async (req: Request, res: Response) => {
  try {
    const documents = await companyDocumentService.list(req.user!.tenantId, {
      category: req.query.category as CompanyDocumentCategory,
      status: req.query.status as CompanyDocumentStatus,
      verificationStatus: req.query.verificationStatus as CompanyDocumentVerificationStatus,
      searchTerm: req.query.searchTerm as string,
      expiringWithinDays: req.query.expiringWithinDays ? Number(req.query.expiringWithinDays) : undefined,
    });

    res.json({ success: true, data: { documents } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'COMPANY_DOCUMENT_LIST_ERROR', message: error.message } });
  }
});

router.get('/stats', hrOnly, async (req: Request, res: Response) => {
  try {
    const stats = await companyDocumentService.stats(req.user!.tenantId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'COMPANY_DOCUMENT_STATS_ERROR', message: error.message } });
  }
});

router.post('/', hrOnly, upload.single('file') as any, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Document file is required' } });
    }

    const payload = parsePayload(req.body);
    const document = await companyDocumentService.create(
      {
        ...payload,
        tenantId: req.user!.tenantId,
        uploadedBy: req.user!.userId,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        fileUrl: `/uploads/company-documents/${req.file.filename}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      actorFromRequest(req)
    );

    res.status(201).json({ success: true, data: document, message: 'Company document uploaded successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'COMPANY_DOCUMENT_UPLOAD_ERROR', message: error.message } });
  }
});

router.put('/:documentId', hrOnly, async (req: Request, res: Response) => {
  try {
    const document = await companyDocumentService.update(
      req.user!.tenantId,
      req.params.documentId,
      parsePayload(req.body),
      actorFromRequest(req)
    );
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company document not found' } });
    }
    res.json({ success: true, data: document, message: 'Company document updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'COMPANY_DOCUMENT_UPDATE_ERROR', message: error.message } });
  }
});

router.post('/:documentId/verify', hrOnly, async (req: Request, res: Response) => {
  try {
    const status =
      req.body.verificationStatus === CompanyDocumentVerificationStatus.REJECTED
        ? CompanyDocumentVerificationStatus.REJECTED
        : CompanyDocumentVerificationStatus.VERIFIED;
    const document = await companyDocumentService.verify(
      req.user!.tenantId,
      req.params.documentId,
      status,
      actorFromRequest(req)
    );
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company document not found' } });
    }
    res.json({ success: true, data: document, message: 'Company document verification updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'COMPANY_DOCUMENT_VERIFY_ERROR', message: error.message } });
  }
});

router.get('/:documentId/download', hrOnly, async (req: Request, res: Response) => {
  try {
    const document = await companyDocumentService.getById(req.user!.tenantId, req.params.documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company document not found' } });
    }
    if (!companyDocumentService.fileExists(document.fileUrl)) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File not found on server' } });
    }
    await companyDocumentService.logDownload(document, actorFromRequest(req));
    res.download(companyDocumentService.resolveFilePath(document.fileUrl), document.originalFileName);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'COMPANY_DOCUMENT_DOWNLOAD_ERROR', message: error.message } });
  }
});

router.delete('/:documentId', hrOnly, async (req: Request, res: Response) => {
  try {
    const document = await companyDocumentService.archiveOrDelete(
      req.user!.tenantId,
      req.params.documentId,
      actorFromRequest(req)
    );
    if (!document) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Company document not found' } });
    }
    res.json({ success: true, data: document, message: 'Company document archived successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'COMPANY_DOCUMENT_DELETE_ERROR', message: error.message } });
  }
});

export default router;
