/**
 * Environment Variable Validator
 * Validates that all required environment variables are set
 * Fails fast on application startup if configuration is invalid
 */

interface EnvConfig {
  [key: string]: {
    required: boolean;
    default?: string;
    validate?: (value: string) => boolean;
    description: string;
  };
}

const envConfig: EnvConfig = {
  // Server Configuration
  NODE_ENV: {
    required: true,
    description: 'Application environment (development, staging, production)',
    validate: (value) => ['development', 'staging', 'production', 'test'].includes(value),
  },
  PORT: {
    required: false,
    default: '3000',
    description: 'Server port number',
    validate: (value) => !isNaN(Number(value)) && Number(value) > 0 && Number(value) < 65536,
  },
  API_VERSION: {
    required: false,
    default: 'v1',
    description: 'API version',
  },

  // Database Configuration
  DB_HOST: {
    required: true,
    description: 'PostgreSQL database host',
  },
  DB_PORT: {
    required: false,
    default: '5432',
    description: 'PostgreSQL database port',
    validate: (value) => !isNaN(Number(value)),
  },
  DB_NAME: {
    required: true,
    description: 'PostgreSQL database name',
  },
  DB_USER: {
    required: true,
    description: 'PostgreSQL database user',
  },
  DB_PASSWORD: {
    required: true,
    description: 'PostgreSQL database password',
  },

  // JWT Configuration
  JWT_SECRET: {
    required: true,
    description: 'JWT signing secret',
    validate: (value) => value.length >= 32,
  },
  JWT_EXPIRY: {
    required: false,
    default: '24h',
    description: 'JWT token expiry time',
  },
  JWT_REFRESH_SECRET: {
    required: false,
    description: 'JWT refresh token secret',
    validate: (value) => !value || value.length >= 32,
  },

  // CORS Configuration
  CORS_ORIGIN: {
    required: true,
    description: 'Allowed CORS origins (comma-separated)',
  },

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    default: '900000',
    description: 'Rate limit window in milliseconds',
    validate: (value) => !isNaN(Number(value)),
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    default: '100',
    description: 'Maximum requests per window',
    validate: (value) => !isNaN(Number(value)),
  },
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, config] of Object.entries(envConfig)) {
    const value = process.env[key];

    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key} - ${config.description}`);
      continue;
    }

    // Use default if not set
    if (!value && config.default) {
      process.env[key] = config.default;
      if (process.env.NODE_ENV !== 'production') {
        warnings.push(`Using default value for ${key}: ${config.default}`);
      }
      continue;
    }

    // Validate value if validator exists
    if (value && config.validate && !config.validate(value)) {
      errors.push(`Invalid value for ${key}: ${value} - ${config.description}`);
    }
  }

  // Additional production-specific validations
  if (process.env.NODE_ENV === 'production') {
    // Check for weak secrets
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('change')) {
      errors.push('JWT_SECRET appears to be using a default/example value. Generate a strong secret!');
    }

    if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 16) {
      warnings.push('DB_PASSWORD is shorter than recommended (16+ characters)');
    }

    // Check SSL configuration
    if (process.env.DB_SSL !== 'true') {
      warnings.push('DB_SSL is not enabled. Consider enabling SSL for database connections in production');
    }

    // Check if HTTPS is configured
    if (process.env.BACKEND_URL && !process.env.BACKEND_URL.startsWith('https://')) {
      errors.push('BACKEND_URL must use HTTPS in production');
    }

    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      errors.push('FRONTEND_URL must use HTTPS in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and fail fast if invalid
 */
export function validateOrExit(): void {
  const result = validateEnvironment();

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach((error) => console.error(`   - ${error}`));
    console.error('\nPlease fix the above errors and restart the application.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with type safety
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * Get environment variable as number
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} is not a valid number: ${value}`);
  }
  return num;
}

/**
 * Get environment variable as boolean
 */
export function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value.toLowerCase() === 'true' || value === '1';
}
