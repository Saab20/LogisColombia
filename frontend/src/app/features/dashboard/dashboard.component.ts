import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/route.service';
import { Route, RouteStat, RegionStat } from '../../core/models/route.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private routeService = inject(RouteService);

  stats = signal<RouteStat[]>([]);
  topRoutes = signal<Route[]>([]);
  regionData = signal<RegionStat[]>([]);
  loading = signal(false);

  startDate = '2024-01-01';
  endDate = '2024-12-31';

  /** Colors for the status chart bars. */
  statusColors: Record<string, string> = {
    ACTIVA: '#00b894',
    INACTIVA: '#d63031',
    SUSPENDIDA: '#fdcb6e',
    EN_MANTENIMIENTO: '#0984e3',
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    this.routeService.getStats().subscribe({
      next: (data) => this.stats.set(data),
    });

    this.routeService.getTopByCost().subscribe({
      next: (data) => this.topRoutes.set(data),
    });

    this.routeService.getByRegion().subscribe({
      next: (data) => {
        this.regionData.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByDate(): void {
    this.routeService.getStatsByDateRange(this.startDate, this.endDate).subscribe({
      next: (data) => this.stats.set(data),
    });
  }

  getTotalRoutes(): number {
    return this.stats().reduce((sum, s) => sum + s.count, 0);
  }

  getMaxCount(): number {
    return Math.max(...this.stats().map((s) => s.count), 1);
  }

  getBarWidth(count: number): number {
    return (count / this.getMaxCount()) * 100;
  }

  getMaxRegionCount(): number {
    return Math.max(...this.regionData().map((r) => r.count), 1);
  }

  getHeatIntensity(count: number): number {
    return Math.max(0.2, count / this.getMaxRegionCount());
  }
}
