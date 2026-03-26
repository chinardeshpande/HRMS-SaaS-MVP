import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError, sendCreated } from '../utils/responses';

// Mock database (replace with actual database calls)
interface Document {
  documentId: string;
  entityType: string; // 'candidate', 'exit_case', 'employee', 'probation'
  entityId: string;
  documentType: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedDate: string;
  verificationStatus: 'pending' | 'uploaded' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  isRequired: boolean;
  requiresSignature: boolean;
  isSigned: boolean;
  signedDate?: string;
  tenantId: string;
}

// In-memory storage (replace with actual database)
const documents: Document[] = [];

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, { code: 'NO_FILE', message: 'No file uploaded' }, 400);
    }

    const { entityType, entityId, documentType, isRequired, requiresSignature } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const document: Document = {
      documentId: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      entityType,
      entityId,
      documentType: documentType || 'general',
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: userId,
      uploadedDate: new Date().toISOString(),
      verificationStatus: 'uploaded',
      isRequired: isRequired === 'true' || isRequired === true,
      requiresSignature: requiresSignature === 'true' || requiresSignature === true,
      isSigned: false,
      tenantId,
    };

    documents.push(document);

    return sendCreated(res, {
      document: {
        ...document,
        filePath: undefined, // Don't expose file system path
        fileUrl: `/api/documents/${document.documentId}/download`,
      },
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    return sendError(res, { code: 'UPLOAD_ERROR', message: error.message }, 500);
  }
};

export const uploadMultipleDocuments = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, { code: 'NO_FILES', message: 'No files uploaded' }, 400);
    }

    const { entityType, entityId } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const uploadedDocuments = files.map((file, index) => {
      const document: Document = {
        documentId: `doc-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`,
        entityType,
        entityId,
        documentType: req.body.documentTypes?.[index] || 'general',
        fileName: file.filename,
        originalFileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
        uploadedDate: new Date().toISOString(),
        verificationStatus: 'uploaded',
        isRequired: false,
        requiresSignature: false,
        isSigned: false,
        tenantId,
      };

      documents.push(document);
      return {
        ...document,
        filePath: undefined,
        fileUrl: `/api/documents/${document.documentId}/download`,
      };
    });

    return sendCreated(res, { documents: uploadedDocuments });
  } catch (error: any) {
    console.error('Upload multiple documents error:', error);
    return sendError(res, { code: 'UPLOAD_ERROR', message: error.message }, 500);
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const tenantId = req.user!.tenantId;

    const document = documents.find(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (!document) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    return sendSuccess(res, {
      document: {
        ...document,
        filePath: undefined,
        fileUrl: `/api/documents/${document.documentId}/download`,
      },
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const tenantId = req.user!.tenantId;

    const document = documents.find(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (!document) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    if (!fs.existsSync(document.filePath)) {
      return sendError(res, { code: 'FILE_NOT_FOUND', message: 'File not found on server' }, 404);
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);
    res.setHeader('Content-Length', document.fileSize.toString());

    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Download document error:', error);
    return sendError(res, { code: 'DOWNLOAD_ERROR', message: error.message }, 500);
  }
};

export const getEntityDocuments = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const tenantId = req.user!.tenantId;

    const entityDocuments = documents.filter(
      (doc) =>
        doc.entityType === entityType &&
        doc.entityId === entityId &&
        doc.tenantId === tenantId
    );

    return sendSuccess(res, {
      documents: entityDocuments.map((doc) => ({
        ...doc,
        filePath: undefined,
        fileUrl: `/api/documents/${doc.documentId}/download`,
        size: `${(doc.fileSize / 1024).toFixed(2)} KB`,
      })),
    });
  } catch (error: any) {
    console.error('Get entity documents error:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const tenantId = req.user!.tenantId;
    const updates = req.body;

    const docIndex = documents.findIndex(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (docIndex === -1) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    // Update allowed fields
    const allowedUpdates = ['documentType', 'isRequired', 'requiresSignature'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (documents[docIndex] as any)[field] = updates[field];
      }
    });

    return sendSuccess(res, {
      document: {
        ...documents[docIndex],
        filePath: undefined,
        fileUrl: `/api/documents/${documents[docIndex].documentId}/download`,
      },
    });
  } catch (error: any) {
    console.error('Update document error:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { notes } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    const docIndex = documents.findIndex(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (docIndex === -1) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    documents[docIndex].verificationStatus = 'verified';
    documents[docIndex].verifiedBy = userId;
    documents[docIndex].verifiedDate = new Date().toISOString();

    return sendSuccess(res, {
      message: 'Document verified successfully',
      document: {
        ...documents[docIndex],
        filePath: undefined,
        fileUrl: `/api/documents/${documents[docIndex].documentId}/download`,
      },
    });
  } catch (error: any) {
    console.error('Verify document error:', error);
    return sendError(res, { code: 'VERIFY_ERROR', message: error.message }, 500);
  }
};

export const rejectDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;

    if (!reason || !reason.trim()) {
      return sendError(res, { code: 'MISSING_REASON', message: 'Rejection reason is required' }, 400);
    }

    const docIndex = documents.findIndex(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (docIndex === -1) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    documents[docIndex].verificationStatus = 'rejected';
    documents[docIndex].verifiedBy = userId;
    documents[docIndex].verifiedDate = new Date().toISOString();
    documents[docIndex].rejectionReason = reason;

    return sendSuccess(res, {
      message: 'Document rejected successfully',
      document: {
        ...documents[docIndex],
        filePath: undefined,
        fileUrl: `/api/documents/${documents[docIndex].documentId}/download`,
      },
    });
  } catch (error: any) {
    console.error('Reject document error:', error);
    return sendError(res, { code: 'REJECT_ERROR', message: error.message }, 500);
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const tenantId = req.user!.tenantId;

    const docIndex = documents.findIndex(
      (doc) => doc.documentId === documentId && doc.tenantId === tenantId
    );

    if (docIndex === -1) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Document not found' }, 404);
    }

    const document = documents[docIndex];

    // Delete physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Remove from array
    documents.splice(docIndex, 1);

    return sendSuccess(res, { message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

export default {
  uploadDocument,
  uploadMultipleDocuments,
  getDocument,
  downloadDocument,
  getEntityDocuments,
  updateDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
};
