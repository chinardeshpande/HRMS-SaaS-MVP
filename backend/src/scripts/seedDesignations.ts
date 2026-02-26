import { AppDataSource } from '../config/database';
import { Designation } from '../models/Designation';
import { Tenant } from '../models/Tenant';
import logger from '../utils/logger';

// Comprehensive list of designations across different departments and levels
const designations = [
  // Executive Level (Level 1)
  { name: 'Chief Executive Officer (CEO)', level: 1 },
  { name: 'Chief Operating Officer (COO)', level: 1 },
  { name: 'Chief Financial Officer (CFO)', level: 1 },
  { name: 'Chief Technology Officer (CTO)', level: 1 },
  { name: 'Chief Human Resources Officer (CHRO)', level: 1 },
  { name: 'Chief Marketing Officer (CMO)', level: 1 },
  { name: 'Chief Product Officer (CPO)', level: 1 },

  // Vice President / Director Level (Level 2)
  { name: 'Vice President - Engineering', level: 2 },
  { name: 'Vice President - Sales', level: 2 },
  { name: 'Vice President - Marketing', level: 2 },
  { name: 'Vice President - Operations', level: 2 },
  { name: 'Vice President - Human Resources', level: 2 },
  { name: 'Director - Engineering', level: 2 },
  { name: 'Director - Product Management', level: 2 },
  { name: 'Director - Finance', level: 2 },
  { name: 'Director - Sales', level: 2 },
  { name: 'Director - Marketing', level: 2 },
  { name: 'Director - Operations', level: 2 },
  { name: 'Director - Human Resources', level: 2 },

  // Senior Management (Level 3)
  { name: 'Senior Engineering Manager', level: 3 },
  { name: 'Senior Product Manager', level: 3 },
  { name: 'Senior Project Manager', level: 3 },
  { name: 'Senior Sales Manager', level: 3 },
  { name: 'Senior Marketing Manager', level: 3 },
  { name: 'Senior HR Manager', level: 3 },
  { name: 'Senior Finance Manager', level: 3 },
  { name: 'Senior Operations Manager', level: 3 },

  // Management (Level 4)
  { name: 'Engineering Manager', level: 4 },
  { name: 'Product Manager', level: 4 },
  { name: 'Project Manager', level: 4 },
  { name: 'Sales Manager', level: 4 },
  { name: 'Marketing Manager', level: 4 },
  { name: 'HR Manager', level: 4 },
  { name: 'Finance Manager', level: 4 },
  { name: 'Operations Manager', level: 4 },
  { name: 'Quality Assurance Manager', level: 4 },
  { name: 'Team Lead - Engineering', level: 4 },
  { name: 'Team Lead - QA', level: 4 },
  { name: 'Team Lead - DevOps', level: 4 },

  // Senior Individual Contributors (Level 5)
  { name: 'Principal Engineer', level: 5 },
  { name: 'Principal Architect', level: 5 },
  { name: 'Staff Engineer', level: 5 },
  { name: 'Senior Software Engineer', level: 5 },
  { name: 'Senior Full Stack Developer', level: 5 },
  { name: 'Senior Frontend Developer', level: 5 },
  { name: 'Senior Backend Developer', level: 5 },
  { name: 'Senior Mobile Developer', level: 5 },
  { name: 'Senior DevOps Engineer', level: 5 },
  { name: 'Senior Data Engineer', level: 5 },
  { name: 'Senior Data Scientist', level: 5 },
  { name: 'Senior QA Engineer', level: 5 },
  { name: 'Senior UI/UX Designer', level: 5 },
  { name: 'Senior Product Designer', level: 5 },
  { name: 'Senior Business Analyst', level: 5 },
  { name: 'Senior Data Analyst', level: 5 },
  { name: 'Senior Content Writer', level: 5 },
  { name: 'Senior Graphic Designer', level: 5 },
  { name: 'Senior Accountant', level: 5 },
  { name: 'Senior HR Business Partner', level: 5 },
  { name: 'Senior Sales Executive', level: 5 },
  { name: 'Senior Marketing Executive', level: 5 },

  // Mid-Level (Level 6)
  { name: 'Software Engineer', level: 6 },
  { name: 'Full Stack Developer', level: 6 },
  { name: 'Frontend Developer', level: 6 },
  { name: 'Backend Developer', level: 6 },
  { name: 'Mobile Developer (iOS)', level: 6 },
  { name: 'Mobile Developer (Android)', level: 6 },
  { name: 'DevOps Engineer', level: 6 },
  { name: 'Data Engineer', level: 6 },
  { name: 'Data Scientist', level: 6 },
  { name: 'QA Engineer', level: 6 },
  { name: 'QA Automation Engineer', level: 6 },
  { name: 'UI/UX Designer', level: 6 },
  { name: 'Product Designer', level: 6 },
  { name: 'Business Analyst', level: 6 },
  { name: 'Data Analyst', level: 6 },
  { name: 'Content Writer', level: 6 },
  { name: 'Copywriter', level: 6 },
  { name: 'Graphic Designer', level: 6 },
  { name: 'Accountant', level: 6 },
  { name: 'HR Business Partner', level: 6 },
  { name: 'Recruitment Specialist', level: 6 },
  { name: 'Sales Executive', level: 6 },
  { name: 'Account Manager', level: 6 },
  { name: 'Marketing Executive', level: 6 },
  { name: 'Digital Marketing Specialist', level: 6 },
  { name: 'SEO Specialist', level: 6 },
  { name: 'Social Media Manager', level: 6 },
  { name: 'Customer Success Manager', level: 6 },
  { name: 'Technical Support Engineer', level: 6 },

  // Junior Level (Level 7)
  { name: 'Junior Software Engineer', level: 7 },
  { name: 'Junior Full Stack Developer', level: 7 },
  { name: 'Junior Frontend Developer', level: 7 },
  { name: 'Junior Backend Developer', level: 7 },
  { name: 'Junior Mobile Developer', level: 7 },
  { name: 'Junior DevOps Engineer', level: 7 },
  { name: 'Junior Data Analyst', level: 7 },
  { name: 'Junior QA Engineer', level: 7 },
  { name: 'Junior UI/UX Designer', level: 7 },
  { name: 'Junior Graphic Designer', level: 7 },
  { name: 'Junior Business Analyst', level: 7 },
  { name: 'Junior Content Writer', level: 7 },
  { name: 'Junior Accountant', level: 7 },
  { name: 'Junior HR Executive', level: 7 },
  { name: 'Junior Sales Executive', level: 7 },
  { name: 'Junior Marketing Executive', level: 7 },

  // Entry Level / Trainee / Intern (Level 8)
  { name: 'Trainee Software Engineer', level: 8 },
  { name: 'Software Engineering Intern', level: 8 },
  { name: 'QA Intern', level: 8 },
  { name: 'Design Intern', level: 8 },
  { name: 'Marketing Intern', level: 8 },
  { name: 'HR Intern', level: 8 },
  { name: 'Finance Intern', level: 8 },
  { name: 'Business Analyst Intern', level: 8 },
  { name: 'Data Analyst Intern', level: 8 },
  { name: 'Content Writing Intern', level: 8 },

  // Support / Administrative (Level 9)
  { name: 'Administrative Assistant', level: 9 },
  { name: 'Executive Assistant', level: 9 },
  { name: 'Office Manager', level: 9 },
  { name: 'Receptionist', level: 9 },
  { name: 'Office Coordinator', level: 9 },
  { name: 'HR Coordinator', level: 9 },
  { name: 'Recruitment Coordinator', level: 9 },
  { name: 'Customer Support Representative', level: 9 },
  { name: 'Technical Support Representative', level: 9 },
  { name: 'Data Entry Operator', level: 9 },
  { name: 'Facilities Manager', level: 9 },
  { name: 'IT Support Specialist', level: 9 },
];

