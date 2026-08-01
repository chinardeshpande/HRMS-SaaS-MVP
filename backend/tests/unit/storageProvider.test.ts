import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { LocalStorageProvider } from '../../src/services/storage/LocalStorageProvider';
import { normalizeGcsKey } from '../../src/services/storage/GcsStorageProvider';
import {
  employeeDocumentKey,
  tenantDocumentKey,
} from '../../src/services/storage';

describe('document storage', () => {
  let rootDir: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aurahrms-storage-'));
    provider = new LocalStorageProvider(rootDir);
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it('persists, resolves, and deletes a private object by key', async () => {
    const key = 'tenants/tenant-a/employees/employee-a/document-id.pdf';
    const content = Buffer.from('synthetic document');

    await provider.put(key, content, 'application/pdf');

    expect(await provider.exists(key)).toBe(true);
    expect(await fs.readFile(path.join(rootDir, key))).toEqual(content);
    expect(await provider.getSignedUrl(key, 60)).toContain('/uploads/tenants/tenant-a/');

    const storedObject = await provider.openRead(key);
    const chunks: Buffer[] = [];
    for await (const chunk of storedObject.stream) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks)).toEqual(content);
    expect(storedObject.contentLength).toBe(content.length);

    await provider.delete(key);
    expect(await provider.exists(key)).toBe(false);
  });

  it('rejects traversal outside the configured storage root', async () => {
    await expect(
      provider.put('../../outside.txt', Buffer.from('blocked'), 'text/plain')
    ).rejects.toThrow('Invalid storage key');
  });

  it('creates tenant and employee scoped keys without trusting filenames as paths', () => {
    const employeeKey = employeeDocumentKey(
      'tenant-a',
      'employee-a',
      '../../Salary Letter 2026.PDF'
    );
    const companyKey = tenantDocumentKey(
      'tenant-b',
      'company-documents',
      '../Policy.pdf'
    );

    expect(employeeKey).toMatch(
      /^tenants\/tenant-a\/employees\/employee-a\/salary-letter-2026-[a-f0-9-]+\.pdf$/
    );
    expect(companyKey).toMatch(
      /^tenants\/tenant-b\/company-documents\/policy-[a-f0-9-]+\.pdf$/
    );
    expect(employeeKey).not.toContain('..');
    expect(companyKey).not.toContain('..');
  });

  it.each([
    ['/uploads/company-documents/legacy.pdf', 'company-documents/legacy.pdf'],
    ['uploads/employee-documents/legacy.pdf', 'employee-documents/legacy.pdf'],
    ['tenants/tenant-a/employees/employee-a/current.pdf', 'tenants/tenant-a/employees/employee-a/current.pdf'],
    ['/tenants/tenant-a/company-documents/current.pdf', 'tenants/tenant-a/company-documents/current.pdf'],
  ])('maps stored document path %s to GCS object key %s', (storedPath, expectedKey) => {
    expect(normalizeGcsKey(storedPath)).toBe(expectedKey);
  });
});
