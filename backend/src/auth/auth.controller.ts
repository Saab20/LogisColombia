import { Router, Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema } from './auth.dto';
import * as authService from './auth.service';

const router = Router();

/**
 * POST /api/auth/login — Valida credenciales y devuelve un token JWT.
 * Rate limit: máximo 5 intentos por minuto por IP.
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
 * POST /api/auth/register — Crea un usuario nuevo y devuelve token JWT.
 * Público en desarrollo; en producción debería restringirse a ADMIN.
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
