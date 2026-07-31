import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Candidate } from '../models/Candidate';
import { Employee } from '../models/Employee';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { Tenant } from '../models/Tenant';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { storageProvider, tenantDocumentKey } from './storage';

export interface GeneratedDocumentOutput {
  storageKey: string;
  fileName: string;
  buffer: Buffer;
}

interface TenantDocumentBrand {
  companyName: string;
  logoUrl: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export class DocumentGenerationService {
  private templateRepo = AppDataSource.getRepository(DocumentTemplate);
  private candidateRepo = AppDataSource.getRepository(Candidate);
  private employeeRepo = AppDataSource.getRepository(Employee);
  private organizationSettingsRepo = AppDataSource.getRepository(OrganizationSettings);
  private tenantRepo = AppDataSource.getRepository(Tenant);
  async generateDocument(
    templateName: string,
    data: Record<string, any>,
    tenantId: string
  ): Promise<GeneratedDocumentOutput> {
    const template = await this.templateRepo.findOne({
      where: { templateName: templateName as any, tenantId, isActive: true },
    });

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const brandedHtml = await this.generatePreviewHtml(templateName, data, tenantId);
    const generatedDocument = await this.htmlToPdf(brandedHtml, templateName, data, tenantId);

    logger.info(`Document generated: ${templateName}`);
    return generatedDocument;
  }

  async generatePreviewHtml(
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

    const brand = await this.getTenantBranding(tenantId);
    const mergedHtml = this.mergeTemplate(template.htmlTemplate, {
      ...data,
      companyName: data.companyName || brand.companyName,
      generatedDate: data.generatedDate || new Date().toLocaleDateString(),
    });

    return this.wrapWithTenantBranding(mergedHtml, template.displayName, brand);
  }

  mergeTemplate(htmlTemplate: string, data: Record<string, any>): string {
    let result = htmlTemplate;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    return result;
  }

  private async getTenantBranding(tenantId: string): Promise<TenantDocumentBrand> {
    const [settings, tenant] = await Promise.all([
      this.organizationSettingsRepo.findOne({ where: { tenantId } }),
      this.tenantRepo.findOne({ where: { tenantId } }),
    ]);

    const branding = (settings?.branding || {}) as Partial<OrganizationSettings['branding']>;
    const companyName = settings?.companyName || tenant?.companyName || 'Company';
    const logoUrl = settings?.logo || branding.logoUrl || tenant?.logoUrl || '';

    return {
      companyName,
      logoUrl,
      email: settings?.email || '',
      phone: settings?.phone || '',
      website: settings?.website || '',
      address: [settings?.address, settings?.city, settings?.state, settings?.postalCode, settings?.country]
        .filter(Boolean)
        .join(', '),
      primaryColor: branding.primaryColor || tenant?.primaryColor || '#2563eb',
      secondaryColor: branding.secondaryColor || '#0f172a',
      accentColor: branding.accentColor || branding.secondaryColor || '#0ea5e9',
    };
  }

  private resolveLogoPath(logoUrl?: string): string | null {
    if (!logoUrl || logoUrl.startsWith('http') || logoUrl.startsWith('data:')) return null;

    const normalized = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
    const publicPath = path.join(__dirname, '../../../frontend-web/public', normalized);
    const backendPath = path.join(__dirname, '../..', normalized);

    if (fs.existsSync(publicPath)) return publicPath;
    if (fs.existsSync(backendPath)) return backendPath;

    return null;
  }

  private logoSourceForHtml(logoUrl?: string): string {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) return logoUrl;
    return logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
  }

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private wrapWithTenantBranding(html: string, documentTitle: string, brand: TenantDocumentBrand): string {
    const logoSource = this.logoSourceForHtml(brand.logoUrl);
    const logoBlock = logoSource
      ? `<img src="${this.escapeHtml(logoSource)}" alt="${this.escapeHtml(brand.companyName)} logo" />`
      : `<div class="tenant-initials">${this.escapeHtml(brand.companyName.slice(0, 2).toUpperCase())}</div>`;

    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --tenant-primary: ${this.escapeHtml(brand.primaryColor)};
        --tenant-secondary: ${this.escapeHtml(brand.secondaryColor)};
        --tenant-accent: ${this.escapeHtml(brand.accentColor)};
      }
      body {
        margin: 0;
        background: #f8fafc;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
      }
      .document-page {
        width: 794px;
        min-height: 1123px;
        margin: 0 auto;
        background: #ffffff;
        box-sizing: border-box;
        padding: 48px 56px;
      }
      .tenant-letterhead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 4px solid var(--tenant-primary);
        padding-bottom: 18px;
        margin-bottom: 30px;
      }
      .tenant-brand {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }
      .tenant-logo {
        width: 78px;
        height: 78px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #ffffff;
      }
      .tenant-logo img {
        max-width: 64px;
        max-height: 64px;
        object-fit: contain;
      }
      .tenant-initials {
        color: var(--tenant-primary);
        font-size: 22px;
        font-weight: 800;
      }
      .tenant-name {
        color: var(--tenant-secondary);
        font-size: 24px;
        font-weight: 800;
        line-height: 1.1;
      }
      .tenant-address {
        color: #6b7280;
        font-size: 11px;
        line-height: 1.45;
        margin-top: 6px;
        max-width: 420px;
      }
      .document-title {
        color: var(--tenant-primary);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-align: right;
        white-space: nowrap;
      }
      .document-body {
        font-size: 13px;
        line-height: 1.65;
      }
      .document-body h1,
      .document-body h2,
      .document-body h3 {
        color: var(--tenant-secondary);
        line-height: 1.2;
      }
      .document-body h1 {
        font-size: 22px;
      }
      .document-footer {
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 10px;
        margin-top: 54px;
        padding-top: 14px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
      }
    </style>
  </head>
  <body>
    <article class="document-page">
      <header class="tenant-letterhead">
        <div class="tenant-brand">
          <div class="tenant-logo">${logoBlock}</div>
          <div>
            <div class="tenant-name">${this.escapeHtml(brand.companyName)}</div>
            ${brand.address ? `<div class="tenant-address">${this.escapeHtml(brand.address)}</div>` : ''}
          </div>
        </div>
        <div class="document-title">${this.escapeHtml(documentTitle)}</div>
      </header>
      <main class="document-body">${html}</main>
      <footer class="document-footer">
        <span>${this.escapeHtml(brand.companyName)}</span>
        <span>${[brand.email, brand.phone, brand.website].filter(Boolean).map((item) => this.escapeHtml(item)).join(' | ')}</span>
      </footer>
    </article>
  </body>
