import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@stores/data-access';

export interface OnboardingPayload {
  name: string;
  legalName: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  currency: 'CUP' | 'USD' | 'MLC';
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly supabase = inject(SupabaseClientService);

  async createTenant(data: OnboardingPayload): Promise<string | null> {
    if (!this.supabase.configured) {
      throw new Error('Supabase no esta configurado. No se puede crear el tenant.');
    }

    const { data: tenantId, error } = await this.supabase.client.rpc('create_new_tenant', {
      p_name: data.name,
      p_legal_name: data.legalName,
      p_slug: data.slug,
      p_plan: data.plan,
      p_currency: data.currency
    });

    if (error) {
      throw new Error(error.message);
    }

    return tenantId;
  }
}
