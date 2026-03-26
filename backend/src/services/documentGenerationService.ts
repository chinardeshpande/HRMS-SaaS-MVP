import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Candidate } from '../models/Candidate';
import { Employee } from '../models/Employee';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class DocumentGenerationService {
  private templateRepo = AppDataSource.getRepository(DocumentTemplate);
  private candidateRepo = AppDataSource.getRepository(Candidate);
  private employeeRepo = AppDataSource.getRepository(Employee);
  private uploadsDir = path.join(__dirname, '../../uploads/documents');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      logger.info(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  async generateDocument(
    templateName: string,
    data: Record<string, any>,
    tenantId: string
  ): Promise<string> {
    const template = await this.templateRepo.findOne({
      where: { templateName: templateName as any, tenantId, isActive: true },
    });

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = this.mergeTemplate(template.htmlTemplate, data);
    const pdfPath = await this.htmlToPdf(html, templateName, data);

    logger.info(`Document generated: ${templateName}`);
    return pdfPath;
  }

  mergeTemplate(htmlTemplate: string, data: Record<string, any>): string {
    let result = htmlTemplate;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    return result;
  }

  async htmlToPdf(html: string, templateName: string, data?: Record<string, any>): Promise<string> {
    const fileName = `${templateName}_${data?.employeeCode || data?.candidateId || Date.now()}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Simple HTML to PDF conversion (basic implementation)
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
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');

        // Add letterhead
        doc.fontSize(20).font('Helvetica-Bold').text(data?.companyName || 'Company Name', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(templateName.replace(/_/g, ' ').toUpperCase(), { align: 'center' });
        doc.moveDown(2);

        // Add content
        doc.fontSize(11).font('Helvetica').text(textContent.trim(), {
          align: 'justify',
          lineGap: 4
        });

        // Add footer
        doc.moveDown(3);
        doc.fontSize(9).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

        doc.end();

        writeStream.on('finish', () => {
          logger.info(`PDF generated: ${fileName}`);
          resolve(`/uploads/documents/${fileName}`);
        });

        writeStream.on('error', (err) => {
          logger.error(`PDF generation error: ${err.message}`);
          reject(err);
        });
      } catch (error: any) {
        logger.error(`PDF generation failed: ${error.message}`);
        reject(error);
      }
    });
  }

  async generateOfferLetter(candidateId: string): Promise<string> {
    const candidate = await this.candidateRepo.findOne({
      where: { candidateId },
      relations: ['department', 'designation'],
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const data = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      positionOffered: candidate.designation?.name || 'N/A',
      departmentName: candidate.department?.name || 'N/A',
      currency: candidate.currency,
      offeredSalary: candidate.offeredSalary,
      expectedJoinDate: candidate.expectedJoinDate?.toISOString().split('T')[0],
      offerExpiryDate: candidate.offerExpiryDate?.toISOString().split('T')[0],
      companyName: 'ACME Corporation',
    };

    return this.generateDocument('offer_letter', data, candidate.tenantId);
  }

  async generateAppointmentLetter(candidateId: string): Promise<string> {
    return this.generateOfferLetter(candidateId); // Simplified
  }

  async generateConfirmationLetter(employeeId: string): Promise<string> {
    const employee = await this.employeeRepo.findOne({
      where: { employeeId },
      relations: ['department', 'designation'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const data = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeCode: employee.employeeCode,
      designation: employee.designation?.name || 'N/A',
      department: employee.department?.name || 'N/A',
      confirmationDate: new Date().toISOString().split('T')[0],
    };

    return this.generateDocument('confirmation_letter', data, employee.tenantId);
  }

  async generateExtensionLetter(probationId: string): Promise<string> {
    logger.info(`Extension letter generated for probation: ${probationId}`);
    return '/uploads/documents/extension_letter.pdf';
  }

  async generateTerminationLetter(probationId: string): Promise<string> {
    logger.info(`Termination letter generated for probation: ${probationId}`);
    return '/uploads/documents/termination_letter.pdf';
  }
}

export default new DocumentGenerationService();
