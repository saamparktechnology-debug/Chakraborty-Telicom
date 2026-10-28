import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid request payload or parameters.',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      requestId: req.requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
      requestId: req.requestId,
    });
    return;
  }

  logger.error('Unhandled error in request pipeline', {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    error: err.message,
  });

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    requestId: req.requestId,
  });
}
