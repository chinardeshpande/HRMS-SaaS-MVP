import { DataSource } from 'typeorm';
import { config } from './config';
import { logger } from '../utils/logger';

// Import entities
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { LeavePolicy } from '../models/LeavePolicy';
import { LeaveBalance } from '../models/LeaveBalance';
import { LeaveRequest } from '../models/LeaveRequest';
import { AttendancePolicy } from '../models/AttendancePolicy';
import { Attendance } from '../models/Attendance';
import { TimeEntryEdit } from '../models/TimeEntryEdit';
// Onboarding & Probation entities
import { Candidate } from '../models/Candidate';
import { OnboardingCase } from '../models/OnboardingCase';
import { ProbationCase } from '../models/ProbationCase';
import { ProbationReview } from '../models/ProbationReview';
import { OnboardingTask } from '../models/OnboardingTask';
import { ProbationTask } from '../models/ProbationTask';
import { OnboardingDocument } from '../models/OnboardingDocument';
import { DocumentTemplate } from '../models/DocumentTemplate';
import { Approval } from '../models/Approval';
import { StatusTransition } from '../models/StatusTransition';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
// Exit Management entities
import { ExitCase } from '../models/ExitCase';
import { ExitInterview } from '../models/ExitInterview';
import { AssetReturn } from '../models/AssetReturn';
import { Clearance } from '../models/Clearance';
import { FinalSettlement } from '../models/FinalSettlement';
// Performance Management entities
import { PerformanceReview } from '../models/PerformanceReview';
import { Goal } from '../models/Goal';
import { KPI } from '../models/KPI';
import { Feedback360 } from '../models/Feedback360';
import { DevelopmentActionItem } from '../models/DevelopmentActionItem';
// HR Connect entities
import { HRConnectPost } from '../models/HRConnectPost';
import { HRConnectComment } from '../models/HRConnectComment';
import { HRConnectReaction } from '../models/HRConnectReaction';
import { HRConnectGroup } from '../models/HRConnectGroup';
import { HRConnectGroupMember } from '../models/HRConnectGroupMember';
// Chat entities
import { ChatConversation } from '../models/ChatConversation';
import { ChatMessage } from '../models/ChatMessage';
import { ChatParticipant } from '../models/ChatParticipant';
// Settings entities
import { Subscription } from '../models/Subscription';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { PaymentHistory } from '../models/PaymentHistory';
import { PaymentMethod } from '../models/PaymentMethod';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { BusinessRules } from '../models/BusinessRules';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  synchronize: config.nodeEnv === 'development', // Auto-sync in development only
  logging: config.nodeEnv === 'development',
  entities: [
    Tenant,
    User,
    Employee,
    Department,
    Designation,
    LeavePolicy,
    LeaveBalance,
    LeaveRequest,
    AttendancePolicy,
    Attendance,
    TimeEntryEdit,
    // Onboarding & Probation
    Candidate,
    OnboardingCase,
    ProbationCase,
    ProbationReview,
    OnboardingTask,
    ProbationTask,
    OnboardingDocument,
    DocumentTemplate,
    Approval,
    StatusTransition,
    AuditLog,
    Notification,
    // Exit Management
    ExitCase,
    ExitInterview,
    AssetReturn,
    Clearance,
    FinalSettlement,
    // Performance Management
    PerformanceReview,
    Goal,
    KPI,
    Feedback360,
    DevelopmentActionItem,
    // HR Connect
    HRConnectPost,
    HRConnectComment,
    HRConnectReaction,
    HRConnectGroup,
    HRConnectGroupMember,
    // Chat
    ChatConversation,
    ChatMessage,
    ChatParticipant,
    // Settings
    Subscription,
    OrganizationSettings,
    PaymentHistory,
    PaymentMethod,
    Permission,
    Role,
    BusinessRules,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  // Connection pool configuration
  extra: {
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connection established successfully');

    if (config.nodeEnv === 'development') {
      logger.info('📊 Database synchronization enabled');
    }
  } catch (error) {
    logger.error('❌ Error initializing database connection:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

export default AppDataSource;
