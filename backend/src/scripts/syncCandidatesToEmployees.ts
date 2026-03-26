import { AppDataSource } from '../config/database';
import { Candidate } from '../models/Candidate';
import { Employee } from '../models/Employee';
import { EmploymentStatus } from '../../../shared/types';
import logger from '../utils/logger';

async function syncCandidatesToEmployees() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const candidateRepo = AppDataSource.getRepository(Candidate);
    const employeeRepo = AppDataSource.getRepository(Employee);

    // Find all candidates in JOINED, ORIENTATION, or ONBOARDING_COMPLETE states
    const joinedCandidates = await candidateRepo.find({
      where: [
        { currentState: 'joined' as any },
        { currentState: 'orientation' as any },
        { currentState: 'onboarding_complete' as any },
      ],
      relations: ['department', 'designation'],
    });

    console.log(`\n📊 Found ${joinedCandidates.length} candidates who have joined\n`);

    let created = 0;
    let alreadyExists = 0;
    let errors = 0;

    for (const candidate of joinedCandidates) {
      try {
        console.log(`\nProcessing: ${candidate.firstName} ${candidate.lastName} (${candidate.email})`);
        console.log(`  Current State: ${candidate.currentState}`);
        console.log(`  Employee ID: ${candidate.employeeId || 'None'}`);

        // Check if employee record already exists
        let employee = null;

        if (candidate.employeeId) {
          employee = await employeeRepo.findOne({ where: { employeeId: candidate.employeeId } });
        }

        if (!employee) {
          employee = await employeeRepo.findOne({
            where: { email: candidate.email, tenantId: candidate.tenantId }
          });
        }

        if (employee) {
          console.log(`  ✓ Employee record already exists: ${employee.employeeCode}`);

          // Link candidate to employee if not already linked
          if (!candidate.employeeId) {
            candidate.employeeId = employee.employeeId;
            await candidateRepo.save(candidate);
            console.log(`  ✓ Linked candidate to existing employee`);
          }

          alreadyExists++;
          continue;
        }

        // Generate employee code
        const employeeCount = await employeeRepo.count({ where: { tenantId: candidate.tenantId } });
        const employeeCode = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

        // Create new employee record
        const newEmployee = employeeRepo.create({
          tenantId: candidate.tenantId,
          employeeCode,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          dateOfBirth: candidate.dateOfBirth,
          gender: candidate.gender,
          address: candidate.address,
          departmentId: candidate.departmentId,
          designationId: candidate.designationId,
          managerId: candidate.reportingManagerId,
          dateOfJoining: candidate.actualJoinDate || new Date(),
          employmentType: candidate.employmentType || 'full-time',
          status: EmploymentStatus.ACTIVE,
        });

        const savedEmployee = await employeeRepo.save(newEmployee);

        // Link candidate to employee
        candidate.employeeId = savedEmployee.employeeId;
        await candidateRepo.save(candidate);

        console.log(`  ✅ Created employee: ${savedEmployee.employeeCode} (${savedEmployee.employeeId})`);
        created++;

      } catch (error: any) {
        console.error(`  ❌ Error processing candidate: ${error.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Employees created: ${created}`);
    console.log(`ℹ️  Already existed: ${alreadyExists}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${joinedCandidates.length}`);
    console.log('='.repeat(60) + '\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing candidates to employees:', error);
    process.exit(1);
  }
}

syncCandidatesToEmployees();
