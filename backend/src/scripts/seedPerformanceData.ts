import { AppDataSource } from '../config/database';
import { PerformanceReview, PerformanceState } from '../models/PerformanceReview';
import { Goal, GoalCategory, GoalStatus } from '../models/Goal';
import { KPI, KPIStatus } from '../models/KPI';
import { DevelopmentActionItem, ActionItemStatus } from '../models/DevelopmentActionItem';
import { Employee } from '../models/Employee';
import { Tenant } from '../models/Tenant';

async function seedPerformanceData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const reviewRepo = AppDataSource.getRepository(PerformanceReview);
    const goalRepo = AppDataSource.getRepository(Goal);
    const kpiRepo = AppDataSource.getRepository(KPI);
    const actionItemRepo = AppDataSource.getRepository(DevelopmentActionItem);

    // Get tenant
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant not found. Run seed script first.');
      return;
    }

    // Get employees with managers
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      relations: ['manager', 'department', 'designation'],
      take: 5,
    });

    if (employees.length === 0) {
      console.error('❌ No employees found. Run seed script first.');
      return;
    }

    console.log(`📦 Creating performance reviews for ${employees.length} employees...`);

    for (const employee of employees) {
      // Skip if no manager
      if (!employee.manager) continue;

      // Create performance review
      const review = reviewRepo.create({
        tenantId: tenant.tenantId,
        employeeId: employee.employeeId,
        reviewerId: employee.manager.employeeId,
        reviewCycle: '2026',
        reviewStartDate: new Date('2026-01-01'),
        reviewEndDate: new Date('2026-12-31'),
        currentState: Math.random() > 0.5 ? PerformanceState.MID_YEAR_COMPLETED : PerformanceState.GOALS_APPROVED,
        selfRatingMidYear: Math.random() > 0.5 ? 4.0 : null,
        managerRatingMidYear: Math.random() > 0.5 ? 4.5 : null,
        selfCommentsMidYear: Math.random() > 0.5 ? 'Making good progress on technical goals. API performance has improved significantly.' : null,
        managerCommentsMidYear: Math.random() > 0.5 ? 'Excellent technical work and strong team collaboration. Keep up the good work.' : null,
        midYearSubmittedDate: Math.random() > 0.5 ? new Date('2026-06-15') : null,
        midYearCompletedDate: Math.random() > 0.5 ? new Date('2026-06-20') : null,
        achievements: [
          'Reduced API response time by 20%',
          'Successfully mentored 2 junior developers',
          'Led architecture redesign for payment module',
        ],
        challenges: [
          'Balancing feature delivery with performance optimization',
          'Managing increased team size',
        ],
      });

      await reviewRepo.save(review);

      // Create 3 goals for each review
      const goalCategories = [GoalCategory.TECHNICAL, GoalCategory.BUSINESS, GoalCategory.LEADERSHIP];
      const goalTitles = [
        'Improve System Performance',
        'Team Leadership',
        'Revenue Growth',
      ];
      const goalDescriptions = [
        'Reduce API response time by 30%',
        'Mentor 2 junior developers',
        'Increase product revenue by 15%',
      ];

      for (let i = 0; i < 3; i++) {
        const goal = goalRepo.create({
          tenantId: tenant.tenantId,
          reviewId: review.reviewId,
          title: goalTitles[i],
          description: goalDescriptions[i],
          category: goalCategories[i],
          targetDate: new Date('2026-12-31'),
          weightage: [25, 20, 30][i],
          status: review.currentState === PerformanceState.GOALS_APPROVED ? GoalStatus.IN_PROGRESS : GoalStatus.APPROVED,
          progress: Math.floor(Math.random() * 40) + 40, // 40-80%
        });

        await goalRepo.save(goal);

        // Create 1-2 KPIs per goal
        const kpiCount = Math.random() > 0.5 ? 2 : 1;
        for (let j = 0; j < kpiCount; j++) {
          const kpiMetrics = [
            ['API Response Time', '200', '250', 'ms', KPIStatus.ON_TRACK],
            ['Error Rate', '0.5', '0.8', '%', KPIStatus.AT_RISK],
            ['Mentees', '2', '2', 'people', KPIStatus.ACHIEVED],
            ['Revenue Growth', '15', '8', '%', KPIStatus.ON_TRACK],
          ];

          const [metric, target, actual, unit, status] = kpiMetrics[(i * 2 + j) % kpiMetrics.length];

          const kpi = kpiRepo.create({
            tenantId: tenant.tenantId,
            goalId: goal.goalId,
            metric,
            target,
            actual,
            unit,
            status,
          });

          await kpiRepo.save(kpi);
        }
      }

      // Add development plan if mid-year completed
      if (review.currentState === PerformanceState.MID_YEAR_COMPLETED) {
        review.skillGaps = ['Cloud Architecture', 'System Design at Scale'];
        review.trainingRecommendations = [
          'AWS Solutions Architect Certification',
          'System Design Workshop',
        ];
        review.careerAspirations = 'Technical Lead role within 2 years';
        await reviewRepo.save(review);

        // Create action items
        const actionItems = [
          { action: 'Complete AWS Certification', timeline: 'Q1 2027', status: ActionItemStatus.PENDING },
          { action: 'Lead 1 major project', timeline: 'Q2 2027', status: ActionItemStatus.PENDING },
        ];

        for (const itemData of actionItems) {
          const item = actionItemRepo.create({
            tenantId: tenant.tenantId,
            reviewId: review.reviewId,
            action: itemData.action,
            timeline: itemData.timeline,
            status: itemData.status,
          });

          await actionItemRepo.save(item);
        }
      }

      console.log(`  ✓ Created performance review for ${employee.firstName} ${employee.lastName}`);
    }

    console.log('✅ Performance data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding performance data:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedPerformanceData();
