import 'reflect-metadata';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import {
  CompanyDocument,
  CompanyDocumentCategory,
  CompanyDocumentStatus,
  CompanyDocumentVerificationStatus,
} from '../models/CompanyDocument';
import auditService from '../services/auditService';
import { resolveUploadUrl, uploadDir } from '../utils/uploadPaths';
import { UserRole } from '../../../shared/types';

const DEFAULT_SOURCE_DIR =
  '/Users/chinar.deshpande06/Temp/CL-ACV/ACV-India/HRMS-MVP/ACV Implementation Data/01-source-files/Latest Data';

const IMPORT_BATCH = 'acv-latest-data-2026-05-27';

interface Options {
  tenantId?: string;
  companyName?: string;
  subdomain?: string;
  sourceDir: string;
  outputDir: string;
  actorEmail?: string;
  execute: boolean;
}

interface SourceDocument {
  sourceFile: string;
  title: string;
  category: CompanyDocumentCategory;
  description: string;
  documentNumber?: string;
  issuingAuthority?: string;
}

interface PlanRow {
  sourceFile: string;
  title: string;
  category: CompanyDocumentCategory;
  sha256: string;
  fileSize: number;
  action: 'create' | 'skip_existing_hash' | 'update_existing_metadata' | 'repair_existing_file';
  existingDocumentId?: string;
  existingTitle?: string;
  targetFileName?: string;
  warning?: string;
}

interface Report {
  mode: 'dry-run' | 'execute';
  generatedAt: string;
  tenant?: {
    tenantId: string;
    companyName: string;
    subdomain?: string | null;
  };
  actor?: {
    userId: string;
    email: string;
    role: string;
  };
  options: Omit<Options, 'execute'>;
  summary: Record<string, number>;
  planned: PlanRow[];
  applied: PlanRow[];
  warnings: string[];
}

const usage = `
Usage:
  npm --prefix backend run acv:company-documents -- --company-name="ACV Solutions Pvt Ltd"

Dry-run is the default. Add --execute to copy files and upsert records.

Options:
  --tenant-id=<uuid>
  --company-name="ACV Solutions Pvt Ltd"
  --subdomain=acv
  --actor-email=anupama.bhat@acvsolutions.in
  --source-dir="/path/to/Latest Data"
  --output-dir="/path/to/evidence"
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

  if (!readArg('tenant-id', args) && !readArg('company-name', args) && !readArg('subdomain', args)) {
    throw new Error('Provide --tenant-id, --company-name, or --subdomain');
  }

  return {
    tenantId: readArg('tenant-id', args),
    companyName: readArg('company-name', args),
    subdomain: readArg('subdomain', args),
    actorEmail: readArg('actor-email', args) || 'anupama.bhat@acvsolutions.in',
    sourceDir: readArg('source-dir', args) || DEFAULT_SOURCE_DIR,
    outputDir:
      readArg('output-dir', args) ||
      path.resolve(process.cwd(), `acv-company-documents-${new Date().toISOString().replace(/[:.]/g, '-')}`),
    execute: hasFlag('execute', args),
  };
};

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hashFile = (filePath: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const safeFileName = (title: string, sha256: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${slug}-${sha256.slice(0, 12)}.pdf`;
};

const findTenant = async (options: Options): Promise<Tenant> => {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const where: FindOptionsWhere<Tenant>[] = [];

  if (options.tenantId) where.push({ tenantId: options.tenantId });
  if (options.subdomain) where.push({ subdomain: options.subdomain });

  let tenants = where.length ? await tenantRepo.find({ where }) : [];

  if (options.companyName) {
    const companyMatches = await tenantRepo
      .createQueryBuilder('tenant')
      .where('LOWER(tenant.companyName) = LOWER(:companyName)', { companyName: options.companyName })
      .orWhere('LOWER(tenant.companyName) LIKE LOWER(:partialCompanyName)', {
        partialCompanyName: `%${options.companyName}%`,
      })
      .getMany();
    tenants = [...tenants, ...companyMatches];
  }

  const unique = new Map(tenants.map((tenant) => [tenant.tenantId, tenant]));
  if (unique.size === 0) throw new Error('No tenant matched the supplied selector');
  if (unique.size > 1) throw new Error(`Tenant selector matched multiple tenants: ${Array.from(unique.keys()).join(', ')}`);
  return Array.from(unique.values())[0];
};

