import { loginSchema, registerSchema } from './auth.dto';

describe('loginSchema', () => {
  it('should validate correct credentials', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: 'admin123' });
    expect(result.success).toBe(true);
  });

  it('should reject username shorter than 3 chars', () => {
    const result = loginSchema.safeParse({ username: 'ab', password: 'admin123' });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 chars', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '123' });
    expect(result.success).toBe(false);
  });

  it('should trim username', () => {
    const result = loginSchema.parse({ username: '  admin  ', password: 'admin123' });
    expect(result.username).toBe('admin');
  });

  it('should reject missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('should validate correct registration data', () => {
    const result = registerSchema.safeParse({
      username: 'newuser',
      password: 'password123',
      role: 'OPERADOR',
    });
    expect(result.success).toBe(true);
  });

  it('should default role to OPERADOR', () => {
    const result = registerSchema.parse({ username: 'newuser', password: 'password123' });
    expect(result.role).toBe('OPERADOR');
  });

  it('should accept ADMIN role', () => {
    const result = registerSchema.parse({
      username: 'admin2',
      password: 'password123',
      role: 'ADMIN',
    });
    expect(result.role).toBe('ADMIN');
  });

  it('should reject invalid role', () => {
    const result = registerSchema.safeParse({
      username: 'user',
      password: 'password123',
      role: 'SUPERADMIN',
    });
    expect(result.success).toBe(false);
  });
});
