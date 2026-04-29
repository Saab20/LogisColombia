import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RouteService } from './route.service';
import { Route, PaginatedResponse, RouteStat, RegionStat, TrackingData, ImportResult } from '../models/route.model';
import { environment } from '../../../environments/environment';

describe('RouteService', () => {
  let service: RouteService;
  let httpMock: HttpTestingController;

  const mockRoute: Route = {
    id: 'route-1',
    originCity: 'Bogotá',
    destinationCity: 'Medellín',
    distanceKm: 415,
    estimatedTimeHours: 8.5,
    vehicleType: 'TRACTOMULA',
    carrier: 'TransColombia S.A.',
    costUsd: 1250,
    status: 'ACTIVA',
    isActive: true,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Route> = {
    data: [mockRoute],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouteService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RouteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getRoutes', () => {
    it('should fetch paginated routes without filters', () => {
      // When
      service.getRoutes().subscribe((response) => {
        // Then
        expect(response.data).toHaveLength(1);
        expect(response.pagination.total).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should send filter params as query string', () => {
      // Given
      const filter = { originCity: 'Bogotá', status: 'ACTIVA' as const, page: 2, limit: 10 };

      // When
      service.getRoutes(filter).subscribe();

      // Then
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/routes`);
      expect(req.request.params.get('originCity')).toBe('Bogotá');
      expect(req.request.params.get('status')).toBe('ACTIVA');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockPaginatedResponse);
    });

    it('should not send undefined or empty filter values', () => {
      // Given
      const filter = { originCity: '', status: undefined, page: 1 };

      // When
      service.getRoutes(filter).subscribe();

      // Then
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/routes`);
      expect(req.request.params.has('originCity')).toBe(false);
      expect(req.request.params.has('status')).toBe(false);
      expect(req.request.params.get('page')).toBe('1');
      req.flush(mockPaginatedResponse);
    });
  });

  describe('getRouteById', () => {
    it('should fetch a single route by ID', () => {
      // When
      service.getRouteById('route-1').subscribe((route) => {
        // Then
        expect(route.id).toBe('route-1');
        expect(route.originCity).toBe('Bogotá');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/route-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRoute);
    });
  });

  describe('createRoute', () => {
    it('should send POST with route data', () => {
      // Given
      const newRoute = {
        originCity: 'Cali',
        destinationCity: 'Pasto',
        distanceKm: 300,
        estimatedTimeHours: 6,
        vehicleType: 'CAMION',
        carrier: 'LogiSur',
        costUsd: 800,
        status: 'ACTIVA',
      };

      // When
      service.createRoute(newRoute).subscribe((route) => {
        // Then
        expect(route.originCity).toBe('Cali');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRoute);
      req.flush({ ...mockRoute, ...newRoute, id: 'route-2' });
    });
  });

  describe('updateRoute', () => {
    it('should send PUT with partial route data', () => {
      // Given
      const updates = { costUsd: 1500, status: 'EN_MANTENIMIENTO' };

      // When
      service.updateRoute('route-1', updates).subscribe((route) => {
        // Then
        expect(route.costUsd).toBe(1500);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/route-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockRoute, ...updates });
    });
  });

  describe('deleteRoute', () => {
    it('should send DELETE request', () => {
      // When
      service.deleteRoute('route-1').subscribe((route) => {
        // Then
        expect(route.status).toBe('INACTIVA');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/route-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ ...mockRoute, status: 'INACTIVA', isActive: false });
    });
  });

  describe('importCsv', () => {
    it('should send POST with FormData containing the file', () => {
      // Given
      const file = new File(['csv,content'], 'routes.csv', { type: 'text/csv' });
      const mockResult: ImportResult = { imported: 10, failed: 2, errors: [{ row: 3, message: 'Invalid' }] };

      // When
      service.importCsv(file).subscribe((result) => {
        // Then
        expect(result.imported).toBe(10);
        expect(result.failed).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/import`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResult);
    });
  });

  describe('getStats', () => {
    it('should fetch route statistics by status', () => {
      // Given
      const mockStats: RouteStat[] = [
        { status: 'ACTIVA', count: 50 },
        { status: 'INACTIVA', count: 10 },
      ];

      // When
      service.getStats().subscribe((stats) => {
        // Then
        expect(stats).toHaveLength(2);
        expect(stats[0].status).toBe('ACTIVA');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('getTopByCost', () => {
    it('should fetch top routes by cost', () => {
      // When
      service.getTopByCost().subscribe((routes) => {
        // Then
        expect(routes).toHaveLength(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/top-cost`);
      expect(req.request.method).toBe('GET');
      req.flush([mockRoute]);
    });
  });

  describe('getByRegion', () => {
    it('should fetch region statistics', () => {
      // Given
      const mockRegions: RegionStat[] = [
        { city: 'Bogotá', count: 25 },
        { city: 'Medellín', count: 15 },
      ];

      // When
      service.getByRegion().subscribe((regions) => {
        // Then
        expect(regions).toHaveLength(2);
        expect(regions[0].city).toBe('Bogotá');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/routes/by-region`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRegions);
    });
  });

  describe('getStatsByDateRange', () => {
    it('should send date range as query params', () => {
      // When
      service.getStatsByDateRange('2025-01-01', '2025-12-31').subscribe();

      // Then
      const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/routes/stats-by-date`);
      expect(req.request.params.get('startDate')).toBe('2025-01-01');
      expect(req.request.params.get('endDate')).toBe('2025-12-31');
      req.flush([]);
    });
  });

  describe('getTracking', () => {
    it('should fetch tracking data for a route', () => {
      // Given
      const mockTracking: TrackingData = {
        routeId: 'route-1',
        lastLocation: 'Bogotá',
        progressPercent: 45,
        etaMinutes: 120,
        timestamp: '2025-01-15T12:00:00.000Z',
      };

      // When
      service.getTracking('route-1').subscribe((tracking) => {
        // Then
        expect(tracking.routeId).toBe('route-1');
        expect(tracking.progressPercent).toBe(45);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tracking/route-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTracking);
    });
  });
});