const findActor = async (tenantId: string, actorEmail?: string): Promise<User> => {
  const userRepo = AppDataSource.getRepository(User);
  const actor = actorEmail
    ? await userRepo.findOne({ where: { tenantId, email: actorEmail.toLowerCase() } })
    : null;

  if (actor) return actor;

  const fallback = await userRepo.findOne({
    where: [
      { tenantId, role: UserRole.HR_ADMIN, isActive: true },
      { tenantId, role: UserRole.SYSTEM_ADMIN, isActive: true },
    ],
    order: { createdAt: 'ASC' },
  });

  if (!fallback) {
    throw new Error('No active HR/system user found to attribute company document import audit logs');
  }

  return fallback;
};

const sourceDocuments = (): SourceDocument[] => [
  {
    sourceFile: 'ACV PTEC Certificate.pdf',
    title: 'ACV PTEC Certificate',
    category: CompanyDocumentCategory.TAX_REGISTRATION,
    description: 'Professional Tax Enrolment Certificate imported during ACV Customer Zero data population.',
    issuingAuthority: 'Government of Maharashtra',
  },
  {
    sourceFile: 'PTRC Certifcate.pdf',
    title: 'PTRC Certificate',
    category: CompanyDocumentCategory.TAX_REGISTRATION,
    description: 'Professional Tax Registration Certificate imported during ACV Customer Zero data population.',
    issuingAuthority: 'Government of Maharashtra',
  },
  {
    sourceFile: 'GST Certificate-ACV Solutions.pdf',
    title: 'GST Certificate',
    category: CompanyDocumentCategory.TAX_REGISTRATION,
    description: 'GST registration certificate imported during ACV Customer Zero data population.',
    issuingAuthority: 'Goods and Services Tax Department',
  },
  {
    sourceFile: 'PAN Card-ACV.pdf',
    title: 'PAN Card',
    category: CompanyDocumentCategory.TAX_REGISTRATION,
    description: 'Company PAN card imported during ACV Customer Zero data population.',
    issuingAuthority: 'Income Tax Department',
  },
  {
    sourceFile: 'CERTIFICATE OF INCORPORATION.PDF',
    title: 'Certificate of Incorporation',
    category: CompanyDocumentCategory.INCORPORATION_IDENTITY,
    description: 'Certificate of Incorporation imported during ACV Customer Zero data population.',
    issuingAuthority: 'Ministry of Corporate Affairs',
  },
  {
    sourceFile: 'Form_INC-20A_ACV Solutions.pdf',
    title: 'Form INC-20A Declaration',
    category: CompanyDocumentCategory.INCORPORATION_IDENTITY,
    description: 'Declaration for commencement of business imported during ACV Customer Zero data population.',
    issuingAuthority: 'Ministry of Corporate Affairs',
  },
  {
    sourceFile: 'Acknowlegement.pdf',
    title: 'Company Registration Acknowledgement',
    category: CompanyDocumentCategory.INCORPORATION_IDENTITY,
    description: 'Company registration acknowledgement imported during ACV Customer Zero data population.',
  },
  {
    sourceFile: 'Print _ Udyam Registration Certificate with Anexure.pdf',
    title: 'Udyam Registration Certificate',
    category: CompanyDocumentCategory.INCORPORATION_IDENTITY,
    description: 'Udyam registration certificate imported during ACV Customer Zero data population.',
    issuingAuthority: 'Ministry of Micro, Small and Medium Enterprises',
  },
  {
    sourceFile: 'Gumasta License.pdf',
    title: 'Gumasta / Shops and Establishment License',
    category: CompanyDocumentCategory.LABOR_HR_COMPLIANCE,
    description: 'Gumasta / Shops and Establishment license imported during ACV Customer Zero data population.',
    issuingAuthority: 'Municipal / Shops and Establishments Authority',
  },
];

const findExisting = async (
  tenantId: string,
  source: SourceDocument,
  sha256: string
): Promise<CompanyDocument | null> => {
  const documentRepo = AppDataSource.getRepository(CompanyDocument);
  const byHash = await documentRepo
    .createQueryBuilder('document')
    .where('document.tenantId = :tenantId', { tenantId })
    .andWhere("document.metadata ->> 'sourceHash' = :sha256", { sha256 })
    .getOne();
  if (byHash) return byHash;

  const candidates = await documentRepo.find({
    where: { tenantId, category: source.category },
  });
  const normalizedTitle = normalize(source.title);
  const normalizedFile = normalize(path.basename(source.sourceFile, path.extname(source.sourceFile)));
  return (
    candidates.find((document) => normalize(document.title) === normalizedTitle) ||
    candidates.find((document) => normalize(document.originalFileName) === normalizedFile) ||
    null
  );
};

