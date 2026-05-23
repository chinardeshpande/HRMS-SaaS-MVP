import { Repository } from 'typeorm';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import {
  EmployeeDocument,
  EmployeeDocumentCategory,
  EmployeeDocumentStatus,
  EmployeeDocumentVerificationStatus,
} from '../models/EmployeeDocument';
import auditService from './auditService';

export interface EmployeeDocumentInput {
  title: string;
  category?: EmployeeDocumentCategory;
  description?: string | null;
  documentNumber?: string | null;
  issueDate?: Date | null;
  expiryDate?: Date | null;
  status?: EmployeeDocumentStatus;
  verificationStatus?: EmployeeDocumentVerificationStatus;
  notes?: string | null;
  metadata?: Record<string, any>;
}

export interface EmployeeDocumentUploadInput extends EmployeeDocumentInput {
  tenantId: string;
  employeeId: string;
  uploadedBy: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface EmployeeDocumentActor {
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

class EmployeeDocumentService {
  private documentRepo: Repository<EmployeeDocument>;
  private employeeRepo: Repository<Employee>;

  constructor() {
    this.documentRepo = AppDataSource.getRepository(EmployeeDocument);
    this.employeeRepo = AppDataSource.getRepository(Employee);
  }

  async assertEmployeeBelongsToTenant(tenantId: string, employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({ where: { tenantId, employeeId } });
    if (!employee) {
      throw new Error('Employee not found');
    }
  }

  async list(
    tenantId: string,
    employeeId: string,
    filters: {
      category?: EmployeeDocumentCategory;
      status?: EmployeeDocumentStatus;
      verificationStatus?: EmployeeDocumentVerificationStatus;
      searchTerm?: string;
    } = {}
  ): Promise<EmployeeDocument[]> {
    await this.assertEmployeeBelongsToTenant(tenantId, employeeId);

    const query = this.documentRepo
      .createQueryBuilder('document')
      .where('document.tenantId = :tenantId', { tenantId })
      .andWhere('document.employeeId = :employeeId', { employeeId });

    if (filters.category) query.andWhere('document.category = :category', { category: filters.category });
    if (filters.status) query.andWhere('document.status = :status', { status: filters.status });
    if (filters.verificationStatus) {
      query.andWhere('document.verificationStatus = :verificationStatus', {
        verificationStatus: filters.verificationStatus,
      });
    }
    if (filters.searchTerm) {
      query.andWhere(
        '(document.title ILIKE :searchTerm OR document.description ILIKE :searchTerm OR document.documentNumber ILIKE :searchTerm OR document.originalFileName ILIKE :searchTerm)',
        { searchTerm: `%${filters.searchTerm}%` }
      );
    }

    return query.orderBy('document.updatedAt', 'DESC').getMany();
  }

  async getById(tenantId: string, documentId: string): Promise<EmployeeDocument | null> {
    return this.documentRepo.findOne({ where: { tenantId, documentId } });
  }

  async create(input: EmployeeDocumentUploadInput, actor: EmployeeDocumentActor): Promise<EmployeeDocument> {
    await this.assertEmployeeBelongsToTenant(input.tenantId, input.employeeId);
    if (!cleanText(input.title)) throw new Error('Document title is required');

    const document = new EmployeeDocument();
    Object.assign(document, {
      ...this.normalizeInput(input),
      tenantId: input.tenantId,
      employeeId: input.employeeId,
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
      action: 'employee_document.upload',
      entityType: 'employee_document',
      entityId: saved.documentId,
      newValue: this.toAuditValue(saved),
      description: `Uploaded employee document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async update(
    tenantId: string,
    documentId: string,
    input: Partial<EmployeeDocumentInput>,
    actor: EmployeeDocumentActor
  ): Promise<EmployeeDocument | null> {
    const document = await this.getById(tenantId, documentId);
    if (!document) return null;

    const before = this.toAuditValue(document);
    Object.assign(document, this.normalizeInput(input));

    const saved = await this.documentRepo.save(document);
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'employee_document.update',
      entityType: 'employee_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Updated employee document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async verify(
    tenantId: string,
    documentId: string,
    verificationStatus: EmployeeDocumentVerificationStatus,
    actor: EmployeeDocumentActor
  ): Promise<EmployeeDocument | null> {
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
      action: 'employee_document.verify',
      entityType: 'employee_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Changed employee document verification to ${verificationStatus}: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async logDownload(document: EmployeeDocument, actor: EmployeeDocumentActor): Promise<void> {
    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'employee_document.download',
      entityType: 'employee_document',
      entityId: document.documentId,
      newValue: this.toAuditValue(document),
      description: `Downloaded employee document: ${document.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }

  async archive(
    tenantId: string,
    documentId: string,
    actor: EmployeeDocumentActor
  ): Promise<EmployeeDocument | null> {
    const document = await this.getById(tenantId, documentId);
    if (!document) return null;

    const before = this.toAuditValue(document);
    document.status = EmployeeDocumentStatus.ARCHIVED;
    const saved = await this.documentRepo.save(document);

    await auditService.record({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'employee_document.archive',
      entityType: 'employee_document',
      entityId: saved.documentId,
      oldValue: before,
      newValue: this.toAuditValue(saved),
      description: `Archived employee document: ${saved.title}`,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return saved;
  }

  async stats(tenantId: string, employeeId: string) {
    const documents = await this.list(tenantId, employeeId);
    return documents.reduce(
      (summary, document) => {
        summary.total += 1;
        if (document.status === EmployeeDocumentStatus.ACTIVE) summary.active += 1;
        if (document.verificationStatus !== EmployeeDocumentVerificationStatus.VERIFIED) {
          summary.needsReview += 1;
        }
        summary.byCategory[document.category] = (summary.byCategory[document.category] || 0) + 1;
        return summary;
      },
      { total: 0, active: 0, needsReview: 0, byCategory: {} as Record<string, number> }
    );
  }

  resolveFilePath(fileUrl: string): string {
    return path.join(__dirname, '../..', fileUrl);
  }

  fileExists(fileUrl: string): boolean {
    return fs.existsSync(this.resolveFilePath(fileUrl));
  }

  private normalizeInput(input: Partial<EmployeeDocumentInput>) {
    return {
      ...(input.title !== undefined ? { title: cleanText(input.title) } : {}),
      ...(input.category !== undefined
        ? {
            category: validEnumValue(
              EmployeeDocumentCategory,
              input.category,
              EmployeeDocumentCategory.OTHER
            ),
          }
        : {}),
      ...(input.description !== undefined ? { description: cleanText(input.description) } : {}),
      ...(input.documentNumber !== undefined ? { documentNumber: cleanText(input.documentNumber) } : {}),
      ...(input.issueDate !== undefined ? { issueDate: input.issueDate || null } : {}),
      ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate || null } : {}),
      ...(input.status !== undefined
        ? { status: validEnumValue(EmployeeDocumentStatus, input.status, EmployeeDocumentStatus.ACTIVE) }
        : {}),
      ...(input.verificationStatus !== undefined
        ? {
            verificationStatus: validEnumValue(
              EmployeeDocumentVerificationStatus,
              input.verificationStatus,
              EmployeeDocumentVerificationStatus.UNVERIFIED
            ),
          }
        : {}),
      ...(input.notes !== undefined ? { notes: cleanText(input.notes) } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {}),
    };
  }

  private toAuditValue(document: EmployeeDocument) {
    return {
      documentId: document.documentId,
      employeeId: document.employeeId,
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

export const employeeDocumentService = new EmployeeDocumentService();
export default employeeDocumentService;

