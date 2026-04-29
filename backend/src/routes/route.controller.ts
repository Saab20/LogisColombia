import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../shared/middleware/auth.middleware';
import { createRouteSchema, updateRouteSchema, routeFilterSchema } from './route.dto';
import * as routeService from './route.service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * GET /api/routes
 * List all routes with pagination and filters.
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = routeFilterSchema.parse(req.query);
    const result = await routeService.findAll(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/stats
 * Get dashboard statistics (routes by status).
 */
router.get('/stats', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await routeService.getStatsByStatus();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/top-cost
 * Get top 5 routes by cost.
 */
router.get('/top-cost', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const routes = await routeService.getTopByCost();
    res.json(routes);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/by-region
 * Get active routes grouped by origin city.
 */
router.get('/by-region', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await routeService.getActiveRoutesByRegion();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/stats-by-date
 * Get route statistics filtered by date range.
 */
router.get('/stats-by-date', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate query params are required' });
      return;
    }
    const stats = await routeService.getStatsByDateRange(
      startDate as string,
      endDate as string
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/routes/:id
 * Get a single route by ID.
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await routeService.findById(req.params.id as string);
    res.json(route);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/routes
 * Create a new route (ADMIN only).
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createRouteSchema.parse(req.body);
      const route = await routeService.create(dto);
      res.status(201).json(route);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/routes/import
 * Import routes from CSV file (ADMIN only).
 */
router.post(
  '/import',
  authenticate,
  authorize('ADMIN'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'CSV file is required' });
        return;
      }
      const result = await routeService.importFromCsv(req.file.buffer);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/routes/:id
 * Update an existing route (ADMIN only).
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = updateRouteSchema.parse(req.body);
      const route = await routeService.update(req.params.id as string, dto);
      res.json(route);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/routes/:id
 * Soft delete a route (ADMIN only).
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const route = await routeService.softDelete(req.params.id as string);
      res.json(route);
    } catch (error) {
      next(error);
    }
  }
);

export const routeController = router;
