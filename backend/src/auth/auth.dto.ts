import { z } from 'zod';

/** Validación del login: username (3-50 chars) y password (6-128 chars). */
export const loginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;

/** Validación del registro: igual que login + role (OPERADOR por defecto). */
export const registerSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['OPERADOR', 'ADMIN']).default('OPERADOR'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

/** Payload que se firma dentro del token JWT. */
export interface JwtPayload {
  userId: string;
  username: string;
  role: 'OPERADOR' | 'ADMIN';
}

/** Respuesta de los endpoints de login y register. */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}
