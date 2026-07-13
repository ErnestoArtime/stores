import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade, RealtimeService, SupabaseClientService } from '@stores/data-access';
import { Order } from '@stores/domain';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';

@Component({
  selector: 'admin-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>MC</span>
          <div>
            <strong>{{ facade.tenant().name }}</strong>
            <small>Operacion comercial</small>
          </div>
        </div>
        <nav>
          <a routerLink="/dashboard">Panel</a>
          <a routerLink="/catalog/products">Productos</a>
          <a routerLink="/catalog/categories">Categorias</a>
          <a routerLink="/stores">Sucursales</a>
          <a routerLink="/inventory">Inventario</a>
          <a routerLink="/dispatch" class="active">Delivery</a>
          <a routerLink="/customers">Clientes</a>
          <a routerLink="/settings">Configuracion</a>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Despacho</p>
            <h1>Gestion de pedidos y rutas</h1>
          </div>
          <div class="tabs">
            <button [class.active]="activeTab() === 'orders'" (click)="activeTab.set('orders')">Pedidos</button>
            <button [class.active]="activeTab() === 'couriers'" (click)="activeTab.set('couriers')">Mensajeros</button>
            <button [class.active]="activeTab() === 'routes'" (click)="activeTab.set('routes')">Rutas</button>
          </div>
        </header>

        <section class="panel" *ngIf="activeTab() === 'orders'">
          <div class="panel__header">
            <div>
              <p>Cola de despacho</p>
              <h2>Pedidos pendientes</h2>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Cliente</th>
                <th>Zona</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of pendingOrders()">
                <td>{{ order.code }}</td>
                <td>
                  <strong>{{ order.customerName }}</strong>
                  <small>{{ order.customerPhone }}</small>
                </td>
                <td>{{ order.deliveryZone }}</td>
                <td><span class="status" [class]="order.status">{{ labels[order.status] }}</span></td>
                <td>{{ order.total | storeMoney: facade.tenant().currency }}</td>
                <td>
                  <div class="row-actions">
                    <button *ngIf="order.status === 'placed'" (click)="updateStatus(order, 'confirmed')">Confirmar</button>
                    <button *ngIf="order.status === 'confirmed'" (click)="updateStatus(order, 'picking')">Preparar</button>
                    <button *ngIf="order.status === 'picking'" (click)="updateStatus(order, 'on_route')">Enviar</button>
                    <button *ngIf="order.status === 'on_route'" (click)="updateStatus(order, 'delivered')">Entregar</button>
                    <button class="danger" *ngIf="order.status !== 'delivered' && order.status !== 'cancelled'" (click)="updateStatus(order, 'cancelled')">Cancelar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="pendingOrders().length === 0">No hay pedidos pendientes.</div>
        </section>

        <section class="panel" *ngIf="activeTab() === 'couriers'">
          <div class="panel__header">
            <div>
              <p>Mensajeros</p>
              <h2>Estado de mensajeros activos</h2>
            </div>
          </div>
          <div class="courier-list">
            <div class="courier-card" *ngFor="let courier of facade.couriers()">
              <div class="courier-info">
                <strong>{{ courier.fullName }}</strong>
                <small>{{ courier.phone }}</small>
              </div>
              <div class="courier-meta">
                <span class="zone">{{ courier.currentZone }}</span>
                <span class="orders">{{ courier.openOrders }} pedidos</span>
              </div>
              <span class="status-badge" [class.active]="courier.active">
                {{ courier.active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </section>

        <section class="panel" *ngIf="activeTab() === 'routes'">
          <div class="panel__header">
            <div>
              <p>Rutas</p>
              <h2>Rutas activas de entrega</h2>
            </div>
          </div>
          <div class="route-card" *ngFor="let route of facade.routes()">
            <h3>{{ route.zoneName }}</h3>
            <ol class="route-stops">
              <li *ngFor="let stop of route.stops" [class.completed]="stop.status === 'delivered'">
                <span class="stop-code">{{ stop.code }}</span>
                <div class="stop-info">
                  <strong>{{ stop.customerName }}</strong>
                  <small>{{ stop.address }} · ETA {{ stop.etaMinutes }} min</small>
                </div>
                <span class="status" [class]="stop.status">{{ labels[stop.status] }}</span>
              </li>
            </ol>
          </div>
          <div class="empty" *ngIf="facade.routes().length === 0">No hay rutas activas.</div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
    .sidebar { position: sticky; top: 0; height: 100vh; padding: 22px; color: white; background: #111827; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .brand span { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 8px; background: #f59e0b; color: #111827; font-weight: 900; }
    .brand strong, .brand small { display: block; }
    .brand small, nav a { color: #9ca3af; }
    nav { display: grid; gap: 8px; }
    nav a { padding: 11px 12px; border-radius: 8px; text-decoration: none; }
    nav a.active { color: white; background: rgba(255, 255, 255, 0.12); }
    main { display: grid; gap: 22px; padding: 24px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .topbar p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .topbar h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.45rem); }
    .tabs { display: flex; gap: 8px; }
    .tabs button { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #6b7280; font-weight: 700; cursor: pointer; }
    .tabs button.active { background: #0f766e; color: white; border-color: #0f766e; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .panel__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
    .panel__header p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .panel__header h2 { margin: 0; }
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
    .row-actions { display: flex; gap: 8px; }
    .row-actions button { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: white; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .row-actions button:hover { background: #f3f4f6; }
    .row-actions button.danger { color: #b91c1c; border-color: #fca5a5; }
    .courier-list { display: grid; gap: 12px; }
    .courier-card { display: flex; align-items: center; gap: 16px; padding: 14px; border-radius: 8px; background: #f9fafb; }
    .courier-info { flex: 1; }
    .courier-info strong, .courier-info small { display: block; }
    .courier-meta { display: flex; gap: 12px; }
    .courier-meta .zone { padding: 4px 8px; border-radius: 6px; background: #fffbeb; color: #b45309; font-size: 0.78rem; font-weight: 700; }
    .courier-meta .orders { font-size: 0.84rem; color: #6b7280; }
    .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #f3f4f6; color: #6b7280; }
    .status-badge.active { background: #ecfdf5; color: #0f766e; }
    .route-card { margin-bottom: 20px; }
    .route-card h3 { margin: 0 0 10px; }
    .route-stops { padding-left: 20px; }
    .route-stops li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .route-stops li.completed { opacity: 0.5; }
    .stop-code { padding: 4px 6px; border-radius: 4px; background: #fffbeb; color: #b45309; font-size: 0.75rem; font-weight: 900; }
    .stop-info { flex: 1; }
    .stop-info strong, .stop-info small { display: block; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } }
  `]
})
export class DispatchPage implements OnInit, OnDestroy {
  readonly facade = inject(CatalogFacade);
  private readonly supabase = inject(SupabaseClientService);
  private readonly realtime = inject(RealtimeService);

  readonly labels = ORDER_STATUS_LABELS;
  readonly activeTab = signal<'orders' | 'couriers' | 'routes'>('orders');

  readonly pendingOrders = signal<Order[]>([]);

  ngOnInit(): void {
    this.pendingOrders.set(
      this.facade.orders().filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    );

    this.realtime.subscribeToOrders(this.facade.tenant().id, (event, order) => {
      if (event === 'INSERT' || event === 'UPDATE') {
        this.pendingOrders.set(
          this.realtime.orders().filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.realtime.unsubscribe();
  }

  async updateStatus(order: Order, newStatus: Order['status']): Promise<void> {
    if (!this.supabase.configured) {
      this.pendingOrders.update((orders) =>
        orders.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      return;
    }

    await this.supabase.client
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);
  }
}
