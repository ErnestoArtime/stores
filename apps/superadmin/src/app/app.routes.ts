import { Routes } from '@angular/router';
import { superadminGuard } from '@stores/data-access';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canActivate: [superadminGuard],
    loadComponent: () => import('./dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'tenants',
    canActivate: [superadminGuard],
    loadComponent: () => import('./tenants/tenant-list.page').then((m) => m.TenantListPage)
  },
  {
    path: 'tenants/:id',
    canActivate: [superadminGuard],
    loadComponent: () => import('./tenants/tenant-detail.page').then((m) => m.TenantDetailPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
