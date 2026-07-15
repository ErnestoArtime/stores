import { Injectable, inject, signal } from '@angular/core';
import { Tenant, TenantFeatures, TenantLimits, TenantBilling } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';

export interface TenantRow extends Tenant {}

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private readonly supabase = inject(SupabaseClientService);

  private readonly _tenants = signal<TenantRow[]>([]);
  readonly tenants = this._tenants.asReadonly();

  async loadTenants(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const { data, error } = await this.supabase.client
      .from('tenants')
      .select('*, tenant_billing(status)')
      .order('name');

    if (error || !data) {
      return;
    }

    this._tenants.set(
      data.map((row) => {
        const billing = row.tenant_billing as unknown as { status: TenantBilling['status'] } | null;
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          legalName: row.legal_name,
          plan: row.plan as Tenant['plan'],
          currency: row.currency as Tenant['currency'],
          supportPhone: row.support_phone ?? '',
          supportWhatsapp: row.support_whatsapp ?? '',
          branding: {
            primaryColor: row.primary_color,
            accentColor: row.accent_color,
            logoUrl: row.logo_url ?? undefined,
            heroImageUrl: row.hero_image_url ?? ''
          },
          features: this.parseFeatures(row.features),
          limits: this.parseLimits(row.limits),
          settings: this.parseSettings(row.settings),
          billing: { plan: row.plan as Tenant['plan'], status: billing?.status || 'active' }
        };
      })
    );
  }

  async updateTenant(
    tenantId: string,
    updates: { plan?: Tenant['plan']; features?: TenantFeatures; limits?: TenantLimits; status?: TenantBilling['status'] }
  ): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantUpdate: { plan?: string; features?: unknown; limits?: unknown } = {};
    if (updates.plan !== undefined) tenantUpdate.plan = updates.plan;
    if (updates.features !== undefined) tenantUpdate.features = updates.features as unknown;
    if (updates.limits !== undefined) tenantUpdate.limits = updates.limits as unknown;

    const { error: tenantError } = await this.supabase.client
      .from('tenants')
      .update(tenantUpdate as never)
      .eq('id', tenantId);

    if (tenantError) {
      throw new Error(tenantError.message);
    }

    if (updates.plan || updates.status) {
      const billingUpdate: { plan?: string; status?: string } = {};
      if (updates.plan !== undefined) billingUpdate.plan = updates.plan;
      if (updates.status !== undefined) billingUpdate.status = updates.status;

      const { error: billingError } = await this.supabase.client
        .from('tenant_billing')
        .update(billingUpdate)
        .eq('tenant_id', tenantId);

      if (billingError) {
        throw new Error(billingError.message);
      }
    }
  }

  private parseFeatures(raw?: unknown): TenantFeatures {
    const defaults: TenantFeatures = {
      delivery: true,
      loyalty: true,
      promotions: true,
      import: true,
      dispatch: true,
      analytics: true
    };
    if (!raw || typeof raw !== 'object') return defaults;
    const f = raw as Record<string, boolean>;
    return {
      delivery: f['delivery'] ?? defaults.delivery,
      loyalty: f['loyalty'] ?? defaults.loyalty,
      promotions: f['promotions'] ?? defaults.promotions,
      import: f['import'] ?? defaults.import,
      dispatch: f['dispatch'] ?? defaults.dispatch,
      analytics: f['analytics'] ?? defaults.analytics
    };
  }

  private parseLimits(raw?: unknown): TenantLimits {
    const defaults: TenantLimits = {
      maxProducts: 1000,
      maxStores: 10,
      maxOrdersPerMonth: 5000,
      maxStaff: 20
    };
    if (!raw || typeof raw !== 'object') return defaults;
    const l = raw as Record<string, number>;
    return {
      maxProducts: l['max_products'] ?? defaults.maxProducts,
      maxStores: l['max_stores'] ?? defaults.maxStores,
      maxOrdersPerMonth: l['max_orders_per_month'] ?? defaults.maxOrdersPerMonth,
      maxStaff: l['max_staff'] ?? defaults.maxStaff
    };
  }

  private parseSettings(raw?: unknown): Tenant['settings'] {
    const defaults: Tenant['settings'] = {
      businessHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6] },
      deliveryWindowOptions: ['Hoy 12:00 - 14:00', 'Hoy 18:00 - 20:00', 'Manana 09:00 - 12:00'],
      paymentMethods: ['cash', 'transfer', 'pos'],
      notificationChannels: ['whatsapp']
    };
    if (!raw || typeof raw !== 'object') return defaults;
    const s = raw as Record<string, unknown>;
    return {
      businessHours: (s['business_hours'] as Tenant['settings']['businessHours']) ?? defaults.businessHours,
      deliveryWindowOptions: (s['delivery_window_options'] as string[]) ?? defaults.deliveryWindowOptions,
      paymentMethods: (s['payment_methods'] as string[]) ?? defaults.paymentMethods,
      notificationChannels: (s['notification_channels'] as Tenant['settings']['notificationChannels']) ?? defaults.notificationChannels
    };
  }
}
