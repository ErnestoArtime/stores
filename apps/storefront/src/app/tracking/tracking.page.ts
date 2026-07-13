import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { CatalogFacade, SupabaseClientService } from '@stores/data-access';
import { Order, OrderStatus } from '@stores/domain';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';

@Component({
  selector: 'stores-tracking',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    MoneyPipe
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Sigue tu pedido</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="loading" *ngIf="loading()">
        <p>Cargando pedido...</p>
      </div>

      <div class="error-message" *ngIf="error() && !loading()">
        <h2>Error al cargar</h2>
        <p>{{ error() }}</p>
        <ion-button routerLink="/">Volver al inicio</ion-button>
      </div>

      <div class="tracking-container" *ngIf="order() && !loading()">
        <div class="order-header">
          <h2>Pedido {{ order()!.code }}</h2>
          <span class="status-badge" [class]="order()!.status">{{ labels[order()!.status] }}</span>
        </div>

        <div class="timeline">
          <div class="timeline-step" *ngFor="let step of steps" [class.active]="isStepActive(step.status)" [class.current]="order()!.status === step.status">
            <div class="step-marker">
              <span></span>
            </div>
            <div class="step-content">
              <strong>{{ step.label }}</strong>
              <small *ngIf="order()!.status === step.status">Estado actual</small>
            </div>
          </div>
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span>Cliente</span>
            <strong>{{ order()!.customerName }}</strong>
          </div>
          <div class="detail-row">
            <span>Telefono</span>
            <strong>{{ order()!.customerPhone }}</strong>
          </div>
          <div class="detail-row">
            <span>Direccion</span>
            <strong>{{ order()!.deliveryAddress }}</strong>
          </div>
          <div class="detail-row">
            <span>Ventana de entrega</span>
            <strong>{{ order()!.deliveryWindow || 'No especificada' }}</strong>
          </div>
          <div class="detail-row">
            <span>Metodo de pago</span>
            <strong>{{ order()!.paymentMethod }}</strong>
          </div>
          <div class="detail-row total">
            <span>Total</span>
            <strong>{{ order()!.total | storeMoney: facade.tenant().currency }}</strong>
          </div>
        </div>

        <div class="order-items" *ngIf="order()!.lines.length > 0">
          <h3>Productos</h3>
          <div class="item" *ngFor="let line of order()!.lines">
            <span>{{ line.quantity }}x {{ line.name }}</span>
            <strong>{{ line.unitPrice * line.quantity | storeMoney: facade.tenant().currency }}</strong>
          </div>
        </div>
      </div>

      <div class="not-found" *ngIf="!order() && !loading() && !error()">
        <h2>Pedido no encontrado</h2>
        <p>No se encontro un pedido con el codigo {{ code }}.</p>
        <ion-button routerLink="/">Volver al inicio</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .loading { text-align: center; padding: 48px 0; color: #6b7280; }
    .error-message { text-align: center; padding: 48px 0; }
    .error-message h2 { color: #b91c1c; }
    .tracking-container { max-width: 500px; margin: 0 auto; }
    .order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .order-header h2 { margin: 0; }
    .status-badge { display: inline-flex; padding: 6px 12px; border-radius: 8px; font-size: 0.84rem; font-weight: 700; }
    .status-badge.placed { background: #fffbeb; color: #b45309; }
    .status-badge.confirmed { background: #eff6ff; color: #1d4ed8; }
    .status-badge.picking { background: #f0fdf4; color: #15803d; }
    .status-badge.on_route { background: #faf5ff; color: #7c3aed; }
    .status-badge.delivered { background: #ecfdf5; color: #0f766e; }
    .status-badge.cancelled { background: #fef2f2; color: #b91c1c; }
    .timeline { margin-bottom: 28px; }
    .timeline-step { display: flex; gap: 16px; padding: 12px 0; }
    .step-marker { display: flex; flex-direction: column; align-items: center; }
    .step-marker span { display: block; width: 14px; height: 14px; border-radius: 50%; background: #e5e7eb; }
    .timeline-step.active .step-marker span { background: #0f766e; }
    .timeline-step.current .step-marker span { background: #0f766e; box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.2); }
    .step-content { flex: 1; }
    .step-content strong { display: block; }
    .step-content small { color: #6b7280; }
    .order-details { padding: 18px; border-radius: 8px; background: #f9fafb; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span { color: #6b7280; }
    .detail-row.total { font-size: 1.1rem; margin-top: 4px; padding-top: 12px; border-top: 1px solid #d1d5db; border-bottom: none; }
    .order-items { margin-top: 24px; padding: 18px; border-radius: 8px; background: #f9fafb; }
    .order-items h3 { margin: 0 0 12px; font-size: 1rem; }
    .order-items .item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
    .order-items .item:last-child { border-bottom: none; }
    .not-found { text-align: center; padding: 48px 0; }
    .not-found h2 { color: #6b7280; }
  `]
})
export class TrackingPage implements OnInit, OnDestroy {
  readonly facade = inject(CatalogFacade);
  private readonly supabase = inject(SupabaseClientService);
  private readonly route = inject(ActivatedRoute);

  readonly labels = ORDER_STATUS_LABELS;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  code = '';

  private channel: ReturnType<typeof this.supabase.client.channel> | null = null;
  readonly error = signal('');

  readonly steps: { status: OrderStatus; label: string }[] = [
    { status: 'placed', label: 'Pedido recibido' },
    { status: 'confirmed', label: 'Confirmado' },
    { status: 'picking', label: 'Preparando' },
    { status: 'on_route', label: 'En ruta' },
    { status: 'delivered', label: 'Entregado' }
  ];

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') || '';
    this.loadOrder();
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private async loadOrder(): Promise<void> {
    if (!this.code) {
      this.loading.set(false);
      return;
    }

    if (!this.supabase.configured) {
      this.loading.set(false);
      return;
    }

    const tenantId = this.facade.tenant().id;

    const { data, error } = await this.supabase.client
      .from('orders')
      .select(`
        id,
        tenant_id,
        store_id,
        code,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_zone,
        delivery_window,
        status,
        payment_method,
        subtotal,
        delivery_fee,
        discount,
        total,
        placed_at,
        order_items (product_id, name, quantity, unit_price)
      `)
      .eq('tenant_id', tenantId)
      .eq('code', this.code)
      .single();

    if (error || !data) {
      this.error.set('No se pudo cargar el pedido. Verifica el codigo e intenta de nuevo.');
      this.loading.set(false);
      return;
    }

    this.order.set(this.mapOrder(data as Record<string, unknown>));
    this.subscribeToOrderUpdates(data.id as string);
    this.loading.set(false);
  }

  private subscribeToOrderUpdates(orderId: string): void {
    this.channel = this.supabase.client
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        () => {
          // Reload full order to reflect status, items, totals, etc.
          this.loadOrder();
        }
      )
      .subscribe();
  }

  isStepActive(stepStatus: OrderStatus): boolean {
    const order = this.order();
    if (!order) return false;
    const orderIndex = this.steps.findIndex((s) => s.status === order.status);
    const stepIndex = this.steps.findIndex((s) => s.status === stepStatus);
    return stepIndex <= orderIndex;
  }

  private mapOrder(row: Record<string, unknown>): Order {
    const items = (row['order_items'] as Array<Record<string, unknown>>) || [];
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
      notes: '',
      placedAt: (row['placed_at'] as string) || '',
      lines: items.map((item) => ({
        productId: (item['product_id'] as string) || '',
        name: item['name'] as string,
        quantity: item['quantity'] as number,
        unitPrice: item['unit_price'] as number,
        imageUrl: ''
      }))
    };
  }
}
