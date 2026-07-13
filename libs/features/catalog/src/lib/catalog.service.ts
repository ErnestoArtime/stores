import { Injectable, inject, signal } from '@angular/core';
import { Category, Product, demoCategories, demoProducts } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _categories = signal<Category[]>(demoCategories);
  private readonly _products = signal<Product[]>(demoProducts);

  readonly categories = this._categories.asReadonly();
  readonly products = this._products.asReadonly();

  async loadCategories(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order');

    if (error || !data) {
      return;
    }

    this._categories.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      icon: row.icon,
      featured: row.featured || false
    })));
  }

  async loadProducts(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (error || !data) {
      return;
    }

    this._products.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      categoryId: row.category_id,
      name: row.name,
      sku: row.sku,
      description: row.description || '',
      price: row.price,
      stock: row.stock,
      unit: row.unit,
      imageUrl: row.image_url || '',
      status: row.status,
      tags: row.tags || []
    })));
  }

  updateProductInState(product: Product): void {
    this._products.update((items) =>
      items.map((p) => (p.id === product.id ? product : p))
    );
  }

  addProductToState(product: Product): void {
    this._products.update((items) => [...items, product]);
  }
}
