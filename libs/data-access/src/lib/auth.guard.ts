import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StaffRole } from '@stores/domain';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.waitUntilReady().then(() => {
    if (auth.isAuthenticated()) {
      return true;
    }

    return router.createUrlTree(['/login']);
  });
};

export const storefrontAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.waitUntilReady().then(() => {
    if (auth.isAuthenticated()) {
      return true;
    }

    return router.createUrlTree(['/login']);
  });
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.waitUntilReady().then(() => {
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (auth.isStaff()) {
      return true;
    }

    return router.createUrlTree(['/login']);
  });
};

export const roleGuard = (...roles: StaffRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.waitUntilReady().then(() => {
      if (!auth.isAuthenticated()) {
        return router.createUrlTree(['/login']);
      }

      if (auth.hasRole(...roles)) {
        return true;
      }

      return router.createUrlTree(['/dashboard']);
    });
  };
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.waitUntilReady().then(() => {
    if (!auth.isAuthenticated()) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  });
};
