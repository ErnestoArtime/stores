import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';
import { Product } from '@stores/domain';
import { MoneyPipe } from '@stores/ui';

@Component({
  selector: 'admin-inventory',
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
          <a routerLink="/inventory" class="active">Inventario</a>
          <a routerLink="/dispatch">Delivery</a>
          <a routerLink="/customers">Clientes</a>
          <a routerLink="/settings">Configuracion</a>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Operaciones</p>
            <h1>Inventario</h1>
          </div>
        </header>

        <section class="summary">
          <article>
            <span>Total productos</span>
            <strong>{{ facade.products().length }}</strong>
          </article>
          <article>
            <span>Bajo stock (5 o menos)</span>
            <strong class="warn">{{ lowStockCount() }}</strong>
          </article>
          <article>
            <span>Sin stock</span>
            <strong class="danger">{{ outOfStockCount() }}</strong>
          </article>
          <article>
            <span>Valor total inventario</span>
            <strong>{{ totalInventoryValue() | storeMoney: facade.tenant().currency }}</strong>
          </article>
        </section>

        <section class="filters">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            [(ngModel)]="search"
            (ngModelChange)="filterProducts()"
          />
          <select [(ngModel)]="stockFilter" (ngModelChange)="filterProducts()">
            <option value="all">Todos</option>
            <option value="low">Bajo stock (5 o menos)</option>
            <option value="out">Sin stock</option>
            <option value="ok">Stock OK</option>
          </select>
        </section>

        <section class="panel">
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Stock actual</th>
                <th>Ajustar</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of filteredProducts()" [class.low-row]="product.stock <= 5 && product.stock > 0" [class.out-row]="product.stock === 0">
                <td>
                  <img [src]="product.imageUrl" [alt]="product.name" class="product-thumb" />
                </td>
                <td>
                  <strong>{{ product.name }}</strong>
                  <small>{{ product.unit }}</small>
                </td>
                <td>{{ product.sku }}</td>
                <td>
                  <span class="stock-badge" [class.low]="product.stock <= 5 && product.stock > 0" [class.out]="product.stock === 0">
                    {{ product.stock }}
                  </span>
                </td>
                <td>
                  <div class="adjust">
                    <input
                      type="number"
                      [id]="'adj-' + product.id"
                      [value]="product.stock"
                      min="0"
                      #adjInput
                    />
                    <button type="button" class="primary small" (click)="adjustStock(product, adjInput)">
                      Guardar
                    </button>
                  </div>
                </td>
                <td>{{ product.price | storeMoney: facade.tenant().currency }}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="filteredProducts().length === 0">No se encontraron productos.</div>
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
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .summary article { display: grid; gap: 6px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    .summary span { color: #6b7280; font-size: 0.84rem; }
    .summary strong { font-size: 1.6rem; }
    .summary .warn { color: #b45309; }
    .summary .danger { color: #b91c1c; }
    .filters { display: flex; gap: 12px; }
    .filters input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .filters select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    td strong, td small { display: block; }
    .product-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .stock-badge { display: inline-flex; min-width: 32px; height: 28px; place-items: center; border-radius: 6px; background: #ecfdf5; color: #0f766e; font-weight: 700; text-align: center; }
    .stock-badge.low { background: #fffbeb; color: #b45309; }
    .stock-badge.out { background: #fef2f2; color: #b91c1c; }
    .low-row { background: #fffbeb; }
    .out-row { background: #fef2f2; }
    .adjust { display: flex; gap: 6px; align-items: center; }
    .adjust input { width: 70px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; text-align: center; }
    button { min-height: 36px; padding: 0 12px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button.small { min-height: 32px; padding: 0 10px; font-size: 0.8rem; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } .summary { grid-template-columns: 1fr 1fr; } }
  `]
})
export class InventoryPage {
  readonly facade = inject(CatalogFacade);

  search = '';
  stockFilter = 'all';
  readonly filteredProducts = signal<Product[]>(this.facade.products());

  lowStockCount(): number {
    return this.facade.products().filter((p) => p.stock > 0 && p.stock <= 5).length;
  }

  outOfStockCount(): number {
    return this.facade.products().filter((p) => p.stock === 0).length;
  }

  totalInventoryValue(): number {
    return this.facade.products().reduce((sum, p) => sum + p.price * p.stock, 0);
  }

  filterProducts(): void {
    const term = this.search.toLowerCase();
    this.filteredProducts.set(
      this.facade.products().filter((p) => {
        const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
        let matchesStock = true;
        if (this.stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= 5;
        else if (this.stockFilter === 'out') matchesStock = p.stock === 0;
        else if (this.stockFilter === 'ok') matchesStock = p.stock > 5;
        return matchesSearch && matchesStock;
      })
    );
  }

  async adjustStock(product: Product, input: HTMLInputElement): Promise<void> {
    const newStock = parseInt(input.value, 10);
    if (Number.isFinite(newStock) && newStock >= 0 && newStock !== product.stock) {
      await this.facade.updateStock(product.id, newStock);
      this.filterProducts();
    }
  }
}
