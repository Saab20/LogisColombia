import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** Asigna un correlation ID a cada request. Reutiliza el header si ya viene, si no genera uno nuevo. */
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
