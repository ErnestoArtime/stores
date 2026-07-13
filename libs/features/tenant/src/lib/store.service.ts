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

  async createStore(store: Omit<StoreLocation, 'id'>): Promise<StoreLocation | null> {
    if (!this.supabase.configured) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('store_locations')
      .insert({
        tenant_id: store.tenantId,
        name: store.name,
        type: store.type,
        address: store.address,
        city: store.city,
        municipality: store.municipality,
        phone: store.phone,
        open_now: store.openNow,
        delivery_minutes: store.deliveryMinutes,
        rating: store.rating,
        cover_url: store.coverUrl,
        fulfillment: store.fulfillment
      })
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    const created: StoreLocation = {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      type: data.type || 'mixed',
      address: data.address,
      city: data.city || '',
      municipality: data.municipality,
      phone: data.phone || '',
      openNow: data.open_now,
      deliveryMinutes: data.delivery_minutes,
      rating: data.rating,
      coverUrl: data.cover_url || '',
      fulfillment: data.fulfillment || ['delivery']
    };

    this._stores.update((stores) => [...stores, created]);
    return created;
  }
}
