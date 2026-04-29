import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouteListComponent } from './route-list.component';
import { RouteService } from '../../../core/services/route.service';
import { AuthService } from '../../../core/services/auth.service';
import { Route, PaginatedResponse } from '../../../core/models/route.model';
import { signal } from '@angular/core';

describe('RouteListComponent', () => {
  let component: RouteListComponent;
  let fixture: ComponentFixture<RouteListComponent>;
  let mockRouteService: {
    getRoutes: jest.Mock;
    deleteRoute: jest.Mock;
    importCsv: jest.Mock;
  };
  let mockRouter: { navigate: jest.Mock };

  const mockRoute: Route = {
    id: 'route-1', originCity: 'Bogotá', destinationCity: 'Medellín',
    distanceKm: 415, estimatedTimeHours: 8.5, vehicleType: 'TRACTOMULA',
    carrier: 'TransColombia', costUsd: 1250, status: 'ACTIVA',
    isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Route> = {
    data: [mockRoute],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  beforeEach(async () => {
    mockRouteService = {
      getRoutes: jest.fn().mockReturnValue(of(mockPaginatedResponse)),
      deleteRoute: jest.fn().mockReturnValue(of({ ...mockRoute, status: 'INACTIVA' })),
      importCsv: jest.fn().mockReturnValue(of({ imported: 5, failed: 0, errors: [] })),
    };
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RouteListComponent],
      providers: [
        { provide: RouteService, useValue: mockRouteService },
        { provide: AuthService, useValue: { isAdmin: signal(true) } },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load routes on init', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(mockRouteService.getRoutes).toHaveBeenCalled();
      expect(component.routes()).toHaveLength(1);
      expect(component.totalPages()).toBe(1);
      expect(component.totalItems()).toBe(1);
    }));
  });

  describe('applyFilters', () => {
    it('should reset page to 1 and reload routes', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      component.filter.page = 3;

      // When
      component.applyFilters();
      tick();

      // Then
      expect(component.filter.page).toBe(1);
      expect(mockRouteService.getRoutes).toHaveBeenCalledTimes(2);
    }));
  });

  describe('clearFilters', () => {
    it('should reset all filters to defaults', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      component.filter.originCity = 'Bogotá';
      component.filter.status = 'ACTIVA';

      // When
      component.clearFilters();
      tick();

      // Then
      expect(component.filter.originCity).toBeUndefined();
      expect(component.filter.status).toBeUndefined();
      expect(component.filter.page).toBe(1);
      expect(component.filter.limit).toBe(20);
    }));
  });

  describe('goToPage', () => {
    it('should navigate to the specified page', fakeAsync(() => {
      // Given — set up a response with multiple pages
      mockRouteService.getRoutes.mockReturnValue(of({
        data: [], pagination: { page: 1, limit: 20, total: 60, totalPages: 3 },
      }));
      fixture.detectChanges();
      tick();
      expect(component.totalPages()).toBe(3);

      // When
      component.goToPage(2);
      tick();

      // Then
      expect(component.filter.page).toBe(2);
    }));

    it('should not navigate to page less than 1', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      const callCount = mockRouteService.getRoutes.mock.calls.length;

      // When
      component.goToPage(0);

      // Then
      expect(mockRouteService.getRoutes).toHaveBeenCalledTimes(callCount);
    }));

    it('should not navigate beyond total pages', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      const callCount = mockRouteService.getRoutes.mock.calls.length;

      // When
      component.goToPage(999);

      // Then
      expect(mockRouteService.getRoutes).toHaveBeenCalledTimes(callCount);
    }));
  });

  describe('sortBy', () => {
    it('should set sort column and default to ASC', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();

      // When
      component.sortBy('cost_usd');
      tick();

      // Then
      expect(component.filter.sortBy).toBe('cost_usd');
      expect(component.filter.sortOrder).toBe('ASC');
    }));

    it('should toggle sort order when clicking same column', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      component.filter.sortBy = 'cost_usd';
      component.filter.sortOrder = 'ASC';

      // When
      component.sortBy('cost_usd');
      tick();

      // Then
      expect(component.filter.sortOrder).toBe('DESC');
    }));
  });

  describe('createRoute', () => {
    it('should navigate to /routes/new', () => {
      component.createRoute();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes/new']);
    });
  });

  describe('editRoute', () => {
    it('should navigate to /routes/edit/:id', () => {
      component.editRoute('route-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes/edit', 'route-1']);
    });
  });

  describe('deleteRoute', () => {
    it('should call deleteRoute and reload on confirm', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      // When
      component.deleteRoute(mockRoute);
      tick();

      // Then
      expect(mockRouteService.deleteRoute).toHaveBeenCalledWith('route-1');
    }));

    it('should not call deleteRoute when user cancels', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      // When
      component.deleteRoute(mockRoute);

      // Then
      expect(mockRouteService.deleteRoute).not.toHaveBeenCalled();
    }));
  });

  describe('getStatusClass', () => {
    it('should return badge class with lowercase status', () => {
      expect(component.getStatusClass('ACTIVA')).toBe('badge badge-activa');
      expect(component.getStatusClass('EN_MANTENIMIENTO')).toBe('badge badge-en_mantenimiento');
    });
  });

  describe('pages', () => {
    it('should generate page numbers around current page', fakeAsync(() => {
      // Given
      mockRouteService.getRoutes.mockReturnValue(of({
        data: [], pagination: { page: 5, limit: 20, total: 200, totalPages: 10 },
      }));
      fixture.detectChanges();
      tick();
      component.filter.page = 5;

      // Then
      expect(component.pages).toEqual([3, 4, 5, 6, 7]);
    }));
  });

  describe('error handling', () => {
    it('should set loading to false on route fetch error', fakeAsync(() => {
      // Given
      mockRouteService.getRoutes.mockReturnValue(throwError(() => new Error('Network error')));

      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.loading()).toBe(false);
    }));
  });
});
