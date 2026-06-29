import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  production: boolean;
  tenantSlug: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');
