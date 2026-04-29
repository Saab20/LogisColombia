import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MonitoringComponent } from './monitoring.component';
import { RouteService } from '../../core/services/route.service';
import { Route, PaginatedResponse, TrackingData } from '../../core/models/route.model';

describe('MonitoringComponent', () => {
  let component: MonitoringComponent;
  let fixture: ComponentFixture<MonitoringComponent>;
  let mockRouteService: {
    getRoutes: jest.Mock;
    getTracking: jest.Mock;
  };

  const mockRoute: Route = {
    id: 'route-1', originCity: 'Bogotá', destinationCity: 'Medellín',
    distanceKm: 415, estimatedTimeHours: 8.5, vehicleType: 'TRACTOMULA',
    carrier: 'TransColombia', costUsd: 1250, status: 'ACTIVA',
    isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockTracking: TrackingData = {
    routeId: 'route-1', lastLocation: 'Bucaramanga',
    progressPercent: 60, etaMinutes: 150, timestamp: '2025-01-15T12:00:00Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Route> = {
    data: [mockRoute],
    pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
  };

  beforeEach(async () => {
    mockRouteService = {
      getRoutes: jest.fn().mockReturnValue(of(mockPaginatedResponse)),
      getTracking: jest.fn().mockReturnValue(of(mockTracking)),
    };

    await TestBed.configureTestingModule({
      imports: [MonitoringComponent],
      providers: [{ provide: RouteService, useValue: mockRouteService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure intervals are cleaned up
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load active routes on init', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(mockRouteService.getRoutes).toHaveBeenCalledWith({ status: 'ACTIVA', limit: 100 });
      expect(mockRouteService.getTracking).toHaveBeenCalledWith('route-1');
      expect(component.monitoredRoutes()).toHaveLength(1);
      expect(component.monitoredRoutes()[0].tracking?.lastLocation).toBe('Bucaramanga');
    }));

    it('should set lastRefresh after loading', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.lastRefresh()).toBeInstanceOf(Date);
    }));
  });

  describe('loadActiveRoutes', () => {
    it('should handle empty routes list', fakeAsync(() => {
      // Given
      mockRouteService.getRoutes.mockReturnValue(of({
        data: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
      }));

      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.monitoredRoutes()).toHaveLength(0);
      expect(component.loading()).toBe(false);
    }));

    it('should handle tracking fetch error gracefully', fakeAsync(() => {
      // Given
      mockRouteService.getTracking.mockReturnValue(throwError(() => new Error('Network error')));

      // When
      fixture.detectChanges();
      tick();

      // Then — routes are still shown, just without tracking data
      expect(component.monitoredRoutes()).toHaveLength(1);
      expect(component.monitoredRoutes()[0].tracking).toBeUndefined();
      expect(component.loading()).toBe(false);
    }));

    it('should handle routes fetch error gracefully', fakeAsync(() => {
      // Given
      mockRouteService.getRoutes.mockReturnValue(throwError(() => new Error('Server error')));

      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.loading()).toBe(false);
    }));

    it('should reset countdown to 30 on load', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.countdown()).toBe(30);
    }));
  });

  describe('getProgressColor', () => {
    it('should return green for progress >= 75', () => {
      expect(component.getProgressColor(75)).toBe('#00b894');
      expect(component.getProgressColor(100)).toBe('#00b894');
    });

    it('should return yellow for progress >= 40 and < 75', () => {
      expect(component.getProgressColor(40)).toBe('#fdcb6e');
      expect(component.getProgressColor(74)).toBe('#fdcb6e');
    });

    it('should return red for progress < 40', () => {
      expect(component.getProgressColor(0)).toBe('#e94560');
      expect(component.getProgressColor(39)).toBe('#e94560');
    });
  });

  describe('formatEta', () => {
    it('should format minutes only when less than 60', () => {
      expect(component.formatEta(45)).toBe('45m');
    });

    it('should format hours and minutes', () => {
      expect(component.formatEta(150)).toBe('2h 30m');
    });

    it('should format exact hours', () => {
      expect(component.formatEta(120)).toBe('2h 0m');
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear intervals on destroy', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // When
      component.ngOnDestroy();

      // Then — no errors, intervals cleared
      expect(component).toBeTruthy();
    }));
  });
});
