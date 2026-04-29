import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError } from '../shared/errors/app-error';

// Mock the repository before importing the service
jest.mock('./auth.repository');
import * as authRepository from './auth.repository';
import * as authService from './auth.service';

const mockRepo = authRepository as jest.Mocked<typeof authRepository>;

const mockUser = {
  id: 'user-uuid-1',
  username: 'admin',
  password_hash: '$2b$12$hashedpassword',
  role: 'ADMIN' as const,
  created_at: new Date(),
};

describe('authService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return token and user on valid credentials', async () => {
    // Given
    mockRepo.findByUsername.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

    // When
    const result = await authService.login({ username: 'admin', password: 'admin123' });

    // Then
    expect(result.token).toBeDefined();
    expect(result.user.username).toBe('admin');
    expect(result.user.role).toBe('ADMIN');
    const decoded = jwt.verify(result.token, env.JWT_SECRET) as Record<string, unknown>;
    expect(decoded.userId).toBe('user-uuid-1');
  });

  it('should throw UnauthorizedError when user not found', async () => {
    // Given
    mockRepo.findByUsername.mockResolvedValue(null);

    // When / Then
    await expect(authService.login({ username: 'ghost', password: '123456' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError on wrong password', async () => {
    // Given
    mockRepo.findByUsername.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

    // When / Then
    await expect(authService.login({ username: 'admin', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedError);
  });
});

describe('authService.register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create user and return token', async () => {
    // Given
    mockRepo.findByUsername.mockResolvedValue(null);
    mockRepo.createUser.mockResolvedValue({ ...mockUser, username: 'newuser', role: 'OPERADOR' });
    jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed'));

    // When
    const result = await authService.register({
      username: 'newuser',
      password: 'password123',
      role: 'OPERADOR',
    });

    // Then
    expect(result.token).toBeDefined();
    expect(result.user.username).toBe('newuser');
    expect(mockRepo.createUser).toHaveBeenCalledWith('newuser', 'hashed', 'OPERADOR');
  });

  it('should throw ConflictError when username already exists', async () => {
    // Given
    mockRepo.findByUsername.mockResolvedValue(mockUser);

    // When / Then
    await expect(
      authService.register({ username: 'admin', password: 'password123', role: 'OPERADOR' })
    ).rejects.toThrow(ConflictError);
  });
});
