import { AppDataSource } from '../config/database';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { ChatConversation, ConversationType } from '../models/ChatConversation';
import { ChatMessage, MessageType, MessageStatus } from '../models/ChatMessage';
import { ChatParticipant, ParticipantRole } from '../models/ChatParticipant';

async function seedChatData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(User);
    const conversationRepo = AppDataSource.getRepository(ChatConversation);
    const messageRepo = AppDataSource.getRepository(ChatMessage);
    const participantRepo = AppDataSource.getRepository(ChatParticipant);

    // Get Acme Corporation tenant
    const tenant = await tenantRepo.findOne({ where: { companyName: 'Acme Corporation' } });
    if (!tenant) {
      console.error('❌ Tenant "Acme Corporation" not found. Run seed script first');
      process.exit(1);
    }

    console.log(`📍 Found tenant: ${tenant.companyName}`);

    // Get employees
    const hrUser = await userRepo.findOne({
      where: { tenantId: tenant.tenantId, email: 'hr@acme.com' },
      relations: ['employee'],
    });
    const managerUser = await userRepo.findOne({
      where: { tenantId: tenant.tenantId, email: 'manager@acme.com' },
      relations: ['employee'],
    });
    const aliceUser = await userRepo.findOne({
      where: { tenantId: tenant.tenantId, email: 'alice@acme.com' },
      relations: ['employee'],
    });
    const bobUser = await userRepo.findOne({
      where: { tenantId: tenant.tenantId, email: 'bob@acme.com' },
      relations: ['employee'],
    });

    const hr = hrUser?.employee;
    const manager = managerUser?.employee;
    const alice = aliceUser?.employee;
    const bob = bobUser?.employee;

    if (!hr || !manager || !alice || !bob) {
      console.error('❌ Required employees not found');
      process.exit(1);
    }

    console.log('✅ Found all required employees');

    // Create 1-on-1 conversation between Alice and HR
    console.log('\n📝 Creating conversation: Alice <-> HR');
    const conv1 = conversationRepo.create({
      tenantId: tenant.tenantId,
      createdBy: alice.employeeId,
      conversationType: ConversationType.DIRECT,
      messageCount: 0,
    });
    const savedConv1 = await conversationRepo.save(conv1);

    // Add participants
    await participantRepo.save([
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv1.conversationId,
        employeeId: alice.employeeId,
        role: ParticipantRole.MEMBER,
      }),
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv1.conversationId,
        employeeId: hr.employeeId,
        role: ParticipantRole.MEMBER,
      }),
    ]);

    // Add messages
    const msg1 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv1.conversationId,
      senderId: alice.employeeId,
      content: 'Hi! I have a question about my leave balance.',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    });
    await messageRepo.save(msg1);

    const msg2 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv1.conversationId,
      senderId: hr.employeeId,
      content: 'Hello Alice! I would be happy to help. What would you like to know?',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    });
    await messageRepo.save(msg2);

    const msg3 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv1.conversationId,
      senderId: alice.employeeId,
      content: 'I wanted to check how many vacation days I have remaining this year.',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    });
    await messageRepo.save(msg3);

    const msg4 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv1.conversationId,
      senderId: hr.employeeId,
      content: 'You have 12 vacation days remaining. Would you like to request time off?',
      messageType: MessageType.TEXT,
      status: MessageStatus.SENT,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    });
    await messageRepo.save(msg4);

    // Update conversation
    await conversationRepo.update(savedConv1.conversationId, {
      lastMessageAt: msg4.createdAt,
      lastMessageText: msg4.content,
      lastMessageBy: hr.employeeId,
      messageCount: 4,
    });

    // Create group conversation for Engineering Team
    console.log('\n📝 Creating group conversation: Engineering Team');
    const conv2 = conversationRepo.create({
      tenantId: tenant.tenantId,
      createdBy: manager.employeeId,
      conversationType: ConversationType.GROUP,
      name: 'Engineering Team Chat',
      description: 'Discussion channel for the engineering team',
      messageCount: 0,
    });
    const savedConv2 = await conversationRepo.save(conv2);

    // Add participants
    await participantRepo.save([
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv2.conversationId,
        employeeId: manager.employeeId,
        role: ParticipantRole.ADMIN,
      }),
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv2.conversationId,
        employeeId: alice.employeeId,
        role: ParticipantRole.MEMBER,
      }),
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv2.conversationId,
        employeeId: bob.employeeId,
        role: ParticipantRole.MEMBER,
      }),
    ]);

    // Add group messages
    const grpMsg1 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv2.conversationId,
      senderId: manager.employeeId,
      content: 'Welcome to the Engineering Team chat! This is where we discuss project updates and sprint planning.',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    await messageRepo.save(grpMsg1);

    const grpMsg2 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv2.conversationId,
      senderId: alice.employeeId,
      content: 'Thanks! Looking forward to collaborating with the team.',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
    });
    await messageRepo.save(grpMsg2);

    const grpMsg3 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv2.conversationId,
      senderId: bob.employeeId,
      content: 'Hey team! Can we schedule a meeting to discuss the new feature requirements?',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    });
    await messageRepo.save(grpMsg3);

    const grpMsg4 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv2.conversationId,
      senderId: manager.employeeId,
      content: 'Great idea! How about tomorrow at 2 PM?',
      messageType: MessageType.TEXT,
      status: MessageStatus.SENT,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    });
    await messageRepo.save(grpMsg4);

    // Update group conversation
    await conversationRepo.update(savedConv2.conversationId, {
      lastMessageAt: grpMsg4.createdAt,
      lastMessageText: grpMsg4.content,
      lastMessageBy: manager.employeeId,
      messageCount: 4,
    });

    // Create 1-on-1 conversation between Bob and Manager
    console.log('\n📝 Creating conversation: Bob <-> Manager');
    const conv3 = conversationRepo.create({
      tenantId: tenant.tenantId,
      createdBy: bob.employeeId,
      conversationType: ConversationType.DIRECT,
      messageCount: 0,
    });
    const savedConv3 = await conversationRepo.save(conv3);

    // Add participants
    await participantRepo.save([
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv3.conversationId,
        employeeId: bob.employeeId,
        role: ParticipantRole.MEMBER,
      }),
      participantRepo.create({
        tenantId: tenant.tenantId,
        conversationId: savedConv3.conversationId,
        employeeId: manager.employeeId,
        role: ParticipantRole.MEMBER,
      }),
    ]);

    // Add messages
    const bobMsg1 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv3.conversationId,
      senderId: bob.employeeId,
      content: 'Hi! I wanted to discuss my performance review.',
      messageType: MessageType.TEXT,
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    await messageRepo.save(bobMsg1);

    const bobMsg2 = messageRepo.create({
      tenantId: tenant.tenantId,
      conversationId: savedConv3.conversationId,
      senderId: manager.employeeId,
      content: 'Sure! Your review is scheduled for next week. Looking forward to our discussion.',
      messageType: MessageType.TEXT,
      status: MessageStatus.SENT,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    });
    await messageRepo.save(bobMsg2);

    // Update conversation
    await conversationRepo.update(savedConv3.conversationId, {
      lastMessageAt: bobMsg2.createdAt,
      lastMessageText: bobMsg2.content,
      lastMessageBy: manager.employeeId,
      messageCount: 2,
    });

    console.log('\n✅ Chat seed data created successfully!');
    console.log(`   - Created 3 conversations`);
    console.log(`   - Created 10 messages`);
    console.log(`   - Added participants to all conversations`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding chat data:', error);
    process.exit(1);
  }
}

seedChatData();
