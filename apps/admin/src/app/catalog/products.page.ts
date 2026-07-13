import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { Product } from '@stores/domain';
import { MoneyPipe } from '@stores/ui';

@Component({
  selector: 'admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Catalogo" title="Productos" [hasActions]="true">
        <div actions>
          <button type="button" routerLink="/catalog/products/new" class="primary">Nuevo producto</button>
        </div>
      </stores-page-header>

        <section class="filters">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            [(ngModel)]="search"
            (ngModelChange)="filterProducts()"
          />
          <select [(ngModel)]="statusFilter" (ngModelChange)="filterProducts()">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>
        </section>

        <section class="panel">
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of filteredProducts()">
                <td>
                  <img [src]="product.imageUrl" [alt]="product.name" class="product-thumb" />
                </td>
                <td>
                  <strong>{{ product.name }}</strong>
                  <small>{{ product.description }}</small>
                </td>
                <td>{{ product.sku }}</td>
                <td>{{ product.price | storeMoney: facade.tenant().currency }}</td>
                <td>
                  <span [class.low-stock]="product.stock <= 5">{{ product.stock }} {{ product.unit }}</span>
                </td>
                <td>
                  <span class="status" [class]="product.status">{{ product.status }}</span>
                </td>
                <td>
                  <div class="row-actions">
                    <a [routerLink]="['/catalog/products', product.id, 'edit']">Editar</a>
                    <button type="button" class="link" (click)="archive(product)">
                      {{ product.status === 'archived' ? 'Activar' : 'Archivar' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty" *ngIf="filteredProducts().length === 0">
            No se encontraron productos.
          </div>
        </section>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .panel__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button.link { border: none; background: none; color: #0f766e; padding: 0; min-height: auto; font-weight: 600; }
    .actions { display: flex; gap: 10px; }
    .filters { display: flex; gap: 12px; }
    .filters input, .filters select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .filters input { flex: 1; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    td strong, td small { display: block; }
    .product-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .status { display: inline-flex; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
    .status.active { background: #ecfdf5; color: #0f766e; }
    .status.draft { background: #fffbeb; color: #b45309; }
    .status.archived { background: #f3f4f6; color: #6b7280; }
    .low-stock { color: #b91c1c; font-weight: 700; }
    .row-actions { display: flex; gap: 12px; }
    .row-actions a { color: #0f766e; text-decoration: none; font-weight: 600; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    a { text-decoration: none; color: inherit; }
  `]
})
export class ProductsPage {
  readonly facade = inject(CatalogFacade);
  private readonly router = inject(Router);

  search = '';
  statusFilter = 'all';
  readonly filteredProducts = signal<Product[]>(this.facade.products());

  filterProducts(): void {
    const term = this.search.toLowerCase();
    this.filteredProducts.set(
      this.facade.products().filter((p) => {
        const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
        const matchesStatus = this.statusFilter === 'all' || p.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      })
    );
  }

  async archive(product: Product): Promise<void> {
    const newStatus = product.status === 'archived' ? 'active' : 'archived';
    await this.facade.updateProduct(product.id, { status: newStatus as Product['status'] });
    this.filterProducts();
  }
}
