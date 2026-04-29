import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../shared/middleware/auth.middleware';
import { trackRoute } from './tracking.adapter';

const router = Router();

/** GET /api/tracking/:routeId — Datos de rastreo en tiempo real para una ruta. */
router.get('/:routeId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routeId = req.params.routeId as string;
    const tracking = await trackRoute(routeId);
    res.json(tracking);
  } catch (error) {
    next(error);
  }
});

export const trackingController = router;
