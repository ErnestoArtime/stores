import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Order } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';
import { mapOrderRow } from './order.mapper';

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
          const order = mapOrderRow(payload.new as Record<string, unknown>);

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
}
