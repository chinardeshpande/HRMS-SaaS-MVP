import { Response } from 'express';

interface SuccessResponseData<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponseData {
  code: string;
  message: string;
  details?: any;
}

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: SuccessResponseData<T>['meta']
): Response => {
  const response: any = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  error: ErrorResponseData,
  statusCode: number = 500
): Response => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};

/**
 * Send paginated response
 */
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages,
  });
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(res: Response, data: T): Response => {
  return sendSuccess(res, data, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

export default {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendCreated,
  sendNoContent,
};
