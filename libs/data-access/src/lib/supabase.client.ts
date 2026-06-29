import { Inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RUNTIME_CONFIG, RuntimeConfig } from './app-config';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly client: SupabaseClient;
  readonly configured: boolean;

  constructor(@Inject(RUNTIME_CONFIG) config: RuntimeConfig) {
    this.configured = Boolean(config.supabaseUrl && config.supabasePublishableKey);
    this.client = createClient(config.supabaseUrl || 'https://placeholder.supabase.co', config.supabasePublishableKey || 'placeholder', {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
  }
}
