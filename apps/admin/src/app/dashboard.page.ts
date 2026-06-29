import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
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
          <a routerLink="/dashboard" class="active">Panel</a>
          <a routerLink="/catalog/products">Productos</a>
          <a routerLink="/catalog/categories">Categorias</a>
          <a routerLink="/stores">Sucursales</a>
          <a routerLink="/inventory">Inventario</a>
          <a routerLink="/dispatch">Delivery</a>
          <a routerLink="/customers">Clientes</a>
          <a routerLink="/settings">Configuracion</a>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Dashboard</p>
            <h1>Control diario de tienda y delivery</h1>
          </div>
          <div class="actions">
            <button type="button">Nuevo producto</button>
            <button type="button" class="primary">Crear pedido</button>
          </div>
        </header>

        <section class="metrics">
          <article>
            <span>Ventas hoy</span>
            <strong>{{ facade.summary.todayRevenue | storeMoney: facade.tenant().currency }}</strong>
            <small>+14% contra ayer</small>
          </article>
          <article>
            <span>Pedidos abiertos</span>
            <strong>{{ facade.summary.openOrders }}</strong>
            <small>3 listos para despacho</small>
          </article>
          <article>
            <span>Productos activos</span>
            <strong>{{ facade.summary.activeProducts }}</strong>
            <small>{{ facade.summary.lowStockProducts }} en bajo stock</small>
          </article>
          <article>
            <span>SLA delivery</span>
            <strong>{{ facade.summary.deliverySlaMinutes }} min</strong>
            <small>Promedio movil</small>
          </article>
          <article>
            <span>Ticket promedio</span>
            <strong>{{ facade.summary.averageOrderValue | storeMoney: facade.tenant().currency }}</strong>
            <small>{{ facade.summary.repeatCustomerRate }}% clientes recurrentes</small>
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

          <aside class="panel">
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
          </aside>
        </section>

        <section class="workspace secondary">
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

          <article class="panel roadmap">
            <div class="panel__header">
              <div>
                <p>Producto SaaS</p>
                <h2>Preparado para varios clientes</h2>
              </div>
            </div>
            <ul>
              <li>Tenant por cadena o gestor comercial.</li>
              <li>Branding configurable por cliente.</li>
              <li>Roles separados para catalogo, despacho y gerencia.</li>
              <li>Datos listos para Supabase con RLS.</li>
            </ul>
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
            <div class="courier" *ngFor="let courier of facade.couriers">
              <div>
                <strong>{{ courier.fullName }}</strong>
                <small>{{ courier.currentZone }} · {{ courier.phone }}</small>
              </div>
              <b>{{ courier.openOrders }}</b>
            </div>
            <div class="route" *ngFor="let route of facade.routes">
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
            <div class="segment" *ngFor="let segment of facade.segments">
              <strong>{{ segment.name }}</strong>
              <span>{{ segment.customerCount }} clientes</span>
              <small>{{ segment.criteria }}</small>
            </div>
          </article>
        </section>

        <section class="workspace secondary">
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
      </main>
    </div>
  `,
  styleUrl: './dashboard.page.scss'
})
export class DashboardPage {
  readonly status = ORDER_STATUS_LABELS;
  readonly csvPreview: ReturnType<CatalogFacade['previewProductCsv']>;

  constructor(readonly facade: CatalogFacade) {
    this.csvPreview = facade.previewProductCsv(
      'sku,name,price,stock,unit\nALM-010,Frijoles negros,950,42,2 lb\nASE-088,Jabon de lavar,320,0,unidad\nBAD,,xx,-1,unidad'
    );
  }
}