async function seedDesignations() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection initialized for seeding');
    }

    const designationRepo = AppDataSource.getRepository(Designation);
    const tenantRepo = AppDataSource.getRepository(Tenant);

    // Get all tenants
    const tenants = await tenantRepo.find();

    if (tenants.length === 0) {
      logger.warn('No tenants found. Please run tenant seeding first.');
      return;
    }

    logger.info(`Found ${tenants.length} tenant(s). Seeding designations...`);

    let totalCreated = 0;

    for (const tenant of tenants) {
      logger.info(`\nSeeding designations for tenant: ${tenant.companyName} (${tenant.tenantId})`);

      for (const desig of designations) {
        // Check if designation already exists for this tenant
        const existing = await designationRepo.findOne({
          where: {
            tenantId: tenant.tenantId,
            name: desig.name,
          },
        });

        if (existing) {
          logger.info(`  ⏭️  Skipping "${desig.name}" - already exists`);
          continue;
        }

        // Create designation
        const designation = designationRepo.create({
          tenantId: tenant.tenantId,
          name: desig.name,
          level: desig.level,
        });

        await designationRepo.save(designation);
        totalCreated++;
        logger.info(`  ✅ Created "${desig.name}" (Level ${desig.level})`);
      }
    }

    logger.info(`\n✅ Designation seeding completed!`);
    logger.info(`📊 Total designations created: ${totalCreated}`);
    logger.info(`📋 Designations per tenant: ${designations.length}`);

    // Display summary
    const allDesignations = await designationRepo.find({
      order: { level: 'ASC', name: 'ASC' },
    });

    logger.info(`\n📊 Total designations in database: ${allDesignations.length}`);

    // Group by level
    const byLevel = allDesignations.reduce((acc, d) => {
      const level = d.level || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    logger.info('\n📈 Breakdown by level:');
    Object.entries(byLevel)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([level, count]) => {
        const levelName = {
          '1': 'Executive',
          '2': 'VP/Director',
          '3': 'Senior Management',
          '4': 'Management',
          '5': 'Senior IC',
          '6': 'Mid-Level',
          '7': 'Junior',
          '8': 'Entry/Intern',
          '9': 'Support/Admin',
        }[level] || 'Other';
        logger.info(`  Level ${level} (${levelName}): ${count} designations`);
      });

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding designations:', error);
    process.exit(1);
  }
}

// Run seeding
seedDesignations();
