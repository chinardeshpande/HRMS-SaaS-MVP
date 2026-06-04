import fs from 'fs';
import os from 'os';
import path from 'path';
import { AppDataSource } from '../../src/config/database';
import { AuditLog } from '../../src/models/AuditLog';
import { CompanyDocumentCategory, CompanyDocumentStatus } from '../../src/models/CompanyDocument';
import {
  EmployeeDocumentCategory,
  EmployeeDocumentStatus,
  EmployeeDocumentVerificationStatus,
} from '../../src/models/EmployeeDocument';
import { PayslipStatus } from '../../src/models/Payslip';
import {
  TEST_ACCOUNTS,
  api,
  API_PREFIX,
  authDelete,
  authGet,
  authPost,
  authPut,
  loginAs,
  requireAuth,
} from '../helpers/testSetup';

const makeTempPdf = (name: string, content: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurorahr-doc-api-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return { dir, filePath, content };
};

const parseBinary = (res: any, callback: (error: Error | null, body?: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  res.on('error', (error: Error) => callback(error));
};

const expectAuditEvent = async (tenantId: string, entityId: string, action: string) => {
  const audit = await AppDataSource.getRepository(AuditLog).findOne({
    where: { tenantId, entityId, action },
    order: { createdAt: 'DESC' },
  });
  expect(audit).toBeTruthy();
  expect(audit!.action).toBe(action);
};

describe('Document and Payslip Lifecycle API', () => {
  it('HR admin can upload, list, download, audit, update, verify, and archive an employee document', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    expect(employee.employeeId).toBeDefined();

    const temp = makeTempPdf('qa-employee-roundtrip.pdf', 'synthetic employee document roundtrip');
    try {
      const upload = await api
        .post(`${API_PREFIX}/employee-documents/employees/${employee.employeeId}`)
        .set('Authorization', `Bearer ${hr.token}`)
        .field('title', 'QA Employee Roundtrip Document')
        .field('category', EmployeeDocumentCategory.EMPLOYMENT_LETTER)
        .field('verificationStatus', EmployeeDocumentVerificationStatus.UNVERIFIED)
        .attach('file', temp.filePath, { contentType: 'application/pdf' });

      expect(upload.status).toBe(201);
      expect(upload.body.success).toBe(true);
      expect(upload.body.data.documentId).toBeTruthy();
      expect(upload.body.data.employeeId).toBe(employee.employeeId);
      expect(upload.body.data.originalFileName).toBe('qa-employee-roundtrip.pdf');
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'employee_document.upload');

      const list = await authGet(`/employee-documents/employees/${employee.employeeId}`, hr.token);
      expect(list.status).toBe(200);
      expect(list.body.data.documents.some((doc: any) => doc.documentId === upload.body.data.documentId)).toBe(true);

      const downloaded = await api
        .get(`${API_PREFIX}/employee-documents/${upload.body.data.documentId}/download`)
        .set('Authorization', `Bearer ${employee.token}`)
        .buffer(true)
        .parse(parseBinary);

      expect(downloaded.status).toBe(200);
      expect(downloaded.headers['content-disposition']).toContain('qa-employee-roundtrip.pdf');
      expect(Buffer.isBuffer(downloaded.body)).toBe(true);
      expect(downloaded.body.toString()).toContain(temp.content);
      await expectAuditEvent(employee.tenantId, upload.body.data.documentId, 'employee_document.download');

      const update = await authPut(`/employee-documents/${upload.body.data.documentId}`, hr.token).send({
        title: 'QA Employee Roundtrip Document Updated',
        status: EmployeeDocumentStatus.ACTIVE,
      });
      expect(update.status).toBe(200);
      expect(update.body.data.title).toBe('QA Employee Roundtrip Document Updated');
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'employee_document.update');

      const verify = await authPost(`/employee-documents/${upload.body.data.documentId}/verify`, hr.token).send({
        verificationStatus: EmployeeDocumentVerificationStatus.VERIFIED,
      });
      expect(verify.status).toBe(200);
      expect(verify.body.data.verificationStatus).toBe(EmployeeDocumentVerificationStatus.VERIFIED);
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'employee_document.verify');

      const archive = await authDelete(`/employee-documents/${upload.body.data.documentId}`, hr.token);
      expect(archive.status).toBe(200);
      expect(archive.body.data.status).toBe(EmployeeDocumentStatus.ARCHIVED);
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'employee_document.archive');
    } finally {
      fs.rmSync(temp.dir, { recursive: true, force: true });
    }
  });

  it('employee and tenant boundaries protect employee document access', async () => {
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
    const orbitEmployee = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);
    requireAuth(orbitEmployee, TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE.label);

    const ownList = await authGet(`/employee-documents/employees/${employee.employeeId}`, employee.token);
    expect(ownList.status).toBe(200);
    expect(ownList.body.data.documents.length).toBeGreaterThan(0);
    const documentId = ownList.body.data.documents[0].documentId;

    const managerList = await authGet(`/employee-documents/employees/${employee.employeeId}`, manager.token);
    expect(managerList.status).toBe(403);

    const otherEmployeeList = await authGet(`/employee-documents/employees/${manager.employeeId}`, employee.token);
    expect(otherEmployeeList.status).toBe(403);

    const orbitDownload = await authGet(`/employee-documents/${documentId}/download`, orbitEmployee.token);
    expect(orbitDownload.status).toBe(404);

    const missing = await authGet('/employee-documents/00000000-0000-0000-0000-000000000000/download', employee.token);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('HR admin can upload, list, download, audit, update, verify, and archive a company document', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);

    const temp = makeTempPdf('qa-company-roundtrip.pdf', 'synthetic company document roundtrip');
    try {
      const upload = await api
        .post(`${API_PREFIX}/company-documents`)
        .set('Authorization', `Bearer ${hr.token}`)
        .field('title', 'QA Company Roundtrip Document')
        .field('category', CompanyDocumentCategory.HR_POLICY)
        .attach('file', temp.filePath, { contentType: 'application/pdf' });

      expect(upload.status).toBe(201);
      expect(upload.body.success).toBe(true);
      expect(upload.body.data.documentId).toBeTruthy();
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'company_document.upload');

      const list = await authGet('/company-documents', hr.token);
      expect(list.status).toBe(200);
      expect(list.body.data.documents.some((doc: any) => doc.documentId === upload.body.data.documentId)).toBe(true);

      const deniedList = await authGet('/company-documents', employee.token);
      expect(deniedList.status).toBe(403);

      const downloaded = await api
        .get(`${API_PREFIX}/company-documents/${upload.body.data.documentId}/download`)
        .set('Authorization', `Bearer ${hr.token}`)
        .buffer(true)
        .parse(parseBinary);

      expect(downloaded.status).toBe(200);
      expect(downloaded.headers['content-disposition']).toContain('qa-company-roundtrip.pdf');
      expect(downloaded.body.toString()).toContain(temp.content);
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'company_document.download');

      const update = await authPut(`/company-documents/${upload.body.data.documentId}`, hr.token).send({
        title: 'QA Company Roundtrip Document Updated',
        status: CompanyDocumentStatus.ACTIVE,
      });
      expect(update.status).toBe(200);
      expect(update.body.data.title).toBe('QA Company Roundtrip Document Updated');
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'company_document.update');

      const verify = await authPost(`/company-documents/${upload.body.data.documentId}/verify`, hr.token).send({});
      expect(verify.status).toBe(200);
      expect(verify.body.data.verificationStatus).toBe('verified');
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'company_document.verify');

      const archive = await authDelete(`/company-documents/${upload.body.data.documentId}`, hr.token);
      expect(archive.status).toBe(200);
      expect(archive.body.data.status).toBe(CompanyDocumentStatus.ARCHIVED);
      await expectAuditEvent(hr.tenantId, upload.body.data.documentId, 'company_document.archive');
    } finally {
      fs.rmSync(temp.dir, { recursive: true, force: true });
    }
  });

  it('tenant and missing-file boundaries protect company document downloads', async () => {
    const acvAdmin = await loginAs(TEST_ACCOUNTS.SYSTEM_ADMIN);
    const orbitAdmin = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_ADMIN);
    requireAuth(acvAdmin, TEST_ACCOUNTS.SYSTEM_ADMIN.label);
    requireAuth(orbitAdmin, TEST_ACCOUNTS.SECOND_TENANT_ADMIN.label);

    const acvList = await authGet('/company-documents', acvAdmin.token);
    expect(acvList.status).toBe(200);
    expect(acvList.body.data.documents.length).toBeGreaterThan(0);
    const seededAcvDocument = acvList.body.data.documents.find(
      (document: any) => document.originalFileName === 'qa-acv-coi.pdf'
    );
    expect(seededAcvDocument).toBeTruthy();
    const seededAcvDocumentId = seededAcvDocument.documentId;

    const crossTenant = await authGet(`/company-documents/${seededAcvDocumentId}/download`, orbitAdmin.token);
    expect(crossTenant.status).toBe(404);

    const missingDocument = await authGet(
      '/company-documents/00000000-0000-0000-0000-000000000000/download',
      acvAdmin.token
    );
    expect(missingDocument.status).toBe(404);
    expect(missingDocument.body.error.code).toBe('NOT_FOUND');

    const missingFile = await authGet(`/company-documents/${seededAcvDocumentId}/download`, acvAdmin.token);
    expect(missingFile.status).toBe(404);
    expect(missingFile.body.error.code).toBe('FILE_NOT_FOUND');
  });

  it('HR admin can create a payslip, attach a file, download it, and audit the download', async () => {
    const hr = await loginAs(TEST_ACCOUNTS.HR_ADMIN);
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    requireAuth(hr, TEST_ACCOUNTS.HR_ADMIN.label);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);

    const payslip = await authPost(`/compensation/employees/${employee.employeeId}/payslips`, hr.token).send({
      month: 6,
      year: 2026,
      grossEarnings: 65000,
      totalDeductions: 9000,
      netPay: 56000,
      paidDays: 30,
      lopDays: 0,
      paymentDate: '2026-06-30',
      status: PayslipStatus.FINAL,
      employeeVisible: true,
    });
    expect(payslip.status).toBe(201);
    expect(payslip.body.data.payslipId).toBeTruthy();

    const temp = makeTempPdf('qa-june-2026-payslip.pdf', 'synthetic payslip roundtrip');
    try {
      const attachment = await api
        .post(`${API_PREFIX}/compensation/payslips/${payslip.body.data.payslipId}/attachments`)
        .set('Authorization', `Bearer ${hr.token}`)
        .attach('file', temp.filePath, { contentType: 'application/pdf' });

      expect(attachment.status).toBe(201);
      expect(attachment.body.data.attachmentId).toBeTruthy();
      expect(attachment.body.data.fileName).toBe('qa-june-2026-payslip.pdf');

      const downloadedByHr = await api
        .get(`${API_PREFIX}/compensation/attachments/${attachment.body.data.attachmentId}/download`)
        .set('Authorization', `Bearer ${hr.token}`)
        .buffer(true)
        .parse(parseBinary);
      expect(downloadedByHr.status).toBe(200);
      expect(downloadedByHr.body.toString()).toContain(temp.content);
      await expectAuditEvent(hr.tenantId, attachment.body.data.attachmentId, 'payslip_attachment.download');

      const downloadedByEmployee = await api
        .get(`${API_PREFIX}/compensation/attachments/${attachment.body.data.attachmentId}/download`)
        .set('Authorization', `Bearer ${employee.token}`)
        .buffer(true)
        .parse(parseBinary);
      expect(downloadedByEmployee.status).toBe(200);
      expect(downloadedByEmployee.body.toString()).toContain(temp.content);
      await expectAuditEvent(employee.tenantId, attachment.body.data.attachmentId, 'payslip_attachment.download');
    } finally {
      fs.rmSync(temp.dir, { recursive: true, force: true });
    }
  });

  it('payslip access boundaries deny unauthorized users and handle missing files safely', async () => {
    const employee = await loginAs(TEST_ACCOUNTS.EMPLOYEE);
    const manager = await loginAs(TEST_ACCOUNTS.MANAGER);
    const orbitEmployee = await loginAs(TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE);
    requireAuth(employee, TEST_ACCOUNTS.EMPLOYEE.label);
    requireAuth(manager, TEST_ACCOUNTS.MANAGER.label);
    requireAuth(orbitEmployee, TEST_ACCOUNTS.SECOND_TENANT_EMPLOYEE.label);

    const ownCompensation = await authGet(`/compensation/employees/${employee.employeeId}`, employee.token);
    expect(ownCompensation.status).toBe(200);
    expect(ownCompensation.body.data.payslips.length).toBeGreaterThan(0);
    const seededPayslip = ownCompensation.body.data.payslips.find((payslip: any) =>
      (payslip.attachments || []).some((attachment: any) => attachment.fileName === 'qa-may-2026-payslip.pdf')
    );
    expect(seededPayslip).toBeTruthy();
    const seededAttachment = seededPayslip.attachments.find(
      (attachment: any) => attachment.fileName === 'qa-may-2026-payslip.pdf'
    );
    expect(seededAttachment).toBeTruthy();
    const seededAttachmentId = seededAttachment.attachmentId;

    const managerDenied = await authGet(`/compensation/employees/${employee.employeeId}`, manager.token);
    expect(managerDenied.status).toBe(403);

    const otherTenantDenied = await authGet(`/compensation/employees/${employee.employeeId}`, orbitEmployee.token);
    expect(otherTenantDenied.status).toBe(403);

    const missingAttachment = await authGet(
      '/compensation/attachments/00000000-0000-0000-0000-000000000000/download',
      employee.token
    );
    expect(missingAttachment.status).toBe(404);
    expect(missingAttachment.body.error.code).toBe('NOT_FOUND');

    const missingFile = await authGet(`/compensation/attachments/${seededAttachmentId}/download`, employee.token);
    expect(missingFile.status).toBe(404);
    expect(missingFile.body.error.code).toBe('FILE_NOT_FOUND');
  });
});
