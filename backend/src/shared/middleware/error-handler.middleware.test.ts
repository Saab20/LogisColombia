import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { errorHandler } from './error-handler.middleware';
import { AppError, NotFoundError } from '../errors/app-error';

const mockReq = (): Partial<Request> => ({ correlationId: 'test-corr-id' });
const mockNext: NextFunction = jest.fn();

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  it('should handle AppError with correct status code', () => {
    // Given
    const err = new NotFoundError('Route', 'abc');
    const res = mockRes();

    // When
    errorHandler(err, mockReq() as Request, res as Response, mockNext);

    // Then
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Route with id 'abc' not found",
        statusCode: 404,
        correlationId: 'test-corr-id',
      })
    );
  });

  it('should handle ZodError with 400 and field details', () => {
    // Given
    const zodIssue: ZodIssue = {
      code: 'too_small',
      minimum: 3,
      type: 'string',
      inclusive: true,
      exact: false,
      message: 'Too short',
      path: ['username'],
    };
    const err = new ZodError([zodIssue]);
    const res = mockRes();

    // When
    errorHandler(err, mockReq() as Request, res as Response, mockNext);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        statusCode: 400,
        details: [{ field: 'username', message: 'Too short' }],
      })
    );
  });

  it('should handle unknown errors with 500 and generic message', () => {
    // Given
    const err = new Error('Something broke');
    const res = mockRes();

    // When
    errorHandler(err, mockReq() as Request, res as Response, mockNext);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
        statusCode: 500,
      })
    );
  });
});
