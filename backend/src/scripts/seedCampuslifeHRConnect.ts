import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { Employee } from '../models/Employee';
import { HRConnectPost, PostType, PostVisibility } from '../models/HRConnectPost';
import { HRConnectGroup, GroupType, GroupPrivacy } from '../models/HRConnectGroup';
import { HRConnectGroupMember, MemberRole } from '../models/HRConnectGroupMember';
import { HRConnectComment } from '../models/HRConnectComment';
import { HRConnectReaction, ReactionType } from '../models/HRConnectReaction';
import logger from '../utils/logger';

/**
 * Seed HR Connect data for Campuslife tenant
 * - Create sample posts (announcements, discussions, questions)
 * - Create groups (Engineering, Project teams, Interest groups)
 * - Add comments and reactions to posts
 */
async function seedCampuslifeHRConnect() {
  try {
    logger.info('🚀 Starting HR Connect data seeding for Campuslife...');

    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const employeeRepo = AppDataSource.getRepository(Employee);
    const postRepo = AppDataSource.getRepository(HRConnectPost);
    const groupRepo = AppDataSource.getRepository(HRConnectGroup);
    const groupMemberRepo = AppDataSource.getRepository(HRConnectGroupMember);
    const commentRepo = AppDataSource.getRepository(HRConnectComment);
    const reactionRepo = AppDataSource.getRepository(HRConnectReaction);

    // Find Campuslife tenant
    const tenant = await tenantRepo.findOne({
      where: { companyName: 'Campuslife' }
    });

    if (!tenant) {
      logger.error('❌ Campuslife tenant not found');
      process.exit(1);
    }

    logger.info(`Found tenant: ${tenant.companyName} (ID: ${tenant.tenantId})`);

    // Get all employees for Campuslife
    const employees = await employeeRepo.find({
      where: { tenantId: tenant.tenantId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    if (employees.length < 5) {
      logger.error('❌ Need at least 5 employees to seed HR Connect data');
      process.exit(1);
    }

    logger.info(`Found ${employees.length} employees`);

    const hrAdmin = employees[0]; // EMP0079 - Chinar
    const manager1 = employees[1]; // Manager
    const manager2 = employees[2]; // Manager
    const emp1 = employees[4]; // Regular employee
    const emp2 = employees[5]; // Regular employee
    const emp3 = employees[6]; // Regular employee

    // ========== CREATE GROUPS ==========
    logger.info('\n📋 Step 1: Creating Groups...');

    const engineeringGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'Engineering Team',
      description: 'All engineering discussions, code reviews, and tech updates',
      groupType: GroupType.DEPARTMENT,
      privacy: GroupPrivacy.PUBLIC_ACCESS,
      createdBy: hrAdmin.employeeId,
      isActive: true,
    });
    await groupRepo.save(engineeringGroup);
    logger.info(`✅ Created group: ${engineeringGroup.name}`);

    const projectAlphaGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'Project Alpha Team',
      description: 'Collaboration space for Project Alpha development',
      groupType: GroupType.PROJECT,
      privacy: GroupPrivacy.PUBLIC_ACCESS,
      createdBy: manager1.employeeId,
      isActive: true,
    });
    await groupRepo.save(projectAlphaGroup);
    logger.info(`✅ Created group: ${projectAlphaGroup.name}`);

    const sportsGroup = groupRepo.create({
      tenantId: tenant.tenantId,
      name: 'Sports & Fitness Club',
      description: 'Weekly football matches, gym sessions, and fitness challenges',
      groupType: GroupType.SOCIAL,
      privacy: GroupPrivacy.PUBLIC_ACCESS,
      createdBy: emp1.employeeId,
      isActive: true,
    });
    await groupRepo.save(sportsGroup);
    logger.info(`✅ Created group: ${sportsGroup.name}`);

    // Add members to groups
    const groupMembers = [
      // Engineering Team (all employees)
      { groupId: engineeringGroup.groupId, employeeId: hrAdmin.employeeId, role: MemberRole.ADMIN },
      { groupId: engineeringGroup.groupId, employeeId: manager1.employeeId, role: MemberRole.MODERATOR },
      { groupId: engineeringGroup.groupId, employeeId: manager2.employeeId, role: MemberRole.MODERATOR },
      { groupId: engineeringGroup.groupId, employeeId: emp1.employeeId, role: MemberRole.MEMBER },
      { groupId: engineeringGroup.groupId, employeeId: emp2.employeeId, role: MemberRole.MEMBER },
      { groupId: engineeringGroup.groupId, employeeId: emp3.employeeId, role: MemberRole.MEMBER },
      // Project Alpha Team
      { groupId: projectAlphaGroup.groupId, employeeId: manager1.employeeId, role: MemberRole.ADMIN },
      { groupId: projectAlphaGroup.groupId, employeeId: emp1.employeeId, role: MemberRole.MEMBER },
      { groupId: projectAlphaGroup.groupId, employeeId: emp2.employeeId, role: MemberRole.MEMBER },
      // Sports Club
      { groupId: sportsGroup.groupId, employeeId: emp1.employeeId, role: MemberRole.ADMIN },
      { groupId: sportsGroup.groupId, employeeId: emp2.employeeId, role: MemberRole.MEMBER },
      { groupId: sportsGroup.groupId, employeeId: emp3.employeeId, role: MemberRole.MEMBER },
    ];

    for (const memberData of groupMembers) {
      const member = groupMemberRepo.create({
        ...memberData,
        tenantId: tenant.tenantId,
      });
      await groupMemberRepo.save(member);
    }
    logger.info(`✅ Added ${groupMembers.length} group members`);

    // ========== CREATE POSTS ==========
    logger.info('\n📋 Step 2: Creating Posts...');

    const postsData = [
      // Announcements
      {
        authorId: hrAdmin.employeeId,
        title: '🎉 Welcome to Campuslife!',
        content: 'Welcome everyone to our new HR Connect platform! This is a space for collaboration, announcements, and staying connected with your team.\n\nFeel free to share ideas, ask questions, and engage with your colleagues. Let\'s build a vibrant community together!',
        postType: PostType.ANNOUNCEMENT,
        visibility: PostVisibility.PUBLIC_ACCESS,
        isPinned: true,
      },
      {
        authorId: hrAdmin.employeeId,
        title: 'Office Holiday - Republic Day',
        content: 'Please note that the office will be closed on January 26th for Republic Day. Regular operations will resume on January 27th.\n\nEnjoy the long weekend! 🇮🇳',
        postType: PostType.ANNOUNCEMENT,
        visibility: PostVisibility.PUBLIC_ACCESS,
        isPinned: false,
      },
      // Discussions
      {
        authorId: manager1.employeeId,
        title: 'Project Alpha Kickoff Meeting Summary',
        content: 'Great meeting today everyone! 🚀\n\nKey Takeaways:\n- Sprint 1 starts next Monday\n- Focus on user authentication and dashboard\n- Daily standups at 10 AM\n- Sprint demo on the 30th\n\nLooking forward to building something amazing together!',
        postType: PostType.DISCUSSION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        groupId: projectAlphaGroup.groupId,
        isPinned: false,
      },
      {
        authorId: emp1.employeeId,
        title: 'New Code Review Guidelines',
        content: 'Hey team! I\'ve updated our code review checklist based on recent learnings:\n\n✅ Check for proper error handling\n✅ Verify test coverage\n✅ Review security implications\n✅ Ensure code readability\n\nLet me know your thoughts!',
        postType: PostType.DISCUSSION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        groupId: engineeringGroup.groupId,
        isPinned: false,
      },
      // Questions
      {
        authorId: emp2.employeeId,
        title: 'Best practices for database migrations?',
        content: 'I\'m working on a database schema update for our user table. What are the best practices for handling migrations in production?\n\nShould we use zero-downtime migrations? Any tools or libraries you recommend?',
        postType: PostType.QUESTION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        isPinned: false,
      },
      {
        authorId: emp3.employeeId,
        title: 'How to access VPN for remote work?',
        content: 'Hi everyone! I need to access some internal tools while working from home. Can someone guide me on how to set up the VPN connection?\n\nThanks in advance!',
        postType: PostType.QUESTION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        isPinned: false,
      },
      // Social/Interest
      {
        authorId: emp1.employeeId,
        title: 'Weekend Football Match - Join Us! ⚽',
        content: 'We\'re organizing a friendly football match this Saturday at 4 PM at the nearby ground.\n\nAll skill levels welcome! Bring your friends and family too.\n\nWho\'s in? 🙌',
        postType: PostType.DISCUSSION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        groupId: sportsGroup.groupId,
        isPinned: false,
      },
      {
        authorId: manager2.employeeId,
        title: 'Team Lunch This Friday',
        content: 'Let\'s celebrate the successful completion of our last sprint with a team lunch this Friday at 1 PM.\n\nVenue: The Olive Garden\n\nPlease confirm your attendance by Thursday evening. Vegetarian and non-veg options available!',
        postType: PostType.DISCUSSION,
        visibility: PostVisibility.PUBLIC_ACCESS,
        isPinned: false,
      },
    ];

    const createdPosts: HRConnectPost[] = [];
    for (const postData of postsData) {
      const post = postRepo.create({
        ...postData,
        tenantId: tenant.tenantId,
      });
      const savedPost = await postRepo.save(post);
      createdPosts.push(savedPost);
      logger.info(`✅ Created post: "${savedPost.title}"`);
    }

    // ========== ADD COMMENTS ==========
    logger.info('\n📋 Step 3: Adding Comments...');

    const commentsData = [
      // Comments on welcome post
      { postId: createdPosts[0].postId, authorId: manager1.employeeId, content: 'Excited to be part of this journey! Let\'s make great things happen.' },
      { postId: createdPosts[0].postId, authorId: emp1.employeeId, content: 'Love the new platform! Much easier to stay connected.' },
      { postId: createdPosts[0].postId, authorId: emp2.employeeId, content: 'Thank you for setting this up! Looking forward to collaborating here.' },
      // Comments on Project Alpha
      { postId: createdPosts[2].postId, authorId: emp1.employeeId, content: 'Great meeting! I\'ll start working on the authentication module.' },
      { postId: createdPosts[2].postId, authorId: emp2.employeeId, content: 'I can handle the dashboard components. Will sync with you tomorrow.' },
      // Comments on code review post
      { postId: createdPosts[3].postId, authorId: manager1.employeeId, content: 'These guidelines look solid! Let\'s add them to our team wiki.' },
      { postId: createdPosts[3].postId, authorId: emp3.employeeId, content: 'Great additions! Should we also include performance checks?' },
      // Comments on database question
      { postId: createdPosts[4].postId, authorId: manager1.employeeId, content: 'For production migrations, I recommend using Flyway or Liquibase for version control and rollback capabilities.' },
      { postId: createdPosts[4].postId, authorId: emp1.employeeId, content: 'Also, always test migrations on a staging environment first. And have a rollback plan ready!' },
      // Comments on VPN question
      { postId: createdPosts[5].postId, authorId: hrAdmin.employeeId, content: 'I\'ll send you the VPN setup guide via email. Let me know if you face any issues!' },
      // Comments on football match
      { postId: createdPosts[6].postId, authorId: emp2.employeeId, content: 'Count me in! 🙋‍♂️' },
      { postId: createdPosts[6].postId, authorId: emp3.employeeId, content: 'I\'m in too! Let\'s do this! ⚽' },
      // Comments on team lunch
      { postId: createdPosts[7].postId, authorId: emp1.employeeId, content: 'Confirmed! Will be there 🍕' },
      { postId: createdPosts[7].postId, authorId: emp2.employeeId, content: 'I\'m in! Prefer vegetarian please.' },
    ];

    for (const commentData of commentsData) {
      const comment = commentRepo.create({
        ...commentData,
        tenantId: tenant.tenantId,
      });
      await commentRepo.save(comment);

      // Update comment count on post
      await postRepo.increment({ postId: commentData.postId }, 'commentCount', 1);
    }
    logger.info(`✅ Added ${commentsData.length} comments`);

    // ========== ADD REACTIONS ==========
    logger.info('\n📋 Step 4: Adding Reactions...');

    const reactionsData = [
      // Reactions on welcome post
      { postId: createdPosts[0].postId, userId: manager1.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[0].postId, userId: manager2.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[0].postId, userId: emp1.employeeId, reactionType: ReactionType.LOVE },
      { postId: createdPosts[0].postId, userId: emp2.employeeId, reactionType: ReactionType.CELEBRATE },
      { postId: createdPosts[0].postId, userId: emp3.employeeId, reactionType: ReactionType.LIKE },
      // Reactions on holiday announcement
      { postId: createdPosts[1].postId, userId: emp1.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[1].postId, userId: emp2.employeeId, reactionType: ReactionType.LIKE },
      // Reactions on Project Alpha
      { postId: createdPosts[2].postId, userId: emp1.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[2].postId, userId: emp2.employeeId, reactionType: ReactionType.CELEBRATE },
      // Reactions on code review
      { postId: createdPosts[3].postId, userId: manager1.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[3].postId, userId: emp3.employeeId, reactionType: ReactionType.INSIGHTFUL },
      // Reactions on database question
      { postId: createdPosts[4].postId, userId: manager1.employeeId, reactionType: ReactionType.INSIGHTFUL },
      // Reactions on football match
      { postId: createdPosts[6].postId, userId: emp2.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[6].postId, userId: emp3.employeeId, reactionType: ReactionType.LOVE },
      // Reactions on team lunch
      { postId: createdPosts[7].postId, userId: emp1.employeeId, reactionType: ReactionType.LIKE },
      { postId: createdPosts[7].postId, userId: emp2.employeeId, reactionType: ReactionType.CELEBRATE },
    ];

    for (const reactionData of reactionsData) {
      const reaction = reactionRepo.create({
        ...reactionData,
        tenantId: tenant.tenantId,
      });
      await reactionRepo.save(reaction);

      // Update reaction count on post
      await postRepo.increment({ postId: reactionData.postId }, 'reactionCount', 1);
    }
    logger.info(`✅ Added ${reactionsData.length} reactions`);

    // ========== SUMMARY ==========
    logger.info('\n✅ HR Connect data seeding completed!');
    logger.info('\n📊 Summary:');
    logger.info(`   Groups: 3 created`);
    logger.info(`   Group Members: ${groupMembers.length}`);
    logger.info(`   Posts: ${createdPosts.length}`);
    logger.info(`   Comments: ${commentsData.length}`);
    logger.info(`   Reactions: ${reactionsData.length}`);
    logger.info('');

    logger.info('🎯 HR Connect is ready for testing!');
    logger.info('📝 Navigate to HR Connect module to see all posts and groups');
    logger.info('');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error seeding HR Connect data:', error);
    process.exit(1);
  }
}

seedCampuslifeHRConnect();
