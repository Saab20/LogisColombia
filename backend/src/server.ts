import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { closePool } from './config/database';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TrackRoute server started');
});

/**
 * Graceful shutdown: stop accepting new requests,
 * complete pending transactions, close DB connections.
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal, closing gracefully...');
  server.close(async () => {
    await closePool();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
