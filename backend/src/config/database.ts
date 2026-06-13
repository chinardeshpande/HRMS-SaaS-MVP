import { DataSource } from 'typeorm';
import { config } from './config';
import { logger } from '../utils/logger';
import { installTenantScope } from '../database/tenantScope';
import { currentSessionStamp, withStampedManager } from '../database/tenantSession';

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
// Professional History entities
import { PositionHistory } from '../models/PositionHistory';
import { CompensationHistory } from '../models/CompensationHistory';
import { ManualEmploymentHistory } from '../models/ManualEmploymentHistory';
import { SalaryStructure } from '../models/SalaryStructure';
import { SalaryComponent } from '../models/SalaryComponent';
import { Payslip } from '../models/Payslip';
import { PayslipComponent } from '../models/PayslipComponent';
import { PayslipAttachment } from '../models/PayslipAttachment';
import { CompensationShareLog } from '../models/CompensationShareLog';
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
// Calendar entities
import { CalendarEvent } from '../models/CalendarEvent';
// Settings entities
import { Subscription } from '../models/Subscription';
import { OrganizationSettings } from '../models/OrganizationSettings';
import { PaymentHistory } from '../models/PaymentHistory';
import { PaymentMethod } from '../models/PaymentMethod';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { BusinessRules } from '../models/BusinessRules';
// Registration & Onboarding Wizard entities
import { CompanyRegistration } from '../models/CompanyRegistration';
import { OnboardingProgress } from '../models/OnboardingProgress';
import { UserInvitation } from '../models/UserInvitation';
// Reporting & Analytics entities
import { SavedReport } from '../models/SavedReport';
import { GeneratedDocument } from '../models/GeneratedDocument';
import { AnalyticsMetric } from '../models/AnalyticsMetric';
// Digital Library entities
import { DigitalLibrary } from '../models/DigitalLibrary';
import { DocumentCategory } from '../models/DocumentCategory';
import { CompanyDocument } from '../models/CompanyDocument';
import { EmployeeDocument } from '../models/EmployeeDocument';

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
    // Professional History
    PositionHistory,
    CompensationHistory,
    ManualEmploymentHistory,
    SalaryStructure,
    SalaryComponent,
    Payslip,
    PayslipComponent,
    PayslipAttachment,
    CompensationShareLog,
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
    // Calendar
    CalendarEvent,
    // Settings
    Subscription,
    OrganizationSettings,
    PaymentHistory,
    PaymentMethod,
    Permission,
    Role,
    BusinessRules,
    // Registration & Onboarding Wizard
    CompanyRegistration,
    OnboardingProgress,
    UserInvitation,
    // Reporting & Analytics
    SavedReport,
    GeneratedDocument,
    AnalyticsMetric,
    // Digital Library
    DigitalLibrary,
    DocumentCategory,
    CompanyDocument,
    EmployeeDocument,
  ],
  migrations: ['dist/backend/src/migrations/*.js'],
  subscribers: [],
  // Connection pool configuration
  extra: {
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  },
});

// Mission 2 (A2a): app-side global tenant scope. Patches Repository.prototype
// once, before any query can run — every repository (including those obtained
// inside transactions) is tenant-filtered by default.
installTenantScope();

// Mission 2 (A2b): raw SQL through AppDataSource.query() cannot be app-side
// scoped, but it can still carry the tenant/bypass session vars for the RLS
// layer. With tenant context the statement runs inside a short stamped
// transaction; context-free calls (health checks) pass through untouched.
{
  const originalQuery = AppDataSource.query.bind(AppDataSource);
  (AppDataSource as { query: typeof AppDataSource.query }).query = (async (
    query: string,
    parameters?: unknown[]
  ) => {
    const stamp = currentSessionStamp();
    if (!stamp) return originalQuery(query, parameters);
    return withStampedManager(AppDataSource, AppDataSource.manager, stamp, (manager) =>
      manager.queryRunner
        ? manager.queryRunner.query(query, parameters as unknown[])
        : originalQuery(query, parameters)
    );
  }) as typeof AppDataSource.query;
}

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
