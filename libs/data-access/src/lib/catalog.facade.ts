import { Injectable, inject, signal } from '@angular/core';
import {
  demoCategories,
  demoCouriers,
  demoDeliveryZones,
  demoLoyaltyTiers,
  demoOrders,
  demoProducts,
  demoPromotions,
  demoRoutes,
  demoSegments,
  demoStores,
  demoSummary,
  demoTenant,
  Category,
  DeliveryZone,
  Order,
  Product,
  Promotion,
  StoreLocation
} from '@stores/domain';
import { RUNTIME_CONFIG } from './app-config';
import { SupabaseClientService } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private readonly config = inject(RUNTIME_CONFIG);
  private readonly supabase = inject(SupabaseClientService);

  private readonly _tenant = signal(demoTenant);
  private readonly _stores = signal<StoreLocation[]>(demoStores);
  private readonly _categories = signal<Category[]>(demoCategories);
  private readonly _products = signal<Product[]>(demoProducts);
  private readonly _orders = signal<Order[]>(demoOrders);
  private readonly _deliveryZones = signal<DeliveryZone[]>(demoDeliveryZones);
  private readonly _promotions = signal<Promotion[]>(demoPromotions);

  readonly tenant = this._tenant.asReadonly();
  readonly stores = this._stores.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly products = this._products.asReadonly();
  readonly orders = this._orders.asReadonly();
  readonly summary = demoSummary;
  readonly deliveryZones = this._deliveryZones.asReadonly();
  readonly promotions = this._promotions.asReadonly();
  readonly couriers = demoCouriers;
  readonly routes = demoRoutes;
  readonly loyaltyTiers = demoLoyaltyTiers;
  readonly segments = demoSegments;

  async loadTenantBySlug(slug?: string): Promise<void> {
    const tenantSlug = slug || this.config.tenantSlug;
    if (!this.supabase.configured) {
      return;
    }

    const { data, error } = await this.supabase.client
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();

    if (error || !data) {
      return;
    }

    this._tenant.set({
      id: data.id,
      slug: data.slug,
      name: data.name,
      legalName: data.legal_name,
      plan: data.plan,
      currency: data.currency,
      supportPhone: data.support_phone,
      supportWhatsapp: data.support_whatsapp,
      branding: {
        primaryColor: data.branding?.primary_color || '#0f766e',
        accentColor: data.branding?.accent_color || '#f59e0b',
        logoUrl: data.branding?.logo_url,
        heroImageUrl: data.branding?.hero_image_url || ''
      }
    });
  }

  async loadStores(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this._tenant().id;
    const { data, error } = await this.supabase.client
      .from('store_locations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) {
      return;
    }

    this._stores.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      type: row.type || 'mixed',
      address: row.address,
      city: row.city || '',
      municipality: row.municipality,
      phone: row.phone || '',
      openNow: row.open_now,
      deliveryMinutes: row.delivery_minutes,
      rating: row.rating,
      coverUrl: row.cover_url || '',
      fulfillment: row.fulfillment || ['delivery']
    })));
  }

  async loadCategories(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this._tenant().id;
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

    const tenantId = this._tenant().id;
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

  async loadPromotions(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this._tenant().id;
    const { data, error } = await this.supabase.client
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error || !data) {
      return;
    }

    this._promotions.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      title: row.title,
      description: row.description || '',
      type: row.type,
      value: row.value,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      active: row.active,
      targetCategoryIds: row.target_category_ids || []
    })));
  }

  async loadDeliveryZones(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this._tenant().id;
    const { data, error } = await this.supabase.client
      .from('delivery_zones')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) {
      return;
    }

    this._deliveryZones.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      fee: row.fee,
      etaMinutes: row.eta_minutes,
      municipalities: row.municipalities || []
    })));
  }

  async loadOrdersForAdmin(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this._tenant().id;
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return;
    }

    this._orders.set(data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id || '',
      code: row.code,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      deliveryAddress: row.delivery_address,
      deliveryZone: row.delivery_zone,
      deliveryWindow: row.delivery_window,
      status: row.status,
      paymentMethod: row.payment_method,
      subtotal: row.subtotal,
      deliveryFee: row.delivery_fee,
      discount: row.discount,
      total: row.total,
      notes: row.notes || '',
      placedAt: row.created_at,
      lines: []
    })));
  }

  async loadAllForTenant(): Promise<void> {
    await this.loadTenantBySlug();
    await Promise.all([
      this.loadStores(),
      this.loadCategories(),
      this.loadProducts(),
      this.loadPromotions(),
      this.loadDeliveryZones()
    ]);
  }

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

    return {
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

    return {
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

    this._products.update((items) =>
      items.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
    return true;
  }

  async archiveProduct(id: string): Promise<boolean> {
    return this.updateProduct(id, { status: 'archived' }).then((r) => r !== null);
  }

  previewProductCsv(csv: string) {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const issues: { row: number; field: string; message: string }[] = [];
    const products = lines.slice(1).map((line, index) => {
      const row = index + 2;
      const [sku = '', name = '', price = '', stock = '', unit = 'unidad'] = line.split(',').map((value) => value.trim());
      const numericPrice = Number(price);
      const numericStock = Number(stock);

      if (!sku) issues.push({ row, field: 'sku', message: 'SKU requerido' });
      if (!name) issues.push({ row, field: 'name', message: 'Nombre requerido' });
      if (!Number.isFinite(numericPrice) || numericPrice < 0) issues.push({ row, field: 'price', message: 'Precio invalido' });
      if (!Number.isInteger(numericStock) || numericStock < 0) issues.push({ row, field: 'stock', message: 'Stock invalido' });

      return {
        sku,
        name,
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        stock: Number.isInteger(numericStock) ? numericStock : 0,
        unit
      };
    });

    return {
      validRows: Math.max(products.length - issues.length, 0),
      issues,
      products
    };
  }

  buildWhatsappOrderUrl(orderId: string) {
    const order = this._orders().find((item) => item.id === orderId);
    const phone = this._tenant().supportWhatsapp.replace(/\D/g, '');
    const text = order
      ? `Hola, quiero consultar el pedido ${order.code} por ${order.total} ${this._tenant().currency}.`
      : 'Hola, necesito ayuda con mi pedido.';

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
}
