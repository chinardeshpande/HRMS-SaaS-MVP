import { Repository } from 'typeorm';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import {
  CompanyDocument,
  CompanyDocumentCategory,
  CompanyDocumentStatus,
  CompanyDocumentVerificationStatus,
} from '../models/CompanyDocument';
import auditService from './auditService';
import { resolveUploadUrl } from '../utils/uploadPaths';

export interface CompanyDocumentInput {
  title: string;
  category?: CompanyDocumentCategory;
  description?: string | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  renewalOwner?: string | null;
  status?: CompanyDocumentStatus;
  verificationStatus?: CompanyDocumentVerificationStatus;
  notes?: string | null;
  metadata?: Record<string, any>;
}

export interface CompanyDocumentUploadInput extends CompanyDocumentInput {
  tenantId: string;
  uploadedBy: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface CompanyDocumentActor {
  tenantId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

const cleanText = (value?: string | null) => {
  const cleaned = value?.trim();
  return cleaned || null;
};

const validEnumValue = <T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  fallback: T[keyof T]
): T[keyof T] => {
  const values = Object.values(enumObject);
  return typeof value === 'string' && values.includes(value) ? (value as T[keyof T]) : fallback;
};

class CompanyDocumentService {
  private documentRepo: Repository<CompanyDocument>;

  constructor() {
    this.documentRepo = AppDataSource.getRepository(CompanyDocument);
  }

  async list(
    tenantId: string,
    filters: {
      category?: CompanyDocumentCategory;
      status?: CompanyDocumentStatus;
      verificationStatus?: CompanyDocumentVerificationStatus;
      searchTerm?: string;
      expiringWithinDays?: number;
    } = {}
  ): Promise<CompanyDocument[]> {
    const query = this.documentRepo
      .createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId });

    if (filters.category) {
      query.andWhere('document.category = :category', { category: filters.category });
    }

    if (filters.status) {
      query.andWhere('document.status = :status', { status: filters.status });
    }

    if (filters.verificationStatus) {
      query.andWhere('document.verificationStatus = :verificationStatus', {
        verificationStatus: filters.verificationStatus,
      });
    }

    if (filters.searchTerm) {
      query.andWhere(
        '(document.title ILIKE :searchTerm OR document.description ILIKE :searchTerm OR document.documentNumber ILIKE :searchTerm OR document.issuingAuthority ILIKE :searchTerm)',
        { searchTerm: `%${filters.searchTerm}%` }
      );
    }

