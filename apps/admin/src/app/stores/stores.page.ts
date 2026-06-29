import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';
import { StoreLocation } from '@stores/domain';

@Component({
  selector: 'admin-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
          <a routerLink="/stores" class="active">Sucursales</a>
          <a routerLink="/inventory">Inventario</a>
          <a routerLink="/dispatch">Delivery</a>
          <a routerLink="/customers">Clientes</a>
          <a routerLink="/settings">Configuracion</a>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Operaciones</p>
            <h1>Sucursales</h1>
          </div>
        </header>

        <section class="stores-grid">
          <article class="store-card" *ngFor="let store of facade.stores()">
            <img [src]="store.coverUrl" [alt]="store.name" />
            <div class="store-card__body">
              <div>
                <h3>{{ store.name }}</h3>
                <p>{{ store.address }} · {{ store.municipality }}</p>
              </div>
              <span class="badge" [class.closed]="!store.openNow">
                {{ store.openNow ? 'Online' : 'Cerrada' }}
              </span>
              <div class="store-card__meta">
                <span>Rating: {{ store.rating }}</span>
                <span>{{ store.deliveryMinutes }} min ETA</span>
                <span>{{ store.type }}</span>
              </div>
            </div>
          </article>
        </section>

        <section class="panel" *ngIf="facade.stores().length === 0">
          <div class="empty">No hay sucursales configuradas.</div>
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
    .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .store-card { border: 1px solid #e5e7eb; border-radius: 8px; background: white; overflow: hidden; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .store-card img { width: 100%; height: 160px; object-fit: cover; }
    .store-card__body { padding: 14px; }
    .store-card__body h3 { margin: 0 0 4px; }
    .store-card__body p { margin: 0; color: #6b7280; font-size: 0.84rem; }
    .badge { display: inline-flex; padding: 4px 8px; border-radius: 6px; background: #ecfdf5; color: #0f766e; font-size: 0.78rem; font-weight: 700; margin-top: 8px; }
    .badge.closed { background: #fef2f2; color: #b91c1c; }
    .store-card__meta { display: flex; gap: 16px; margin-top: 10px; font-size: 0.8rem; color: #6b7280; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } }
  `]
})
export class StoresPage {
  readonly facade = inject(CatalogFacade);
}
