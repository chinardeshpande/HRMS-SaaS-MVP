import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { HRConnectPost, PostType, PostVisibility } from '../models/HRConnectPost';
import { HRConnectComment } from '../models/HRConnectComment';
import { HRConnectReaction, ReactionType } from '../models/HRConnectReaction';
import { HRConnectGroup, GroupType, GroupPrivacy } from '../models/HRConnectGroup';
import { HRConnectGroupMember, MemberRole } from '../models/HRConnectGroupMember';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

async function seedHRConnectData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const postRepo = AppDataSource.getRepository(HRConnectPost);
    const commentRepo = AppDataSource.getRepository(HRConnectComment);
    const reactionRepo = AppDataSource.getRepository(HRConnectReaction);
    const groupRepo = AppDataSource.getRepository(HRConnectGroup);
    const groupMemberRepo = AppDataSource.getRepository(HRConnectGroupMember);

    // Find tenant
    const tenant = await tenantRepo.findOne({ where: { subdomain: 'acme' } });
    if (!tenant) {
      console.error('❌ Tenant not found!');
      process.exit(1);
    }

    // Get employees via users
    const hrUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'hr@acme.com' }, relations: ['employee'] });
    const managerUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'manager@acme.com' }, relations: ['employee'] });
    const aliceUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'alice@acme.com' }, relations: ['employee'] });
    const bobUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'bob@acme.com' }, relations: ['employee'] });
    const emmaUser = await userRepo.findOne({ where: { tenantId: tenant.tenantId, email: 'emma@acme.com' }, relations: ['employee'] });

    const hr = hrUser?.employee;
    const manager = managerUser?.employee;
    const alice = aliceUser?.employee;
    const bob = bobUser?.employee;
    const emma = emmaUser?.employee;

    const missing = [];
    if (!hr) missing.push('hr@acme.com');
    if (!manager) missing.push('manager@acme.com');
    if (!alice) missing.push('alice@acme.com');
    if (!bob) missing.push('bob@acme.com');
    if (!emma) missing.push('emma@acme.com');

    if (missing.length > 0) {
      console.error('❌ Required employees not found:', missing.join(', '));
      console.error('Run: npm run seed:hrconnect');
      console.error('Or: npx ts-node src/scripts/createMultipleUsers.ts');
      process.exit(1);
    }

    // Type assertions - we know they exist after the check
    const hrEmployee = hr!;
    const managerEmployee = manager!;
    const aliceEmployee = alice!;
    const bobEmployee = bob!;
    const emmaEmployee = emma!;

    // Get departments
    const engineering = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Engineering' }
    });

    const humanResources = await departmentRepo.findOne({
      where: { tenantId: tenant.tenantId, name: 'Human Resources' }
    });

    console.log('\n🏢 Creating HR Connect Groups...\n');

    // Create Groups
    const groups = [];

    const engineeringGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'Engineering Team',
      description: 'Discussion space for all engineering team members',
      groupType: GroupType.DEPARTMENT,
      privacy: GroupPrivacy.PUBLIC,
      createdBy: managerEmployee.employeeId,
      departmentId: engineering?.departmentId,
      memberCount: 4,
    });
    const savedEngineeringGroup = await groupRepo.save(engineeringGroup);
    groups.push(savedEngineeringGroup);

    const socialGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'Water Cooler',
      description: 'Casual conversations and social chatter',
      groupType: GroupType.SOCIAL,
      privacy: GroupPrivacy.PUBLIC,
      createdBy: aliceEmployee.employeeId,
      memberCount: 5,
    });
    const savedSocialGroup = await groupRepo.save(socialGroup);
    groups.push(savedSocialGroup);

    const hrAnnouncementsGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'HR Announcements',
      description: 'Important HR updates and policy changes',
      groupType: GroupType.TOPIC,
      privacy: GroupPrivacy.PUBLIC,
      createdBy: hrEmployee.employeeId,
      departmentId: humanResources?.departmentId,
      memberCount: 2,
    });
    const savedHRGroup = await groupRepo.save(hrAnnouncementsGroup);
    groups.push(savedHRGroup);

    console.log(`✓ Created ${groups.length} groups`);

    // Add group members
    console.log('\n👥 Adding group members...\n');

    const groupMemberships = [
      // Engineering Group
      { groupId: savedEngineeringGroup.groupId, employeeId: managerEmployee.employeeId, role: MemberRole.ADMIN },
      { groupId: savedEngineeringGroup.groupId, employeeId: aliceEmployee.employeeId, role: MemberRole.MEMBER },
      { groupId: savedEngineeringGroup.groupId, employeeId: bobEmployee.employeeId, role: MemberRole.MEMBER },
      { groupId: savedEngineeringGroup.groupId, employeeId: emmaEmployee.employeeId, role: MemberRole.MEMBER },

      // Social Group
      { groupId: savedSocialGroup.groupId, employeeId: aliceEmployee.employeeId, role: MemberRole.ADMIN },
      { groupId: savedSocialGroup.groupId, employeeId: bobEmployee.employeeId, role: MemberRole.MEMBER },
      { groupId: savedSocialGroup.groupId, employeeId: emmaEmployee.employeeId, role: MemberRole.MEMBER },
      { groupId: savedSocialGroup.groupId, employeeId: managerEmployee.employeeId, role: MemberRole.MEMBER },
      { groupId: savedSocialGroup.groupId, employeeId: hrEmployee.employeeId, role: MemberRole.MEMBER },

      // HR Announcements Group
      { groupId: savedHRGroup.groupId, employeeId: hrEmployee.employeeId, role: MemberRole.ADMIN },
      { groupId: savedHRGroup.groupId, employeeId: managerEmployee.employeeId, role: MemberRole.MODERATOR },
    ];

    for (const membership of groupMemberships) {
      await groupMemberRepo.save(groupMemberRepo.create({
        tenantId: tenant.tenantId,
        ...membership,
      }));
    }

    console.log(`✓ Added ${groupMemberships.length} group memberships`);

    console.log('\n📝 Creating HR Connect Posts...\n');

    // Create Posts
    const posts: HRConnectPost[] = [];

    // HR Announcement about benefits
    const benefitsPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: hrEmployee.employeeId,
      title: 'New Health Insurance Benefits Enrollment - Action Required',
      content: `Dear Team,

We're excited to announce enhanced health insurance benefits for all employees! Open enrollment starts next Monday.

📋 Key Updates:
• Increased coverage for dental and vision
• Added mental health support services
• Lower co-pays for primary care visits
• Expanded network of healthcare providers

📅 Important Dates:
• Enrollment Period: March 15 - March 31
• Coverage Starts: April 1, 2026

👉 Action Required:
Please review the benefits package and make your selections in the HR portal by March 31.

Questions? Reach out to hr@acme.com or drop by the HR office.`,
      postType: PostType.ANNOUNCEMENT,
      visibility: PostVisibility.PUBLIC,
      groupId: savedHRGroup.groupId,
      isPinned: true,
      viewCount: 45,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addDays(new Date(), -3),
      updatedAt: addDays(new Date(), -3),
    });
    const savedBenefitsPost = await postRepo.save(benefitsPost);
    posts.push(savedBenefitsPost);

    // Manager post about sprint planning
    const sprintPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: managerEmployee.employeeId,
      title: 'Sprint Planning - Q2 2026',
      content: `Team,

Let's discuss our priorities for the upcoming quarter. I'd like everyone's input on:

1. Technical debt items we should tackle
2. New features that would have the biggest impact
3. Infrastructure improvements needed

Please share your thoughts below. We'll finalize the roadmap in Friday's meeting.`,
      postType: PostType.DISCUSSION,
      visibility: PostVisibility.PUBLIC,
      groupId: savedEngineeringGroup.groupId,
      viewCount: 28,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addDays(new Date(), -2),
      updatedAt: addDays(new Date(), -2),
    });
    const savedSprintPost = await postRepo.save(sprintPost);
    posts.push(savedSprintPost);

    // Alice asking a question
    const questionPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: aliceEmployee.employeeId,
      title: 'Best practices for code reviews?',
      content: `Hey team! I'm working on improving our code review process. What do you all think are the most important things to look for during reviews?

I usually check for:
- Code readability
- Test coverage
- Performance implications

What else should I be considering?`,
      postType: PostType.QUESTION,
      visibility: PostVisibility.PUBLIC,
      groupId: savedEngineeringGroup.groupId,
      viewCount: 22,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addDays(new Date(), -1),
      updatedAt: addDays(new Date(), -1),
    });
    const savedQuestionPost = await postRepo.save(questionPost);
    posts.push(savedQuestionPost);

    // Emma's social post
    const lunchPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: emmaEmployee.employeeId,
      title: 'Team Lunch Tomorrow?',
      content: `Anyone interested in grabbing lunch together tomorrow around 12:30 PM?

I'm thinking of trying that new Italian place down the street. All are welcome! 🍝`,
      postType: PostType.DISCUSSION,
      visibility: PostVisibility.PUBLIC,
      groupId: savedSocialGroup.groupId,
      viewCount: 18,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addHours(new Date(), -8),
      updatedAt: addHours(new Date(), -8),
    });
    const savedLunchPost = await postRepo.save(lunchPost);
    posts.push(savedLunchPost);

    // Bob's technical discussion
    const techPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: bobEmployee.employeeId,
      title: 'Database Migration Best Practices',
      content: `Planning to migrate our production database to a new server this weekend.

Has anyone done a similar migration before? Would love to hear about your experience and any gotchas to watch out for.

Current plan:
1. Full backup on Friday night
2. Run migration scripts Saturday morning
3. Test and verify Sunday
4. Go live Monday if all checks pass

Thoughts?`,
      postType: PostType.DISCUSSION,
      visibility: PostVisibility.PUBLIC,
      groupId: savedEngineeringGroup.groupId,
      viewCount: 15,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addHours(new Date(), -4),
      updatedAt: addHours(new Date(), -4),
    });
    const savedTechPost = await postRepo.save(techPost);
    posts.push(savedTechPost);

    // HR asking for feedback
    const feedbackPost = postRepo.create({
      tenantId: tenant.tenantId,
      authorId: hrEmployee.employeeId,
      title: 'Help us improve onboarding! Share your feedback',
      content: `We're revamping our onboarding process and would love your input!

If you joined us in the last 12 months, please share:
- What worked well?
- What could be improved?
- What information was missing that you wish you had?

Your feedback will help make the experience better for new hires. Thanks in advance! 🙏`,
      postType: PostType.QUESTION,
      visibility: PostVisibility.PUBLIC,
      viewCount: 31,
      commentCount: 0,
      reactionCount: 0,
      createdAt: addHours(new Date(), -12),
      updatedAt: addHours(new Date(), -12),
    });
    const savedFeedbackPost = await postRepo.save(feedbackPost);
    posts.push(savedFeedbackPost);

    console.log(`✓ Created ${posts.length} posts`);

    console.log('\n💬 Adding comments to posts...\n');

    // Add comments
    const comments: HRConnectComment[] = [];

    // Comments on benefits post
    const comment1 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      authorId: aliceEmployee.employeeId,
      content: 'This is great news! The expanded mental health support is especially welcome.',
      createdAt: addDays(new Date(), -2),
      updatedAt: addDays(new Date(), -2),
    });
    const savedComment1 = await commentRepo.save(comment1);
    comments.push(savedComment1);

    const comment2 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      authorId: managerEmployee.employeeId,
      content: 'Excellent initiative! Will share this with the team during our next standup.',
      createdAt: addDays(new Date(), -2),
      updatedAt: addDays(new Date(), -2),
    });
    comments.push(await commentRepo.save(comment2));

    // Comments on sprint planning
    const comment3 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedSprintPost.postId,
      authorId: aliceEmployee.employeeId,
      content: `I think we should prioritize the API refactoring. It's been causing some performance issues and will pay off in the long run.`,
      createdAt: addDays(new Date(), -1),
      updatedAt: addDays(new Date(), -1),
    });
    comments.push(await commentRepo.save(comment3));

    const comment4 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedSprintPost.postId,
      authorId: bobEmployee.employeeId,
      content: `+1 on the API refactoring. Also, I'd like to propose improving our CI/CD pipeline. Current deployment times are getting slow.`,
      createdAt: addDays(new Date(), -1),
      updatedAt: addDays(new Date(), -1),
    });
    comments.push(await commentRepo.save(comment4));

    const comment5 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedSprintPost.postId,
      authorId: emmaEmployee.employeeId,
      content: 'Could we also allocate some time for documentation updates? Our onboarding docs are outdated.',
      createdAt: addDays(new Date(), -1),
      updatedAt: addDays(new Date(), -1),
    });
    comments.push(await commentRepo.save(comment5));

    // Comments on code review question
    const comment6 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedQuestionPost.postId,
      authorId: managerEmployee.employeeId,
      content: `Great question, Alice! I'd add:
- Security vulnerabilities (SQL injection, XSS, etc.)
- Error handling and edge cases
- Code duplication
- Adherence to our style guide

Also, remember reviews are as much about learning as finding bugs!`,
      createdAt: addHours(new Date(), -20),
      updatedAt: addHours(new Date(), -20),
    });
    comments.push(await commentRepo.save(comment6));

    const comment7 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedQuestionPost.postId,
      authorId: bobEmployee.employeeId,
      content: 'I always check if the changes align with the ticket requirements. Sometimes PR scope creeps beyond the original scope.',
      createdAt: addHours(new Date(), -18),
      updatedAt: addHours(new Date(), -18),
    });
    comments.push(await commentRepo.save(comment7));

    // Comments on lunch post
    const comment8 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedLunchPost.postId,
      authorId: bobEmployee.employeeId,
      content: "I'm in! Love Italian food. Should we make a reservation?",
      createdAt: addHours(new Date(), -7),
      updatedAt: addHours(new Date(), -7),
    });
    comments.push(await commentRepo.save(comment8));

    const comment9 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedLunchPost.postId,
      authorId: aliceEmployee.employeeId,
      content: 'Count me in too! 🍝',
      createdAt: addHours(new Date(), -6),
      updatedAt: addHours(new Date(), -6),
    });
    comments.push(await commentRepo.save(comment9));

    const comment10 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedLunchPost.postId,
      authorId: emmaEmployee.employeeId,
      content: 'Great! I will make a reservation for 5 people. See you all at 12:30!',
      createdAt: addHours(new Date(), -5),
      updatedAt: addHours(new Date(), -5),
    });
    comments.push(await commentRepo.save(comment10));

    // Comments on tech post
    const comment11 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedTechPost.postId,
      authorId: managerEmployee.employeeId,
      content: `Solid plan! Make sure to:
1. Test the rollback procedure beforehand
2. Have a communication plan for stakeholders
3. Monitor performance closely after migration

Also, consider doing a dry run on staging first.`,
      createdAt: addHours(new Date(), -3),
      updatedAt: addHours(new Date(), -3),
    });
    comments.push(await commentRepo.save(comment11));

    const comment12 = commentRepo.create({
      tenantId: tenant.tenantId,
      postId: savedTechPost.postId,
      authorId: aliceEmployee.employeeId,
      content: 'I can help with testing on Sunday if needed. Let me know!',
      createdAt: addHours(new Date(), -2),
      updatedAt: addHours(new Date(), -2),
    });
    comments.push(await commentRepo.save(comment12));

    // Update comment counts
    await postRepo.update({ postId: savedBenefitsPost.postId }, { commentCount: 2 });
    await postRepo.update({ postId: savedSprintPost.postId }, { commentCount: 3 });
    await postRepo.update({ postId: savedQuestionPost.postId }, { commentCount: 2 });
    await postRepo.update({ postId: savedLunchPost.postId }, { commentCount: 3 });
    await postRepo.update({ postId: savedTechPost.postId }, { commentCount: 2 });

    console.log(`✓ Created ${comments.length} comments`);

    console.log('\n👍 Adding reactions...\n');

    // Add reactions
    const reactions: HRConnectReaction[] = [];

    // Reactions on benefits post
    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      userId: aliceEmployee.employeeId,
      reactionType: ReactionType.HELPFUL,
    })));

    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      userId: bobEmployee.employeeId,
      reactionType: ReactionType.LIKE,
    })));

    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      userId: emmaEmployee.employeeId,
      reactionType: ReactionType.CELEBRATE,
    })));

    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedBenefitsPost.postId,
      userId: managerEmployee.employeeId,
      reactionType: ReactionType.HELPFUL,
    })));

    // Reactions on sprint post
    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedSprintPost.postId,
      userId: aliceEmployee.employeeId,
      reactionType: ReactionType.LIKE,
    })));

    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedSprintPost.postId,
      userId: bobEmployee.employeeId,
      reactionType: ReactionType.LIKE,
    })));

    // Reactions on question post
    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedQuestionPost.postId,
      userId: managerEmployee.employeeId,
      reactionType: ReactionType.INSIGHTFUL,
    })));

    // Reactions on lunch post
    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedLunchPost.postId,
      userId: aliceEmployee.employeeId,
      reactionType: ReactionType.LOVE,
    })));

    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      postId: savedLunchPost.postId,
      userId: bobEmployee.employeeId,
      reactionType: ReactionType.LOVE,
    })));

    // Reactions on comments
    reactions.push(await reactionRepo.save(reactionRepo.create({
      tenantId: tenant.tenantId,
      commentId: savedComment1.commentId,
      userId: hrEmployee.employeeId,
      reactionType: ReactionType.SUPPORT,
    })));

    // Update reaction counts
    await postRepo.update({ postId: savedBenefitsPost.postId }, { reactionCount: 4 });
    await postRepo.update({ postId: savedSprintPost.postId }, { reactionCount: 2 });
    await postRepo.update({ postId: savedQuestionPost.postId }, { reactionCount: 1 });
    await postRepo.update({ postId: savedLunchPost.postId }, { reactionCount: 2 });

    console.log(`✓ Created ${reactions.length} reactions`);

    console.log('\n✅ HR Connect seed data created successfully!\n');
    console.log('=====================================');
    console.log('SUMMARY');
    console.log('=====================================');
    console.log(`Groups:   ${groups.length}`);
    console.log(`Members:  ${groupMemberships.length}`);
    console.log(`Posts:    ${posts.length}`);
    console.log(`Comments: ${comments.length}`);
    console.log(`Reactions: ${reactions.length}`);
    console.log('=====================================\n');
    console.log('🎯 Ready to test HR Connect!');
    console.log('Login as different users to see posts, add comments, and react.\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding HR Connect data:', error);
    process.exit(1);
  }
}

seedHRConnectData();
