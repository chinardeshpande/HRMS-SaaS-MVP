import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { GeneratedDocument, GeneratedDocumentStatus, GeneratedDocumentFormat } from '../models/GeneratedDocument';
import { Employee } from '../models/Employee';
import { Candidate } from '../models/Candidate';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { DocumentType } from '../models/enums/DocumentEnums';
import Handlebars from 'handlebars';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import logger from '../utils/logger';
import { storageProvider, tenantDocumentKey } from './storage';

// Note: For production, install puppeteer for better HTML to PDF conversion
// npm install puppeteer
// import puppeteer from 'puppeteer';

export interface DocumentGenerationOptions {
  templateId?: string;
  templateType: DocumentType;
  recipientId: string;
  recipientType: 'employee' | 'candidate';
  format?: GeneratedDocumentFormat;
  variables?: Record<string, any>;
  metadata?: {
    signatories?: Array<{
      name: string;
      designation: string;
      signature?: string;
    }>;
    validity?: {
      issueDate: string;
      expiryDate?: string;
    };
    customData?: Record<string, any>;
  };
  autoIssue?: boolean;
  sendEmail?: boolean;
}

export interface TemplateVariables {
  // Company variables
  company: {
    name: string;
    legalName?: string;
    logo?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    registrationNumber?: string;
    taxId?: string;
  };

  // Employee/Candidate variables
  recipient: {
    id: string;
    code?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    dateOfJoining?: string;
    department?: string;
    designation?: string;
    manager?: string;
    probationEndDate?: string;
    employmentType?: string;
  };

  // Document-specific variables
  document: {
    type: string;
    name: string;
    issueDate: string;
    documentNumber?: string;
    referenceNumber?: string;
  };

  // Custom variables
  custom?: Record<string, any>;
}

export class EnhancedDocumentService {
  private templateRepo: Repository<DocumentTemplate>;
  private generatedDocRepo: Repository<GeneratedDocument>;
  private employeeRepo: Repository<Employee>;
  private candidateRepo: Repository<Candidate>;
  private orgSettingsRepo: Repository<OrganizationSettings>;

