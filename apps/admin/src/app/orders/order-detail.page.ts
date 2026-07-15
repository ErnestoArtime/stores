import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogFacade, ToastService } from '@stores/data-access';
import { OrderService } from '@stores/features/orders';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';
import { Order, OrderStatus } from '@stores/domain';

@Component({
  selector: 'admin-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Operaciones" title="Detalle del pedido" [hasActions]="true">
        <div actions>
          <a routerLink="/orders" class="btn">Volver</a>
        </div>
      </stores-page-header>

      <section class="panel" *ngIf="order()">
        <div class="order-header">
          <div>
            <h2>{{ order()?.code }}</h2>
            <span class="status" [class]="order()!.status">{{ labels[order()!.status] }}</span>
          </div>
          <div class="order-total">
            <strong>{{ order()!.total | storeMoney: facade.tenant().currency }}</strong>
            <small>{{ order()!.placedAt | date:'medium' }}</small>
          </div>
        </div>

        <div class="grid">
          <div class="section">
            <h3>Cliente</h3>
            <p><strong>{{ order()!.customerName }}</strong></p>
            <p>{{ order()!.customerPhone }}</p>
            <p>{{ order()!.deliveryAddress }}</p>
            <p *ngIf="order()!.deliveryZone">Zona: {{ order()!.deliveryZone }}</p>
            <p *ngIf="order()!.deliveryWindow">Ventana: {{ order()!.deliveryWindow }}</p>
          </div>

          <div class="section">
            <h3>Pago</h3>
            <p>Metodo: {{ order()!.paymentMethod }}</p>
            <p>Subtotal: {{ order()!.subtotal | storeMoney: facade.tenant().currency }}</p>
            <p>Envio: {{ order()!.deliveryFee | storeMoney: facade.tenant().currency }}</p>
            <p *ngIf="order()!.discount > 0">Descuento: {{ order()!.discount | storeMoney: facade.tenant().currency }}</p>
            <p><strong>Total: {{ order()!.total | storeMoney: facade.tenant().currency }}</strong></p>
          </div>
        </div>

        <div class="section">
          <h3>Productos</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of order()!.lines">
                <td>{{ line.name }}</td>
                <td>{{ line.quantity }}</td>
                <td>{{ line.unitPrice | storeMoney: facade.tenant().currency }}</td>
                <td>{{ line.quantity * line.unitPrice | storeMoney: facade.tenant().currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section actions">
          <h3>Gestionar estado</h3>
          <div class="status-actions">
            <button *ngIf="canTransition('confirmed')" (click)="updateStatus('confirmed')">Confirmar</button>
            <button *ngIf="canTransition('picking')" (click)="updateStatus('picking')">Preparar</button>
            <button *ngIf="canTransition('on_route')" (click)="updateStatus('on_route')">Enviar</button>
            <button *ngIf="canTransition('delivered')" (click)="updateStatus('delivered')">Entregar</button>
            <button *ngIf="canTransition('cancelled')" class="danger" (click)="updateStatus('cancelled')">Cancelar</button>
          </div>
        </div>

        <div class="section" *ngIf="facade.couriers().length > 0 && order()!.status === 'picking'">
          <h3>Asignar courier</h3>
          <select [(ngModel)]="selectedCourier">
            <option value="">Seleccionar courier</option>
            <option *ngFor="let courier of facade.couriers()" [value]="courier.id">{{ courier.fullName }}</option>
          </select>
          <button class="primary" (click)="assignCourier()" [disabled]="!selectedCourier">Asignar y enviar</button>
        </div>
      </section>

      <div class="panel" *ngIf="!order() && !loading()">
        <p>Pedido no encontrado.</p>
        <a routerLink="/orders">Volver a pedidos</a>
      </div>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .btn { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; text-decoration: none; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .order-header h2 { margin: 0 0 8px; }
    .order-total { text-align: right; }
    .order-total strong { display: block; font-size: 1.5rem; }
    .order-total small { color: #6b7280; }
    .status { display: inline-flex; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
    .status.placed { background: #fffbeb; color: #b45309; }
    .status.confirmed { background: #eff6ff; color: #1d4ed8; }
    .status.picking { background: #f0fdf4; color: #15803d; }
    .status.on_route { background: #faf5ff; color: #7c3aed; }
    .status.delivered { background: #ecfdf5; color: #0f766e; }
    .status.cancelled { background: #fef2f2; color: #b91c1c; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .section { margin-bottom: 24px; }
    .section h3 { margin: 0 0 12px; font-size: 1rem; }
    .section p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    .actions { padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .status-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button.danger { color: #b91c1c; border-color: #fca5a5; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; margin-right: 8px; }
    a { color: #0f766e; text-decoration: none; font-weight: 600; }
    @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class OrderDetailPage implements OnInit {
  readonly facade = inject(CatalogFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly orderService = inject(OrderService);

  readonly labels = ORDER_STATUS_LABELS;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  selectedCourier = '';

  private readonly validTransitions: Record<OrderStatus, OrderStatus[]> = {
    draft: ['placed'],
    placed: ['confirmed', 'cancelled'],
    confirmed: ['picking', 'cancelled'],
    picking: ['on_route', 'cancelled'],
    on_route: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') || '';
    await this.facade.loadOrdersForAdmin();
    const found = this.facade.orders().find((o) => o.id === id);
    this.order.set(found || null);
    this.loading.set(false);
  }

  canTransition(status: OrderStatus): boolean {
    const current = this.order()?.status;
    return current ? this.validTransitions[current].includes(status) : false;
  }

  async updateStatus(status: OrderStatus): Promise<void> {
    const orderId = this.order()?.id;
    if (!orderId) return;

    const updated = await this.orderService.updateOrderStatus(orderId, status);
    if (updated) {
      this.order.set(updated);
      this.toast.success(`Estado actualizado a ${this.labels[status]}`);
    } else {
      this.toast.error('Error al actualizar el estado');
    }
  }

  async assignCourier(): Promise<void> {
    const orderId = this.order()?.id;
    if (!orderId || !this.selectedCourier) return;

    const updated = await this.orderService.assignCourier(orderId, this.selectedCourier);
    if (updated) {
      this.order.set(updated);
      this.toast.success('Courier asignado correctamente');
    } else {
      this.toast.error('Error al asignar courier');
    }
  }
}
