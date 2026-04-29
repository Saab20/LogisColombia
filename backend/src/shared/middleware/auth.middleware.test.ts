import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { authenticate, authorize } from './auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

/** Helper to create a mock request. */
const mockReq = (headers: Record<string, string> = {}, user?: unknown): Partial<Request> => ({
  headers,
  user: user as Request['user'],
});

const mockRes = (): Partial<Response> => ({});
const mockNext: NextFunction = jest.fn();

describe('authenticate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should attach user to req on valid token', () => {
    // Given
    const payload = { userId: 'u1', username: 'admin', role: 'ADMIN' };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq({ authorization: `Bearer ${token}` });

    // When
    authenticate(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith();
    expect((req as Request).user?.username).toBe('admin');
  });

  it('should call next with UnauthorizedError when no header', () => {
    // Given
    const req = mockReq({});

    // When
    authenticate(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should call next with UnauthorizedError when header is not Bearer', () => {
    // Given
    const req = mockReq({ authorization: 'Basic abc123' });

    // When
    authenticate(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should call next with UnauthorizedError on invalid token', () => {
    // Given
    const req = mockReq({ authorization: 'Bearer invalid.token.here' });

    // When
    authenticate(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe('authorize', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should allow access for matching role', () => {
    // Given
    const req = mockReq({}, { userId: 'u1', username: 'admin', role: 'ADMIN' });
    const middleware = authorize('ADMIN');

    // When
    middleware(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with ForbiddenError for non-matching role', () => {
    // Given
    const req = mockReq({}, { userId: 'u2', username: 'operador', role: 'OPERADOR' });
    const middleware = authorize('ADMIN');

    // When
    middleware(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should call next with UnauthorizedError when no user', () => {
    // Given
    const req = mockReq({});
    const middleware = authorize('ADMIN');

    // When
    middleware(req as Request, mockRes() as Response, mockNext);

    // Then
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
