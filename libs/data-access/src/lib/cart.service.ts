import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Product } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';
import { AuthService } from './auth.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface PersistedCartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  unit: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'stores_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly auth = inject(AuthService);

  private readonly _items = signal<CartItem[]>(this.loadFromStorage());
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user && this.supabase.configured) {
        this.loadCartFromServer(user.id).catch(() => {});
      }
    });
  }

  private loadFromStorage(): CartItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      // Storage may be disabled or full; cart still works in memory.
    }
  }

  private async loadCartFromServer(userId: string): Promise<void> {
    if (!this.supabase.configured) return;

    this._loading.set(true);
    const { data, error } = await this.supabase.client
      .from('carts')
      .select('items')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      this._loading.set(false);
      return;
    }

    const items = (data.items as unknown as PersistedCartItem[]) || [];
    // We cannot fully reconstruct Product objects without catalog data,
    // so we keep localStorage as source of truth for product details.
    // Server cart is used to merge quantities for known products.
    const localItems = this._items();
    const merged = [...localItems];

    for (const serverItem of items) {
      const existing = merged.find((i) => i.product.id === serverItem.productId);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, serverItem.quantity);
      }
    }

    this._items.set(merged);
    this.persist();
    this._loading.set(false);
  }

  private async saveCartToServer(): Promise<void> {
    if (!this.supabase.configured) return;
    const user = this.auth.user();
    if (!user) return;

    const tenantId = 'demo-tenant'; // Replace with actual tenant resolution in real app
    const items: PersistedCartItem[] = this._items().map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      unit: item.product.unit,
      quantity: item.quantity
    }));

    await this.supabase.client.from('carts').upsert(
      {
        user_id: user.id,
        tenant_id: tenantId,
        items: items as unknown as never,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,tenant_id' }
    );
  }

  add(product: Product, quantity = 1): void {
    if (quantity <= 0) return;
    this._items.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...items, { product, quantity }];
    });
    this.persist();
    this.saveCartToServer().catch(() => {});
  }

  remove(productId: string): void {
    const before = this._items().length;
    this._items.update((items) => items.filter((i) => i.product.id !== productId));
    if (this._items().length !== before) {
      this.persist();
      this.saveCartToServer().catch(() => {});
    }
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const before = this._items().find((i) => i.product.id === productId);
    this._items.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    if (before) {
      this.persist();
      this.saveCartToServer().catch(() => {});
    }
  }

  clear(): void {
    if (this._items().length === 0) return;
    this._items.set([]);
    this.persist();
    this.saveCartToServer().catch(() => {});
  }

  getDeliveryFee(zoneFee: number): number {
    return zoneFee;
  }

  calculateTotal(zoneFee: number, discount = 0): number {
    return Math.max(this.subtotal() + zoneFee - discount, 0);
  }
}