</html>`;
  }

  async htmlToPdf(
    html: string,
    templateName: string,
    data: Record<string, any>,
    tenantId: string
  ): Promise<GeneratedDocumentOutput> {
    const fileName = `${templateName}_${data?.employeeCode || data?.candidateId || Date.now()}.pdf`;
    const brand = await this.getTenantBranding(tenantId);
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

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

        const logoPath = this.resolveLogoPath(brand.logoUrl);
        const logoIsRaster = logoPath && /\.(png|jpe?g)$/i.test(logoPath);
        const left = doc.page.margins.left;
        const top = doc.page.margins.top;

        if (logoIsRaster) {
          doc.image(logoPath, left, top, { fit: [62, 62] });
        } else {
          doc
            .roundedRect(left, top, 62, 62, 8)
            .strokeColor('#e5e7eb')
            .stroke()
            .fillColor(brand.primaryColor)
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(brand.companyName.slice(0, 2).toUpperCase(), left, top + 21, { width: 62, align: 'center' });
        }

        doc
          .fillColor(brand.secondaryColor)
          .fontSize(18)
          .font('Helvetica-Bold')
          .text(brand.companyName, left + 78, top + 8, { width: 310 });

        if (brand.address) {
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .font('Helvetica')
            .text(brand.address, left + 78, top + 32, { width: 310, lineGap: 2 });
        }

        doc
          .fillColor(brand.primaryColor)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(templateName.replace(/_/g, ' ').toUpperCase(), 390, top + 14, { width: 150, align: 'right' });

        doc
          .moveTo(left, top + 78)
          .lineTo(doc.page.width - doc.page.margins.right, top + 78)
          .lineWidth(3)
          .strokeColor(brand.primaryColor)
          .stroke();

        doc.y = top + 104;

        // Add content
        doc.fillColor('#111827').fontSize(11).font('Helvetica').text(textContent.trim(), {
          align: 'justify',
          lineGap: 4
        });

        // Add footer
        doc.moveDown(3);
        doc.fontSize(9).fillColor('#6b7280').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });

        doc.end();
      } catch (error: any) {
        logger.error(`PDF generation failed: ${error.message}`);
        reject(error);
      }
    });
    const storageKey = tenantDocumentKey(tenantId, 'generated-documents', fileName);
    await storageProvider.put(storageKey, buffer, 'application/pdf');
    logger.info(`PDF generated: ${storageKey}`);
    return { storageKey, fileName: storageKey.split('/').pop()!, buffer };
  }

  async generateOfferLetter(candidateId: string): Promise<GeneratedDocumentOutput> {
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

  async generateAppointmentLetter(candidateId: string): Promise<GeneratedDocumentOutput> {
    return this.generateOfferLetter(candidateId); // Simplified
  }

  async generateConfirmationLetter(employeeId: string): Promise<GeneratedDocumentOutput> {
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
    throw new Error(`Extension letter generation is not implemented for probation ${probationId}`);
  }

  async generateTerminationLetter(probationId: string): Promise<string> {
    throw new Error(`Termination letter generation is not implemented for probation ${probationId}`);
  }
}

export default new DocumentGenerationService();
