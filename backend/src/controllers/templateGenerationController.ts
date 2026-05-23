import { Request, Response } from 'express';
import { Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Employee } from '../models/Employee';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { Tenant } from '../models/Tenant';
import { GeneratedDocument, GeneratedDocumentFormat, GeneratedDocumentStatus } from '../models/GeneratedDocument';
import { DocumentType } from '../models/enums/DocumentEnums';
import documentGenerationService from '../services/documentGenerationService';
import { sendSuccess, sendError } from '../utils/responses';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

const defaultDocumentTemplates: Array<Partial<DocumentTemplate>> = [
  {
    templateName: DocumentType.OFFER_LETTER,
    displayName: 'Offer Letter',
    category: 'offer',
    description: 'Standard offer letter template for new candidates',
    availableFields: ['companyName', 'offerDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'employmentType', 'workLocation', 'currency', 'offeredSalary', 'expectedJoinDate', 'offerExpiryDate'],
    htmlTemplate: '<h1>{{companyName}}</h1><p>Date: {{offerDate}}</p><p>Dear {{firstName}} {{lastName}},</p><p>We are pleased to offer you the position of {{positionOffered}} in {{departmentName}}.</p><p>Compensation: {{currency}} {{offeredSalary}}</p><p>Expected joining date: {{expectedJoinDate}}</p>',
    isActive: true,
    version: 1,
  },
  {
    templateName: DocumentType.CONFIRMATION_LETTER,
    displayName: 'Confirmation Letter',
    category: 'confirmation',
    description: 'Confirmation letter after successful probation completion',
    availableFields: ['companyName', 'confirmationDate', 'firstName', 'lastName', 'employeeCode', 'designation', 'department', 'joinDate'],
    htmlTemplate: '<h1>{{companyName}}</h1><p>Date: {{confirmationDate}}</p><p>Dear {{firstName}} {{lastName}},</p><p>Your employment is confirmed effective {{confirmationDate}}.</p><p>Employee Code: {{employeeCode}}</p><p>Designation: {{designation}}</p><p>Department: {{department}}</p>',
    isActive: true,
    version: 1,
  },
  {
    templateName: DocumentType.APPOINTMENT_LETTER,
    displayName: 'Appointment Letter',
    category: 'appointment',
    description: 'Appointment letter issued when an employee joins',
    availableFields: ['companyName', 'appointmentDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'reportingManager', 'joinDate', 'employeeCode', 'currency', 'offeredSalary'],
    htmlTemplate: '<h1>{{companyName}}</h1><p>Date: {{appointmentDate}}</p><p>Dear {{firstName}} {{lastName}},</p><p>Your appointment as {{positionOffered}} in {{departmentName}} is confirmed from {{joinDate}}.</p><p>Employee Code: {{employeeCode}}</p><p>Reporting Manager: {{reportingManager}}</p>',
    isActive: true,
    version: 1,
  },
];

async function ensureDefaultTemplates(tenantId: string): Promise<void> {
  const templateRepo = AppDataSource.getRepository(DocumentTemplate);
  const existingCount = await templateRepo.count({ where: { tenantId, isActive: true } });

  if (existingCount > 0) return;

  const templates = defaultDocumentTemplates.map((template) =>
    templateRepo.create({
      ...template,
      tenantId,
    })
  );

  await templateRepo.save(templates);
  logger.info(`Seeded ${templates.length} default document templates for tenant ${tenantId}`);
}

async function buildMergedDocumentData(tenantId: string, employeeId: string | undefined, variables: Record<string, any>) {
  let employeeData: any = {};
  if (employeeId) {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employee = await employeeRepo.findOne({
      where: { employeeId, tenantId },
      relations: ['department', 'designation'],
    });

    if (employee) {
      employeeData = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        employeeCode: employee.employeeCode,
        department: employee.department?.name,
        departmentName: employee.department?.name,
        designation: employee.designation?.name,
        position: employee.designation?.name,
        positionOffered: employee.designation?.name,
      };
    }
  }

  const [settings, tenant] = await Promise.all([
    AppDataSource.getRepository(OrganizationSettings).findOne({ where: { tenantId } }),
    AppDataSource.getRepository(Tenant).findOne({ where: { tenantId } }),
  ]);

  return {
    ...employeeData,
    ...variables,
    companyName: variables.companyName || settings?.companyName || tenant?.companyName || 'Company',
    generatedDate: variables.generatedDate || new Date().toLocaleDateString(),
  };
}

/**
 * Get all available document templates
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    await ensureDefaultTemplates(tenantId);

    const templates = await templateRepo.find({
      where: { tenantId, isActive: true },
      order: { templateName: 'ASC' },
    });

    return sendSuccess(res, {
      templates: templates.map((t) => ({
        templateId: t.templateId,
        templateName: t.templateName,
        displayName: t.displayName,
        category: t.category,
        description: t.description,
        availableFields: t.availableFields,
        isActive: t.isActive,
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching templates:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

/**
 * Generate a document from template
 */
export const generateDocument = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { templateId, employeeId, variables, format } = req.body;

    if (!templateId || !variables) {
      return sendError(
        res,
        { code: 'MISSING_FIELDS', message: 'Template ID and variables are required' },
        400
      );
    }

    // Get template
    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    const template = await templateRepo.findOne({
      where: { templateId, tenantId, isActive: true },
    });

    if (!template) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    const mergedData = await buildMergedDocumentData(tenantId, employeeId, variables);

    // Generate PDF
    const pdfPath = await documentGenerationService.generateDocument(
      template.templateName,
      mergedData,
      tenantId
    );

    // Read the generated PDF file
    const absolutePath = path.join(__dirname, '../..', pdfPath);
    if (!fs.existsSync(absolutePath)) {
      return sendError(res, { code: 'FILE_NOT_FOUND', message: 'Generated file not found' }, 500);
    }

    const fileName = path.basename(pdfPath);
    const fileBuffer = fs.readFileSync(absolutePath);

    const generatedDocRepo = AppDataSource.getRepository(GeneratedDocument);
    await generatedDocRepo.save(
      generatedDocRepo.create({
        tenantId,
        templateId: template.templateId,
        documentType: template.templateName,
        documentName: template.displayName,
        employeeId: employeeId || undefined,
        generatedBy: userId,
        status: GeneratedDocumentStatus.GENERATED,
        format: GeneratedDocumentFormat.PDF,
        filePath: pdfPath,
        fileUrl: pdfPath,
        fileSizeBytes: fileBuffer.length,
        metadata: {
          variables: mergedData,
          issuedTo: mergedData.email
            ? {
                name: `${mergedData.firstName || ''} ${mergedData.lastName || ''}`.trim(),
                email: mergedData.email,
              }
            : undefined,
        },
      })
    );

    // Set response headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());

    // Send the PDF file
    res.send(fileBuffer);
  } catch (error: any) {
    logger.error('Error generating document:', error);
    return sendError(res, { code: 'GENERATION_ERROR', message: error.message }, 500);
  }
};

