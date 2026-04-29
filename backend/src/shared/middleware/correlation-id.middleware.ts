import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attach a correlation-id to every request for distributed tracing.
 * Uses the incoming X-Correlation-ID header or generates a new UUID.
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}
