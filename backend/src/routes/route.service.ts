import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { NotFoundError, BadRequestError } from '../shared/errors/app-error';
import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteFilterDto,
  RouteResponse,
  PaginatedResponse,
  ImportResult,
  createRouteSchema,
  vehicleTypes,
  routeStatuses,
} from './route.dto';
import * as routeRepository from './route.repository';
import { RouteRow } from './route.repository';

/** Convierte un registro de BD (snake_case) al formato del API (camelCase). */
const toResponse = (row: RouteRow): RouteResponse => ({
  id: row.id,
  originCity: row.origin_city,
  destinationCity: row.destination_city,
  distanceKm: Number(row.distance_km),
  estimatedTimeHours: Number(row.estimated_time_hours),
  vehicleType: row.vehicle_type,
  carrier: row.carrier,
  costUsd: Number(row.cost_usd),
  status: row.status,
  isActive: row.is_active,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

/** Lista rutas con paginación y filtros. */
export const findAll = async (
  filters: RouteFilterDto
): Promise<PaginatedResponse<RouteResponse>> => {
  const { rows, total } = await routeRepository.findAll(filters);
  return {
    data: rows.map(toResponse),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

/**
 * Obtiene una ruta por UUID.
 * @throws {NotFoundError} Si no existe.
 */
export const findById = async (id: string): Promise<RouteResponse> => {
  const row = await routeRepository.findById(id);
  if (!row) {
    throw new NotFoundError('Route', id);
  }
  return toResponse(row);
};

/** Crea una ruta nueva. */
export const create = async (dto: CreateRouteDto): Promise<RouteResponse> => {
  const row = await routeRepository.create(dto);
  return toResponse(row);
};

/**
 * Actualiza parcialmente una ruta.
 * @throws {NotFoundError} Si no existe.
 */
export const update = async (id: string, dto: UpdateRouteDto): Promise<RouteResponse> => {
  const existing = await routeRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Route', id);
  }
  const row = await routeRepository.update(id, dto);
  if (!row) {
    throw new NotFoundError('Route', id);
  }
  return toResponse(row);
};

/**
 * Soft delete: marca la ruta como INACTIVA sin borrarla.
 * @throws {NotFoundError} Si no existe.
 */
export const softDelete = async (id: string): Promise<RouteResponse> => {
  const existing = await routeRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Route', id);
  }
  const row = await routeRepository.softDelete(id);
  if (!row) {
    throw new NotFoundError('Route', id);
  }
  return toResponse(row);
};

/**
 * Importa rutas desde un CSV. Valida cada fila y reporta errores sin detener la importación.
 * @throws {BadRequestError} Si el CSV está vacío.
 */
export const importFromCsv = async (buffer: Buffer): Promise<ImportResult> => {
  const records: Record<string, string>[] = await new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on('data', (record: Record<string, string>) => results.push(record))
      .on('end', () => resolve(results))
      .on('error', reject);
  });

  if (records.length === 0) {
    throw new BadRequestError('CSV file is empty or has no valid rows');
  }

  let imported = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNumber = i + 2;

    try {
      const dto = createRouteSchema.parse({
        originCity: record.origin_city,
        destinationCity: record.destination_city,
        distanceKm: Number(record.distance_km),
        estimatedTimeHours: Number(record.estimated_time_hours),
        vehicleType: record.vehicle_type,
        carrier: record.carrier,
        costUsd: Number(record.cost_usd),
        status: record.status || 'ACTIVA',
      });

      await routeRepository.create(dto);
      imported++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown validation error';
      errors.push({ row: rowNumber, message });
    }
  }

  return { imported, failed: errors.length, errors };
};

/** Estadísticas de rutas agrupadas por estado. */
export const getStatsByStatus = async () => {
  return routeRepository.getStatsByStatus();
};

/** Top 5 rutas por costo. */
export const getTopByCost = async (): Promise<RouteResponse[]> => {
  const rows = await routeRepository.getTopByCost(5);
  return rows.map(toResponse);
};

/** Rutas activas agrupadas por ciudad de origen. */
export const getActiveRoutesByRegion = async () => {
  return routeRepository.getActiveRoutesByRegion();
};

/** Estadísticas filtradas por rango de fechas. */
export const getStatsByDateRange = async (startDate: string, endDate: string) => {
  return routeRepository.getStatsByDateRange(startDate, endDate);
};
