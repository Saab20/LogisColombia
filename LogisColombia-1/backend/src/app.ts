import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { correlationIdMiddleware } from './shared/middleware/correlation-id.middleware';
import { errorHandler } from './shared/middleware/error-handler.middleware';
import { authController } from './auth/auth.controller';
import { routeController } from './routes/route.controller';
import { trackingController } from './tracking/tracking.controller';

const app = express();

// Security headers
app.use(helmet());

// CORS — explicit origin, no wildcard in production
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Correlation ID for request tracing
app.use(correlationIdMiddleware);

// Structured HTTP logging
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      correlationId: (req as express.Request).correlationId,
    }),
  })
);

// Global rate limiting
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  })
);

// Login-specific rate limiting (max 5 attempts per minute per IP)
app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 60000,
    max: env.LOGIN_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later' },
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authController);
app.use('/api/routes', routeController);
app.use('/api/tracking', trackingController);

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };
