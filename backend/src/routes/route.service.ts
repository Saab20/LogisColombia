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

/**
 * Map a database row to the API response format.
 * @param row Database route row
 * @returns Formatted route response
 */
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

/**
 * Get paginated list of routes with optional filters.
 * @param filters Pagination and filter parameters
 * @returns Paginated route response
 */
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
 * Get a single route by ID.
 * @param id Route UUID
 * @returns Route response
 */
export const findById = async (id: string): Promise<RouteResponse> => {
  const row = await routeRepository.findById(id);
  if (!row) {
    throw new NotFoundError('Route', id);
  }
  return toResponse(row);
};

/**
 * Create a new route.
 * @param dto Route creation data
 * @returns Created route response
 */
export const create = async (dto: CreateRouteDto): Promise<RouteResponse> => {
  const row = await routeRepository.create(dto);
  return toResponse(row);
};

/**
 * Update an existing route.
 * @param id Route UUID
 * @param dto Partial route update data
 * @returns Updated route response
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
 * Soft delete a route (set is_active = false).
 * @param id Route UUID
 * @returns Deactivated route response
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
 * Import routes from a CSV buffer.
 * Validates each row before persisting.
 * @param buffer CSV file buffer
 * @returns Import summary with success/failure counts
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
    const rowNumber = i + 2; // +2 because row 1 is header, data starts at row 2

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

/**
 * Get dashboard statistics: routes by status.
 * @returns Array of { status, count }
 */
export const getStatsByStatus = async () => {
  return routeRepository.getStatsByStatus();
};

/**
 * Get top 5 routes by cost.
 * @returns Array of route responses
 */
export const getTopByCost = async (): Promise<RouteResponse[]> => {
  const rows = await routeRepository.getTopByCost(5);
  return rows.map(toResponse);
};

/**
 * Get active routes grouped by region (origin city).
 * @returns Array of { city, count }
 */
export const getActiveRoutesByRegion = async () => {
  return routeRepository.getActiveRoutesByRegion();
};

/**
 * Get route statistics filtered by date range.
 * @param startDate ISO date string
 * @param endDate ISO date string
 * @returns Stats by status within the date range
 */
export const getStatsByDateRange = async (startDate: string, endDate: string) => {
  return routeRepository.getStatsByDateRange(startDate, endDate);
};
