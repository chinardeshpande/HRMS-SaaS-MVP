import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Employee } from '../models/Employee';
import documentGenerationService from '../services/documentGenerationService';
import { sendSuccess, sendError } from '../utils/responses';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

/**
 * Get all available document templates
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const templateRepo = AppDataSource.getRepository(DocumentTemplate);
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

    // Get employee data if employeeId provided
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
          designation: employee.designation?.name,
        };
      }
    }

    // Merge employee data with provided variables
    const mergedData = {
      ...employeeData,
      ...variables,
      companyName: 'Aurora HR', // TODO: Get from tenant settings
      generatedDate: new Date().toLocaleDateString(),
    };

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

/**
 * Get document generation history
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = parseInt(req.query.limit as string) || 50;

    // TODO: Implement GeneratedDocument model and repository
    // For now, return empty array
    return sendSuccess(res, {
      history: [],
      message: 'Document history feature coming soon',
    });
  } catch (error: any) {
    logger.error('Error fetching history:', error);
    return sendError(res, { code: 'FETCH_ERROR', message: error.message }, 500);
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
  getTemplateById,
  updateTemplate,
  previewTemplate,
};