const toAuditValue = (document: CompanyDocument) => ({
  documentId: document.documentId,
  title: document.title,
  category: document.category,
  status: document.status,
  verificationStatus: document.verificationStatus,
  fileName: document.fileName,
  originalFileName: document.originalFileName,
  fileUrl: document.fileUrl,
  fileSize: document.fileSize,
  metadata: document.metadata,
});

const buildPlan = async (tenantId: string, sourceDir: string): Promise<PlanRow[]> => {
  const planned: PlanRow[] = [];

  for (const source of sourceDocuments()) {
    const absoluteSource = path.join(sourceDir, source.sourceFile);
    if (!fs.existsSync(absoluteSource)) {
      planned.push({
        sourceFile: source.sourceFile,
        title: source.title,
        category: source.category,
        sha256: '',
        fileSize: 0,
        action: 'create',
        warning: 'Source file missing',
      });
      continue;
    }

    const sha256 = hashFile(absoluteSource);
    const targetFileName = safeFileName(source.title, sha256);
    const existing = await findExisting(tenantId, source, sha256);
    const fileMissing = existing ? !fs.existsSync(resolveUploadUrl(existing.fileUrl)) : false;
    const sourceHashMissing = existing ? existing.metadata?.sourceHash !== sha256 : false;

    planned.push({
      sourceFile: source.sourceFile,
      title: source.title,
      category: source.category,
      sha256,
      fileSize: fs.statSync(absoluteSource).size,
      action: !existing
        ? 'create'
        : fileMissing
          ? 'repair_existing_file'
          : sourceHashMissing
            ? 'update_existing_metadata'
            : 'skip_existing_hash',
      existingDocumentId: existing?.documentId,
      existingTitle: existing?.title,
      targetFileName,
    });
  }

  return planned;
};

const applyPlan = async (tenant: Tenant, actor: User, sourceDir: string, planned: PlanRow[]): Promise<PlanRow[]> => {
  const documentRepo = AppDataSource.getRepository(CompanyDocument);
  const applied: PlanRow[] = [];
  const targetDir = uploadDir('company-documents');
  fs.mkdirSync(targetDir, { recursive: true });

  for (const row of planned) {
    if (row.warning) {
      applied.push(row);
      continue;
    }

    const source = sourceDocuments().find((candidate) => candidate.sourceFile === row.sourceFile)!;
    const absoluteSource = path.join(sourceDir, row.sourceFile);
    const targetFileName = row.targetFileName!;
    const targetPath = path.join(targetDir, targetFileName);
    const fileUrl = `/uploads/company-documents/${targetFileName}`;

    if (row.action === 'skip_existing_hash') {
      applied.push(row);
      continue;
    }

    fs.copyFileSync(absoluteSource, targetPath);

    if (row.existingDocumentId) {
      const existing = await documentRepo.findOne({
        where: { tenantId: tenant.tenantId, documentId: row.existingDocumentId },
      });
      if (!existing) {
        applied.push({ ...row, warning: 'Existing document disappeared before update' });
        continue;
      }

      const before = toAuditValue(existing);
      existing.title = source.title;
      existing.description = source.description;
      existing.issuingAuthority = source.issuingAuthority || existing.issuingAuthority;
      existing.fileName = targetFileName;
      existing.originalFileName = row.sourceFile;
      existing.fileUrl = fileUrl;
      existing.fileType = 'application/pdf';
      existing.fileSize = row.fileSize;
      existing.status = CompanyDocumentStatus.ACTIVE;
      existing.verificationStatus = existing.verificationStatus || CompanyDocumentVerificationStatus.UNVERIFIED;
      existing.notes = existing.notes || 'Imported during ACV Customer Zero data population. Review manually.';
      existing.metadata = {
        ...(existing.metadata || {}),
        sourceFile: row.sourceFile,
        sourceHash: row.sha256,
        importBatch: IMPORT_BATCH,
        importedByScript: 'importAcvCompanyDocuments',
      };

      const saved = await documentRepo.save(existing);
      await auditService.record({
        tenantId: tenant.tenantId,
        userId: actor.userId,
        action: row.action === 'repair_existing_file' ? 'company_document.import_repair_file' : 'company_document.import_update_metadata',
        entityType: 'company_document',
        entityId: saved.documentId,
        oldValue: before,
        newValue: toAuditValue(saved),
        description: `Imported ACV company document metadata/file: ${saved.title}`,
      });
      applied.push(row);
      continue;
    }

    const document = documentRepo.create({
      tenantId: tenant.tenantId,
      title: source.title,
      category: source.category,
      description: source.description,
      documentNumber: source.documentNumber || null,
      issuingAuthority: source.issuingAuthority || null,
      status: CompanyDocumentStatus.ACTIVE,
      verificationStatus: CompanyDocumentVerificationStatus.UNVERIFIED,
      notes: 'Imported during ACV Customer Zero data population. Review manually.',
      fileName: targetFileName,
      originalFileName: row.sourceFile,
      fileUrl,
      fileType: 'application/pdf',
      fileSize: row.fileSize,
      uploadedBy: actor.userId,
      metadata: {
        sourceFile: row.sourceFile,
        sourceHash: row.sha256,
        importBatch: IMPORT_BATCH,
        importedByScript: 'importAcvCompanyDocuments',
      },
    });

    const saved = await documentRepo.save(document);
    await auditService.record({
      tenantId: tenant.tenantId,
      userId: actor.userId,
      action: 'company_document.import_create',
      entityType: 'company_document',
      entityId: saved.documentId,
      newValue: toAuditValue(saved),
      description: `Imported ACV company document: ${saved.title}`,
    });
    applied.push(row);
  }

  return applied;
};

