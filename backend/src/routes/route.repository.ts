import { query } from '../config/database';
import { RouteFilterDto } from './route.dto';

export interface RouteRow {
  id: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  estimated_time_hours: number;
  vehicle_type: string;
  carrier: string;
  cost_usd: number;
  status: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Find all routes with pagination and filters.
 * @param filters Pagination and filter parameters
 * @returns Paginated route rows and total count
 */
export const findAll = async (
  filters: RouteFilterDto
): Promise<{ rows: RouteRow[]; total: number }> => {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.originCity) {
    conditions.push(`origin_city ILIKE $${paramIndex}`);
    params.push(`%${filters.originCity}%`);
    paramIndex++;
  }
  if (filters.destinationCity) {
    conditions.push(`destination_city ILIKE $${paramIndex}`);
    params.push(`%${filters.destinationCity}%`);
    paramIndex++;
  }
  if (filters.vehicleType) {
    conditions.push(`vehicle_type = $${paramIndex}`);
    params.push(filters.vehicleType);
    paramIndex++;
  }
  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.carrier) {
    conditions.push(`carrier ILIKE $${paramIndex}`);
    params.push(`%${filters.carrier}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (filters.page - 1) * filters.limit;

  const countResult = await query(
    `SELECT COUNT(*) as total FROM routes ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await query(
    `SELECT * FROM routes ${whereClause} ORDER BY ${filters.sortBy} ${filters.sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, filters.limit, offset]
  );

  return { rows: dataResult.rows, total };
};

/**
 * Find a single route by ID.
 * @param id Route UUID
 * @returns The route row or null
 */
export const findById = async (id: string): Promise<RouteRow | null> => {
  const result = await query('SELECT * FROM routes WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Insert a new route into the database.
 * @returns The created route row
 */
export const create = async (data: {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: string;
}): Promise<RouteRow> => {
  const result = await query(
    `INSERT INTO routes (origin_city, destination_city, distance_km, estimated_time_hours, vehicle_type, carrier, cost_usd, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.originCity,
      data.destinationCity,
      data.distanceKm,
      data.estimatedTimeHours,
      data.vehicleType,
      data.carrier,
      data.costUsd,
      data.status,
    ]
  );
  return result.rows[0];
};

/**
 * Update an existing route.
 * @param id Route UUID
 * @param data Partial route data to update
 * @returns The updated route row or null
 */
export const update = async (
  id: string,
  data: Partial<{
    originCity: string;
    destinationCity: string;
    distanceKm: number;
    estimatedTimeHours: number;
    vehicleType: string;
    carrier: string;
    costUsd: number;
    status: string;
  }>
): Promise<RouteRow | null> => {
  const fieldMap: Record<string, string> = {
    originCity: 'origin_city',
    destinationCity: 'destination_city',
    distanceKm: 'distance_km',
    estimatedTimeHours: 'estimated_time_hours',
    vehicleType: 'vehicle_type',
    carrier: 'carrier',
    costUsd: 'cost_usd',
    status: 'status',
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && fieldMap[key]) {
      setClauses.push(`${fieldMap[key]} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query(
    `UPDATE routes SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

/**
 * Soft delete a route by setting is_active to false and status to INACTIVA.
 * @param id Route UUID
 * @returns The updated route row or null
 */
export const softDelete = async (id: string): Promise<RouteRow | null> => {
  const result = await query(
    `UPDATE routes SET is_active = false, status = 'INACTIVA', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Bulk insert routes (for CSV import).
 * @param routes Array of route data
 * @returns The created route row
 */
export const createBulk = async (data: {
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTimeHours: number;
  vehicleType: string;
  carrier: string;
  costUsd: number;
  status: string;
}): Promise<RouteRow> => {
  return create(data);
};

/**
 * Get route statistics grouped by status.
 * @returns Array of { status, count }
 */
export const getStatsByStatus = async (): Promise<Array<{ status: string; count: number }>> => {
  const result = await query(
    'SELECT status, COUNT(*)::int as count FROM routes GROUP BY status ORDER BY count DESC'
  );
  return result.rows;
};

/**
 * Get top N routes by cost.
 * @param limit Number of routes to return
 * @returns Array of route rows ordered by cost descending
 */
export const getTopByCost = async (limit: number = 5): Promise<RouteRow[]> => {
  const result = await query(
    'SELECT * FROM routes ORDER BY cost_usd DESC LIMIT $1',
    [limit]
  );
  return result.rows;
};

/**
 * Get route counts grouped by origin city (for heat map).
 * @returns Array of { city, count }
 */
export const getActiveRoutesByRegion = async (): Promise<Array<{ city: string; count: number }>> => {
  const result = await query(
    `SELECT origin_city as city, COUNT(*)::int as count 
     FROM routes 
     WHERE status = 'ACTIVA' 
     GROUP BY origin_city 
     ORDER BY count DESC`
  );
  return result.rows;
};

/**
 * Get route statistics filtered by date range.
 * @param startDate Start of the date range
 * @param endDate End of the date range
 * @returns Stats by status within the date range
 */
export const getStatsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Array<{ status: string; count: number }>> => {
  const result = await query(
    `SELECT status, COUNT(*)::int as count 
     FROM routes 
     WHERE created_at >= $1 AND created_at <= $2 
     GROUP BY status 
     ORDER BY count DESC`,
    [startDate, endDate]
  );
  return result.rows;
};
