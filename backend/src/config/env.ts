import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Valida todas las variables de entorno al arrancar. Si falta alguna, la app no inicia. */
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  SOAP_TRACKING_URL: z.string().url(),
  SOAP_CACHE_TTL_SECONDS: z.coerce.number().default(60),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/** Variables de entorno validadas y tipadas. */
export const env = parsed.data;
