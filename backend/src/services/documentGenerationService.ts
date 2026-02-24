import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Candidate } from '../models/Candidate';
import { Employee } from '../models/Employee';
import logger from '../utils/logger';

export class DocumentGenerationService {
  private templateRepo = AppDataSource.getRepository(DocumentTemplate);
  private candidateRepo = AppDataSource.getRepository(Candidate);
  private employeeRepo = AppDataSource.getRepository(Employee);

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
    const pdfPath = await this.htmlToPdf(html, templateName);

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

  async htmlToPdf(html: string, templateName: string): Promise<string> {
    // Placeholder implementation - would use pdfkit or puppeteer
    const filePath = `/uploads/documents/${templateName}_${Date.now()}.pdf`;
    logger.info(`PDF would be generated at: ${filePath}`);
    return filePath;
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
      positionOffered: candidate.designation?.designationName || 'N/A',
      departmentName: candidate.department?.departmentName || 'N/A',
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
      designation: employee.designation?.designationName || 'N/A',
      department: employee.department?.departmentName || 'N/A',
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
