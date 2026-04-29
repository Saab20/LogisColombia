import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteService } from '../../../core/services/route.service';
import { VEHICLE_TYPES, ROUTE_STATUSES } from '../../../core/models/route.model';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-form.component.html',
  styleUrl: './route-form.component.scss',
})
export class RouteFormComponent implements OnInit {
  private routeService = inject(RouteService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  routeId = '';

  vehicleTypes = VEHICLE_TYPES;
  routeStatuses = ROUTE_STATUSES;

  form = {
    originCity: '',
    destinationCity: '',
    distanceKm: 0,
    estimatedTimeHours: 0,
    vehicleType: 'CAMION' as string,
    carrier: '',
    costUsd: 0,
    status: 'ACTIVA' as string,
  };

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.routeId = id;
      this.loadRoute(id);
    }
  }

  private loadRoute(id: string): void {
    this.loading.set(true);
    this.routeService.getRouteById(id).subscribe({
      next: (route) => {
        this.form = {
          originCity: route.originCity,
          destinationCity: route.destinationCity,
          distanceKm: route.distanceKm,
          estimatedTimeHours: route.estimatedTimeHours,
          vehicleType: route.vehicleType,
          carrier: route.carrier,
          costUsd: route.costUsd,
          status: route.status,
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la ruta');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    this.error.set(null);
    this.loading.set(true);

    const payload = {
      ...this.form,
      distanceKm: Number(this.form.distanceKm),
      estimatedTimeHours: Number(this.form.estimatedTimeHours),
      costUsd: Number(this.form.costUsd),
    };

    const request$ = this.isEdit()
      ? this.routeService.updateRoute(this.routeId, payload)
      : this.routeService.createRoute(payload);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/routes']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al guardar la ruta');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/routes']);
  }
}
