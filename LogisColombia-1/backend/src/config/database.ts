import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

/**
 * Execute a parameterized query against the database.
 * @param text SQL query string with $1, $2... placeholders
 * @param params Array of parameter values
 * @returns Query result
 */
export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');
  return result;
};

/**
 * Gracefully close the database connection pool.
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};