    if (filters.expiringWithinDays && filters.expiringWithinDays > 0) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + filters.expiringWithinDays);
      query
        .andWhere('document.expiryDate IS NOT NULL')
        .andWhere('document.expiryDate <= :threshold', { threshold });
    }

    return query.orderBy('document.expiryDate', 'ASC', 'NULLS LAST').addOrderBy('document.updatedAt', 'DESC').getMany();
  }

  async getById(tenantId: string, documentId: string): Promise<CompanyDocument | null> {
    return this.documentRepo.findOne({ where: { tenantId, documentId } });
  }

  async create(input: CompanyDocumentUploadInput, actor: CompanyDocumentActor): Promise<CompanyDocument> {
    if (!cleanText(input.title)) {
      throw new Error('Document title is required');
    }

    const document = new CompanyDocument();
    Object.assign(document, {
      ...this.normalizeInput(input),
      tenantId: input.tenantId,
      uploadedBy: input.uploadedBy,
      fileName: input.fileName,
      originalFileName: input.originalFileName,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      fileSize: input.fileSize,
    });

    const saved = await this.documentRepo.save(document);
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'company_document.upload',
      entityType: 'company_document',
      entityId: saved.documentId,
      newValue: this.toAuditValue(saved),
      description: `Uploaded company document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async update(
    tenantId: string,
    documentId: string,
    input: Partial<CompanyDocumentInput>,
    actor: CompanyDocumentActor
  ): Promise<CompanyDocument | null> {
    const document = await this.getById(tenantId, documentId);
    if (!document) return null;

    const before = this.toAuditValue(document);
    Object.assign(document, this.normalizeInput(input));

    const saved = await this.documentRepo.save(document);
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'company_document.update',
      entityType: 'company_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Updated company document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async verify(
    tenantId: string,
    documentId: string,
    verificationStatus: CompanyDocumentVerificationStatus,
    actor: CompanyDocumentActor
  ): Promise<CompanyDocument | null> {
    const document = await this.getById(tenantId, documentId);
    if (!document) return null;

    const before = this.toAuditValue(document);
    document.verificationStatus = verificationStatus;
    document.verifiedBy = actor.userId;
    document.verifiedAt = new Date();

    const saved = await this.documentRepo.save(document);
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'company_document.verify',
      entityType: 'company_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Changed company document verification to ${verificationStatus}: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async logDownload(document: CompanyDocument, actor: CompanyDocumentActor): Promise<void> {
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'company_document.download',
      entityType: 'company_document',
      entityId: document.documentId,
      newValue: this.toAuditValue(document),
      description: `Downloaded company document: ${document.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  async archiveOrDelete(
    tenantId: string,
    documentId: string,
    actor: CompanyDocumentActor
  ): Promise<CompanyDocument | null> {
    const document = await this.getById(tenantId, documentId);
    if (!document) return null;

    const before = this.toAuditValue(document);
    document.status = CompanyDocumentStatus.ARCHIVED;
    const saved = await this.documentRepo.save(document);

    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'company_document.archive',
      entityType: 'company_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Archived company document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async stats(tenantId: string): Promise<{
    total: number;
    active: number;
    needsReview: number;
    expiringSoon: number;
    byCategory: Record<string, number>;
  }> {
    const documents = await this.documentRepo.find({ where: { tenantId } });
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 60);

    return documents.reduce(
      (summary, document) => {
        summary.total += 1;
        if (document.status === CompanyDocumentStatus.ACTIVE) summary.active += 1;
        if (
          document.status === CompanyDocumentStatus.NEEDS_REVIEW ||
          document.verificationStatus !== CompanyDocumentVerificationStatus.VERIFIED
        ) {
          summary.needsReview += 1;
        }
        if (document.expiryDate && new Date(document.expiryDate) <= threshold) {
          summary.expiringSoon += 1;
        }
        summary.byCategory[document.category] = (summary.byCategory[document.category] || 0) + 1;
        return summary;
      },
      { total: 0, active: 0, needsReview: 0, expiringSoon: 0, byCategory: {} as Record<string, number> }
    );
  }

  resolveFilePath(fileUrl: string): string {
    return resolveUploadUrl(fileUrl);
  }

  fileExists(fileUrl: string): boolean {
    return fs.existsSync(this.resolveFilePath(fileUrl));
  }

  private normalizeInput(input: Partial<CompanyDocumentInput>) {
    return {
      ...(input.title !== undefined ? { title: cleanText(input.title) } : {}),
      ...(input.category !== undefined
        ? {
            category: validEnumValue(
              CompanyDocumentCategory,
              input.category,
              CompanyDocumentCategory.OTHER
            ),
          }
        : {}),
      ...(input.description !== undefined ? { description: cleanText(input.description) } : {}),
      ...(input.documentNumber !== undefined ? { documentNumber: cleanText(input.documentNumber) } : {}),
      ...(input.issuingAuthority !== undefined ? { issuingAuthority: cleanText(input.issuingAuthority) } : {}),
      ...(input.issueDate !== undefined ? { issueDate: input.issueDate || null } : {}),
      ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate || null } : {}),
      ...(input.renewalOwner !== undefined ? { renewalOwner: cleanText(input.renewalOwner) } : {}),
      ...(input.status !== undefined
        ? { status: validEnumValue(CompanyDocumentStatus, input.status, CompanyDocumentStatus.ACTIVE) }
        : {}),
      ...(input.verificationStatus !== undefined
        ? {
            verificationStatus: validEnumValue(
              CompanyDocumentVerificationStatus,
              input.verificationStatus,
              CompanyDocumentVerificationStatus.UNVERIFIED
            ),
          }
        : {}),
      ...(input.notes !== undefined ? { notes: cleanText(input.notes) } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {}),
    };
  }

  private toAuditValue(document: CompanyDocument) {
    return {
      documentId: document.documentId,
      title: document.title,
      category: document.category,
      status: document.status,
      verificationStatus: document.verificationStatus,
      documentNumber: document.documentNumber,
      expiryDate: document.expiryDate,
      fileName: document.fileName,
      fileSize: document.fileSize,
    };
  }
}

export const companyDocumentService = new CompanyDocumentService();
export default companyDocumentService;
