import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const integerEnv = (name: string, fallback: number, minimum: number): number => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
};

interface Config {
  // Server
  nodeEnv: string;
  port: number;
  apiVersion: string;

  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    poolMax: number;
    poolMin: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    keepAlive: boolean;
    keepAliveInitialDelayMs: number;
    initMaxAttempts: number;
    initRetryBaseMs: number;
    initRetryMaxMs: number;
  };

  // JWT
  jwt: {
    secret: string;
    expiry: string;
    refreshExpiry: string;
  };

  // Email
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };

  // File Upload
  upload: {
    dir: string;
    maxSize: number;
    allowedTypes: string[];
  };
  storage: {
    type: 'local' | 'gcs';
    gcsBucket: string;
    signedUrlTtlSeconds: number;
  };

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // CORS
  corsOrigin: string;

  // Logging
  logLevel: string;
  logFile: string;

  // Multi-tenancy
  tenantIdHeader: string;
  subdomainEnabled: boolean;

  // Feature Flags
  enableSwagger: boolean;
  enableAuditLog: boolean;

  // AI Assistant
  openai: {
    enabled: boolean;
    apiKey: string;
    model: string;
    timeoutMs: number;
  };
}

export const config: Config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'hrms_saas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolMax: integerEnv('DB_POOL_MAX', 10, 1),
    poolMin: integerEnv('DB_POOL_MIN', 0, 0),
    idleTimeoutMs: integerEnv('DB_IDLE_TIMEOUT_MS', 30000, 1),
    connectionTimeoutMs: integerEnv('DB_CONNECTION_TIMEOUT_MS', 10000, 1),
    keepAlive: process.env.DB_KEEP_ALIVE !== 'false',
    keepAliveInitialDelayMs: integerEnv('DB_KEEP_ALIVE_INITIAL_DELAY_MS', 10000, 0),
    initMaxAttempts: integerEnv('DB_INIT_MAX_ATTEMPTS', 5, 1),
    initRetryBaseMs: integerEnv('DB_INIT_RETRY_BASE_MS', 1000, 1),
    initRetryMaxMs: integerEnv('DB_INIT_RETRY_MAX_MS', 8000, 1),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@hrms-saas.com',
  },

  // File Upload
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,doc,docx').split(','),
  },
  storage: {
    type: process.env.STORAGE_TYPE === 'gcs' ? 'gcs' : 'local',
    gcsBucket: process.env.GCS_BUCKET || '',
    signedUrlTtlSeconds: parseInt(process.env.SIGNED_URL_TTL_SECONDS || '300', 10),
  },

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute (reduced from 15)
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // Increased from 100 to 1000

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logFile: process.env.LOG_FILE || 'logs/app.log',

  // Multi-tenancy
  tenantIdHeader: process.env.TENANT_ID_HEADER || 'X-Tenant-ID',
  subdomainEnabled: process.env.SUBDOMAIN_ENABLED === 'true',

  // Feature Flags
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',

  // AI Assistant
  openai: {
    enabled: process.env.OPENAI_ASSISTANT_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '12000', 10),
  },
};

// Validate critical configuration
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-this') {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  console.warn('⚠️  Warning: Using default JWT_SECRET. Please set a secure secret in production!');
}

if (!config.database.password && config.nodeEnv === 'production') {
  throw new Error('DB_PASSWORD must be set in production environment');
}

if (config.nodeEnv === 'production' && config.storage.type === 'gcs' && !config.storage.gcsBucket) {
  throw new Error('GCS_BUCKET must be set when STORAGE_TYPE=gcs');
}

export default config;
