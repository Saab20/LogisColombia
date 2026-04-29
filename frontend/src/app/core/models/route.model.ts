export interface Route {
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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RouteFilter {
  originCity?: string;
  destinationCity?: string;
  vehicleType?: string;
  status?: string;
  carrier?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export interface TrackingData {
  routeId: string;
  lastLocation: string;
  progressPercent: number;
  etaMinutes: number;
  timestamp: string;
}

export interface RouteStat {
  status: string;
  count: number;
}

export interface RegionStat {
  city: string;
  count: number;
}

export const VEHICLE_TYPES = ['CAMION', 'TRACTOMULA', 'FURGONETA', 'MOTO_CARGO'] as const;
export const ROUTE_STATUSES = ['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'EN_MANTENIMIENTO'] as const;
