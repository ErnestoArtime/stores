import { Injectable, inject, signal, computed } from '@angular/core';
import { Category, Product, demoCategories, demoProducts } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

export interface CatalogFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _categories = signal<Category[]>(demoCategories);
  private readonly _products = signal<Product[]>(demoProducts);
  private readonly _filters = signal<CatalogFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly products = this._products.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredProducts = computed(() => {
    const f = this._filters();
    const term = f.search?.trim().toLowerCase();
    return this._products().filter((p) => {
      if (p.status !== 'active') return false;
      if (term && !p.name.toLowerCase().includes(term) && !p.description.toLowerCase().includes(term)) return false;
      if (f.categoryId && p.categoryId !== f.categoryId) return false;
      if (f.minPrice !== undefined && p.price < f.minPrice) return false;
      if (f.maxPrice !== undefined && p.price > f.maxPrice) return false;
      if (f.tags && f.tags.length > 0 && !f.tags.some((t) => p.tags.includes(t))) return false;
      return true;
    });
  });

  readonly featuredProducts = computed(() =>
    this._products().filter((p) => p.status === 'active' && p.tags.includes('destacado'))
  );

  async loadCategories(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order');

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando categorias');
      this._loading.set(false);
      return;
    }

    this._categories.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      icon: row.icon,
      featured: row.featured
    })));
    this._loading.set(false);
  }

  async loadProducts(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando productos');
      this._loading.set(false);
      return;
    }

    this._products.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      categoryId: row.category_id,
      name: row.name,
      sku: row.sku,
      description: row.description,
      price: row.price,
      stock: row.stock,
      unit: row.unit,
      imageUrl: row.image_url ?? '',
      status: row.status,
      tags: row.tags
    })));
    this._loading.set(false);
  }

  setFilters(filters: CatalogFilters): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
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
