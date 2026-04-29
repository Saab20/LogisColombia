import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

/** Pool de conexiones a PostgreSQL. Máx 20 conexiones, timeout 5s. */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

/** Ejecuta una query parametrizada y loguea la duración. */
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
  return result;
};

/** Cierra el pool de conexiones (se usa en el graceful shutdown). */
export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};
