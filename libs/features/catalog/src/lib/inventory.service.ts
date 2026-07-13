import { Injectable, inject } from '@angular/core';
import { Product } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { CatalogService } from './catalog.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly catalog = inject(CatalogService);

  async createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    if (!this.supabase.configured) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('products')
      .insert({
        tenant_id: product.tenantId,
        store_id: product.storeId,
        category_id: product.categoryId,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        image_url: product.imageUrl,
        status: product.status,
        tags: product.tags
      })
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    const created: Product = {
      id: data.id,
      tenantId: data.tenant_id,
      storeId: data.store_id,
      categoryId: data.category_id,
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      price: data.price,
      stock: data.stock,
      unit: data.unit,
      imageUrl: data.image_url || '',
      status: data.status,
      tags: data.tags || []
    };

    this.catalog.addProductToState(created);
    return created;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!this.supabase.configured) {
      return null;
    }

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload['name'] = updates.name;
    if (updates.sku !== undefined) payload['sku'] = updates.sku;
    if (updates.description !== undefined) payload['description'] = updates.description;
    if (updates.price !== undefined) payload['price'] = updates.price;
    if (updates.stock !== undefined) payload['stock'] = updates.stock;
    if (updates.unit !== undefined) payload['unit'] = updates.unit;
    if (updates.imageUrl !== undefined) payload['image_url'] = updates.imageUrl;
    if (updates.status !== undefined) payload['status'] = updates.status;
    if (updates.tags !== undefined) payload['tags'] = updates.tags;
    if (updates.categoryId !== undefined) payload['category_id'] = updates.categoryId;
    if (updates.storeId !== undefined) payload['store_id'] = updates.storeId;

    const { data, error } = await this.supabase.client
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    const updated: Product = {
      id: data.id,
      tenantId: data.tenant_id,
      storeId: data.store_id,
      categoryId: data.category_id,
      name: data.name,
      sku: data.sku,
      description: data.description || '',
      price: data.price,
      stock: data.stock,
      unit: data.unit,
      imageUrl: data.image_url || '',
      status: data.status,
      tags: data.tags || []
    };

    this.catalog.updateProductInState(updated);
    return updated;
  }

  async updateStock(id: string, newStock: number): Promise<boolean> {
    if (!this.supabase.configured) {
      return false;
    }

    const { error } = await this.supabase.client
      .from('products')
      .update({ stock: newStock })
      .eq('id', id);

    if (error) {
      return false;
    }

    const existing = this.catalog.products().find((p) => p.id === id);
    if (existing) {
      this.catalog.updateProductInState({ ...existing, stock: newStock });
    }
    return true;
  }

  async archiveProduct(id: string): Promise<boolean> {
    const result = await this.updateProduct(id, { status: 'archived' as Product['status'] });
    return result !== null;
  }
}
