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
      },
      {
        templateName: DocumentType.PROBATION_EXTENSION_LETTER,
        displayName: 'Probation Extension Letter',
        category: 'probation',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #f39c12; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .highlight { background-color: #fff3cd; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Probation Period Extension</p>
  </div>

  <div class="content">
    <p>Date: {{extensionDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p><strong>Subject: Extension of Probation Period</strong></p>

    <p>This letter is to inform you that your probation period, which was scheduled to end on <strong>{{originalEndDate}}</strong>, is being extended.</p>

    <div class="highlight">
      <p><strong>Extension Details:</strong></p>
      <ul>
        <li>Original Probation End Date: {{originalEndDate}}</li>
        <li>New Probation End Date: {{newEndDate}}</li>
        <li>Extension Period: {{extensionPeriod}}</li>
      </ul>
    </div>

    <p><strong>Reason for Extension:</strong></p>
    <p>{{extensionReason}}</p>

    <p><strong>Areas for Improvement:</strong></p>
    <p>{{areasForImprovement}}</p>

    <p>During this extension period, we expect you to work on the identified areas and demonstrate improvement in your performance. Regular reviews will be conducted to assess your progress.</p>

    <p>Your confirmation will be reconsidered at the end of the extended probation period based on your performance.</p>

    <p>Please feel free to discuss any concerns with your reporting manager or the HR department.</p>

    <div class="signature" style="margin-top: 50px;">
      <p>Sincerely,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'extensionDate', 'firstName', 'lastName', 'originalEndDate', 'newEndDate', 'extensionPeriod', 'extensionReason', 'areasForImprovement'],
        isActive: true,
        version: 1,
        description: 'Letter for extending employee probation period'
      },
      {
        templateName: DocumentType.PROMOTION_LETTER,
        displayName: 'Promotion Letter',
        category: 'promotion',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #9b59b6; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .celebration { background-color: #f8f3ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 10px; border: 1px solid #ddd; }
    .header-cell { background-color: #f0f0f0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Letter of Promotion</p>
  </div>

  <div class="celebration">
    <h2 style="color: #9b59b6; margin: 0;">Congratulations!</h2>
  </div>

  <div class="content">
    <p>Date: {{promotionDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p>We are delighted to inform you that you have been promoted to the position of <strong>{{newPosition}}</strong>, effective {{effectiveDate}}.</p>

    <p>This promotion is in recognition of your outstanding performance, dedication, and significant contributions to {{companyName}}.</p>

    <h3>Promotion Details:</h3>
    <table>
      <tr>
        <td class="header-cell">Current Position</td>
        <td>{{currentPosition}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Position</td>
        <td>{{newPosition}}</td>
      </tr>
      <tr>
        <td class="header-cell">Current Department</td>
        <td>{{currentDepartment}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Department</td>
        <td>{{newDepartment}}</td>
      </tr>
      <tr>
        <td class="header-cell">Effective Date</td>
        <td>{{effectiveDate}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Annual CTC</td>
        <td>{{currency}} {{newSalary}}</td>
      </tr>
    </table>

    <h3>New Responsibilities:</h3>
    <p>{{newResponsibilities}}</p>

    <p>We are confident that you will excel in your new role and continue to make valuable contributions to our organization.</p>

    <p>Once again, congratulations on your well-deserved promotion!</p>

    <div class="signature" style="margin-top: 50px;">
      <p>Best Regards,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'promotionDate', 'firstName', 'lastName', 'currentPosition', 'newPosition', 'currentDepartment', 'newDepartment', 'effectiveDate', 'currency', 'newSalary', 'newResponsibilities'],
        isActive: true,
        version: 1,
        description: 'Letter announcing employee promotion'
      },
      {
        templateName: DocumentType.TRANSFER_LETTER,
        displayName: 'Transfer Letter',
        category: 'transfer',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    td { padding: 10px; border: 1px solid #ddd; }
    .header-cell { background-color: #e8f4f8; font-weight: bold; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Internal Transfer Letter</p>
  </div>

  <div class="content">
    <p>Date: {{transferDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p><strong>Subject: Internal Transfer Notification</strong></p>

    <p>This letter confirms your internal transfer within {{companyName}}, effective {{effectiveDate}}.</p>

    <h3>Transfer Details:</h3>
    <table>
      <tr>
        <td class="header-cell">Employee Code</td>
        <td>{{employeeCode}}</td>
      </tr>
      <tr>
        <td class="header-cell">Current Department</td>
        <td>{{currentDepartment}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Department</td>
        <td>{{newDepartment}}</td>
      </tr>
      <tr>
        <td class="header-cell">Current Location</td>
        <td>{{currentLocation}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Location</td>
        <td>{{newLocation}}</td>
      </tr>
      <tr>
        <td class="header-cell">Current Reporting Manager</td>
        <td>{{currentManager}}</td>
      </tr>
      <tr>
        <td class="header-cell">New Reporting Manager</td>
        <td>{{newManager}}</td>
      </tr>
      <tr>
        <td class="header-cell">Effective Date</td>
        <td>{{effectiveDate}}</td>
      </tr>
    </table>

    <p><strong>Transfer Reason:</strong> {{transferReason}}</p>

    <p>Your position, grade, and compensation remain unchanged unless otherwise notified. Please coordinate with both your current and new managers for a smooth transition.</p>

    <p>We wish you all the best in your new role and location.</p>

    <div class="signature" style="margin-top: 50px;">
      <p>Sincerely,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'transferDate', 'firstName', 'lastName', 'employeeCode', 'currentDepartment', 'newDepartment', 'currentLocation', 'newLocation', 'currentManager', 'newManager', 'effectiveDate', 'transferReason'],
        isActive: true,
        version: 1,
        description: 'Letter for internal employee transfer'
      },
      {
        templateName: DocumentType.RESIGNATION_ACCEPTANCE,
        displayName: 'Resignation Acceptance Letter',
        category: 'exit',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #e67e22; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .info-box { background-color: #fff5e6; padding: 15px; border-left: 4px solid #e67e22; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Resignation Acceptance</p>
  </div>

  <div class="content">
    <p>Date: {{acceptanceDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p><strong>Subject: Acceptance of Resignation</strong></p>

    <p>This letter acknowledges receipt of your resignation letter dated {{resignationDate}}, and we accept your resignation from the position of <strong>{{position}}</strong>.</p>

    <div class="info-box">
      <p><strong>Exit Details:</strong></p>
      <ul>
        <li>Resignation Date: {{resignationDate}}</li>
        <li>Notice Period: {{noticePeriod}} days</li>
        <li>Last Working Day: {{lastWorkingDay}}</li>
      </ul>
    </div>

    <p><strong>Exit Formalities:</strong></p>
    <ol>
      <li>Please ensure handover of all responsibilities to {{handoverPerson}}</li>
      <li>Return all company assets including laptop, access cards, and documents</li>
      <li>Complete the exit clearance form</li>
      <li>Attend the exit interview scheduled by HR</li>
      <li>Settle all pending dues and advances</li>
    </ol>

    <p>Your Full and Final (F&F) settlement will be processed within 45 days from your last working day, subject to completion of all exit formalities.</p>

    <p>We appreciate your contributions during your tenure with {{companyName}} and wish you success in your future endeavors.</p>

    <div class="signature" style="margin-top: 50px;">
      <p>Best Regards,</p>
      <p><strong>HR Department</strong><br>{{companyName}}</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'acceptanceDate', 'firstName', 'lastName', 'resignationDate', 'position', 'noticePeriod', 'lastWorkingDay', 'handoverPerson'],
        isActive: true,
        version: 1,
        description: 'Formal acceptance of employee resignation'
      },
      {
        templateName: DocumentType.EXPERIENCE_LETTER,
        displayName: 'Experience Letter',
        category: 'exit',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #16a085; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; text-align: justify; }
    .certificate-border { border: 3px solid #16a085; padding: 30px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="certificate-border">
    <div class="letterhead">
      <h1>{{companyName}}</h1>
      <p style="font-size: 18px; font-weight: bold; color: #16a085;">EXPERIENCE CERTIFICATE</p>
    </div>

    <div class="content">
      <p>Date: {{issueDate}}</p>

      <p><strong>To Whom It May Concern,</strong></p>

      <p>This is to certify that <strong>{{firstName}} {{lastName}}</strong> (Employee Code: {{employeeCode}}) worked with {{companyName}} as <strong>{{designation}}</strong> in the {{department}} department.</p>

      <p><strong>Employment Details:</strong></p>
      <ul>
        <li>Date of Joining: {{joiningDate}}</li>
        <li>Date of Relieving: {{relievingDate}}</li>
        <li>Total Experience: {{totalExperience}}</li>
        <li>Department: {{department}}</li>
        <li>Designation: {{designation}}</li>
      </ul>

      <p><strong>Key Responsibilities:</strong></p>
      <p>{{responsibilities}}</p>

      <p>During the tenure with us, {{firstName}} demonstrated professionalism and dedication to work. We found {{gender}} to be sincere, hardworking, and committed to responsibilities.</p>

      <p>We wish {{gender}} all the best for future endeavors.</p>

      <div class="signature" style="margin-top: 60px;">
        <table style="width: 100%; border: none;">
          <tr style="border: none;">
            <td style="border: none; width: 50%;"></td>
            <td style="border: none; width: 50%; text-align: center;">
              <p>_____________________</p>
              <p><strong>Authorized Signatory</strong></p>
              <p>HR Department</p>
              <p>{{companyName}}</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'issueDate', 'firstName', 'lastName', 'employeeCode', 'designation', 'department', 'joiningDate', 'relievingDate', 'totalExperience', 'responsibilities', 'gender'],
        isActive: true,
        version: 1,
        description: 'Official experience certificate for former employees'
      },
      {
        templateName: DocumentType.RELIEVING_LETTER,
        displayName: 'Relieving Letter',
        category: 'exit',
        htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #c0392b; padding-bottom: 10px; }
    .letterhead { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .clearance-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
    .clearance-table td { padding: 8px; border: 1px solid #ddd; }
    .clearance-table th { padding: 10px; border: 1px solid #ddd; background-color: #f0f0f0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="letterhead">
    <h1>{{companyName}}</h1>
    <p>Relieving Letter</p>
  </div>

  <div class="content">
    <p>Date: {{relievingDate}}</p>
    <p>Dear {{firstName}} {{lastName}},</p>

    <p><strong>Subject: Relieving from Employment</strong></p>

    <p>This is to confirm that you have been relieved from your duties at {{companyName}} effective <strong>{{lastWorkingDay}}</strong>.</p>

    <p><strong>Employment Summary:</strong></p>
    <ul>
      <li>Employee Code: {{employeeCode}}</li>
      <li>Designation: {{designation}}</li>
      <li>Department: {{department}}</li>
      <li>Date of Joining: {{joiningDate}}</li>
      <li>Last Working Day: {{lastWorkingDay}}</li>
      <li>Reason for Leaving: {{reasonForLeaving}}</li>
    </ul>

    <p><strong>Exit Clearance Status:</strong></p>
    <table class="clearance-table">
      <thead>
        <tr>
          <th>Department</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>IT Department</td><td>{{itClearance}}</td></tr>
        <tr><td>Finance Department</td><td>{{financeClearance}}</td></tr>
        <tr><td>Admin Department</td><td>{{adminClearance}}</td></tr>
        <tr><td>Reporting Manager</td><td>{{managerClearance}}</td></tr>
      </tbody>
    </table>

    <p>All company assets have been returned, and exit formalities have been completed. You have no pending dues with the company.</p>

    <p>We thank you for your services and wish you success in all your future endeavors.</p>

    <div class="signature" style="margin-top: 50px;">
      <p>For {{companyName}},</p>
      <br><br>
      <p>_____________________</p>
      <p><strong>Authorized Signatory</strong></p>
      <p>HR Department</p>
    </div>
  </div>
</body>
</html>`,
        availableFields: ['companyName', 'relievingDate', 'firstName', 'lastName', 'lastWorkingDay', 'employeeCode', 'designation', 'department', 'joiningDate', 'reasonForLeaving', 'itClearance', 'financeClearance', 'adminClearance', 'managerClearance'],
        isActive: true,
        version: 1,
        description: 'Final relieving letter with clearance confirmation'
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
