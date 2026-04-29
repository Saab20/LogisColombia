import { z } from 'zod';

/** Tipos de vehículo permitidos. */
export const vehicleTypes = ['CAMION', 'TRACTOMULA', 'FURGONETA', 'MOTO_CARGO'] as const;

/** Estados posibles de una ruta. */
export const routeStatuses = ['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'EN_MANTENIMIENTO'] as const;

/** Validación para crear una ruta. Status por defecto: ACTIVA. */
export const createRouteSchema = z.object({
  originCity: z.string().min(2).max(100).trim(),
  destinationCity: z.string().min(2).max(100).trim(),
  distanceKm: z.number().positive().max(99999),
  estimatedTimeHours: z.number().positive().max(999),
  vehicleType: z.enum(vehicleTypes),
  carrier: z.string().min(2).max(100).trim(),
  costUsd: z.number().positive().max(999999.99),
  status: z.enum(routeStatuses).default('ACTIVA'),
});

export type CreateRouteDto = z.infer<typeof createRouteSchema>;

/** Validación para actualizar una ruta. Todos los campos son opcionales. */
export const updateRouteSchema = createRouteSchema.partial();

export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;

/** Validación de filtros y paginación del listado. */
export const routeFilterSchema = z.object({
  originCity: z.string().optional(),
  destinationCity: z.string().optional(),
  vehicleType: z.enum(vehicleTypes).optional(),
  status: z.enum(routeStatuses).optional(),
  carrier: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['origin_city', 'destination_city', 'cost_usd', 'created_at', 'status']).default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type RouteFilterDto = z.infer<typeof routeFilterSchema>;

/** Ruta formateada para la respuesta del API (camelCase). */
export interface RouteResponse {
  id: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta paginada con metadatos. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Resultado de importación CSV con detalle de errores por fila. */
export interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}