export const previewGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { templateId, employeeId, variables } = req.body;

    if (!templateId || !variables) {
      return sendError(
        res,
        { code: 'MISSING_FIELDS', message: 'Template ID and variables are required' },
        400
      );
    }

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    const template = await templateRepo.findOne({
      where: { templateId, tenantId, isActive: true },
    });

    if (!template) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    const mergedData = await buildMergedDocumentData(tenantId, employeeId, variables);
    const html = await documentGenerationService.generatePreviewHtml(template.templateName, mergedData, tenantId);

    return sendSuccess(res, {
      html,
      documentName: template.displayName,
      documentType: template.templateName,
      variables: mergedData,
    });
  } catch (error: any) {
    logger.error('Error previewing generated document:', error);
    return sendError(res, { code: 'PREVIEW_ERROR', message: error.message }, 500);
  }
};

/**
 * Get document generation history
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string) || 50;

    const generatedDocRepo = AppDataSource.getRepository(GeneratedDocument);
    const history = await generatedDocRepo.find({
      where: { tenantId, status: Not(GeneratedDocumentStatus.REVOKED) },
      relations: ['template', 'generator'],
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return sendSuccess(res, {
      history: history.map((doc) => ({
        documentId: doc.documentId,
        templateName: doc.template?.displayName || doc.documentName,
        fileName: path.basename(doc.filePath || doc.fileUrl || `${doc.documentName}.${doc.format}`),
        format: doc.format.toUpperCase(),
        status: doc.status,
        fileSizeBytes: doc.fileSizeBytes,
        generatedAt: doc.createdAt,
        generatedBy: doc.generator?.fullName || 'Unknown user',
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching history:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

/**
 * Download a generated document by ID
 */
