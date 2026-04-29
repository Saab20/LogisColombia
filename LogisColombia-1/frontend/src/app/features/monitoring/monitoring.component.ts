import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteService } from '../../core/services/route.service';
import { Route, TrackingData } from '../../core/models/route.model';
import { forkJoin } from 'rxjs';

interface MonitoredRoute extends Route {
  tracking?: TrackingData;
}

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.scss',
})
export class MonitoringComponent implements OnInit, OnDestroy {
  private routeService = inject(RouteService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  monitoredRoutes = signal<MonitoredRoute[]>([]);
  loading = signal(false);
  lastRefresh = signal<Date | null>(null);
  countdown = signal(30);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadActiveRoutes();
    // Auto-refresh every 30 seconds
    this.intervalId = setInterval(() => this.loadActiveRoutes(), 30000);
    this.countdownInterval = setInterval(() => {
      this.countdown.update((v) => (v <= 1 ? 30 : v - 1));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  loadActiveRoutes(): void {
    this.loading.set(true);
    this.countdown.set(30);

    this.routeService.getRoutes({ status: 'ACTIVA', limit: 100 }).subscribe({
      next: (response) => {
        const routes = response.data;
        if (routes.length === 0) {
          this.monitoredRoutes.set([]);
          this.loading.set(false);
          this.lastRefresh.set(new Date());
          return;
        }

        const trackingRequests = routes.map((r) => this.routeService.getTracking(r.id));
        forkJoin(trackingRequests).subscribe({
          next: (trackingData) => {
            const monitored: MonitoredRoute[] = routes.map((route, i) => ({
              ...route,
              tracking: trackingData[i],
            }));
            this.monitoredRoutes.set(monitored);
            this.loading.set(false);
            this.lastRefresh.set(new Date());
          },
          error: () => {
            this.monitoredRoutes.set(routes.map((r) => ({ ...r })));
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getProgressColor(percent: number): string {
    if (percent >= 75) return '#00b894';
    if (percent >= 40) return '#fdcb6e';
    return '#e94560';
  }

  formatEta(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}
