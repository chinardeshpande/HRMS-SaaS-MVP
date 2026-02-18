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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
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
