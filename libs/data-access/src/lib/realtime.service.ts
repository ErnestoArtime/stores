import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Order } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly supabase = inject(SupabaseClientService);
  private channel: RealtimeChannel | null = null;

  private readonly _orders = signal<Order[]>([]);
  private readonly _lastEvent = signal<{ type: string; order: Order | null } | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();

  subscribeToOrders(tenantId: string, callback?: (event: string, order: Order) => void): void {
    if (!this.supabase.configured) {
      return;
    }

    this.unsubscribe();

    this.channel = this.supabase.client
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const order = this.mapOrder(payload.new as Record<string, unknown>);

          if (payload.eventType === 'INSERT') {
            this._orders.update((orders) => [order, ...orders]);
          } else if (payload.eventType === 'UPDATE') {
            this._orders.update((orders) =>
              orders.map((o) => (o.id === order.id ? order : o))
            );
          } else if (payload.eventType === 'DELETE') {
            this._orders.update((orders) => orders.filter((o) => o.id !== (payload.old as any)?.id));
          }

          this._lastEvent.set({ type: payload.eventType, order });
          callback?.(payload.eventType, order);
        }
      )
      .subscribe();
  }

  setOrders(orders: Order[]): void {
    this._orders.set(orders);
  }

  unsubscribe(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private mapOrder(row: Record<string, unknown>): Order {
    return {
      id: row['id'] as string,
      tenantId: row['tenant_id'] as string,
      storeId: (row['store_id'] as string) || '',
      code: row['code'] as string,
      customerName: row['customer_name'] as string,
      customerPhone: row['customer_phone'] as string,
      deliveryAddress: row['delivery_address'] as string,
      deliveryZone: (row['delivery_zone'] as string) || '',
      deliveryWindow: (row['delivery_window'] as string) || '',
      status: row['status'] as Order['status'],
      paymentMethod: row['payment_method'] as Order['paymentMethod'],
      subtotal: row['subtotal'] as number,
      deliveryFee: row['delivery_fee'] as number,
      discount: (row['discount'] as number) || 0,
      total: row['total'] as number,
      notes: (row['notes'] as string) || '',
      placedAt: (row['created_at'] as string) || '',
      lines: [],
    };
  }
}
