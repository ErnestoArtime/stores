import { Routes } from '@angular/router';
import { adminGuard, guestGuard, featureGuard, onboardingGuard } from '@stores/data-access';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadComponent: () => import('./onboarding/onboarding.page').then((m) => m.OnboardingPage)
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () => import('./dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'catalog/products',
    canActivate: [adminGuard],
    loadComponent: () => import('./catalog/products.page').then((m) => m.ProductsPage)
  },
  {
    path: 'catalog/products/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./catalog/product-form.page').then((m) => m.ProductFormPage)
  },
  {
    path: 'catalog/products/:id/edit',
    canActivate: [adminGuard],
    loadComponent: () => import('./catalog/product-form.page').then((m) => m.ProductFormPage)
  },
  {
    path: 'catalog/categories',
    canActivate: [adminGuard],
    loadComponent: () => import('./catalog/categories.page').then((m) => m.CategoriesPage)
  },
  {
    path: 'stores',
    canActivate: [adminGuard],
    loadComponent: () => import('./stores/stores.page').then((m) => m.StoresPage)
  },
  {
    path: 'inventory',
    canActivate: [adminGuard],
    loadComponent: () => import('./inventory/inventory.page').then((m) => m.InventoryPage)
  },
  {
    path: 'dispatch',
    canActivate: [adminGuard, featureGuard('dispatch')],
    loadComponent: () => import('./dispatch/dispatch.page').then((m) => m.DispatchPage)
  },
  {
    path: 'customers',
    canActivate: [adminGuard, featureGuard(['promotions', 'loyalty'])],
    loadComponent: () => import('./customers/customers.page').then((m) => m.CustomersPage)
  },
  {
    path: 'settings',
    canActivate: [adminGuard],
    loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
