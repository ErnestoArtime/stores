import { Injectable, inject, signal, computed } from '@angular/core';
import { Order, CommerceSummary, OrderStatus, demoOrders, demoSummary } from '@stores/domain';
import { SupabaseClientService, mapOrderRow } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _orders = signal<Order[]>(demoOrders);
  private readonly _summary = signal<CommerceSummary>(demoSummary);
  private readonly _filters = signal<OrderFilters>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly filteredOrders = computed(() => {
    const f = this._filters();
    const term = f.search?.trim().toLowerCase();
    const fromDate = f.from ? new Date(f.from) : null;
    const toDate = f.to ? new Date(f.to) : null;
    return this._orders().filter((o) => {
      if (f.status && o.status !== f.status) return false;
      const placedAt = new Date(o.placedAt);
      if (fromDate && placedAt < fromDate) return false;
      if (toDate && placedAt > toDate) return false;
      if (term && !o.code.toLowerCase().includes(term) && !o.customerName.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  async loadOrdersForAdmin(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const tenantId = this.tenantService.tenant().id;
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('placed_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      this._error.set(error?.message ?? 'Error cargando pedidos');
      this._loading.set(false);
      return;
    }

    this._orders.set(data.map((row) => mapOrderRow(row as unknown as Record<string, unknown>)));
    this._loading.set(false);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    if (!this.supabase.configured) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !data) {
      this._error.set(error?.message ?? 'Error actualizando pedido');
      return null;
    }

    const updated = mapOrderRow(data as unknown as Record<string, unknown>);
    this.updateOrderInState(updated);
    return updated;
  }

  async assignCourier(orderId: string, courierId: string): Promise<Order | null> {
    if (!this.supabase.configured) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('orders')
      .update({ status: 'on_route', assigned_courier_id: courierId })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !data) {
      this._error.set(error?.message ?? 'Error asignando courier');
      return null;
    }

    const updated = mapOrderRow(data as unknown as Record<string, unknown>);
    this.updateOrderInState(updated);
    return updated;
  }

  setFilters(filters: OrderFilters): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
  }

  updateOrderInState(order: Order): void {
    this._orders.update((orders) =>
      orders.map((o) => (o.id === order.id ? order : o))
    );
  }

  addOrderToState(order: Order): void {
    this._orders.update((orders) => [order, ...orders]);
  }

  buildWhatsappOrderUrl(orderId: string): string {
    const order = this._orders().find((item) => item.id === orderId);
    const phone = this.tenantService.tenant().supportWhatsapp.replace(/\D/g, '');
    const text = order
      ? `Hola, quiero consultar el pedido ${order.code} por ${order.total} ${this.tenantService.tenant().currency}.`
      : 'Hola, necesito ayuda con mi pedido.';

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
}
