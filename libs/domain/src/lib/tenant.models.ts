export type TenantPlan = 'starter' | 'growth' | 'enterprise';
export type StaffRole = 'owner' | 'manager' | 'catalog' | 'dispatch' | 'viewer';

export interface TenantBranding {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  heroImageUrl: string;
}

export interface TenantFeatures {
  delivery: boolean;
  loyalty: boolean;
  promotions: boolean;
  import: boolean;
  dispatch: boolean;
  analytics: boolean;
}

export interface TenantLimits {
  maxProducts: number;
  maxStores: number;
  maxOrdersPerMonth: number;
  maxStaff: number;
}

export interface BusinessHours {
  open: string;
  close: string;
  days: number[];
}

export type NotificationChannel = 'whatsapp' | 'email' | 'push' | 'telegram';

export interface TenantSettings {
  businessHours: BusinessHours;
  deliveryWindowOptions: string[];
  paymentMethods: string[];
  notificationChannels: NotificationChannel[];
}

export interface TenantBilling {
  plan: TenantPlan;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd?: string;
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
  features: TenantFeatures;
  limits: TenantLimits;
  settings: TenantSettings;
  billing: TenantBilling;
}

export interface StaffProfile {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: StaffRole;
  active: boolean;
  isSuperadmin?: boolean;
}
