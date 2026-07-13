import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { StoreLocation } from '@stores/domain';

@Component({
  selector: 'admin-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Operaciones" title="Sucursales"></stores-page-header>

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
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
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
  `]
})
export class StoresPage {
  readonly facade = inject(CatalogFacade);
}
