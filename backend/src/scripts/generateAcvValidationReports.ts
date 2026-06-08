import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { EmployeeDocument, EmployeeDocumentCategory } from '../models/EmployeeDocument';
import { CompanyDocument, CompanyDocumentCategory } from '../models/CompanyDocument';
import { SalaryStructure, SalaryStructureStatus } from '../models/SalaryStructure';
import { Payslip } from '../models/Payslip';
import { PayslipAttachment } from '../models/PayslipAttachment';
import { CompensationHistory } from '../models/CompensationHistory';
import { Attendance } from '../models/Attendance';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeavePolicy, LeaveType } from '../models/LeavePolicy';
import { LeaveRequest } from '../models/LeaveRequest';
import { ProbationCase } from '../models/ProbationCase';
import { ExitCase } from '../models/ExitCase';
import { PositionHistory } from '../models/PositionHistory';
import { ManualEmploymentHistory } from '../models/ManualEmploymentHistory';
import { AuditLog } from '../models/AuditLog';
import { HRConnectPost } from '../models/HRConnectPost';
import { HRConnectComment } from '../models/HRConnectComment';
import { ChatConversation } from '../models/ChatConversation';
import { ChatMessage } from '../models/ChatMessage';
import { SavedReport } from '../models/SavedReport';
import { EmploymentStatus } from '../../../shared/types';
import { findUploadPath, uploadPathExists, uploadRoots } from '../utils/uploadPaths';

type Severity = 'Blocker' | 'Important' | 'Cleanup' | 'Optional';
type ScoreStatus = 'Green' | 'Amber' | 'Red' | 'Grey';

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  outputDir: string;
  includeNames: boolean;
}

interface MissingItem {
  area: string;
  severity: Severity;
  employeeCode?: string;
  employeeName?: string;
  item: string;
  evidence: string;
  recommendedAction: string;
}

const DEFAULT_OUTPUT_DIR = path.resolve(
  process.cwd(),
  '../docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports'
);

const usage = `
Usage:
  npm --prefix backend run acv:validation-reports -- --company-name="ACV Solutions"

Options:
  --tenant-id=<uuid>
  --company-name="ACV Solutions"
  --subdomain=acv
  --output-dir="/path/to/docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports"
  --include-names

Notes:
  - This is read-only.
  - It writes redacted validation evidence by default; it does not export salary amounts.
`;

const readArg = (name: string, args: string[]): string | undefined => {
  const prefix = `--${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
};

const hasFlag = (name: string, args: string[]): boolean => args.includes(`--${name}`);

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  if (hasFlag('help', args) || hasFlag('h', args)) {
    console.log(usage.trim());
    process.exit(0);
  }

  return {
    tenantId: readArg('tenant-id', args),
    companyName: readArg('company-name', args) || 'ACV Solutions',
    subdomain: readArg('subdomain', args),
    outputDir: readArg('output-dir', args) || DEFAULT_OUTPUT_DIR,
    includeNames: hasFlag('include-names', args),
  };
};

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();
const isBlank = (value: unknown): boolean => normalize(value) === '';
const fullName = (employee: Employee): string => `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
let includeNamesInOutput = false;
const safeName = (employee?: Employee): string | undefined => {
  if (!employee) return undefined;
  return includeNamesInOutput ? fullName(employee) : undefined;
};
const safeDocumentRef = (prefix: string, id?: string): string => `${prefix}${id ? ` ending ${id.slice(-6)}` : ''}`;
const isActive = (employee: Employee): boolean => normalize(employee.status) === EmploymentStatus.ACTIVE;
const dateKey = (value?: Date | string | null): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};
const monthKey = (year: number, month: number): string => `${year}-${String(month).padStart(2, '0')}`;

const writeJson = (filePath: string, data: unknown) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const writeText = (filePath: string, text: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text.endsWith('\n') ? text : `${text}\n`);
};

const csvValue = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const writeCsv = <T extends object>(filePath: string, rows: T[]) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row as Record<string, unknown>).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));

  const output = [
    headers.map(csvValue).join(','),
    ...rows.map((row) => headers.map((header) => csvValue((row as Record<string, unknown>)[header])).join(',')),
  ].join('\n');

  fs.writeFileSync(filePath, `${output}\n`);
};

const copyFile = (sourcePath: string, targetPath: string) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
};

const fileExists = (fileUrl?: string | null): boolean => uploadPathExists(fileUrl);

const fileKind = (fileName?: string | null): string => {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  return ext || 'unknown';
};

const fileUrlPattern = (fileUrl?: string | null): string => (fileUrl ? fileUrl.replace(/\/[^/]+$/, '/<file>') : '');

