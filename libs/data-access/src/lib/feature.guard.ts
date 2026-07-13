import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TenantFeatures } from '@stores/domain';
import { CatalogFacade } from './catalog.facade';

export function featureGuard<K extends keyof TenantFeatures>(featureKeys: K | K[]): CanActivateFn {
  return () => {
    const facade = inject(CatalogFacade);
    const router = inject(Router);
    const keys: K[] = Array.isArray(featureKeys) ? featureKeys : [featureKeys];
    const enabled = keys.some((key) => facade.features()[key]);

    if (!enabled) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };
}
