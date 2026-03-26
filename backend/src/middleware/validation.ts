import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses';

/**
 * Validates required fields in request body
 */
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          details: { missingFields },
        },
        400
      );
    }

    next();
  };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validates date format and range
 */
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return new Date(startDate) <= new Date(endDate);
};

/**
 * Validates UUID format
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates rating (1-5 scale)
 */
export const validateRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5;
};

/**
 * Validates percentage (0-100)
 */
export const validatePercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

/**
 * Sanitizes string input (removes potential XSS)
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates request body schema
 */
export const validateSchema = (schema: {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'uuid' | 'rating' | 'percentage' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    enum?: any[];
  };
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field, message: `${field} must be a string` });
          } else if (rules.min && value.length < rules.min) {
            errors.push({ field, message: `${field} must be at least ${rules.min} characters` });
          } else if (rules.max && value.length > rules.max) {
            errors.push({ field, message: `${field} must be at most ${rules.max} characters` });
          }
          break;

        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({ field, message: `${field} must be a number` });
          } else if (rules.min !== undefined && value < rules.min) {
            errors.push({ field, message: `${field} must be at least ${rules.min}` });
          } else if (rules.max !== undefined && value > rules.max) {
            errors.push({ field, message: `${field} must be at most ${rules.max}` });
          }
          break;

        case 'email':
          if (!validateEmail(value)) {
            errors.push({ field, message: `${field} must be a valid email address` });
          }
          break;

        case 'phone':
          if (!validatePhone(value)) {
            errors.push({ field, message: `${field} must be a valid phone number` });
          }
          break;

        case 'uuid':
          if (!validateUUID(value)) {
            errors.push({ field, message: `${field} must be a valid UUID` });
          }
          break;

        case 'rating':
          if (!validateRating(value)) {
            errors.push({ field, message: `${field} must be a rating between 1 and 5` });
          }
          break;

        case 'percentage':
          if (!validatePercentage(value)) {
            errors.push({ field, message: `${field} must be a percentage between 0 and 100` });
          }
          break;

        case 'date':
          if (isNaN(new Date(value).getTime())) {
            errors.push({ field, message: `${field} must be a valid date` });
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            errors.push({ field, message: `${field} must be an array` });
          }
          break;

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push({ field, message: `${field} must be an object` });
          }
          break;
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { errors },
        },
        400
      );
    }

    next();
  };
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1) {
    return sendError(res, { code: 'VALIDATION_ERROR', message: 'Page must be >= 1' }, 400);
  }

  if (limit < 1 || limit > 100) {
    return sendError(res, { code: 'VALIDATION_ERROR', message: 'Limit must be between 1 and 100' }, 400);
  }

  // Attach to request for easy access
  (req as any).pagination = { page, limit, skip: (page - 1) * limit };

  next();
};

export default {
  validateRequiredFields,
  validateEmail,
  validatePhone,
  validateDateRange,
  validateUUID,
  validateRating,
  validatePercentage,
  sanitizeString,
  validateSchema,
  validatePagination,
};
