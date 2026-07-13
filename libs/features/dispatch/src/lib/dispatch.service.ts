import { Injectable, inject, signal } from '@angular/core';
import { DeliveryZone, Courier, DeliveryRoute, demoDeliveryZones, demoCouriers, demoRoutes } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _deliveryZones = signal<DeliveryZone[]>(demoDeliveryZones);
  private readonly _couriers = signal<Courier[]>(demoCouriers);
  private readonly _routes = signal<DeliveryRoute[]>(demoRoutes);

  readonly deliveryZones = this._deliveryZones.asReadonly();
  readonly couriers = this._couriers.asReadonly();
  readonly routes = this._routes.asReadonly();

  async loadDeliveryZones(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('delivery_zones')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) {
      return;
    }

    this._deliveryZones.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      fee: row.fee,
      etaMinutes: row.eta_minutes,
      municipalities: row.municipalities || []
    })));
  }
}
