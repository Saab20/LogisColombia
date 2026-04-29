import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Route,
  PaginatedResponse,
  RouteFilter,
  ImportResult,
  TrackingData,
  RouteStat,
  RegionStat,
} from '../models/route.model';
import { environment } from '../../../environments/environment';

/**
 * Service for route CRUD, dashboard stats, and tracking operations.
 */
@Injectable({ providedIn: 'root' })
export class RouteService {
  private apiUrl = `${environment.apiUrl}/routes`;
  private trackingUrl = `${environment.apiUrl}/tracking`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated routes with optional filters.
   * @param filter Filter and pagination parameters
   * @returns Observable with paginated route response
   */
  getRoutes(filter: RouteFilter = {}): Observable<PaginatedResponse<Route>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Route>>(this.apiUrl, { params });
  }

  /**
   * Get a single route by ID.
   * @param id Route UUID
   * @returns Observable with route data
   */
  getRouteById(id: string): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new route.
   * @param route Route data
   * @returns Observable with created route
   */
  createRoute(route: Partial<Route>): Observable<Route> {
    return this.http.post<Route>(this.apiUrl, route);
  }

  /**
   * Update an existing route.
   * @param id Route UUID
   * @param route Partial route data to update
   * @returns Observable with updated route
   */
  updateRoute(id: string, route: Partial<Route>): Observable<Route> {
    return this.http.put<Route>(`${this.apiUrl}/${id}`, route);
  }

  /**
   * Soft delete a route.
   * @param id Route UUID
   * @returns Observable with deactivated route
   */
  deleteRoute(id: string): Observable<Route> {
    return this.http.delete<Route>(`${this.apiUrl}/${id}`);
  }

  /**
   * Import routes from a CSV file.
   * @param file CSV file
   * @returns Observable with import result summary
   */
  importCsv(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.apiUrl}/import`, formData);
  }

  /**
   * Get route statistics grouped by status.
   * @returns Observable with status counts
   */
  getStats(): Observable<RouteStat[]> {
    return this.http.get<RouteStat[]>(`${this.apiUrl}/stats`);
  }

  /**
   * Get top 5 routes by cost.
   * @returns Observable with route array
   */
  getTopByCost(): Observable<Route[]> {
    return this.http.get<Route[]>(`${this.apiUrl}/top-cost`);
  }

  /**
   * Get active routes grouped by origin city.
   * @returns Observable with region stats
   */
  getByRegion(): Observable<RegionStat[]> {
    return this.http.get<RegionStat[]>(`${this.apiUrl}/by-region`);
  }

  /**
   * Get stats filtered by date range.
   * @param startDate ISO date string
   * @param endDate ISO date string
   * @returns Observable with status counts
   */
  getStatsByDateRange(startDate: string, endDate: string): Observable<RouteStat[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<RouteStat[]>(`${this.apiUrl}/stats-by-date`, { params });
  }

  /**
   * Get real-time tracking data for a route.
   * @param routeId Route UUID
   * @returns Observable with tracking data
   */
  getTracking(routeId: string): Observable<TrackingData> {
    return this.http.get<TrackingData>(`${this.trackingUrl}/${routeId}`);
  }
}
