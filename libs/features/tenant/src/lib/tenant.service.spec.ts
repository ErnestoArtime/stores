import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { TenantService } from './tenant.service';
import { demoTenant } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';

const mockSupabase = {
  configured: false,
  client: {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
    })
  }
} as unknown as SupabaseClientService;

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    service = new TenantService();
    (service as any).supabase = mockSupabase;
  });

  it('starts with demo tenant', () => {
    expect(service.tenant().id).toBe(demoTenant.id);
    expect(service.tenant().name).toBe(demoTenant.name);
  });

  it('parses features with defaults', () => {
    const features = (service as any).parseFeatures(null);
    expect(features.delivery).toBe(true);
    expect(features.analytics).toBe(true);
  });

  it('parses features from object', () => {
    const features = (service as any).parseFeatures({ delivery: false, loyalty: true });
    expect(features.delivery).toBe(false);
    expect(features.loyalty).toBe(true);
  });

  it('parses limits with defaults', () => {
    const limits = (service as any).parseLimits(null);
    expect(limits.maxProducts).toBe(1000);
    expect(limits.maxStaff).toBe(20);
  });

  it('parses limits from object', () => {
    const limits = (service as any).parseLimits({ max_products: 500, max_staff: 5 });
    expect(limits.maxProducts).toBe(500);
    expect(limits.maxStaff).toBe(5);
  });
});
