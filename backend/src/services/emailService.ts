import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { AppDataSource } from '../config/database';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { OutboundEmailLog } from '../models/OutboundEmailLog';
import logger from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tenantId?: string;
  purpose?: string;
  metadata?: Record<string, any>;
}

interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  provider: 'tenant' | 'platform';
}

class EmailService {
  isConfigured(): boolean {
    return Boolean(config.smtp.host && config.smtp.user && config.smtp.password && config.smtp.from);
  }

  async isConfiguredForTenant(tenantId?: string): Promise<boolean> {
    try {
      await this.resolveSmtpConfig(tenantId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    let resolvedConfig: ResolvedSmtpConfig | null = null;

    try {
      resolvedConfig = await this.resolveSmtpConfig(options.tenantId);
      const transporter = this.createTransporter(resolvedConfig);

      const info = await transporter.sendMail({
        from: resolvedConfig.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      await this.recordEmailEvent(options, resolvedConfig, 'sent', info.messageId);
      logger.info(`Email sent via ${resolvedConfig.provider} SMTP: ${info.messageId}`);
    } catch (error) {
      await this.recordEmailEvent(
        options,
        resolvedConfig || this.getPlatformSmtpConfig(),
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Unknown email error'
      );
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  private async resolveSmtpConfig(tenantId?: string): Promise<ResolvedSmtpConfig> {
    const tenantConfig = await this.getTenantSmtpConfig(tenantId);
    if (tenantConfig) {
      return tenantConfig;
    }

    const platformConfig = this.getPlatformSmtpConfig();
    if (this.isSmtpComplete(platformConfig)) {
      return platformConfig;
    }

    throw new Error('SMTP is not configured');
  }

  private async getTenantSmtpConfig(tenantId?: string): Promise<ResolvedSmtpConfig | null> {
    if (!tenantId || !AppDataSource.isInitialized) {
      return null;
    }

    const settings = await AppDataSource.getRepository(OrganizationSettings).findOne({ where: { tenantId } });
    const smtpConfig = settings?.smtpConfig;
    if (!smtpConfig?.enabled) {
      return null;
    }

    const resolved: ResolvedSmtpConfig = {
      host: smtpConfig.host,
      port: Number(smtpConfig.port || 587),
      secure: Boolean(smtpConfig.secure),
      user: smtpConfig.username,
      password: smtpConfig.password,
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      provider: 'tenant',
    };

    return this.isSmtpComplete(resolved) ? resolved : null;
  }

  private getPlatformSmtpConfig(): ResolvedSmtpConfig {
    return {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      user: config.smtp.user,
      password: config.smtp.password,
      from: config.smtp.from,
      provider: 'platform',
    };
  }

  private isSmtpComplete(smtpConfig: ResolvedSmtpConfig): boolean {
    return Boolean(smtpConfig.host && smtpConfig.port && smtpConfig.user && smtpConfig.password && smtpConfig.from);
  }

  private createTransporter(smtpConfig: ResolvedSmtpConfig): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });
  }

  private async recordEmailEvent(
    options: EmailOptions,
    smtpConfig: ResolvedSmtpConfig,
    status: 'sent' | 'failed',
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    if (!AppDataSource.isInitialized) {
      return;
    }

    try {
      const logRepo = AppDataSource.getRepository(OutboundEmailLog);
      const log = logRepo.create({
        tenantId: options.tenantId,
        recipientEmail: options.to,
        subject: options.subject,
        purpose: options.purpose || 'general',
        status,
        provider: smtpConfig.provider,
        fromEmail: smtpConfig.from,
        messageId,
        errorMessage,
        metadata: options.metadata || {},
      });

      await logRepo.save(log);
    } catch (logError) {
      logger.warn('Failed to record outbound email event', logError);
    }
  }

  /**
   * Send user invitation email
   */
  async sendInvitationEmail(data: {
    to: string;
    fullName: string;
    inviterName: string;
    companyName: string;
    token: string;
    role: string;
    tenantId?: string;
  }): Promise<void> {
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${data.token}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #333333;
    }
    .content p {
      margin: 0 0 15px 0;
      line-height: 1.6;
      color: #666666;
      font-size: 16px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .info-box strong {
      color: #333333;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      font-size: 13px;
      color: #999999;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    .expiry-notice {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .expiry-notice p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${data.companyName}!</h1>
    </div>

    <div class="content">
      <h2>Hi ${data.fullName},</h2>

      <p>You've been invited by <strong>${data.inviterName}</strong> to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.</p>

      <p>We're excited to have you on board! To get started, you'll need to set up your account by creating a password.</p>

      <div class="info-box">
        <p><strong>Company:</strong> ${data.companyName}</p>
        <p><strong>Role:</strong> ${data.role}</p>
        <p><strong>Invited by:</strong> ${data.inviterName}</p>
      </div>

      <p style="text-align: center;">
        <a href="${acceptUrl}" class="button">Accept Invitation & Set Password</a>
      </p>

      <div class="expiry-notice">
        <p><strong>⏰ Important:</strong> This invitation will expire in 7 days. Please accept it before ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.</p>
      </div>

      <p style="font-size: 14px; color: #999999; margin-top: 30px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${acceptUrl}" style="color: #667eea; word-break: break-all;">${acceptUrl}</a>
      </p>
    </div>

    <div class="footer">
      <p>This email was sent by ${data.companyName}</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p style="margin-top: 15px;">© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Welcome to ${data.companyName}!

Hi ${data.fullName},

You've been invited by ${data.inviterName} to join ${data.companyName} as a ${data.role}.

To accept this invitation and set up your account, please visit:
${acceptUrl}

Company: ${data.companyName}
Role: ${data.role}
Invited by: ${data.inviterName}

Important: This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.
    `;

    await this.sendEmail({
      to: data.to,
      subject: `You're invited to join ${data.companyName}`,
      html,
      text,
      tenantId: data.tenantId,
      purpose: 'user_invitation',
      metadata: {
        companyName: data.companyName,
        role: data.role,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    to: string;
    fullName: string;
    resetToken: string;
    tenantId?: string;
  }): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${data.resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 15px 0;
      line-height: 1.6;
      color: #666666;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      font-size: 13px;
      color: #999999;
      border-top: 1px solid #e9ecef;
    }
    .expiry-notice {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Password Reset Request</h1>
    </div>

    <div class="content">
      <p>Hi ${data.fullName},</p>

      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <div class="expiry-notice">
        <p><strong>⏰ Note:</strong> This link will expire in 1 hour for security reasons.</p>
      </div>

      <p>If you didn't request a password reset, you can safely ignore this email.</p>

      <p style="font-size: 14px; color: #999999; margin-top: 30px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>

    <div class="footer">
      <p>If you didn't request this, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to: data.to,
      subject: 'Password Reset Request',
      html,
      text: `Hi ${data.fullName},\n\nWe received a request to reset your password. Visit this link to create a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      tenantId: data.tenantId,
      purpose: 'password_reset',
    });
  }

  /**
   * Send offer letter email
   */
  async sendOfferLetter(data: {
    to: string;
    candidateName: string;
    position: string;
    department: string;
    salary: number;
    joinDate: string;
    companyName: string;
    tenantId?: string;
  }): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Offer from ${data.companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #333333;
    }
    .content p {
      margin: 0 0 15px 0;
      line-height: 1.6;
      color: #555555;
      font-size: 16px;
    }
    .offer-details {
      background-color: #f8f9fa;
      border-left: 4px solid #4CAF50;
      padding: 20px;
      margin: 30px 0;
    }
    .offer-details p {
      margin: 10px 0;
      font-size: 15px;
    }
    .offer-details strong {
      color: #333333;
      display: inline-block;
      width: 150px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      color: #777777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <h2>Dear ${data.candidateName},</h2>
      <p>We are delighted to extend an offer of employment to you for the position of <strong>${data.position}</strong> with ${data.companyName}.</p>
      <p>We were impressed by your qualifications and believe you will be a valuable addition to our ${data.department} team.</p>

      <div class="offer-details">
        <h3 style="margin-top: 0; color: #4CAF50;">Offer Details</h3>
        <p><strong>Position:</strong> ${data.position}</p>
        <p><strong>Department:</strong> ${data.department}</p>
        <p><strong>Annual Salary:</strong> ₹${data.salary.toLocaleString()}</p>
        <p><strong>Expected Join Date:</strong> ${data.joinDate}</p>
      </div>

      <p>Your formal offer letter and other onboarding documents have been prepared and will be available for review and signature through our HR portal.</p>
      <p>Please review the documents carefully and let us know if you have any questions.</p>
      <p>We look forward to welcoming you to our team!</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>${data.companyName} HR Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated email from ${data.companyName} HRMS.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: data.to,
      subject: `Job Offer - ${data.position} at ${data.companyName}`,
      html,
      text: `Dear ${data.candidateName},\n\nCongratulations! We are delighted to extend an offer of employment to you for the position of ${data.position} with ${data.companyName}.\n\nPosition: ${data.position}\nDepartment: ${data.department}\nAnnual Salary: ₹${data.salary.toLocaleString()}\nExpected Join Date: ${data.joinDate}\n\nPlease review your formal offer letter through our HR portal.\n\nBest regards,\n${data.companyName} HR Team`,
      tenantId: data.tenantId,
      purpose: 'offer_letter',
      metadata: {
        position: data.position,
        department: data.department,
      },
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const smtpConfig = await this.resolveSmtpConfig();
      await this.createTransporter(smtpConfig).verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
