import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../config/logger';
import { AppError } from '../errors/app-error';

/**
 * Manejo centralizado de errores.
 * AppError → su statusCode. ZodError → 400 con detalles. Otros → 500 genérico.
 * Nunca expone stack traces al cliente.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn(
      { correlationId, statusCode: err.statusCode, message: err.message },
      'Application error'
    );
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      correlationId,
    });
    return;
  }

  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    logger.warn({ correlationId, validationErrors }, 'Validation error');
    res.status(400).json({
      error: 'Validation failed',
      statusCode: 400,
      details: validationErrors,
      correlationId,
    });
    return;
  }

  logger.error(
    { correlationId, error: err.message, stack: err.stack },
    'Unhandled error'
  );
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
    correlationId,
  });
};