export const downloadGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { documentId } = req.params;

    const generatedDocRepo = AppDataSource.getRepository(GeneratedDocument);
    const document = await generatedDocRepo.findOne({
      where: { documentId, tenantId },
    });

    if (!document || !document.filePath) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Generated document not found' }, 404);
    }

    const absolutePath = path.join(__dirname, '../..', document.filePath);
    if (!fs.existsSync(absolutePath)) {
      return sendError(res, { code: 'FILE_NOT_FOUND', message: 'Generated document file is no longer available' }, 404);
    }

    res.download(absolutePath, path.basename(document.filePath));
  } catch (error: any) {
    logger.error('Error downloading generated document:', error);
    return sendError(res, { code: 'DOWNLOAD_ERROR', message: error.message }, 500);
  }
};

/**
 * Soft-delete generated document history entry
 */
export const deleteGeneratedDocument = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { documentId } = req.params;

    const generatedDocRepo = AppDataSource.getRepository(GeneratedDocument);
    const document = await generatedDocRepo.findOne({
      where: { documentId, tenantId },
    });

    if (!document) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Generated document not found' }, 404);
    }

    document.status = GeneratedDocumentStatus.REVOKED;
    document.revokedAt = new Date();
    document.revocationReason = 'Deleted from document history';
    await generatedDocRepo.save(document);

    return sendSuccess(res, { message: 'Document removed from active history' });
  } catch (error: any) {
    logger.error('Error deleting generated document:', error);
    return sendError(res, { code: 'DELETE_ERROR', message: error.message }, 500);
  }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { templateId } = req.params;

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    const template = await templateRepo.findOne({
      where: { templateId, tenantId },
    });

    if (!template) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    return sendSuccess(res, { template });
  } catch (error: any) {
    logger.error('Error fetching template:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { templateId } = req.params;
    const { displayName, htmlTemplate, availableFields, description, category, isActive } = req.body;

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    const template = await templateRepo.findOne({
      where: { templateId, tenantId },
    });

    if (!template) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    // Update fields
    if (displayName !== undefined) template.displayName = displayName;
    if (htmlTemplate !== undefined) template.htmlTemplate = htmlTemplate;
    if (availableFields !== undefined) template.availableFields = availableFields;
    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (isActive !== undefined) template.isActive = isActive;

    // Increment version
    template.version += 1;

    await templateRepo.save(template);

    logger.info(`Template updated: ${template.displayName} (v${template.version})`);

    return sendSuccess(res, {
      message: 'Template updated successfully',
      template,
    });
  } catch (error: any) {
    logger.error('Error updating template:', error);
    return sendError(res, { code: 'UPDATE_ERROR', message: error.message }, 500);
  }
};

/**
 * Preview template with sample data
 */
export const previewTemplate = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { templateId } = req.params;
    const { sampleData } = req.body;

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
    const template = await templateRepo.findOne({
      where: { templateId, tenantId },
    });

    if (!template) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Template not found' }, 404);
    }

    // Merge sample data with defaults
    const mergedData = {
      companyName: 'Aurora HR',
      generatedDate: new Date().toLocaleDateString(),
      ...sampleData,
    };

    // Generate preview HTML
    let previewHtml = template.htmlTemplate;
    for (const [key, value] of Object.entries(mergedData)) {
      const placeholder = `{{${key}}}`;
      previewHtml = previewHtml.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    return sendSuccess(res, {
      html: previewHtml,
      template: {
        templateId: template.templateId,
        displayName: template.displayName,
        availableFields: template.availableFields,
      },
    });
  } catch (error: any) {
    logger.error('Error previewing template:', error);
    return sendError(res, { code: 'PREVIEW_ERROR', message: error.message }, 500);
  }
};

export default {
  getTemplates,
  generateDocument,
  getHistory,
  downloadGeneratedDocument,
  deleteGeneratedDocument,
  previewGeneratedDocument,
  getTemplateById,
  updateTemplate,
  previewTemplate,
};
