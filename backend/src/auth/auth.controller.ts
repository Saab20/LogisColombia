import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema } from './auth.dto';
import * as authService from './auth.service';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register a new user (ADMIN only in production, open in dev).
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export const authController = router;
