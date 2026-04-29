import { Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware } from './correlation-id.middleware';

const mockNext: NextFunction = jest.fn();

describe('correlationIdMiddleware', () => {
  it('should generate a UUID when no header is provided', () => {
    // Given
    const req = { headers: {} } as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    // When
    correlationIdMiddleware(req, res, mockNext);

    // Then
    expect(req.correlationId).toBeDefined();
    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing X-Correlation-ID header', () => {
    // Given
    const req = { headers: { 'x-correlation-id': 'my-custom-id' } } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    // When
    correlationIdMiddleware(req, res, mockNext);

    // Then
    expect(req.correlationId).toBe('my-custom-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'my-custom-id');
  });
});
