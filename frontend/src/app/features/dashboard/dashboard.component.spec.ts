import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { RouteService } from '../../core/services/route.service';
import { Route, RouteStat, RegionStat } from '../../core/models/route.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockRouteService: {
    getStats: jest.Mock;
    getTopByCost: jest.Mock;
    getByRegion: jest.Mock;
    getStatsByDateRange: jest.Mock;
  };

  const mockStats: RouteStat[] = [
    { status: 'ACTIVA', count: 50 },
    { status: 'INACTIVA', count: 10 },
    { status: 'SUSPENDIDA', count: 5 },
  ];

  const mockTopRoutes: Route[] = [
    {
      id: 'r1', originCity: 'Bogotá', destinationCity: 'Medellín',
      distanceKm: 415, estimatedTimeHours: 8.5, vehicleType: 'TRACTOMULA',
      carrier: 'TransColombia', costUsd: 5000, status: 'ACTIVA',
      isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockRegions: RegionStat[] = [
    { city: 'Bogotá', count: 25 },
    { city: 'Medellín', count: 15 },
  ];

  beforeEach(async () => {
    mockRouteService = {
      getStats: jest.fn().mockReturnValue(of(mockStats)),
      getTopByCost: jest.fn().mockReturnValue(of(mockTopRoutes)),
      getByRegion: jest.fn().mockReturnValue(of(mockRegions)),
      getStatsByDateRange: jest.fn().mockReturnValue(of(mockStats)),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: RouteService, useValue: mockRouteService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load dashboard data on init', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(mockRouteService.getStats).toHaveBeenCalled();
      expect(mockRouteService.getTopByCost).toHaveBeenCalled();
      expect(mockRouteService.getByRegion).toHaveBeenCalled();
      expect(component.stats()).toEqual(mockStats);
      expect(component.topRoutes()).toEqual(mockTopRoutes);
      expect(component.regionData()).toEqual(mockRegions);
    }));
  });

  describe('getTotalRoutes', () => {
    it('should sum all route counts', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // When
      const total = component.getTotalRoutes();

      // Then
      expect(total).toBe(65); // 50 + 10 + 5
    }));

    it('should return 0 when no stats', () => {
      expect(component.getTotalRoutes()).toBe(0);
    });
  });

  describe('getMaxCount', () => {
    it('should return the highest count among stats', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // Then
      expect(component.getMaxCount()).toBe(50);
    }));

    it('should return 1 as minimum when no stats', () => {
      expect(component.getMaxCount()).toBe(1);
    });
  });

  describe('getBarWidth', () => {
    it('should calculate percentage relative to max count', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // Then
      expect(component.getBarWidth(50)).toBe(100);
      expect(component.getBarWidth(25)).toBe(50);
    }));
  });

  describe('getMaxRegionCount', () => {
    it('should return the highest region count', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // Then
      expect(component.getMaxRegionCount()).toBe(25);
    }));
  });

  describe('getHeatIntensity', () => {
    it('should return opacity between 0.2 and 1', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // Then
      expect(component.getHeatIntensity(25)).toBe(1);
      expect(component.getHeatIntensity(0)).toBe(0.2);
    }));
  });

  describe('filterByDate', () => {
    it('should call getStatsByDateRange with selected dates', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      component.startDate = '2025-06-01';
      component.endDate = '2025-12-31';

      // When
      component.filterByDate();
      tick();

      // Then
      expect(mockRouteService.getStatsByDateRange).toHaveBeenCalledWith('2025-06-01', '2025-12-31');
    }));
  });

  describe('statusColors', () => {
    it('should have colors for all known statuses', () => {
      expect(component.statusColors['ACTIVA']).toBeDefined();
      expect(component.statusColors['INACTIVA']).toBeDefined();
      expect(component.statusColors['SUSPENDIDA']).toBeDefined();
      expect(component.statusColors['EN_MANTENIMIENTO']).toBeDefined();
    });
  });
});
