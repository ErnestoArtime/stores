import { Injectable, inject, signal } from '@angular/core';
import { StoreLocation, demoStores } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from './tenant.service';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _stores = signal<StoreLocation[]>(demoStores);
  readonly stores = this._stores.asReadonly();

  async loadStores(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('store_locations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) {
      return;
    }

    this._stores.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type || 'mixed',
      address: row.address,
      city: row.city || '',
      municipality: row.municipality,
      phone: row.phone || '',
      openNow: row.open_now,
      deliveryMinutes: row.delivery_minutes,
      rating: row.rating,
      coverUrl: row.cover_url || '',
      fulfillment: row.fulfillment || ['delivery']
    })));
  }
}
