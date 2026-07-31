import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';

const logsDir = path.dirname(config.logFile);
if (config.nodeEnv !== 'production' && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const cloudSeverity = winston.format((info) => {
  const severityByLevel: Record<string, string> = {
    error: 'ERROR',
    warn: 'WARNING',
    info: 'INFO',
    http: 'INFO',
    verbose: 'DEBUG',
    debug: 'DEBUG',
    silly: 'DEBUG',
  };
  info.severity = severityByLevel[info.level] || 'DEFAULT';
  return info;
});

const logFormat = winston.format.combine(
  cloudSeverity(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for better readability
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.nodeEnv === 'production' ? logFormat : consoleFormat,
  }),
];

if (config.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: config.logFile,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
