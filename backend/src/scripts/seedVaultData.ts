import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { DigitalLibrary, ResourceType, AccessLevel } from '../models/DigitalLibrary';
import { GeneratedDocument, GeneratedDocumentStatus, GeneratedDocumentFormat } from '../models/GeneratedDocument';
import { DocumentType } from '../models/enums/DocumentEnums';
import { UserRole } from '../../../shared/types';

async function seedVault() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected for Vault Seeding');

    const employeeRepo = AppDataSource.getRepository(Employee);
    const userRepo = AppDataSource.getRepository(User);
    const libraryRepo = AppDataSource.getRepository(DigitalLibrary);
    const docRepo = AppDataSource.getRepository(GeneratedDocument);

    // Find our key employees
    const sarah = await employeeRepo.findOne({ where: { email: 'sarah.johnson@acme.com' } });
    const john = await employeeRepo.findOne({ where: { email: 'john.smith@acme.com' } });

    if (!sarah || !john) {
      console.error('❌ Could not find Sarah or John employees. Run seedTestData first!');
      process.exit(1);
    }

    const adminUser = await userRepo.findOne({ where: { role: UserRole.SYSTEM_ADMIN } });
    const adminId = adminUser ? adminUser.userId : sarah.employeeId;

    console.log(`👤 Found Sarah Johnson: employeeId = ${sarah.employeeId}, tenantId = ${sarah.tenantId}`);
    console.log(`👤 Found John Smith: employeeId = ${john.employeeId}, tenantId = ${john.tenantId}`);

    // Clear existing vault items for these users to prevent duplicates
    await libraryRepo.delete({ employeeId: sarah.employeeId });
    await libraryRepo.delete({ employeeId: john.employeeId });
    await docRepo.delete({ employeeId: sarah.employeeId });
    await docRepo.delete({ employeeId: john.employeeId });

    // Seed Digital Library items (Payslips for Sarah & John)
    const libraryEntries = [
      // Sarah Payslips
      libraryRepo.create({
        tenantId: sarah.tenantId,
        employeeId: sarah.employeeId,
        fileName: 'payslip_may_2026.pdf',
        fileUrl: '/uploads/sample_payslip.pdf', // Local mock relative URL
        fileType: 'application/pdf',
        fileSize: 102450,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PRIVATE,
        category: 'payslip',
        originalOwnerId: sarah.employeeId,
        description: 'Salary slips generated for month of May 2026',
        createdAt: new Date('2026-05-30T10:00:00Z'),
      }),
      libraryRepo.create({
        tenantId: sarah.tenantId,
        employeeId: sarah.employeeId,
        fileName: 'payslip_april_2026.pdf',
        fileUrl: '/uploads/sample_payslip.pdf',
        fileType: 'application/pdf',
        fileSize: 102120,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PRIVATE,
        category: 'payslip',
        originalOwnerId: sarah.employeeId,
        description: 'Salary slips generated for month of April 2026',
        createdAt: new Date('2026-04-30T10:00:00Z'),
      }),
      // John Payslips
      libraryRepo.create({
        tenantId: john.tenantId,
        employeeId: john.employeeId,
        fileName: 'payslip_may_2026.pdf',
        fileUrl: '/uploads/sample_payslip.pdf',
        fileType: 'application/pdf',
        fileSize: 102450,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PRIVATE,
        category: 'payslip',
        originalOwnerId: john.employeeId,
        description: 'Salary slips generated for month of May 2026',
        createdAt: new Date('2026-05-30T10:00:00Z'),
      }),

      // Corporate Policies (Public) - Available to Sarah and John
      libraryRepo.create({
        tenantId: sarah.tenantId,
        employeeId: sarah.employeeId, // Sarah created/owns the entry
        fileName: 'AuroraHR_Employee_Handbook_2026.pdf',
        fileUrl: '/uploads/sample_handbook.pdf',
        fileType: 'application/pdf',
        fileSize: 2450000,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PUBLIC,
        category: 'policy',
        originalOwnerId: sarah.employeeId,
        description: 'General HR policies & standards for employees',
        createdAt: new Date('2026-01-01T09:00:00Z'),
      }),
      libraryRepo.create({
        tenantId: sarah.tenantId,
        employeeId: sarah.employeeId,
        fileName: 'AURORAHR_Travel_Policy_v4.pdf',
        fileUrl: '/uploads/sample_travel_policy.pdf',
        fileType: 'application/pdf',
        fileSize: 580000,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PUBLIC,
        category: 'policy',
        originalOwnerId: sarah.employeeId,
        description: 'Corporate travel allowance details & rules',
        createdAt: new Date('2026-02-15T09:00:00Z'),
      }),

      // Duplicate policies for John to see under his tenantId/employeeId
      libraryRepo.create({
        tenantId: john.tenantId,
        employeeId: john.employeeId,
        fileName: 'AuroraHR_Employee_Handbook_2026.pdf',
        fileUrl: '/uploads/sample_handbook.pdf',
        fileType: 'application/pdf',
        fileSize: 2450000,
        resourceType: ResourceType.DOCUMENT,
        accessLevel: AccessLevel.PUBLIC,
        category: 'policy',
        originalOwnerId: john.employeeId,
        description: 'General HR policies & standards for employees',
        createdAt: new Date('2026-01-01T09:00:00Z'),
      }),
    ];

    await libraryRepo.save(libraryEntries);
    console.log('✅ Seeding Digital Library (Payslips & Policies) completed');

    // Seed Generated Documents (Contracts) for Sarah & John
    const documentEntries = [
      // Sarah Contracts
      docRepo.create({
        tenantId: sarah.tenantId,
        documentType: DocumentType.APPOINTMENT_LETTER,
        documentName: 'AuroraHR_Appointment_Letter_Sarah.pdf',
        employeeId: sarah.employeeId,
        generatedBy: adminId,
        status: GeneratedDocumentStatus.ISSUED,
        format: GeneratedDocumentFormat.PDF,
        filePath: 'uploads/appointment_letter.pdf',
        fileUrl: `/api/v1/documents/sample_contract.pdf`,
        fileSizeBytes: 142500,
        metadata: {
          issuedTo: {
            name: `${sarah.firstName} ${sarah.lastName}`,
            email: sarah.email,
          },
          validity: {
            issueDate: '2023-02-01',
          }
        },
        createdAt: new Date('2023-02-01T09:00:00Z'),
      }),
      docRepo.create({
        tenantId: sarah.tenantId,
        documentType: DocumentType.NDA,
        documentName: 'Mutual_NDA_Sarah_Johnson.pdf',
        employeeId: sarah.employeeId,
        generatedBy: adminId,
        status: GeneratedDocumentStatus.ISSUED,
        format: GeneratedDocumentFormat.PDF,
        filePath: 'uploads/nda.pdf',
        fileUrl: `/api/v1/documents/sample_contract.pdf`,
        fileSizeBytes: 98200,
        metadata: {
          issuedTo: {
            name: `${sarah.firstName} ${sarah.lastName}`,
            email: sarah.email,
          },
          validity: {
            issueDate: '2023-02-01',
          }
        },
        createdAt: new Date('2023-02-01T09:00:00Z'),
      }),

      // John Contracts
      docRepo.create({
        tenantId: john.tenantId,
        documentType: DocumentType.APPOINTMENT_LETTER,
        documentName: 'AuroraHR_Appointment_Letter_John.pdf',
        employeeId: john.employeeId,
        generatedBy: adminId,
        status: GeneratedDocumentStatus.ISSUED,
        format: GeneratedDocumentFormat.PDF,
        filePath: 'uploads/appointment_letter.pdf',
        fileUrl: `/api/v1/documents/sample_contract.pdf`,
        fileSizeBytes: 142500,
        metadata: {
          issuedTo: {
            name: `${john.firstName} ${john.lastName}`,
            email: john.email,
          },
          validity: {
            issueDate: '2023-02-15',
          }
        },
        createdAt: new Date('2023-02-15T09:00:00Z'),
      }),
    ];

    await docRepo.save(documentEntries);
    console.log('✅ Seeding Generated Documents (Contracts) completed');

    await AppDataSource.destroy();
    console.log('🎉 Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedVault();
