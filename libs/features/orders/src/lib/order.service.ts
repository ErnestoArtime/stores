import { Injectable, inject, signal } from '@angular/core';
import { Order, CommerceSummary, demoOrders, demoSummary } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly tenantService = inject(TenantService);

  private readonly _orders = signal<Order[]>(demoOrders);
  private readonly _summary = signal<CommerceSummary>(demoSummary);

  readonly orders = this._orders.asReadonly();
  readonly summary = this._summary.asReadonly();

  async loadOrdersForAdmin(): Promise<void> {
    if (!this.supabase.configured) {
      return;
    }

    const tenantId = this.tenantService.tenant().id;
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
