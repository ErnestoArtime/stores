import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Tenant, TenantFeatures, TenantLimits, TenantSettings, TenantBilling, TenantPlan, demoTenant } from '@stores/domain';
import { RUNTIME_CONFIG } from '@stores/data-access';
import { SupabaseClientService } from '@stores/data-access';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly config = inject(RUNTIME_CONFIG);
  private readonly supabase = inject(SupabaseClientService);
  private readonly document = inject(DOCUMENT);

  private readonly _tenant = signal<Tenant>(demoTenant);
  readonly tenant = this._tenant.asReadonly();

  constructor() {
    this.applyBranding(demoTenant.branding);
  }

  async loadTenantBySlug(slug?: string): Promise<void> {
    const tenantSlug = slug || this.config.tenantSlug;
    if (!this.supabase.configured) {
      return;
    }

    const { data, error } = await this.supabase.client
      .from('tenants')
      .select('*, tenant_billing(*)')
      .eq('slug', tenantSlug)
      .single();

    if (error || !data) {
      return;
    }

    const billingRow = data.tenant_billing as unknown as { plan: string; status: string; current_period_end: string | null } | undefined;

    const branding = {
      primaryColor: data.primary_color,
      accentColor: data.accent_color,
      logoUrl: data.logo_url ?? undefined,
      heroImageUrl: data.hero_image_url ?? ''
    };

    this._tenant.set({
      id: data.id,
      slug: data.slug,
      name: data.name,
      legalName: data.legal_name,
      plan: data.plan as Tenant['plan'],
      currency: data.currency as Tenant['currency'],
      supportPhone: data.support_phone ?? '',
      supportWhatsapp: data.support_whatsapp ?? '',
      branding,
      features: this.parseFeatures(data.features),
      limits: this.parseLimits(data.limits),
      settings: this.parseSettings(data.settings),
      billing: this.parseBilling(billingRow, data.plan)
    });

    this.applyBranding(branding);
  }

  private applyBranding(branding: Tenant['branding']): void {
    const root = this.document.documentElement;
    root.style.setProperty('--tenant-primary', branding.primaryColor);
    root.style.setProperty('--tenant-accent', branding.accentColor);
    root.style.setProperty('--ion-color-primary', branding.primaryColor);
    root.style.setProperty('--ion-color-primary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-primary-tint', branding.primaryColor);
    root.style.setProperty('--ion-color-primary-shade', branding.primaryColor);
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

  private parseSettings(raw?: unknown): TenantSettings {
    const defaults: TenantSettings = {
      businessHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6] },
      deliveryWindowOptions: ['Hoy 12:00 - 14:00', 'Hoy 18:00 - 20:00', 'Manana 09:00 - 12:00'],
      paymentMethods: ['cash', 'transfer', 'pos'],
      notificationChannels: ['whatsapp']
    };
    if (!raw || typeof raw !== 'object') return defaults;
    const s = raw as Record<string, unknown>;
    return {
      businessHours: (s['business_hours'] as TenantSettings['businessHours']) ?? defaults.businessHours,
      deliveryWindowOptions: (s['delivery_window_options'] as string[]) ?? defaults.deliveryWindowOptions,
      paymentMethods: (s['payment_methods'] as string[]) ?? defaults.paymentMethods,
      notificationChannels: (s['notification_channels'] as TenantSettings['notificationChannels']) ?? defaults.notificationChannels
    };
  }

  private parseBilling(raw?: unknown, plan?: string): TenantBilling {
    const defaults: TenantBilling = {
      plan: (plan as TenantPlan) || 'starter',
      status: 'active'
    };
    if (!raw || typeof raw !== 'object') return defaults;
    const b = raw as Record<string, unknown>;
    return {
      plan: (b['plan'] as TenantBilling['plan']) ?? defaults.plan,
      status: (b['status'] as TenantBilling['status']) ?? defaults.status,
      currentPeriodEnd: b['current_period_end'] as string | undefined
    };
  }
}
