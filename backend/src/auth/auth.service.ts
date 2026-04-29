import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ConflictError } from '../shared/errors/app-error';
import { LoginDto, RegisterDto, JwtPayload, AuthResponse } from './auth.dto';
import * as authRepository from './auth.repository';

/** Factor de costo para bcrypt (12 ≈ 250ms por hash). */
const BCRYPT_COST_FACTOR = 12;

/**
 * Verifica credenciales y genera un token JWT.
 * @throws {UnauthorizedError} Si el usuario no existe o la contraseña es incorrecta.
 */
export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  const user = await authRepository.findByUsername(dto.username);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

/**
 * Crea un usuario, hashea la contraseña y devuelve token JWT.
 * @throws {ConflictError} Si el username ya existe.
 */
export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  const existingUser = await authRepository.findByUsername(dto.username);
  if (existingUser) {
    throw new ConflictError(`Username '${dto.username}' already exists`);
  }

  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST_FACTOR);
  const user = await authRepository.createUser(dto.username, passwordHash, dto.role);

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};
