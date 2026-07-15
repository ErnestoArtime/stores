import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';

function computeMaxRevenue(revenueByDay: { value: number }[]): number {
  const values = revenueByDay.map((d) => d.value);
  return values.length ? Math.max(...values) : 0;
}

function computeStatusBreakdown(
  ordersByStatus: Record<string, number>,
  labels: typeof ORDER_STATUS_LABELS
): { label: string; count: number; percent: number }[] {
  const total = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);
  return (Object.keys(ordersByStatus) as Array<keyof typeof ORDER_STATUS_LABELS>).map((status) => {
    const count = ordersByStatus[status] ?? 0;
    return {
      label: labels[status],
      count,
      percent: total ? (count / total) * 100 : 0
    };
  });
}

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, MoneyPipe, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Dashboard" title="Control diario de tienda y delivery" [hasActions]="true">
        <div actions>
          <button type="button">Nuevo producto</button>
          <button type="button" class="primary">Crear pedido</button>
        </div>
      </stores-page-header>

      <ng-container *ngIf="facade.kpis() as kpis">
      <section class="metrics">
        <article>
          <span>Ventas hoy</span>
          <strong>{{ kpis.todayRevenue | storeMoney: facade.tenant().currency }}</strong>
          <small>{{ kpis.todayOrders }} pedidos hoy</small>
        </article>
        <article>
          <span>Pedidos abiertos</span>
          <strong>{{ kpis.openOrders }}</strong>
          <small>en cola operativa</small>
        </article>
        <article>
          <span>Productos activos</span>
          <strong>{{ kpis.activeProducts }}</strong>
          <small>{{ kpis.lowStockProducts }} en bajo stock</small>
        </article>
        <article>
          <span>SLA delivery</span>
          <strong>{{ kpis.deliverySlaMinutes }} min</strong>
          <small>Promedio movil</small>
        </article>
        <article>
          <span>Ticket promedio</span>
          <strong>{{ kpis.averageOrderValue | storeMoney: facade.tenant().currency }}</strong>
          <small>{{ kpis.repeatCustomerRate }}% clientes recurrentes</small>
        </article>
      </section>

      <section class="workspace">
        <article class="panel orders">
          <div class="panel__header">
            <div>
              <p>Pedidos recientes</p>
              <h2>Cola operativa</h2>
            </div>
            <button type="button">Filtrar</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Pago</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of facade.orders()">
                <td>{{ order.code }}</td>
                <td>
                  <strong>{{ order.customerName }}</strong>
                  <small>{{ order.deliveryAddress }}</small>
                </td>
                <td><span class="status">{{ status[order.status] }}</span></td>
                <td>{{ order.total | storeMoney: facade.tenant().currency }}</td>
                <td>{{ order.paymentMethod }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article class="panel chart">
          <div class="panel__header">
            <div>
              <p>Ingresos</p>
              <h2>Ultimos 7 dias</h2>
            </div>
          </div>
          <div class="chart-bars">
            <div class="bar" *ngFor="let day of kpis.revenueByDay" [style.height.%]="maxRevenue() ? (day.value / maxRevenue()) * 80 + 10 : 10">
              <span class="bar-value">{{ day.value | storeMoney: facade.tenant().currency }}</span>
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="workspace secondary">
        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Productos</p>
              <h2>Mas vendidos</h2>
            </div>
          </div>
          <div class="top-product" *ngFor="let product of kpis.topSellingProducts">
            <div>
              <strong>{{ product.name }}</strong>
              <small>{{ product.quantity }} unidades vendidas</small>
            </div>
            <b>{{ product.revenue | storeMoney: facade.tenant().currency }}</b>
          </div>
        </article>

        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Pedidos</p>
              <h2>Por estado</h2>
            </div>
          </div>
          <div class="status-row" *ngFor="let item of statusBreakdown()">
            <span>{{ item.label }}</span>
            <div class="status-bar">
              <div class="status-fill" [style.width.%]="item.percent"></div>
            </div>
            <b>{{ item.count }}</b>
          </div>
        </article>
      </section>

      <section class="workspace">
        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Sucursales</p>
              <h2>Estado de venta</h2>
            </div>
          </div>
          <div class="branch" *ngFor="let store of facade.stores()">
            <img [src]="store.coverUrl" [alt]="store.name" />
            <div>
              <strong>{{ store.name }}</strong>
              <small>{{ store.municipality }} · {{ store.deliveryMinutes }} min</small>
            </div>
            <span [class.closed]="!store.openNow">{{ store.openNow ? 'Online' : 'Cerrada' }}</span>
          </div>
        </article>

        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Inventario</p>
              <h2>Productos que requieren accion</h2>
            </div>
          </div>
          <div class="inventory" *ngFor="let product of facade.products()">
            <img [src]="product.imageUrl" [alt]="product.name" />
            <div>
              <strong>{{ product.name }}</strong>
              <small>{{ product.sku }} · {{ product.unit }}</small>
            </div>
            <b>{{ product.stock }}</b>
          </div>
        </article>
      </section>

      <section class="workspace secondary">
        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Despacho</p>
              <h2>Rutas activas y mensajeros</h2>
            </div>
          </div>
          <div class="courier" *ngFor="let courier of facade.couriers()">
            <div>
              <strong>{{ courier.fullName }}</strong>
              <small>{{ courier.currentZone }} · {{ courier.phone }}</small>
            </div>
            <b>{{ courier.openOrders }}</b>
          </div>
          <div class="route" *ngFor="let route of facade.routes()">
            <h3>{{ route.zoneName }}</h3>
            <ol>
              <li *ngFor="let stop of route.stops">
                <span>{{ stop.code }}</span>
                <strong>{{ stop.customerName }}</strong>
                <small>{{ stop.address }} · ETA {{ stop.etaMinutes }} min</small>
              </li>
            </ol>
          </div>
        </article>

        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Marketing y fidelizacion</p>
              <h2>Segmentos y promociones</h2>
            </div>
          </div>
          <div class="promo" *ngFor="let promo of facade.promotions()">
            <span>{{ promo.code }}</span>
            <div>
              <strong>{{ promo.title }}</strong>
              <small>{{ promo.description }}</small>
            </div>
          </div>
          <div class="segment" *ngFor="let segment of facade.segments()">
            <strong>{{ segment.name }}</strong>
            <span>{{ segment.customerCount }} clientes</span>
            <small>{{ segment.criteria }}</small>
          </div>
        </article>
      </section>

      <section class="workspace secondary" *ngIf="facade.features().import">
        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Importacion masiva</p>
              <h2>Preview CSV de productos</h2>
            </div>
            <button type="button">Subir archivo</button>
          </div>
          <div class="import-summary">
            <strong>{{ csvPreview.validRows }} filas validas</strong>
            <span>{{ csvPreview.issues.length }} incidencias</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of csvPreview.products">
                <td>{{ item.sku }}</td>
                <td>{{ item.name || 'Sin nombre' }}</td>
                <td>{{ item.price | storeMoney: facade.tenant().currency }}</td>
                <td>{{ item.stock }}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article class="panel">
          <div class="panel__header">
            <div>
              <p>Incidencias</p>
              <h2>Validacion antes de importar</h2>
            </div>
          </div>
          <div class="issue" *ngFor="let issue of csvPreview.issues">
            <strong>Fila {{ issue.row }} · {{ issue.field }}</strong>
            <small>{{ issue.message }}</small>
          </div>
        </article>
      </section>
      </ng-container>
    </stores-admin-shell>
  `,
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  readonly status = ORDER_STATUS_LABELS;
  readonly csvPreview: ReturnType<CatalogFacade['previewProductCsv']>;
  readonly maxRevenue = computed(() => computeMaxRevenue(this.facade.kpis().revenueByDay));
  readonly statusBreakdown = computed(() => computeStatusBreakdown(this.facade.kpis().ordersByStatus, this.status));

  constructor(readonly facade: CatalogFacade) {
    this.csvPreview = facade.previewProductCsv(
      'sku,name,price,stock,unit\nALM-010,Frijoles negros,950,42,2 lb\nASE-088,Jabon de lavar,320,0,unidad\nBAD,,xx,-1,unidad'
    );
  }
}
