import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'routes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/routes/route-list/route-list.component').then(
        (m) => m.RouteListComponent
      ),
  },
  {
    path: 'routes/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/routes/route-form/route-form.component').then(
        (m) => m.RouteFormComponent
      ),
  },
  {
    path: 'routes/edit/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/routes/route-form/route-form.component').then(
        (m) => m.RouteFormComponent
      ),
  },
  {
    path: 'monitoring',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/monitoring/monitoring.component').then(
        (m) => m.MonitoringComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
