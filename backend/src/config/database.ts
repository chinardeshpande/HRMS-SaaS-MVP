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
  migrations: ['dist/backend/src/migrations-v2/*.js'],
  subscribers: [],
  // Connection pool configuration
  extra: {
    max: config.database.poolMax,
    min: config.database.poolMin,
    idleTimeoutMillis: config.database.idleTimeoutMs,
    connectionTimeoutMillis: config.database.connectionTimeoutMs,
    keepAlive: config.database.keepAlive,
    keepAliveInitialDelayMillis: config.database.keepAliveInitialDelayMs,
  },
});

type DatabaseInitialization = () => Promise<unknown>;
type Sleep = (delayMs: number) => Promise<void>;

const transientDatabaseErrorCodes = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '08P01',
  '53300',
  '57P03',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
]);

const sleep: Sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

export const isTransientDatabaseError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code) : '';
  if (transientDatabaseErrorCodes.has(code)) return true;

  const message = 'message' in error ? String(error.message).toLowerCase() : '';
  return [
    'connection terminated unexpectedly',
    'connection timeout',
    'connect timeout',
    'the database system is starting up',
  ].some((fragment) => message.includes(fragment));
};

export const initializeDatabaseWithRetry = async (
  initialize: DatabaseInitialization,
  wait: Sleep = sleep
): Promise<void> => {
  const maxAttempts = Math.max(1, config.database.initMaxAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await initialize();
      logger.info('Database connection established', {
        event: 'database.initialize.success',
        attempt,
        maxAttempts,
      });

      if (config.nodeEnv === 'development') {
        logger.info('Database synchronization enabled');
      }
      return;
    } catch (error) {
      const transient = isTransientDatabaseError(error);
      if (!transient || attempt === maxAttempts) {
        logger.error('Database initialization failed', {
          event: 'database.initialize.failed',
          attempt,
          maxAttempts,
          transient,
          errorCode: error && typeof error === 'object' && 'code' in error
            ? String(error.code)
            : undefined,
        });
        throw error;
      }

      const delayMs = Math.min(
        config.database.initRetryBaseMs * (2 ** (attempt - 1)),
        config.database.initRetryMaxMs
      );
      logger.warn('Transient database initialization failure; retry scheduled', {
        event: 'database.initialize.retry',
        attempt,
        maxAttempts,
        delayMs,
        errorCode: error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : undefined,
      });
      await wait(delayMs);
    }
  }
};

export const initializeDatabase = async (): Promise<void> => {
  await initializeDatabaseWithRetry(() => AppDataSource.initialize());
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
