import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouteFormComponent } from './route-form.component';
import { RouteService } from '../../../core/services/route.service';
import { Route } from '../../../core/models/route.model';

describe('RouteFormComponent', () => {
  let component: RouteFormComponent;
  let fixture: ComponentFixture<RouteFormComponent>;
  let mockRouteService: {
    getRouteById: jest.Mock;
    createRoute: jest.Mock;
    updateRoute: jest.Mock;
  };
  let mockRouter: { navigate: jest.Mock };

  const mockRoute: Route = {
    id: 'route-1', originCity: 'Bogotá', destinationCity: 'Medellín',
    distanceKm: 415, estimatedTimeHours: 8.5, vehicleType: 'TRACTOMULA',
    carrier: 'TransColombia', costUsd: 1250, status: 'ACTIVA',
    isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  };

  const setupTestBed = async (routeId: string | null = null) => {
    mockRouteService = {
      getRouteById: jest.fn().mockReturnValue(of(mockRoute)),
      createRoute: jest.fn().mockReturnValue(of(mockRoute)),
      updateRoute: jest.fn().mockReturnValue(of(mockRoute)),
    };
    mockRouter = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RouteFormComponent],
      providers: [
        { provide: RouteService, useValue: mockRouteService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteFormComponent);
    component = fixture.componentInstance;
  };

  describe('create mode', () => {
    beforeEach(async () => {
      await setupTestBed(null);
      fixture.detectChanges();
    });

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBe(false);
    });

    it('should have default form values', () => {
      expect(component.form.originCity).toBe('');
      expect(component.form.vehicleType).toBe('CAMION');
      expect(component.form.status).toBe('ACTIVA');
    });

    it('should not fetch route data in create mode', () => {
      expect(mockRouteService.getRouteById).not.toHaveBeenCalled();
    });

    it('should call createRoute on submit', fakeAsync(() => {
      // Given
      component.form = {
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
      component.onSubmit();
      tick();

      // Then
      expect(mockRouteService.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          originCity: 'Cali',
          destinationCity: 'Pasto',
          distanceKm: 300,
        })
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes']);
    }));

    it('should show error on create failure', fakeAsync(() => {
      // Given
      mockRouteService.createRoute.mockReturnValue(
        throwError(() => ({ error: { error: 'Validation failed' } }))
      );
      component.form.originCity = 'Cali';
      component.form.destinationCity = 'Pasto';

      // When
      component.onSubmit();
      tick();

      // Then
      expect(component.error()).toBe('Validation failed');
      expect(component.loading()).toBe(false);
    }));

    it('should show generic error when server returns no message', fakeAsync(() => {
      // Given
      mockRouteService.createRoute.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      // When
      component.onSubmit();
      tick();

      // Then
      expect(component.error()).toBe('Error al guardar la ruta');
    }));
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      await setupTestBed('route-1');
    });

    it('should be in edit mode when route ID is present', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.isEdit()).toBe(true);
      expect(component.routeId).toBe('route-1');
    }));

    it('should load route data in edit mode', fakeAsync(() => {
      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('route-1');
      expect(component.form.originCity).toBe('Bogotá');
      expect(component.form.destinationCity).toBe('Medellín');
      expect(component.form.costUsd).toBe(1250);
    }));

    it('should call updateRoute on submit in edit mode', fakeAsync(() => {
      // Given
      fixture.detectChanges();
      tick();
      component.form.costUsd = 1500;

      // When
      component.onSubmit();
      tick();

      // Then
      expect(mockRouteService.updateRoute).toHaveBeenCalledWith(
        'route-1',
        expect.objectContaining({ costUsd: 1500 })
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes']);
    }));

    it('should handle route load error', fakeAsync(() => {
      // Given
      mockRouteService.getRouteById.mockReturnValue(
        throwError(() => new Error('Not found'))
      );

      // When
      fixture.detectChanges();
      tick();

      // Then
      expect(component.error()).toBe('Error al cargar la ruta');
      expect(component.loading()).toBe(false);
    }));
  });

  describe('cancel', () => {
    beforeEach(async () => {
      await setupTestBed(null);
      fixture.detectChanges();
    });

    it('should navigate back to /routes', () => {
      component.cancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/routes']);
    });
  });

  describe('form data conversion', () => {
    beforeEach(async () => {
      await setupTestBed(null);
      fixture.detectChanges();
    });

    it('should convert string numbers to Number type on submit', fakeAsync(() => {
      // Given — simulate form binding where numbers come as strings
      component.form.distanceKm = '500' as unknown as number;
      component.form.estimatedTimeHours = '10.5' as unknown as number;
      component.form.costUsd = '2000.50' as unknown as number;
      component.form.originCity = 'Bogotá';
      component.form.destinationCity = 'Cali';
      component.form.carrier = 'Test';

      // When
      component.onSubmit();
      tick();

      // Then
      expect(mockRouteService.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          distanceKm: 500,
          estimatedTimeHours: 10.5,
          costUsd: 2000.50,
        })
      );
    }));
  });
});
