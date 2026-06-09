import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { EmployeeDocument } from '../models/EmployeeDocument';
import { CompanyDocument } from '../models/CompanyDocument';
import { PayslipAttachment } from '../models/PayslipAttachment';
import { findUploadPath, uploadPathExists, uploadRoots } from '../utils/uploadPaths';

interface Options {
  tenantId?: string;
  companyName: string;
  outputDir: string;
}

const DEFAULT_OUTPUT_DIR = path.resolve(
  process.cwd(),
  '../docs/acv-implementation/ACV-Testing-Evidence/import-validation-reports/2026-06-08'
);

const readArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
};

const parseOptions = (): Options => ({
  tenantId: readArg('tenant-id'),
  companyName: readArg('company-name') || 'ACV Solutions',
  outputDir: readArg('output-dir') || DEFAULT_OUTPUT_DIR,
});

const csvValue = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const writeCsv = <T extends object>(filePath: string, rows: T[]) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row as Record<string, unknown>).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );
  const output = [
    headers.map(csvValue).join(','),
    ...rows.map((row) => headers.map((header) => csvValue((row as Record<string, unknown>)[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${output}\n`);
};

const safeRef = (prefix: string, id?: string): string => `${prefix}${id ? ` ending ${id.slice(-6)}` : ''}`;

const urlPattern = (fileUrl?: string | null): string => (fileUrl ? fileUrl.replace(/\/[^/]+$/, '/<file>') : '');

const fileKind = (fileName?: string | null): string => {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  return ext || 'unknown';
};

const storageStatus = (fileUrl?: string | null): string => {
  if (!fileUrl) return 'not_provided';
  if (/^https?:\/\//i.test(fileUrl)) return 'remote';
  return uploadPathExists(fileUrl) ? 'reachable' : 'missing';
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

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  if (options.tenantId) {
    const tenant = await tenantRepo.findOne({ where: { tenantId: options.tenantId } });
    if (!tenant) throw new Error(`No tenant found for ${options.tenantId}`);
    return tenant;
  }

  const tenants = await tenantRepo
    .createQueryBuilder('tenant')
    .where('LOWER(tenant.companyName) = LOWER(:companyName)', { companyName: options.companyName })
    .orWhere('tenant.companyName ILIKE :companyNameLike', {
      companyNameLike: `%${options.companyName.replace(/\s+/g, '%')}%`,
    })
    .getMany();

  const unique = Array.from(new Map(tenants.map((tenant) => [tenant.tenantId, tenant])).values());
  if (unique.length !== 1) {
    throw new Error(`Tenant selector matched ${unique.length} tenants.`);
  }
  return unique[0];
};

async function main() {
  const options = parseOptions();
  await AppDataSource.initialize();

  try {
    const tenant = await findTenant(options);
    const [employeeDocuments, companyDocuments, payslipAttachments] = await Promise.all([
      AppDataSource.getRepository(EmployeeDocument).find({
        where: { tenantId: tenant.tenantId },
        relations: ['employee'],
      }),
      AppDataSource.getRepository(CompanyDocument).find({ where: { tenantId: tenant.tenantId } }),
      AppDataSource.getRepository(PayslipAttachment).find({ where: { tenantId: tenant.tenantId } }),
    ]);

    const rows = [
      ...employeeDocuments.map((doc) => ({
        source: 'employee_document',
        recordRef: safeRef('employee-document', doc.documentId),
        employeeCode: doc.employee?.employeeCode || '',
        category: doc.category,
        fileKind: fileKind(doc.fileName || doc.originalFileName),
        fileUrlPattern: urlPattern(doc.fileUrl),
        storageStatus: storageStatus(doc.fileUrl),
        storageRoot: storageRootLabel(doc.fileUrl),
        recommendedAction: uploadPathExists(doc.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this document.',
      })),
      ...companyDocuments.map((doc) => ({
        source: 'company_document',
        recordRef: safeRef('company-document', doc.documentId),
        employeeCode: '',
        category: doc.category,
        fileKind: fileKind(doc.fileName || doc.originalFileName),
        fileUrlPattern: urlPattern(doc.fileUrl),
        storageStatus: storageStatus(doc.fileUrl),
        storageRoot: storageRootLabel(doc.fileUrl),
        recommendedAction: uploadPathExists(doc.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this document.',
      })),
      ...payslipAttachments.map((attachment) => ({
        source: 'payslip_attachment',
        recordRef: safeRef('payslip-attachment', attachment.attachmentId),
        employeeCode: '',
        category: 'payslip',
        fileKind: fileKind(attachment.fileName),
        fileUrlPattern: urlPattern(attachment.fileUrl),
        storageStatus: storageStatus(attachment.fileUrl),
        storageRoot: storageRootLabel(attachment.fileUrl),
        recommendedAction: uploadPathExists(attachment.fileUrl)
          ? 'No action needed.'
          : 'Repair file path/storage mapping or re-upload this payslip attachment.',
      })),
    ];

    const outputPath = path.join(options.outputDir, 'document-storage-diagnostics.csv');
    writeCsv(outputPath, rows);
    console.log(JSON.stringify({
      tenant: tenant.companyName,
      outputPath,
      checked: rows.length,
      reachable: rows.filter((row) => row.storageStatus === 'reachable' || row.storageStatus === 'remote').length,
      missing: rows.filter((row) => row.storageStatus === 'missing' || row.storageStatus === 'not_provided').length,
      uploadRootsChecked: uploadRoots.length,
    }, null, 2));
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
