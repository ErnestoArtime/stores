import { Injectable, inject, signal } from '@angular/core';
import { Tenant, TenantFeatures, TenantLimits, TenantBilling } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';

export interface TenantRow extends Tenant {}

interface TenantDbRow {
  id: string;
  slug: string;
  name: string;
  legal_name: string;
  plan: Tenant['plan'];
  currency: Tenant['currency'];
  support_phone: string;
  support_whatsapp: string;
  branding: Tenant['branding'];
  features: TenantFeatures;
  limits: TenantLimits;
  settings: Tenant['settings'];
  tenant_billing: { status: TenantBilling['status'] } | null;
}

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

    const rows = data as unknown as TenantDbRow[];

    this._tenants.set(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        legalName: row.legal_name,
        plan: row.plan,
        currency: row.currency,
        supportPhone: row.support_phone,
        supportWhatsapp: row.support_whatsapp,
        branding: row.branding,
        features: row.features,
        limits: row.limits,
        settings: row.settings,
        billing: { plan: row.plan, status: row.tenant_billing?.status || 'active' }
      }))
    );
  }

  async updateTenant(
    tenantId: string,
    updates: { plan?: Tenant['plan']; features?: TenantFeatures; limits?: TenantLimits; status?: TenantBilling['status'] }
  ): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const { error: tenantError } = await this.supabase.client
      .from('tenants')
      .update({
        plan: updates.plan,
        features: updates.features,
        limits: updates.limits
      })
      .eq('id', tenantId);

    if (tenantError) {
      throw new Error(tenantError.message);
    }

    if (updates.plan || updates.status) {
      const { error: billingError } = await this.supabase.client
        .from('tenant_billing')
        .update({
          plan: updates.plan,
          status: updates.status
        })
        .eq('tenant_id', tenantId);

      if (billingError) {
        throw new Error(billingError.message);
      }
    }
  }
}
