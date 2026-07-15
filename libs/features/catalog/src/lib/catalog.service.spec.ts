import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { CatalogService } from './catalog.service';
import { Product, Category, demoCategories, demoProducts } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

const mockSupabase = {
  configured: false,
  client: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) })
    })
  }
} as unknown as SupabaseClientService;

const mockTenantService = {
  tenant: signal({ id: 'tenant-1' } as any).asReadonly()
} as unknown as TenantService;

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    service = new CatalogService();
    (service as any).supabase = mockSupabase;
    (service as any).tenantService = mockTenantService;
  });

  it('starts with demo categories and products', () => {
    expect(service.categories()).toEqual(demoCategories);
    expect(service.products()).toEqual(demoProducts);
  });

  it('filters products by search term', () => {
    service.setFilters({ search: demoProducts[0].name.slice(0, 3) });
    expect(service.filteredProducts().length).toBeGreaterThan(0);
    expect(service.filteredProducts().every((p) =>
      p.name.toLowerCase().includes(demoProducts[0].name.slice(0, 3).toLowerCase()) ||
      p.description.toLowerCase().includes(demoProducts[0].name.slice(0, 3).toLowerCase())
    )).toBe(true);
  });

  it('filters products by category', () => {
    const categoryId = demoProducts[0].categoryId;
    service.setFilters({ categoryId });
    expect(service.filteredProducts().every((p) => p.categoryId === categoryId)).toBe(true);
  });

  it('filters products by price range', () => {
    const minPrice = 0;
    const maxPrice = 100;
    service.setFilters({ minPrice, maxPrice });
    expect(service.filteredProducts().every((p) => p.price >= minPrice && p.price <= maxPrice)).toBe(true);
  });

  it('updates product in state', () => {
    const product = { ...demoProducts[0], name: 'Updated' };
    service.updateProductInState(product);
    expect(service.products().find((p) => p.id === product.id)?.name).toBe('Updated');
  });

  it('adds product to state', () => {
    const initialCount = service.products().length;
    const product: Product = {
      id: 'new-product',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      categoryId: 'cat-1',
      sku: 'NEW-001',
      name: 'New Product',
      description: 'New',
      imageUrl: '',
      price: 10,
      stock: 5,
      unit: 'unidad',
      status: 'active',
      tags: []
    };
    service.addProductToState(product);
    expect(service.products().length).toBe(initialCount + 1);
  });
});