const writeReport = (report: Report): void => {
  fs.mkdirSync(report.options.outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(report.options.outputDir, 'acv-company-document-import-report.json'),
    JSON.stringify(report, null, 2)
  );

  const markdown = `# ACV Company Document Import ${report.mode === 'execute' ? 'Execution' : 'Dry Run'}

Generated: ${report.generatedAt}

## Tenant

- Company: ${report.tenant?.companyName || 'not resolved'}
- Tenant ID: ${report.tenant?.tenantId || 'not resolved'}
- Mode: ${report.mode}

## Summary

${Object.entries(report.summary)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

## Planned Actions

| Action | Title | Category | Existing ID | Source |
|---|---|---|---|---|
${report.planned
  .map(
    (row) =>
      `| ${row.action}${row.warning ? ` (${row.warning})` : ''} | ${row.title} | ${row.category} | ${row.existingDocumentId || ''} | ${row.sourceFile} |`
  )
  .join('\n')}

## Rollback Notes

- Created records can be identified by \`metadata.importBatch = ${IMPORT_BATCH}\`.
- Copied files are stored under \`uploads/company-documents\` with deterministic hash-suffixed names.
- If rollback is needed, archive/delete records created by this batch and remove matching copied files.
- Existing document updates should be restored from database backup if a full rollback is needed.

## Warnings

${report.warnings.length ? report.warnings.map((warning) => `- ${warning}`).join('\n') : '- None'}
`;

  fs.writeFileSync(path.join(report.options.outputDir, 'README.md'), markdown);
};

const summarize = (rows: PlanRow[]): Record<string, number> => {
  const summary: Record<string, number> = {
    total: rows.length,
    create: 0,
    skip_existing_hash: 0,
    update_existing_metadata: 0,
    repair_existing_file: 0,
    warnings: 0,
  };
  rows.forEach((row) => {
    summary[row.action] = (summary[row.action] || 0) + 1;
    if (row.warning) summary.warnings += 1;
  });
  return summary;
};

const main = async () => {
  const options = parseArgs();
  if (!fs.existsSync(options.sourceDir)) {
    throw new Error(`Source directory does not exist: ${options.sourceDir}`);
  }

  await AppDataSource.initialize();

  const tenant = await findTenant(options);
  const actor = await findActor(tenant.tenantId, options.actorEmail);
  const planned = await buildPlan(tenant.tenantId, options.sourceDir);
  const warnings = planned.filter((row) => row.warning).map((row) => `${row.sourceFile}: ${row.warning}`);
  const applied = options.execute ? await applyPlan(tenant, actor, options.sourceDir, planned) : [];

  const report: Report = {
    mode: options.execute ? 'execute' : 'dry-run',
    generatedAt: new Date().toISOString(),
    tenant: {
      tenantId: tenant.tenantId,
      companyName: tenant.companyName,
      subdomain: tenant.subdomain,
    },
    actor: {
      userId: actor.userId,
      email: actor.email,
      role: actor.role,
    },
    options: {
      tenantId: options.tenantId,
      companyName: options.companyName,
      subdomain: options.subdomain,
      sourceDir: options.sourceDir,
      outputDir: options.outputDir,
      actorEmail: options.actorEmail,
    },
    summary: summarize(planned),
    planned,
    applied,
    warnings,
  };

  writeReport(report);
  console.log(JSON.stringify({ mode: report.mode, tenant: report.tenant, summary: report.summary, outputDir: options.outputDir }, null, 2));
  await AppDataSource.destroy();
};

main().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
