import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouteService } from '../../../core/services/route.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Route,
  RouteFilter,
  VEHICLE_TYPES,
  ROUTE_STATUSES,
} from '../../../core/models/route.model';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-list.component.html',
  styleUrl: './route-list.component.scss',
})
export class RouteListComponent implements OnInit {
  private routeService = inject(RouteService);
  private authService = inject(AuthService);
  private router = inject(Router);

  routes = signal<Route[]>([]);
  loading = signal(false);
  totalPages = signal(0);
  totalItems = signal(0);

  isAdmin = this.authService.isAdmin;

  vehicleTypes = VEHICLE_TYPES;
  routeStatuses = ROUTE_STATUSES;

  filter: RouteFilter = {
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  };

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.loading.set(true);
    this.routeService.getRoutes(this.filter).subscribe({
      next: (response) => {
        this.routes.set(response.data);
        this.totalPages.set(response.pagination.totalPages);
        this.totalItems.set(response.pagination.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.filter.page = 1;
    this.loadRoutes();
  }

  clearFilters(): void {
    this.filter = {
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    };
    this.loadRoutes();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.filter.page = page;
    this.loadRoutes();
  }

  sortBy(column: string): void {
    if (this.filter.sortBy === column) {
      this.filter.sortOrder = this.filter.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filter.sortBy = column;
      this.filter.sortOrder = 'ASC';
    }
    this.loadRoutes();
  }

  createRoute(): void {
    this.router.navigate(['/routes/new']);
  }

  editRoute(id: string): void {
    this.router.navigate(['/routes/edit', id]);
  }

  deleteRoute(route: Route): void {
    if (!confirm(`¿Inhabilitar la ruta ${route.originCity} → ${route.destinationCity}?`)) return;
    this.routeService.deleteRoute(route.id).subscribe({
      next: () => this.loadRoutes(),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    this.loading.set(true);
    this.routeService.importCsv(file).subscribe({
      next: (result) => {
        alert(`Importación completada: ${result.imported} importadas, ${result.failed} fallidas`);
        input.value = '';
        this.loadRoutes();
      },
      error: () => {
        this.loading.set(false);
        input.value = '';
      },
    });
  }

  getStatusClass(status: string): string {
    return 'badge badge-' + status.toLowerCase();
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.filter.page || 1;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
