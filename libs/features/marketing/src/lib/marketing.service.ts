import { Injectable, inject, signal } from '@angular/core';
import { Promotion, LoyaltyTier, CustomerSegment, demoPromotions, demoLoyaltyTiers, demoSegments } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

@Injectable({ providedIn: 'root' })
export class MarketingService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _promotions = signal<Promotion[]>(demoPromotions);
  private readonly _loyaltyTiers = signal<LoyaltyTier[]>(demoLoyaltyTiers);
  private readonly _segments = signal<CustomerSegment[]>(demoSegments);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly promotions = this._promotions.asReadonly();
  readonly loyaltyTiers = this._loyaltyTiers.asReadonly();
  readonly segments = this._segments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadPromotions(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando promociones');
      this._loading.set(false);
      return;
    }

    this._promotions.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code ?? '',
      title: row.title,
      description: row.description,
      type: row.type,
      value: row.value,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      active: row.active,
      targetCategoryIds: row.target_category_ids
    })));
    this._loading.set(false);
  }

  async loadLoyaltyTiers(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('loyalty_tiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando niveles de lealtad');
      this._loading.set(false);
      return;
    }

    this._loyaltyTiers.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      minimumSpend: row.minimum_spend,
      pointsMultiplier: row.points_multiplier,
      perks: row.perks
    })));
    this._loading.set(false);
  }

  async loadSegments(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('customer_segments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando segmentos');
      this._loading.set(false);
      return;
    }

    this._segments.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      criteria: row.criteria,
      customerCount: row.customer_count,
      active: row.active
    })));
    this._loading.set(false);
  }
}
