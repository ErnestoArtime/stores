import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';
import { Order } from '@stores/domain';

@Component({
  selector: 'admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Operaciones" title="Pedidos"></stores-page-header>

      <section class="filters">
        <input type="text" [(ngModel)]="search" (ngModelChange)="applyFilters()" placeholder="Buscar por codigo o cliente..." />
        <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
          <option value="all">Todos los estados</option>
          <option value="placed">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="picking">En preparacion</option>
          <option value="on_route">En camino</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </section>

      <section class="panel">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Cliente</th>
              <th>Zona</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders()">
              <td>{{ order.code }}</td>
              <td>
                <strong>{{ order.customerName }}</strong>
                <small>{{ order.customerPhone }}</small>
              </td>
              <td>{{ order.deliveryZone }}</td>
              <td><span class="status" [class]="order.status">{{ labels[order.status] }}</span></td>
              <td>{{ order.total | storeMoney: facade.tenant().currency }}</td>
              <td>{{ order.placedAt | date:'short' }}</td>
              <td>
                <a [routerLink]="['/orders', order.id]">Ver detalle</a>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="filteredOrders().length === 0">No se encontraron pedidos.</div>
      </section>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; }
    .filters input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .filters select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    td strong, td small { display: block; }
    .status { display: inline-flex; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
    .status.placed { background: #fffbeb; color: #b45309; }
    .status.confirmed { background: #eff6ff; color: #1d4ed8; }
    .status.picking { background: #f0fdf4; color: #15803d; }
    .status.on_route { background: #faf5ff; color: #7c3aed; }
    .status.delivered { background: #ecfdf5; color: #0f766e; }
    .status.cancelled { background: #fef2f2; color: #b91c1c; }
    a { color: #0f766e; text-decoration: none; font-weight: 600; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
  `]
})
export class OrdersPage implements OnInit {
  readonly facade = inject(CatalogFacade);
  readonly labels = ORDER_STATUS_LABELS;

  search = '';
  statusFilter = 'all';
  readonly filteredOrders = signal<Order[]>([]);

  async ngOnInit(): Promise<void> {
    await this.facade.loadOrdersForAdmin();
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredOrders.set(
      this.facade.filteredOrders().filter((o) => {
        const matchesSearch = !term || o.code.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term);
        const matchesStatus = this.statusFilter === 'all' || o.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      })
    );
  }
}
