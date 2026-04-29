/** Error base con statusCode HTTP. Los errores de negocio heredan de esta clase. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Recurso no encontrado (404). */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} with id '${id}' not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/** Conflicto, por ejemplo username duplicado (409). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

/** Credenciales inválidas o token ausente (401). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/** Permisos insuficientes (403). */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

/** Datos de entrada inválidos (400). */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'BadRequestError';
  }
}
