import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['OPERADOR', 'ADMIN']).default('OPERADOR'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'OPERADOR' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}
