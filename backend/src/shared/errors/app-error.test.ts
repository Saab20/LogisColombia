import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from './app-error';

describe('AppError', () => {
  it('should create with status code and message', () => {
    const error = new AppError(418, 'I am a teapot');
    expect(error.statusCode).toBe(418);
    expect(error.message).toBe('I am a teapot');
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('should create 404 with resource name', () => {
    const error = new NotFoundError('Route');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Route not found');
  });

  it('should include id in message when provided', () => {
    const error = new NotFoundError('Route', 'abc-123');
    expect(error.message).toBe("Route with id 'abc-123' not found");
  });
});

describe('ConflictError', () => {
  it('should create 409', () => {
    const error = new ConflictError('Already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Already exists');
  });
});

describe('UnauthorizedError', () => {
  it('should create 401 with default message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid credentials');
  });

  it('should accept custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('should create 403 with default message', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access denied');
  });
});

describe('BadRequestError', () => {
  it('should create 400', () => {
    const error = new BadRequestError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
  });
});
