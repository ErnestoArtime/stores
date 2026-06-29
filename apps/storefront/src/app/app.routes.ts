import { Routes } from '@angular/router';
import { storefrontAuthGuard } from '@stores/data-access';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'checkout',
    canActivate: [storefrontAuthGuard],
    loadComponent: () => import('./checkout/checkout.page').then((m) => m.CheckoutPage)
  },
  {
    path: 'track/:code',
    loadComponent: () => import('./tracking/tracking.page').then((m) => m.TrackingPage)
  },
  {
    path: '',
    loadComponent: () => import('./home.page').then((m) => m.HomePage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