  constructor() {
    this.templateRepo = AppDataSource.getRepository(DocumentTemplate);
    this.generatedDocRepo = AppDataSource.getRepository(GeneratedDocument);
    this.employeeRepo = AppDataSource.getRepository(Employee);
    this.candidateRepo = AppDataSource.getRepository(Candidate);
    this.orgSettingsRepo = AppDataSource.getRepository(OrganizationSettings);

    this.registerHandlebarsHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: string, format?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'long') {
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      return d.toLocaleDateString('en-US');
    });

    // Currency formatting helper
    Handlebars.registerHelper('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (text: string) => {
      return text ? text.toUpperCase() : '';
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function (this: any, arg1, arg2, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Number to words helper (simplified)
    Handlebars.registerHelper('numberToWords', (num: number) => {
      // Simplified implementation - in production use a library like 'number-to-words'
      return num.toString();
    });
  }

  /**
   * Generate a document
   */
  async generateDocument(
    tenantId: string,
    userId: string,
    options: DocumentGenerationOptions
  ): Promise<GeneratedDocument> {
    try {
      // Get template
      const template = options.templateId
        ? await this.templateRepo.findOne({
            where: { templateId: options.templateId, tenantId, isActive: true },
          })
        : await this.templateRepo.findOne({
            where: { templateName: options.templateType, tenantId, isActive: true },
          });

      if (!template) {
        throw new Error(`Template not found for type: ${options.templateType}`);
      }

      // Prepare template variables
      const variables = await this.prepareTemplateVariables(
        tenantId,
        options.recipientId,
        options.recipientType,
        options.variables
      );

      // Compile template
      const compiledTemplate = Handlebars.compile(template.htmlTemplate);
      const html = compiledTemplate(variables);

      // Generate document based on format
      const format = options.format || GeneratedDocumentFormat.PDF;
      const generatedFile = await this.generateFile(
        tenantId,
        html,
        format,
        template.templateName,
        variables
      );

      // Create GeneratedDocument record
      const generatedDoc = this.generatedDocRepo.create({
        tenantId,
        templateId: template.templateId,
        documentType: options.templateType,
        documentName: template.displayName,
        employeeId: options.recipientType === 'employee' ? options.recipientId : undefined,
        candidateId: options.recipientType === 'candidate' ? options.recipientId : undefined,
        generatedBy: userId,
        status: options.autoIssue ? GeneratedDocumentStatus.ISSUED : GeneratedDocumentStatus.GENERATED,
        format,
        filePath: generatedFile.storageKey,
        fileSizeBytes: generatedFile.size,
        metadata: {
          variables,
          issuedTo: {
            name: variables.recipient.fullName,
            email: variables.recipient.email,
            phone: variables.recipient.phone,
          },
          ...options.metadata,
        },
        issuedAt: options.autoIssue ? new Date() : undefined,
      });

      const savedDoc = await this.generatedDocRepo.save(generatedDoc);

      logger.info(`Document generated: ${savedDoc.documentId} - ${template.displayName}`);

      // Send email if requested
      if (options.sendEmail) {
        await this.sendDocumentEmail(savedDoc);
      }

      return savedDoc;
    } catch (error: any) {
      logger.error('Error generating document:', error);
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  }

  /**
   * Prepare template variables
   */
  private async prepareTemplateVariables(
    tenantId: string,
    recipientId: string,
    recipientType: 'employee' | 'candidate',
    customVariables?: Record<string, any>
  ): Promise<TemplateVariables> {
    // Get organization settings
    const orgSettings = await this.orgSettingsRepo.findOne({
      where: { tenantId },
    });

    // Get recipient details
    let recipient: any;
    if (recipientType === 'employee') {
      recipient = await this.employeeRepo.findOne({
        where: { employeeId: recipientId, tenantId },
        relations: ['department', 'designation', 'manager'],
      });
    } else {
      recipient = await this.candidateRepo.findOne({
        where: { candidateId: recipientId, tenantId },
      });
    }

    if (!recipient) {
      throw new Error(`Recipient not found: ${recipientId}`);
    }

    // Build variables object
    const variables: TemplateVariables = {
      company: {
        name: orgSettings?.companyName || 'Company Name',
        legalName: orgSettings?.companyName,
        logo: orgSettings?.logo || orgSettings?.branding?.logoUrl,
        address: orgSettings?.address,
        city: orgSettings?.city,
        state: orgSettings?.state,
        postalCode: orgSettings?.postalCode,
        country: orgSettings?.country,
        phone: orgSettings?.phone,
        email: orgSettings?.email,
        website: orgSettings?.website,
        registrationNumber: orgSettings?.registrationNumber,
        taxId: orgSettings?.taxId,
      },
      recipient: {
        id: recipientId,
        code: recipient.employeeCode || recipient.candidateId,
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        fullName: `${recipient.firstName} ${recipient.lastName}`,
        email: recipient.email,
        phone: recipient.phone,
        address: recipient.address,
        dateOfBirth: recipient.dateOfBirth,
        dateOfJoining: recipient.dateOfJoining || recipient.expectedJoiningDate,
        department: recipient.department?.departmentName,
        designation: recipient.designation?.name,
        manager: recipient.manager ? `${recipient.manager.firstName} ${recipient.manager.lastName}` : undefined,
        probationEndDate: recipient.probationEndDate,
        employmentType: recipient.employmentType,
      },
      document: {
        type: 'Document',
        name: 'Generated Document',
        issueDate: new Date().toISOString().split('T')[0],
        documentNumber: this.generateDocumentNumber(),
      },
      custom: customVariables,
    };

    return variables;
  }

  /**
   * Generate file (PDF or DOCX)
   */
  private async generateFile(
    tenantId: string,
    html: string,
    format: GeneratedDocumentFormat,
    templateName: string,
    variables: TemplateVariables
  ): Promise<{ storageKey: string; size: number }> {
    const fileName = `${templateName}_${variables.recipient.code}_${Date.now()}.${format}`;
    const content =
      format === GeneratedDocumentFormat.PDF
        ? await this.generatePDF(html, variables)
        : format === GeneratedDocumentFormat.DOCX
          ? this.generateDOCX(html, variables)
          : Buffer.from(html, 'utf-8');
    const contentType =
      format === GeneratedDocumentFormat.PDF
        ? 'application/pdf'
        : format === GeneratedDocumentFormat.DOCX
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/html; charset=utf-8';
    const storageKey = tenantDocumentKey(tenantId, 'generated-documents', fileName);
    await storageProvider.put(storageKey, content, contentType);
    return { storageKey, size: content.length };
  }

  /**
   * Generate PDF file
   * Note: This uses basic PDFKit. For production, use Puppeteer for better HTML rendering
   */
  private async generatePDF(html: string, variables: TemplateVariables): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add company logo if available
        if (variables.company.logo && fs.existsSync(variables.company.logo)) {
          doc.image(variables.company.logo, 50, 45, { width: 100 });
        }

        // Add company header
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(variables.company.name, 50, 45, { align: 'right' });

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(variables.company.address || '', { align: 'right' });

        doc.moveDown(2);

        // Add horizontal line
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .stroke();

        doc.moveDown();

        // Convert HTML to text (simplified - Puppeteer would be better)
        const textContent = html
          .replace(/<style>[\s\S]*?<\/style>/gi, '')
          .replace(/<script>[\s\S]*?<\/script>/gi, '')
          .replace(/<h1[^>]*>/gi, '\n\n')
          .replace(/<\/h1>/gi, '\n')
          .replace(/<h2[^>]*>/gi, '\n\n')
          .replace(/<\/h2>/gi, '\n')
          .replace(/<h3[^>]*>/gi, '\n')
          .replace(/<\/h3>/gi, '\n')
          .replace(/<p[^>]*>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<li[^>]*>/gi, '\n  • ')
          .replace(/<\/li>/gi, '')
          .replace(/<strong[^>]*>/gi, '')
          .replace(/<\/strong>/gi, '')
          .replace(/<em[^>]*>/gi, '')
          .replace(/<\/em>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        // Add content
        doc.fontSize(11).font('Helvetica').text(textContent, {
          align: 'justify',
          lineGap: 5,
        });

        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(
              `Generated by ${variables.company.name} | ${variables.document.issueDate}`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate DOCX file
   * Note: For production, use 'docx' or 'officegen' library
   */
  private generateDOCX(html: string, variables: TemplateVariables): Buffer {
    // Simplified implementation - save as HTML with .docx extension
    // In production, use a proper DOCX library like 'docx' npm package
    const docxContent = `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8">
        <title>${variables.document.name}</title>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    return Buffer.from(docxContent, 'utf-8');
  }

  /**
   * Generate unique document number
   */
  private generateDocumentNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DOC-${year}${month}-${random}`;
  }

  /**
   * Issue a generated document
   */
  async issueDocument(documentId: string, tenantId: string): Promise<GeneratedDocument> {
    const doc = await this.generatedDocRepo.findOne({
      where: { documentId, tenantId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    if (doc.status === GeneratedDocumentStatus.ISSUED) {
      throw new Error('Document already issued');
    }

    doc.status = GeneratedDocumentStatus.ISSUED;
    doc.issuedAt = new Date();

    return await this.generatedDocRepo.save(doc);
  }

  /**
   * Send document via email
   */
  private async sendDocumentEmail(doc: GeneratedDocument): Promise<void> {
    // TODO: Integrate with email service
    logger.info(`Email would be sent for document: ${doc.documentId}`);
  }

  /**
   * Get generated documents
   */
  async getGeneratedDocuments(
    tenantId: string,
    filters?: {
      employeeId?: string;
      candidateId?: string;
      documentType?: DocumentType;
      status?: GeneratedDocumentStatus;
    }
  ): Promise<GeneratedDocument[]> {
    const query = this.generatedDocRepo
      .createQueryBuilder('doc')
      .where('doc.tenantId = :tenantId', { tenantId })
      .orderBy('doc.createdAt', 'DESC');

    if (filters?.employeeId) {
      query.andWhere('doc.employeeId = :employeeId', { employeeId: filters.employeeId });
    }

    if (filters?.candidateId) {
      query.andWhere('doc.candidateId = :candidateId', { candidateId: filters.candidateId });
    }

    if (filters?.documentType) {
      query.andWhere('doc.documentType = :documentType', { documentType: filters.documentType });
    }

    if (filters?.status) {
      query.andWhere('doc.status = :status', { status: filters.status });
    }

    return await query.getMany();
  }

  /**
   * Revoke a document
   */
  async revokeDocument(documentId: string, tenantId: string, reason: string): Promise<GeneratedDocument> {
    const doc = await this.generatedDocRepo.findOne({
      where: { documentId, tenantId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    doc.status = GeneratedDocumentStatus.REVOKED;
    doc.revokedAt = new Date();
    doc.revocationReason = reason;

    return await this.generatedDocRepo.save(doc);
  }
}

export default new EnhancedDocumentService();
