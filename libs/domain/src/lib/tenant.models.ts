export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type StaffRole = 'owner' | 'manager' | 'catalog' | 'dispatch' | 'viewer';

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  heroImageUrl: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  plan: TenantPlan;
  currency: 'CUP' | 'USD' | 'MLC';
  supportPhone: string;
  supportWhatsapp: string;
  branding: TenantBranding;
}

export interface StaffProfile {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: StaffRole;
  active: boolean;
}
