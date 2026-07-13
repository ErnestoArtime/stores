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

  readonly promotions = this._promotions.asReadonly();
  readonly loyaltyTiers = this._loyaltyTiers.asReadonly();
  readonly segments = this._segments.asReadonly();

  async loadPromotions(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      return;
    }

    this._promotions.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      title: row.title,
      description: row.description || '',
      type: row.type,
      value: row.value,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      active: row.active,
      targetCategoryIds: row.target_category_ids || []
    })));
  }
}
