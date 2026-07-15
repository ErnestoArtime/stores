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
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly deliveryZones = this._deliveryZones.asReadonly();
  readonly couriers = this._couriers.asReadonly();
  readonly routes = this._routes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadDeliveryZones(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('delivery_zones')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando zonas');
      this._loading.set(false);
      return;
    }

    this._deliveryZones.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      fee: row.fee,
      etaMinutes: row.eta_minutes,
      municipalities: row.municipalities
    })));
    this._loading.set(false);
  }

  async loadCouriers(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('couriers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando couriers');
      this._loading.set(false);
      return;
    }

    this._couriers.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      fullName: row.full_name,
      phone: row.phone,
      active: row.active,
      currentZone: row.current_zone ?? '',
      openOrders: 0
    })));
    this._loading.set(false);
  }

  async loadRoutes(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('delivery_routes')
      .select('*, delivery_route_stops(*)')
      .eq('tenant_id', tenantId)
      .order('started_at', { ascending: false });

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando rutas');
      this._loading.set(false);
      return;
    }

    this._routes.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      courierId: row.courier_id,
      zoneName: row.zone_name,
      startedAt: row.started_at ?? undefined,
      stops: [] // TODO: map delivery_route_stops when needed
    })));
    this._loading.set(false);
  }
}
