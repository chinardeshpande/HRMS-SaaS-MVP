import { AppDataSource } from '../config/database';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Tenant } from '../models/Tenant';
import { DocumentType } from '../models/enums/DocumentEnums';
import logger from '../utils/logger';

async function seedDocumentTemplates() {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const templateRepo = AppDataSource.getRepository(DocumentTemplate);

    // Get the first tenant (or create one if needed)
    let tenant = await tenantRepo.findOne({ where: {} });

    if (!tenant) {
      logger.error('No tenant found. Please seed tenants first.');
      process.exit(1);
    }

    const templates = [
      {
        templateName: DocumentType.OFFER_LETTER,
        displayName: 'Offer Letter',
        category: 'offer',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .signature { margin-top: 50px; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 8px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Offer of Employment</p>
  </div>

  <div class="content">
    <p>Date: {{offerDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p>We are pleased to offer you the position of <strong>{{positionOffered}}</strong> in the {{departmentName}} department at {{companyName}}.</p>

    <h3>Position Details:</h3>
    <table>
      <tr><td><strong>Position:</strong></td><td>{{positionOffered}}</td></tr>
      <tr><td><strong>Department:</strong></td><td>{{departmentName}}</td></tr>
      <tr><td><strong>Employment Type:</strong></td><td>{{employmentType}}</td></tr>
      <tr><td><strong>Work Location:</strong></td><td>{{workLocation}}</td></tr>
      <tr><td><strong>Annual Salary:</strong></td><td>{{currency}} {{offeredSalary}}</td></tr>
      <tr><td><strong>Expected Join Date:</strong></td><td>{{expectedJoinDate}}</td></tr>
    </table>

    <h3>Key Terms:</h3>
    <ul>
      <li>This offer is contingent upon successful background verification</li>
      <li>You will be on probation for 90 days from your joining date</li>
      <li>Notice period: 30 days after confirmation</li>
      <li>Benefits include health insurance, paid time off, and professional development opportunities</li>
    </ul>

    <p>Please sign and return this offer letter by <strong>{{offerExpiryDate}}</strong> to confirm your acceptance.</p>

    <p>We look forward to welcoming you to our team!</p>

    <div class="signature">
      <p>Sincerely,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'offerDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'employmentType', 'workLocation', 'currency', 'offeredSalary', 'expectedJoinDate', 'offerExpiryDate'],
        isActive: true,
        version: 1,
        description: 'Standard offer letter template for new candidates'
      },
      {
        templateName: DocumentType.APPOINTMENT_LETTER,
        displayName: 'Appointment Letter',
        category: 'appointment',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 8px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Letter of Appointment</p>
  </div>

  <div class="content">
    <p>Date: {{appointmentDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p>Further to your acceptance of our offer, we are pleased to appoint you as <strong>{{positionOffered}}</strong> in the {{departmentName}} department, effective {{joinDate}}.</p>

    <h3>Terms of Employment:</h3>
    <table>
      <tr><td><strong>Employee Code:</strong></td><td>{{employeeCode}}</td></tr>
      <tr><td><strong>Position:</strong></td><td>{{positionOffered}}</td></tr>
      <tr><td><strong>Department:</strong></td><td>{{departmentName}}</td></tr>
      <tr><td><strong>Reporting Manager:</strong></td><td>{{reportingManager}}</td></tr>
      <tr><td><strong>Date of Joining:</strong></td><td>{{joinDate}}</td></tr>
      <tr><td><strong>Probation Period:</strong></td><td>90 days</td></tr>
      <tr><td><strong>Annual CTC:</strong></td><td>{{currency}} {{offeredSalary}}</td></tr>
    </table>

    <h3>Conditions of Employment:</h3>
    <ol>
      <li>You will be required to comply with all company policies and procedures</li>
      <li>You must maintain confidentiality of company information</li>
      <li>Performance will be reviewed at 30, 60, and 85 days during probation</li>
      <li>Confirmation of employment is subject to satisfactory performance</li>
    </ol>

    <p>Please sign below to acknowledge acceptance of this appointment.</p>

    <p>Welcome to {{companyName}}!</p>

    <div class="signature" style="margin-top: 50px;">
      <table style="border: none;">
        <tr style="border: none;">
          <td style="border: none; width: 50%;">
            <p>_____________________<br>Employee Signature<br>Date: ___________</p>
          </td>
          <td style="border: none; width: 50%;">
            <p>_____________________<br>HR Manager<br>{{companyName}}</p>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'appointmentDate', 'firstName', 'lastName', 'positionOffered', 'departmentName', 'joinDate', 'employeeCode', 'reportingManager', 'currency', 'offeredSalary'],
        isActive: true,
        version: 1,
        description: 'Official appointment letter issued upon joining'
      },
      {
        templateName: DocumentType.CONFIRMATION_LETTER,
        displayName: 'Confirmation Letter',
        category: 'confirmation',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #27ae60; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Probation Confirmation Letter</p>
  </div>

  <div class="content">
    <p>Date: {{confirmationDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p><strong>Subject: Confirmation of Employment</strong></p>

    <p>We are pleased to inform you that your performance during the probation period has been satisfactory, and we are confirming your employment with {{companyName}} effective {{confirmationDate}}.</p>

    <p><strong>Employee Details:</strong></p>
    <ul>
      <li>Employee Code: {{employeeCode}}</li>
      <li>Position: {{designation}}</li>
      <li>Department: {{department}}</li>
      <li>Date of Joining: {{joinDate}}</li>
      <li>Confirmation Date: {{confirmationDate}}</li>
    </ul>

    <p>As a confirmed employee, you are now eligible for all benefits as per company policy, including:</p>
    <ul>
      <li>Annual performance reviews and increments</li>
      <li>Leave entitlements as per policy</li>
      <li>Employee benefits program</li>
      <li>Career development opportunities</li>
    </ul>

    <p>We appreciate your contributions and look forward to your continued success with us.</p>

    <p>Congratulations!</p>

    <div class="signature" style="margin-top: 50px;">
      <p>Sincerely,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'confirmationDate', 'firstName', 'lastName', 'employeeCode', 'designation', 'department', 'joinDate'],
        isActive: true,
        version: 1,
        description: 'Confirmation letter after successful probation completion'
      },
      {
        templateName: DocumentType.NDA,
        displayName: 'Non-Disclosure Agreement',
        category: 'policy',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; text-align: center; }
    .content { margin: 20px 0; text-align: justify; }
  </style>
</head>
<body>
  <h1>NON-DISCLOSURE AGREEMENT</h1>

  <div class="content">
    <p>This Non-Disclosure Agreement ("Agreement") is entered into as of {{signDate}} between {{companyName}} ("Company") and {{firstName}} {{lastName}} ("Employee").</p>

    <h3>1. Definition of Confidential Information</h3>
    <p>Confidential Information includes all non-public information relating to the Company's business, including but not limited to trade secrets, customer lists, financial data, technical information, business strategies, and proprietary processes.</p>

    <h3>2. Obligations</h3>
    <p>Employee agrees to:</p>
    <ul>
      <li>Keep all Confidential Information strictly confidential</li>
      <li>Not disclose Confidential Information to any third party without prior written consent</li>
      <li>Use Confidential Information only for employment purposes</li>
      <li>Return all Confidential Information upon termination of employment</li>
    </ul>

    <h3>3. Duration</h3>
    <p>This obligation continues for 2 years after termination of employment.</p>

    <h3>4. Legal Remedies</h3>
    <p>Breach of this Agreement may result in immediate termination and legal action for damages.</p>

    <div class="signature" style="margin-top: 50px;">
      <table style="width: 100%; border: none;">
        <tr style="border: none;">
          <td style="border: none; width: 50%;">
            <p>_____________________<br>{{firstName}} {{lastName}}<br>Date: ___________</p>
          </td>
          <td style="border: none; width: 50%;">
            <p>_____________________<br>For {{companyName}}<br>Date: ___________</p>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'signDate', 'firstName', 'lastName'],
        isActive: true,
        version: 1,
        description: 'Standard NDA for all employees'
      }
    ];

    for (const templateData of templates) {
      // Check if template already exists
      const existing = await templateRepo.findOne({
        where: {
          tenantId: tenant.tenantId,
          templateName: templateData.templateName
        }
      });

      if (existing) {
        logger.info(`Template ${templateData.displayName} already exists, skipping...`);
        continue;
      }

      const template = templateRepo.create({
        ...templateData,
        tenantId: tenant.tenantId
      });

      await templateRepo.save(template);
      logger.info(`✅ Created template: ${templateData.displayName}`);
    }

    logger.info('\n✅ Document template seeding completed successfully!');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error seeding document templates:', error);
    process.exit(1);
  }
}

seedDocumentTemplates();