const storageStatus = (fileUrl?: string | null): 'remote' | 'reachable' | 'missing' | 'not_provided' => {
  if (!fileUrl) return 'not_provided';
  if (/^https?:\/\//i.test(fileUrl)) return 'remote';
  return findUploadPath(fileUrl) ? 'reachable' : 'missing';
};

const storageRootLabel = (fileUrl?: string | null): string => {
  const found = findUploadPath(fileUrl);
  if (!found || /^https?:\/\//i.test(found)) return found ? 'remote-url' : '';
  const index = uploadRoots.findIndex((root) => {
    const relative = path.relative(root, found);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
  return index >= 0 ? `upload-root-${index + 1}` : 'absolute-path';
};

const score = (missing: number, total: number, blocker = false): ScoreStatus => {
  if (total === 0) return 'Grey';
  if (blocker || missing > Math.max(2, total * 0.25)) return 'Red';
  if (missing > 0) return 'Amber';
  return 'Green';
};

const addMissing = (
  items: MissingItem[],
  area: string,
  severity: Severity,
  item: string,
  evidence: string,
  recommendedAction: string,
  employee?: Employee
) => {
  items.push({
    area,
    severity,
    employeeCode: employee?.employeeCode,
    employeeName: safeName(employee),
    item,
    evidence,
    recommendedAction,
  });
};

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);

  if (options.tenantId) {
    const tenant = await tenantRepo.findOne({ where: { tenantId: options.tenantId } });
    if (!tenant) throw new Error(`No tenant matched tenant id ${options.tenantId}`);
    return tenant;
  }

  const query = tenantRepo.createQueryBuilder('tenant');
  if (options.subdomain) {
    query.orWhere('LOWER(tenant.subdomain) = LOWER(:subdomain)', { subdomain: options.subdomain });
  }
  if (options.companyName) {
    query.orWhere('LOWER(tenant.companyName) = LOWER(:companyName)', { companyName: options.companyName });
    query.orWhere('LOWER(tenant.companyName) = LOWER(:companyNamePvt)', { companyNamePvt: `${options.companyName} Pvt Ltd` });
    query.orWhere('tenant.companyName ILIKE :companyNameLike', { companyNameLike: `%${options.companyName.replace(/\s+/g, '%')}%` });
  }

  const tenants = await query.getMany();
  if (tenants.length === 0) {
    throw new Error(`No tenant matched selector: ${JSON.stringify({
      tenantId: options.tenantId,
      companyName: options.companyName,
      subdomain: options.subdomain,
    })}`);
  }

  const unique = Array.from(new Map(tenants.map((tenant) => [tenant.tenantId, tenant])).values());
  if (unique.length > 1) {
    throw new Error(`Tenant selector matched multiple tenants: ${unique.map((tenant) => tenant.companyName).join(', ')}`);
  }

  return unique[0];
};

const groupCount = <T>(items: T[], keyFn: (item: T) => string): Record<string, number> =>
  items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

async function main() {
  const options = parseArgs();
  fs.mkdirSync(options.outputDir, { recursive: true });

  await AppDataSource.initialize();

  try {
    const tenant = await findTenant(options);
    const tenantId = tenant.tenantId;
    includeNamesInOutput = options.includeNames;

    const employeeRepo = AppDataSource.getRepository(Employee);
    const orgRepo = AppDataSource.getRepository(OrganizationSettings);
    const departmentRepo = AppDataSource.getRepository(Department);
    const designationRepo = AppDataSource.getRepository(Designation);
    const employeeDocumentRepo = AppDataSource.getRepository(EmployeeDocument);
    const companyDocumentRepo = AppDataSource.getRepository(CompanyDocument);
    const salaryStructureRepo = AppDataSource.getRepository(SalaryStructure);
    const payslipRepo = AppDataSource.getRepository(Payslip);
    const payslipAttachmentRepo = AppDataSource.getRepository(PayslipAttachment);
    const compensationHistoryRepo = AppDataSource.getRepository(CompensationHistory);
    const attendanceRepo = AppDataSource.getRepository(Attendance);
    const leaveBalanceRepo = AppDataSource.getRepository(LeaveBalance);
    const leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);
    const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
    const probationRepo = AppDataSource.getRepository(ProbationCase);
    const exitRepo = AppDataSource.getRepository(ExitCase);
    const positionHistoryRepo = AppDataSource.getRepository(PositionHistory);
    const manualHistoryRepo = AppDataSource.getRepository(ManualEmploymentHistory);
    const auditLogRepo = AppDataSource.getRepository(AuditLog);
    const hrConnectPostRepo = AppDataSource.getRepository(HRConnectPost);
    const hrConnectCommentRepo = AppDataSource.getRepository(HRConnectComment);
    const chatConversationRepo = AppDataSource.getRepository(ChatConversation);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);
    const savedReportRepo = AppDataSource.getRepository(SavedReport);

    const [
      employees,
      orgSettings,
      departments,
      designations,
      employeeDocuments,
      companyDocuments,
      salaryStructures,
      payslips,
      payslipAttachments,
      compensationHistory,
      attendanceRows,
      leaveBalances,
      leavePolicies,
      leaveRequests,
      probationCases,
      exitCases,
      positionHistory,
      manualHistory,
      auditLogs,
      hrConnectPosts,
      hrConnectComments,
      chatConversations,
      chatMessages,
      savedReports,
    ] = await Promise.all([
      employeeRepo.find({ where: { tenantId }, relations: ['department', 'designation', 'manager'], order: { employeeCode: 'ASC' } }),
      orgRepo.findOne({ where: { tenantId } }),
      departmentRepo.find({ where: { tenantId } }),
      designationRepo.find({ where: { tenantId } }),
      employeeDocumentRepo.find({ where: { tenantId }, relations: ['employee'] }),
      companyDocumentRepo.find({ where: { tenantId } }),
      salaryStructureRepo.find({ where: { tenantId } }),
      payslipRepo.find({ where: { tenantId } }),
      payslipAttachmentRepo.find({ where: { tenantId } }),
      compensationHistoryRepo.find({ where: { tenantId } }),
      attendanceRepo.find({ where: { tenantId } }),
      leaveBalanceRepo.find({ where: { tenantId } }),
      leavePolicyRepo.find({ where: { tenantId } }),
      leaveRequestRepo.find({ where: { tenantId } }),
      probationRepo.find({ where: { tenantId } }),
      exitRepo.find({ where: { tenantId } }),
      positionHistoryRepo.find({ where: { tenantId } }),
      manualHistoryRepo.find({ where: { tenantId } }),
      auditLogRepo.find({ where: { tenantId } }),
      hrConnectPostRepo.find({ where: { tenantId } }),
      hrConnectCommentRepo.find({ where: { tenantId } }),
      chatConversationRepo.find({ where: { tenantId } }),
      chatMessageRepo.find({ where: { tenantId } }),
      savedReportRepo.find({ where: { tenantId } }),
    ]);

    const missingItems: MissingItem[] = [];
    const activeEmployees = employees.filter(isActive);
    const inactiveEmployees = employees.filter((employee) => !isActive(employee));
    const employeeById = new Map(employees.map((employee) => [employee.employeeId, employee]));
    const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.employeeId));

    const documentStorageDiagnostics = [
      ...employeeDocuments.map((doc) => ({
        source: 'employee_document',
        recordRef: safeDocumentRef('employee-document', doc.documentId),
        employeeCode: doc.employee?.employeeCode || '',
        category: doc.category,
        fileKind: fileKind(doc.fileName || doc.originalFileName),
        fileUrlPattern: fileUrlPattern(doc.fileUrl),
        storageStatus: storageStatus(doc.fileUrl),
        storageRoot: storageRootLabel(doc.fileUrl),
        recommendedAction: fileExists(doc.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this document.',
      })),
      ...companyDocuments.map((doc) => ({
        source: 'company_document',
        recordRef: safeDocumentRef('company-document', doc.documentId),
        employeeCode: '',
        category: doc.category,
        fileKind: fileKind(doc.fileName || doc.originalFileName),
        fileUrlPattern: fileUrlPattern(doc.fileUrl),
        storageStatus: storageStatus(doc.fileUrl),
        storageRoot: storageRootLabel(doc.fileUrl),
        recommendedAction: fileExists(doc.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this document.',
      })),
      ...payslipAttachments.map((attachment) => ({
        source: 'payslip_attachment',
        recordRef: safeDocumentRef('payslip-attachment', attachment.attachmentId),
        employeeCode: '',
        category: 'payslip',
        fileKind: fileKind(attachment.fileName),
        fileUrlPattern: fileUrlPattern(attachment.fileUrl),
        storageStatus: storageStatus(attachment.fileUrl),
        storageRoot: storageRootLabel(attachment.fileUrl),
        recommendedAction: fileExists(attachment.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this payslip attachment.',
      })),
    ];

    const duplicateCodeCounts = groupCount(employees.filter((employee) => !isBlank(employee.employeeCode)), (employee) => normalize(employee.employeeCode));
    const duplicateEmailCounts = groupCount(employees.filter((employee) => !isBlank(employee.email)), (employee) => normalize(employee.email));

    const employeeMasterRows = employees.map((employee) => {
      const missing: string[] = [];
      if (isBlank(employee.employeeCode)) missing.push('employeeCode');
      if (!employee.dateOfBirth) missing.push('dateOfBirth');
      if (isBlank(employee.gender)) missing.push('gender');
      if (isBlank(employee.email)) missing.push('email');
      if (isBlank(employee.phone)) missing.push('phone');
      if (isBlank(employee.address)) missing.push('address');
      if (!employee.departmentId) missing.push('department');
      if (!employee.designationId) missing.push('designation');
      if (isActive(employee) && !employee.managerId) missing.push('reportingManager');
      if (!employee.dateOfJoining) missing.push('dateOfJoining');
      if (isBlank(employee.workLocation)) missing.push('workLocation');
      if (duplicateCodeCounts[normalize(employee.employeeCode)] > 1) missing.push('duplicateEmployeeCodeRisk');
      if (duplicateEmailCounts[normalize(employee.email)] > 1) missing.push('duplicateEmailRisk');

      missing.forEach((field) => {
        addMissing(
          missingItems,
          'Employee master',
          ['employeeCode', 'email', 'department', 'designation', 'dateOfJoining'].includes(field) ? 'Important' : 'Cleanup',
          field,
          `Employee ${employee.employeeCode || employee.employeeId} has missing/risky ${field}`,
          'Update employee master through Employee Register or import correction.',
          employee
        );
      });

      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        department: employee.department?.name || '',
        designation: employee.designation?.name || '',
        managerCode: employee.manager?.employeeCode || '',
        managerName: safeName(employee.manager) || '',
        missingFields: missing.join('|'),
        missingCount: missing.length,
      };
    });

    addMissing(
      missingItems,
      'Employee master',
      'Important',
      'personalEmailModelGap',
      'Employee model has one email field; no distinct personal email field exists.',
      'Decide whether AuroraHR needs separate workEmail/personalEmail fields before validating personal email coverage.'
    );

    const managerRows = employees.map((employee) => {
      const manager = employee.managerId ? employeeById.get(employee.managerId) : undefined;
      const invalidManagerReference = Boolean(employee.managerId && !manager);
      if (isActive(employee) && !employee.managerId) {
        addMissing(
          missingItems,
          'Manager mapping',
          'Important',
          'missingReportingManager',
          'Active employee has no reporting manager.',
          'Assign reporting manager in Employee Register.',
          employee
        );
      }
      if (invalidManagerReference) {
        addMissing(
          missingItems,
          'Manager mapping',
          'Blocker',
          'invalidManagerReference',
          'Manager reference does not match an employee in tenant.',
          'Repair managerId or clear invalid reference.',
          employee
        );
      }
      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        managerCode: manager?.employeeCode || '',
        managerName: safeName(manager) || '',
        hasManager: Boolean(manager),
        invalidManagerReference,
      };
    });

    const circularRisks: Array<Record<string, unknown>> = [];
    for (const employee of employees) {
      const seen = new Set<string>();
      let current: Employee | undefined = employee;
      while (current?.managerId) {
        if (seen.has(current.managerId)) {
          circularRisks.push({
            employeeCode: employee.employeeCode,
            employeeName: safeName(employee),
            loopDetected: true,
          });
          addMissing(
            missingItems,
            'Manager mapping',
            'Blocker',
            'circularReportingRisk',
            `Circular reporting path detected for ${employee.employeeCode}.`,
            'Review manager hierarchy and break the loop.',
            employee
          );
          break;
        }
        seen.add(current.employeeId);
        current = employeeById.get(current.managerId);
      }
    }

    const probationByEmployee = new Set(probationCases.map((row) => row.employeeId));
    const exitByEmployee = new Map(exitCases.map((row) => [row.employeeId, row]));
    const positionHistoryByEmployee = groupCount(positionHistory, (row) => row.employeeId);
    const manualHistoryByEmployee = groupCount(manualHistory, (row) => row.employeeId);
    const compensationHistoryByEmployee = groupCount(compensationHistory, (row) => row.employeeId);

    const lifecycleRows = employees.map((employee) => {
      const hasTimeline =
        Boolean(employee.dateOfJoining) ||
        probationByEmployee.has(employee.employeeId) ||
        Boolean(exitByEmployee.get(employee.employeeId)) ||
        Boolean(positionHistoryByEmployee[employee.employeeId]) ||
        Boolean(manualHistoryByEmployee[employee.employeeId]) ||
        Boolean(compensationHistoryByEmployee[employee.employeeId]);

      if (!hasTimeline) {
        addMissing(
          missingItems,
          'Lifecycle history',
          'Important',
          'noLifecycleTimeline',
          'Employee has no detectable lifecycle timeline entries.',
          'Create joining/confirmation/exit/history events as applicable.',
          employee
        );
      }
      if (!isActive(employee)) {
        const exitCase = exitByEmployee.get(employee.employeeId);
        if (!exitCase) {
          addMissing(
            missingItems,
            'Lifecycle history',
            'Important',
            'missingExitCase',
            'Inactive/exited employee has no exit case.',
            'Create exit case or manually record exit event.',
            employee
          );
        } else if (!exitCase.actualExitDate && !exitCase.lastWorkingDate && !exitCase.exitCompletedDate) {
          addMissing(
            missingItems,
            'Lifecycle history',
            'Important',
            'missingExitDate',
            'Exit case has no final/last working date.',
            'Update exit dates after HR verification.',
            employee
          );
        }
      }
      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        joiningDate: dateKey(employee.dateOfJoining),
        hasProbationCase: probationByEmployee.has(employee.employeeId),
        positionHistoryCount: positionHistoryByEmployee[employee.employeeId] || 0,
        manualHistoryCount: manualHistoryByEmployee[employee.employeeId] || 0,
        compensationHistoryCount: compensationHistoryByEmployee[employee.employeeId] || 0,
        hasExitCase: Boolean(exitByEmployee.get(employee.employeeId)),
        hasLifecycleTimeline: hasTimeline,
      };
    });

    const employeeDocsByEmployee = new Map<string, EmployeeDocument[]>();
    employeeDocuments.forEach((doc) => {
      employeeDocsByEmployee.set(doc.employeeId, [...(employeeDocsByEmployee.get(doc.employeeId) || []), doc]);
    });

    const hasDocMatching = (docs: EmployeeDocument[], categories: EmployeeDocumentCategory[], terms: string[]): boolean =>
      docs.some((doc) => {
        const title = normalize(`${doc.title} ${doc.originalFileName} ${doc.description} ${doc.category}`);
        return categories.includes(doc.category) || terms.some((term) => title.includes(term));
      });

    const employeeDocumentRows = employees.map((employee) => {
      const docs = employeeDocsByEmployee.get(employee.employeeId) || [];
      const missing: string[] = [];
      const checks = [
        {
          key: 'PAN',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.IDENTITY], ['pan']),
          severity: 'Important' as Severity,
        },
        {
          key: 'Aadhaar',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.IDENTITY], ['aadhaar', 'aadhar']),
          severity: 'Important' as Severity,
        },
        {
          key: 'Address proof',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.ADDRESS_PROOF], ['address']),
          severity: 'Cleanup' as Severity,
        },
        {
          key: 'Education documents',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.EDUCATION], ['education', 'degree', 'certificate']),
          severity: 'Cleanup' as Severity,
        },
        {
          key: 'Offer/appointment letter',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.EMPLOYMENT_LETTER], ['offer', 'appointment']),
          severity: 'Important' as Severity,
        },
        {
          key: 'Salary/revision letters',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.COMPENSATION], ['salary', 'increment', 'increement', 'revision']),
          severity: 'Cleanup' as Severity,
        },
      ];

      if (!isActive(employee)) {
        checks.push({
          key: 'Exit documents',
          present: hasDocMatching(docs, [EmployeeDocumentCategory.EXIT], ['fnf', 'experience', 'relieving', 'exit']),
          severity: 'Important' as Severity,
        });
      }

      checks.forEach((check) => {
        if (!check.present) {
          missing.push(check.key);
          addMissing(
            missingItems,
            'Employee documents',
            check.severity,
            `missing${check.key.replace(/[^a-zA-Z0-9]/g, '')}`,
            `${check.key} not found in employee document categories/titles.`,
            'Upload or classify available document in employee document vault.',
            employee
          );
        }
      });

      const missingFiles = docs.filter((doc) => !fileExists(doc.fileUrl));
      missingFiles.forEach((doc) => {
        addMissing(
          missingItems,
          'Employee documents',
          'Blocker',
          'documentFileMissingOnDisk',
          `${safeDocumentRef('Employee document record', doc.documentId)} is not reachable in configured storage.`,
          'Repair file path/storage or re-upload document.',
          employee
        );
      });

      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        documentCount: docs.length,
        categories: Array.from(new Set(docs.map((doc) => doc.category))).join('|'),
        unverifiedCount: docs.filter((doc) => doc.verificationStatus !== 'verified').length,
        missingRequired: missing.join('|'),
        missingFileCount: missingFiles.length,
      };
    });

    const companyDocumentRows = companyDocuments.map((doc) => {
      const exists = fileExists(doc.fileUrl);
      if (!exists) {
        addMissing(
          missingItems,
          'Company documents',
          'Blocker',
          'companyDocumentFileMissingOnDisk',
          `${safeDocumentRef('Company document record', doc.documentId)} is not reachable in configured storage.`,
          'Repair file path/storage or re-upload company document.'
        );
      }
      return {
        title: doc.title,
        category: doc.category,
        status: doc.status,
        verificationStatus: doc.verificationStatus,
        expiryDate: dateKey(doc.expiryDate),
        hasExpiryDate: Boolean(doc.expiryDate),
        fileExists: exists,
      };
    });

    const companyDocText = companyDocuments.map((doc) => normalize(`${doc.title} ${doc.originalFileName} ${doc.category}`)).join(' | ');
    const companyRequiredChecks = [
      { key: 'incorporation documents', present: companyDocText.includes('incorporation') || companyDocText.includes('moa') || companyDocText.includes('aoa'), severity: 'Important' as Severity },
      { key: 'PAN', present: companyDocText.includes('pan'), severity: 'Important' as Severity },
      { key: 'TAN', present: companyDocText.includes('tan'), severity: 'Important' as Severity },
      { key: 'GST', present: companyDocText.includes('gst'), severity: 'Important' as Severity },
      { key: 'EPF/ESIC', present: companyDocText.includes('epf') || companyDocText.includes('esic'), severity: 'Optional' as Severity },
      { key: 'POSH', present: companyDocText.includes('posh'), severity: 'Important' as Severity },
      { key: 'HR policies', present: companyDocuments.some((doc) => doc.category === CompanyDocumentCategory.HR_POLICY), severity: 'Important' as Severity },
      { key: 'HR templates', present: companyDocuments.some((doc) => doc.category === CompanyDocumentCategory.HR_TEMPLATE), severity: 'Cleanup' as Severity },
    ];

    companyRequiredChecks.forEach((check) => {
      if (!check.present) {
        addMissing(
          missingItems,
          'Company documents',
          check.severity,
          `missing ${check.key}`,
          `${check.key} not detected in company document vault.`,
          'Upload or correctly classify company document.'
        );
      }
    });

    const structuresByEmployee = new Map<string, SalaryStructure[]>();
    salaryStructures.forEach((row) => {
      structuresByEmployee.set(row.employeeId, [...(structuresByEmployee.get(row.employeeId) || []), row]);
    });
    const payslipsByEmployee = new Map<string, Payslip[]>();
    payslips.forEach((row) => {
      payslipsByEmployee.set(row.employeeId, [...(payslipsByEmployee.get(row.employeeId) || []), row]);
    });
    const attachmentCountsByPayslip = groupCount(payslipAttachments, (row) => row.payslipId);

    const allPayslipMonths = Array.from(new Set(payslips.map((payslip) => monthKey(payslip.year, payslip.month)))).sort();
    const compensationRows = employees.map((employee) => {
      const structures = structuresByEmployee.get(employee.employeeId) || [];
      const activeStructureCount = structures.filter((structure) => structure.status === SalaryStructureStatus.ACTIVE).length;
      const employeePayslips = payslipsByEmployee.get(employee.employeeId) || [];
      const payslipMonths = Array.from(new Set(employeePayslips.map((payslip) => monthKey(payslip.year, payslip.month)))).sort();
      const payslipsWithoutAttachments = employeePayslips.filter((payslip) => !attachmentCountsByPayslip[payslip.payslipId]);
      const hasTransactions = employeePayslips.length > 0 || Boolean(compensationHistoryByEmployee[employee.employeeId]);

      if (isActive(employee) && activeStructureCount === 0) {
        addMissing(
          missingItems,
          'Compensation',
          'Important',
          'missingActiveSalaryStructure',
          'Active employee has no active salary structure.',
          'Create or import current salary structure.',
          employee
        );
      }
      payslipsWithoutAttachments.forEach((payslip) => {
        addMissing(
          missingItems,
          'Compensation',
          'Important',
          'payslipAttachmentMissing',
          `Payslip ${monthKey(payslip.year, payslip.month)} has no attachment.`,
          'Attach payslip PDF/image or mark record as payroll-output-only.',
          employee
        );
      });

      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        salaryStructureCount: structures.length,
        activeSalaryStructureCount: activeStructureCount,
        compensationHistoryCount: compensationHistoryByEmployee[employee.employeeId] || 0,
        payslipCount: employeePayslips.length,
        payslipMonths: payslipMonths.join('|'),
        payslipsWithoutAttachments: payslipsWithoutAttachments.length,
        hasSalaryHistoryButNoPayslip: Boolean(compensationHistoryByEmployee[employee.employeeId]) && employeePayslips.length === 0,
        hasPayslipButNoHistory: employeePayslips.length > 0 && !compensationHistoryByEmployee[employee.employeeId],
        hasTransactions,
      };
    });

    const attendanceByEmployee = groupCount(attendanceRows, (row) => row.employeeId);
    const attendanceDates = attendanceRows.map((row) => dateKey(row.date)).filter(Boolean).sort();
    const attendanceRowsReport = employees.map((employee) => {
      const count = attendanceByEmployee[employee.employeeId] || 0;
      if (isActive(employee) && count === 0) {
        addMissing(
          missingItems,
          'Attendance',
          'Important',
          'missingAttendanceRows',
          'Active employee has no attendance rows.',
          'Import attendance data or confirm employee should be excluded.',
          employee
        );
      }
      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        attendanceRows: count,
      };
    });

    const balancesByEmployee = new Map<string, LeaveBalance[]>();
    leaveBalances.forEach((row) => {
      balancesByEmployee.set(row.employeeId, [...(balancesByEmployee.get(row.employeeId) || []), row]);
    });
    const activePolicyIds = new Set(leavePolicies.filter((policy) => policy.isActive).map((policy) => policy.policyId));
    const allLeaveTypes = Array.from(new Set(leavePolicies.filter((policy) => policy.isActive).map((policy) => policy.leaveType))).sort();
    const leaveRows = employees.map((employee) => {
      const balances = balancesByEmployee.get(employee.employeeId) || [];
      const balanceTypes = new Set(balances.map((balance) => balance.leaveType));
      const missingTypes = isActive(employee)
        ? allLeaveTypes.filter((type) => {
          if (type === LeaveType.MATERNITY && normalize(employee.gender) !== 'female') return false;
          if (type === LeaveType.PATERNITY && normalize(employee.gender) !== 'male') return false;
          return !balanceTypes.has(type);
        })
        : [];

      missingTypes.forEach((type) => {
        addMissing(
          missingItems,
          'Leave',
          'Important',
          `missingLeaveBalance:${type}`,
          `Active employee has no ${type} leave balance.`,
          'Initialize leave balance or confirm policy exclusion.',
          employee
        );
      });

      balances
        .filter((balance) => !activePolicyIds.has(balance.policyId))
        .forEach((balance) => {
          addMissing(
            missingItems,
            'Leave',
            'Cleanup',
            `balancePolicyInactive:${balance.leaveType}`,
            'Leave balance is linked to missing/inactive policy.',
            'Repair leave policy linkage or archive stale balance.',
            employee
          );
        });

      const genderMismatchBalances = balances.filter((balance) => {
        if (balance.leaveType === LeaveType.MATERNITY) return normalize(employee.gender) !== 'female' && Number(balance.totalAllocated) > 0;
        if (balance.leaveType === LeaveType.PATERNITY) return normalize(employee.gender) !== 'male' && Number(balance.totalAllocated) > 0;
        return false;
      });
      genderMismatchBalances.forEach((balance) => {
        addMissing(
          missingItems,
          'Leave',
          'Important',
          `genderSpecificEligibilityMismatch:${balance.leaveType}`,
          `${balance.leaveType} allocated despite employee gender ${employee.gender || 'missing'}.`,
          'Set gender-specific eligibility to zero or fix employee gender.',
          employee
        );
      });

      return {
        employeeCode: employee.employeeCode,
        employeeName: safeName(employee),
        status: employee.status,
        gender: employee.gender || '',
        balanceCount: balances.length,
        balanceTypes: Array.from(balanceTypes).join('|'),
        missingBalanceTypes: missingTypes.join('|'),
        genderMismatchCount: genderMismatchBalances.length,
      };
    });

    const tenantSetupRows = [
      { item: 'Tenant logo', status: tenant.logoUrl ? 'present' : 'missing', evidence: tenant.logoUrl || '' },
      { item: 'Tenant primary color', status: tenant.primaryColor ? 'present' : 'missing', evidence: tenant.primaryColor || '' },
      { item: 'Organization settings', status: orgSettings ? 'present' : 'missing', evidence: orgSettings?.settingId || '' },
      { item: 'Registered address', status: orgSettings?.address ? 'present' : 'missing', evidence: orgSettings?.address ? 'configured' : '' },
      { item: 'HR/company email', status: orgSettings?.email ? 'present' : 'missing', evidence: orgSettings?.email || '' },
      { item: 'PAN/TAN/GST/CIN references', status: orgSettings?.registrationNumber || orgSettings?.taxId ? 'partial/present' : 'missing', evidence: `registrationNumber=${orgSettings?.registrationNumber || ''}; taxId=${orgSettings?.taxId || ''}` },
      { item: 'SMTP config', status: orgSettings?.smtpConfig?.enabled ? 'configured' : 'not_configured', evidence: orgSettings?.smtpConfig?.enabled ? 'tenant smtp enabled' : 'tenant smtp not enabled' },
      { item: 'Branding settings', status: orgSettings?.branding || orgSettings?.logo ? 'present' : 'missing', evidence: orgSettings?.branding ? 'branding json configured' : orgSettings?.logo || '' },
    ];

    tenantSetupRows.forEach((row) => {
      if (row.status.includes('missing')) {
        addMissing(
          missingItems,
          'Tenant setup',
          row.item === 'SMTP config' ? 'Optional' : 'Cleanup',
          row.item,
          row.evidence || `${row.item} is missing`,
          'Complete organization settings after HR/legal verification.'
        );
      }
    });

    const auditEntityCounts = groupCount(auditLogs, (row) => row.entityType);
    const auditActionCounts = groupCount(auditLogs, (row) => row.action);
    const expectedAuditAreas = [
      { key: 'employee_document', evidence: auditEntityCounts.employee_document || 0 },
      { key: 'company_document', evidence: auditEntityCounts.company_document || 0 },
      { key: 'candidate', evidence: auditEntityCounts.candidate || 0 },
      { key: 'probation_case', evidence: auditEntityCounts.probation_case || 0 },
      { key: 'exit_case', evidence: auditEntityCounts.exit_case || 0 },
    ];
    expectedAuditAreas.forEach((area) => {
      if (area.evidence === 0) {
        addMissing(
          missingItems,
          'Audit logs',
          'Cleanup',
          `missingAuditCoverage:${area.key}`,
          `No audit rows found for ${area.key}.`,
          'Confirm whether the workflow has been used after audit coverage was added; otherwise add audit hooks.'
        );
      }
    });

    const auditCoverage = {
      totalAuditRows: auditLogs.length,
      byEntityType: auditEntityCounts,
      byAction: auditActionCounts,
      expectedAreaCoverage: expectedAuditAreas,
      verdict:
        auditLogs.length === 0
          ? 'No audit trail rows found for ACV tenant'
          : expectedAuditAreas.some((area) => area.evidence === 0)
            ? 'Partial audit coverage'
            : 'Audit coverage present for expected areas',
      redaction: 'Only aggregate action/entity counts are exported. User ids, old values, new values, IP addresses, and user agents are not exported.',
    };

    const hrConnectCoverage = {
      postCount: hrConnectPosts.length,
      commentCount: hrConnectComments.length,
      chatConversationCount: chatConversations.length,
      chatMessageCount: chatMessages.length,
      postsByType: groupCount(hrConnectPosts, (post) => post.postType),
      postsByVisibility: groupCount(hrConnectPosts, (post) => post.visibility),
      conversationsByType: groupCount(chatConversations, (conversation) => conversation.conversationType),
      verdict:
        hrConnectPosts.length + hrConnectComments.length + chatMessages.length > 0
          ? 'Communication records present'
          : 'No ACV HR Connect or chat activity found',
      redaction: 'Counts and classifications only. Post, comment, and message content is not exported.',
    };

    const dashboardReadiness = {
      savedReportCount: savedReports.length,
      savedReportsByCategory: groupCount(savedReports, (reportRow) => reportRow.category),
      savedReportsByType: groupCount(savedReports, (reportRow) => reportRow.reportType),
      readinessSignals: [
        { area: 'Employee master', ready: employees.length > 0 },
        { area: 'Documents', ready: employeeDocuments.length > 0 || companyDocuments.length > 0 },
        { area: 'Compensation', ready: salaryStructures.length > 0 || payslips.length > 0 },
        { area: 'Attendance', ready: attendanceRows.length > 0 },
        { area: 'Leave', ready: leaveBalances.length > 0 && leavePolicies.length > 0 },
        { area: 'HR Connect', ready: hrConnectPosts.length + chatMessages.length > 0 },
        { area: 'Audit logs', ready: auditLogs.length > 0 },
      ],
    };

    const summary = {
      generatedAt: new Date().toISOString(),
      tenant: {
        tenantId,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
      },
      counts: {
        employees: employees.length,
        activeEmployees: activeEmployees.length,
        inactiveOrExitedEmployees: inactiveEmployees.length,
        departments: departments.length,
        designations: designations.length,
        employeeDocuments: employeeDocuments.length,
        companyDocuments: companyDocuments.length,
        salaryStructures: salaryStructures.length,
        payslips: payslips.length,
        payslipAttachments: payslipAttachments.length,
        attendanceRows: attendanceRows.length,
        leaveBalances: leaveBalances.length,
        leavePolicies: leavePolicies.length,
        leaveRequests: leaveRequests.length,
        auditLogs: auditLogs.length,
        hrConnectPosts: hrConnectPosts.length,
        hrConnectComments: hrConnectComments.length,
        chatConversations: chatConversations.length,
        chatMessages: chatMessages.length,
        savedReports: savedReports.length,
      },
      attendanceDateRange: {
        from: attendanceDates[0] || null,
        to: attendanceDates[attendanceDates.length - 1] || null,
      },
      salaryMonthRange: {
        months: allPayslipMonths,
      },
      assumptions: [
        'Employee model has one email field; personal email cannot be separately validated.',
        'Salary values are not exported; this report validates coverage only.',
        'Biometric attendance files remain out of scope unless converted/imported by a separate safe parser.',
        'File existence checks validate local upload paths and treat external URLs as reachable.',
      ],
    };

    const scorecard = [
      {
        area: 'Employee master',
        status: score(employeeMasterRows.filter((row) => row.missingCount > 0).length, employees.length),
        evidence: `${employeeMasterRows.filter((row) => row.missingCount > 0).length}/${employees.length} employees have missing/risky fields`,
      },
      {
        area: 'Manager mapping',
        status: score(managerRows.filter((row) => {
          const employee = employees.find((candidate) => candidate.employeeCode === row.employeeCode);
          return Boolean(employee && activeEmployeeIds.has(employee.employeeId) && !row.hasManager);
        }).length + circularRisks.length, employees.length, circularRisks.length > 0),
        evidence: `${managerRows.filter((row) => !row.hasManager).length} without manager; ${circularRisks.length} circular risks`,
      },
      {
        area: 'Lifecycle history',
        status: score(lifecycleRows.filter((row) => !row.hasLifecycleTimeline).length + lifecycleRows.filter((row) => row.status !== 'active' && !row.hasExitCase).length, employees.length),
        evidence: `${lifecycleRows.filter((row) => !row.hasLifecycleTimeline).length} with no timeline; ${lifecycleRows.filter((row) => row.status !== 'active' && !row.hasExitCase).length} inactive/exited without exit case`,
      },
      {
        area: 'Employee documents',
        status: score(employeeDocumentRows.filter((row) => String(row.missingRequired).length > 0).length, employees.length),
        evidence: `${employeeDocumentRows.filter((row) => String(row.missingRequired).length > 0).length}/${employees.length} employees missing one or more key document classes`,
      },
      {
        area: 'Company document vault',
        status: score(companyRequiredChecks.filter((check) => !check.present && check.severity !== 'Optional').length, companyRequiredChecks.length),
        evidence: `${companyDocuments.length} company documents; ${companyRequiredChecks.filter((check) => !check.present).length} expected categories not detected`,
      },
      {
        area: 'Compensation and payslips',
        status: score(compensationRows.filter((row) => {
          const employee = employees.find((candidate) => candidate.employeeCode === row.employeeCode);
          return Boolean(employee && activeEmployeeIds.has(employee.employeeId) && Number(row.activeSalaryStructureCount) === 0);
        }).length + compensationRows.filter((row) => Number(row.payslipsWithoutAttachments) > 0).length, employees.length),
        evidence: `${compensationRows.filter((row) => Number(row.activeSalaryStructureCount) === 0).length} without active structures; ${compensationRows.filter((row) => Number(row.payslipsWithoutAttachments) > 0).length} with unattached payslips`,
      },
      {
        area: 'Attendance',
        status: score(attendanceRowsReport.filter((row) => Number(row.attendanceRows) === 0 && row.status === 'active').length, activeEmployees.length),
        evidence: `${attendanceRows.length} rows; date range ${attendanceDates[0] || 'none'} to ${attendanceDates[attendanceDates.length - 1] || 'none'}`,
      },
      {
        area: 'Leave',
        status: score(leaveRows.filter((row) => String(row.missingBalanceTypes).length > 0 || Number(row.genderMismatchCount) > 0).length, activeEmployees.length),
        evidence: `${leaveBalances.length} balances; ${leavePolicies.filter((policy) => policy.isActive).length} active policies`,
      },
      {
        area: 'Tenant setup',
        status: score(tenantSetupRows.filter((row) => row.status === 'missing').length, tenantSetupRows.length),
        evidence: `${tenantSetupRows.filter((row) => row.status !== 'missing').length}/${tenantSetupRows.length} tenant setup items configured`,
      },
      {
        area: 'HR Connect and communication trail',
        status: hrConnectCoverage.postCount + hrConnectCoverage.commentCount + hrConnectCoverage.chatMessageCount > 0 ? 'Green' as ScoreStatus : 'Amber' as ScoreStatus,
        evidence: `${hrConnectCoverage.postCount} posts; ${hrConnectCoverage.commentCount} comments; ${hrConnectCoverage.chatMessageCount} chat messages`,
      },
      {
        area: 'Audit logs',
        status: auditCoverage.totalAuditRows === 0 ? 'Red' as ScoreStatus : expectedAuditAreas.some((area) => area.evidence === 0) ? 'Amber' as ScoreStatus : 'Green' as ScoreStatus,
        evidence: `${auditCoverage.totalAuditRows} audit rows; ${expectedAuditAreas.filter((area) => area.evidence > 0).length}/${expectedAuditAreas.length} expected areas covered`,
      },
      {
        area: 'Dashboard/reporting readiness',
        status: dashboardReadiness.readinessSignals.filter((signal) => signal.ready).length >= 5 ? 'Green' as ScoreStatus : 'Amber' as ScoreStatus,
        evidence: `${dashboardReadiness.savedReportCount} saved reports; ${dashboardReadiness.readinessSignals.filter((signal) => signal.ready).length}/${dashboardReadiness.readinessSignals.length} data readiness signals present`,
      },
      {
        area: 'Zoho/SMTP integration',
        status: 'Grey' as ScoreStatus,
        evidence: 'Explicitly out of scope for this branch',
      },
    ];

    const blockerCount = missingItems.filter((item) => item.severity === 'Blocker').length;
    const importantCount = missingItems.filter((item) => item.severity === 'Important').length;
    const finalVerdict =
      blockerCount > 0
        ? 'Not ready due to blockers'
        : importantCount > 0
          ? 'Ready after fixes'
          : 'Ready for UAT';

    const report = {
      summary,
      scorecard,
      finalVerdict,
      missingItemCounts: groupCount(missingItems, (item) => item.severity),
      employeeMaster: employeeMasterRows,
      managerMapping: {
        rows: managerRows,
        circularRisks,
        hierarchySummary: groupCount(managerRows.filter((row) => row.managerCode), (row) => String(row.managerCode)),
      },
      lifecycleCoverage: lifecycleRows,
      employeeDocumentCoverage: employeeDocumentRows,
      companyDocumentCoverage: {
        rows: companyDocumentRows,
        byCategory: groupCount(companyDocuments, (doc) => doc.category),
        expectedCategoryChecks: companyRequiredChecks,
      },
      compensationPayslipCoverage: compensationRows,
      attendanceCoverage: {
        rows: attendanceRowsReport,
        dateRange: summary.attendanceDateRange,
        byStatus: groupCount(attendanceRows, (row) => row.status),
      },
      leaveCoverage: {
        rows: leaveRows,
        byLeaveType: groupCount(leaveBalances, (row) => row.leaveType),
        policySummary: leavePolicies.map((policy) => ({
          policyId: policy.policyId,
          policyName: policy.policyName,
          leaveType: policy.leaveType,
          totalLeaves: policy.totalLeaves,
          applicableGender: policy.applicableGender || 'all',
          isActive: policy.isActive,
        })),
        requestSummary: groupCount(leaveRequests, (row) => row.status),
      },
      tenantSetup: tenantSetupRows,
      masterDataSummary: {
        departments: departments.map((department) => ({
          name: department.name,
          employeeCount: employees.filter((employee) => employee.departmentId === department.departmentId).length,
        })),
        designations: designations.map((designation) => ({
          name: designation.name,
          employeeCount: employees.filter((employee) => employee.designationId === designation.designationId).length,
        })),
        activeLeavePolicies: leavePolicies.filter((policy) => policy.isActive).map((policy) => ({
          policyName: policy.policyName,
          leaveType: policy.leaveType,
          totalLeaves: policy.totalLeaves,
          applicableGender: policy.applicableGender || 'all',
        })),
      },
      auditCoverage,
      hrConnectCoverage,
      dashboardReadiness,
      documentStorageDiagnostics,
      missingDataRegister: missingItems,
    };

    writeJson(path.join(options.outputDir, 'acv-validation-report.json'), report);
    writeJson(path.join(options.outputDir, 'acv-readiness-scorecard.json'), scorecard);
    writeJson(path.join(options.outputDir, 'acv-missing-data-register.json'), missingItems);
    writeJson(path.join(options.outputDir, 'acv-tenant-readiness.json'), {
      summary,
      tenantSetup: tenantSetupRows,
      scorecard,
      finalVerdict,
    });
    writeJson(path.join(options.outputDir, 'acv-master-data-summary.json'), report.masterDataSummary);
    writeJson(path.join(options.outputDir, 'acv-audit-coverage.json'), auditCoverage);
    writeJson(path.join(options.outputDir, 'acv-hr-connect-coverage.json'), hrConnectCoverage);
    writeJson(path.join(options.outputDir, 'acv-dashboard-readiness.json'), dashboardReadiness);
    writeJson(path.join(options.outputDir, 'document-storage-diagnostics.json'), {
      uploadRootsChecked: uploadRoots.map((_root, index) => `upload-root-${index + 1}`),
      rows: documentStorageDiagnostics,
      byStatus: groupCount(documentStorageDiagnostics, (row) => row.storageStatus),
    });

    const employeeMasterPath = path.join(options.outputDir, 'employee-master-completeness.csv');
    const managerMappingPath = path.join(options.outputDir, 'manager-mapping-coverage.csv');
    const lifecycleHistoryPath = path.join(options.outputDir, 'lifecycle-history-coverage.csv');
    const employeeDocumentPath = path.join(options.outputDir, 'employee-document-coverage.csv');
    const companyDocumentPath = path.join(options.outputDir, 'company-document-vault-coverage.csv');
    const compensationPayslipPath = path.join(options.outputDir, 'compensation-payslip-coverage.csv');
    const attendanceCoveragePath = path.join(options.outputDir, 'attendance-coverage.csv');
    const leaveCoveragePath = path.join(options.outputDir, 'leave-coverage.csv');

    writeCsv(employeeMasterPath, employeeMasterRows);
    writeCsv(managerMappingPath, managerRows);
    writeCsv(lifecycleHistoryPath, lifecycleRows);
    writeCsv(employeeDocumentPath, employeeDocumentRows);
    writeCsv(companyDocumentPath, companyDocumentRows);
    writeCsv(compensationPayslipPath, compensationRows);
    writeCsv(attendanceCoveragePath, attendanceRowsReport);
    writeCsv(leaveCoveragePath, leaveRows);
    writeCsv(path.join(options.outputDir, 'tenant-setup-completeness.csv'), tenantSetupRows);
    writeCsv(path.join(options.outputDir, 'acv-readiness-scorecard.csv'), scorecard);
    writeCsv(path.join(options.outputDir, 'acv-missing-data-register.csv'), missingItems);
    writeCsv(path.join(options.outputDir, 'document-storage-diagnostics.csv'), documentStorageDiagnostics);
    copyFile(employeeMasterPath, path.join(options.outputDir, 'acv-employee-completeness.csv'));
    copyFile(managerMappingPath, path.join(options.outputDir, 'acv-manager-mapping.csv'));
    copyFile(employeeDocumentPath, path.join(options.outputDir, 'acv-document-coverage.csv'));
    copyFile(companyDocumentPath, path.join(options.outputDir, 'acv-company-document-coverage.csv'));
    copyFile(compensationPayslipPath, path.join(options.outputDir, 'acv-compensation-coverage.csv'));
    copyFile(compensationPayslipPath, path.join(options.outputDir, 'acv-payslip-coverage.csv'));
    copyFile(attendanceCoveragePath, path.join(options.outputDir, 'acv-attendance-coverage.csv'));
    copyFile(leaveCoveragePath, path.join(options.outputDir, 'acv-leave-coverage.csv'));
    writeText(
      path.join(options.outputDir, 'README.md'),
      `# ACV Validation Reports

Generated: ${summary.generatedAt}

Tenant: ${tenant.companyName} (${tenantId})

Final verdict: ${finalVerdict}

## How To Regenerate

\`\`\`bash
npm --prefix backend run acv:validation-reports -- --company-name="ACV Solutions" --output-dir="${options.outputDir}"
\`\`\`

## Output Files

- \`acv-validation-report.json\`: consolidated machine-readable report.
- \`acv-readiness-scorecard.json\` / \`.csv\`: area-level readiness scorecard.
- \`acv-missing-data-register.json\` / \`.csv\`: missing data and document register.
- \`acv-tenant-readiness.json\`
- \`acv-master-data-summary.json\`
- \`acv-audit-coverage.json\`
- \`acv-hr-connect-coverage.json\`
- \`acv-dashboard-readiness.json\`
- \`document-storage-diagnostics.json\` / \`.csv\`
- \`acv-employee-completeness.csv\`
- \`acv-manager-mapping.csv\`
- \`acv-document-coverage.csv\`
- \`acv-company-document-coverage.csv\`
- \`acv-compensation-coverage.csv\`
- \`acv-payslip-coverage.csv\`
- \`acv-attendance-coverage.csv\`
- \`acv-leave-coverage.csv\`
- \`employee-master-completeness.csv\`
- \`manager-mapping-coverage.csv\`
- \`lifecycle-history-coverage.csv\`
- \`employee-document-coverage.csv\`
- \`company-document-vault-coverage.csv\`
- \`compensation-payslip-coverage.csv\`
- \`attendance-coverage.csv\`
- \`leave-coverage.csv\`
- \`tenant-setup-completeness.csv\`

## Data Safety

Salary amounts are not exported in this evidence pack. The report focuses on coverage, readiness, missing items, and record counts.
`
    );

    console.log(JSON.stringify({
      outputDir: options.outputDir,
      tenant: report.summary.tenant,
      counts: report.summary.counts,
      finalVerdict,
      scorecard,
      missingItemCounts: report.missingItemCounts,
    }, null, 2));
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error('ACV validation report generation failed:', error);
  process.exit(1);
});
