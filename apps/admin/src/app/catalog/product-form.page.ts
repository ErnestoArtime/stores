import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogFacade, ToastService } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { Product } from '@stores/domain';

@Component({
  selector: 'admin-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Catalogo" [title]="isEditing() ? 'Editar producto' : 'Nuevo producto'" [hasActions]="true">
        <div actions>
          <a routerLink="/catalog/products" class="btn">Cancelar</a>
          <button type="button" class="primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </stores-page-header>

        <section class="panel form-grid">
          <div class="field">
            <label for="name">Nombre</label>
            <input id="name" [(ngModel)]="product.name" placeholder="Nombre del producto" required />
          </div>
          <div class="field">
            <label for="sku">SKU</label>
            <input id="sku" [(ngModel)]="product.sku" placeholder="Codigo SKU" required />
          </div>
          <div class="field full">
            <label for="description">Descripcion</label>
            <textarea id="description" [(ngModel)]="product.description" rows="3" placeholder="Descripcion del producto"></textarea>
          </div>
          <div class="field">
            <label for="category">Categoria</label>
            <select id="category" [(ngModel)]="product.categoryId">
              <option value="">Sin categoria</option>
              <option *ngFor="let cat of facade.categories()" [value]="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="field">
            <label for="store">Sucursal</label>
            <select id="store" [(ngModel)]="product.storeId">
              <option value="">Todas</option>
              <option *ngFor="let store of facade.stores()" [value]="store.id">{{ store.name }}</option>
            </select>
          </div>
          <div class="field">
            <label for="price">Precio ({{ facade.tenant().currency }})</label>
            <input id="price" type="number" [(ngModel)]="product.price" min="0" step="0.01" required />
          </div>
          <div class="field">
            <label for="stock">Stock</label>
            <input id="stock" type="number" [(ngModel)]="product.stock" min="0" required />
          </div>
          <div class="field">
            <label for="unit">Unidad</label>
            <select id="unit" [(ngModel)]="product.unit">
              <option value="unidad">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="lb">Libra</option>
              <option value="litro">Litro</option>
              <option value="docena">Docena</option>
            </select>
          </div>
          <div class="field">
            <label for="imageUrl">URL de imagen</label>
            <input id="imageUrl" [(ngModel)]="product.imageUrl" placeholder="https://..." />
          </div>
          <div class="field">
            <label for="status">Estado</label>
            <select id="status" [(ngModel)]="product.status">
              <option value="active">Activo</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </section>

        <div class="error" *ngIf="error()">{{ error() }}</div>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .actions { display: flex; gap: 10px; align-items: center; }
    .btn { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; text-decoration: none; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field.full { grid-column: 1 / -1; }
    label { display: block; margin-bottom: 6px; color: #374151; font-size: 0.84rem; font-weight: 600; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; font-family: inherit; resize: vertical; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #0f766e; }
    .error { padding: 12px; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.84rem; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProductFormPage implements OnInit {
  readonly facade = inject(CatalogFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isEditing = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  private productId = '';

  product = {
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    storeId: '',
    price: 0,
    stock: 0,
    unit: 'unidad',
    imageUrl: '',
    status: 'active' as Product['status']
  };

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.isEditing.set(true);
      const existing = this.facade.products().find((p) => p.id === this.productId);
      if (existing) {
        this.product = {
          name: existing.name,
          sku: existing.sku,
          description: existing.description,
          categoryId: existing.categoryId || '',
          storeId: existing.storeId || '',
          price: existing.price,
          stock: existing.stock,
          unit: existing.unit,
          imageUrl: existing.imageUrl,
          status: existing.status
        };
      }
    }
  }

  async save(): Promise<void> {
    this.error.set('');
    this.saving.set(true);

    try {
      if (this.isEditing()) {
        await this.facade.updateProduct(this.productId, {
          ...this.product,
          tenantId: this.facade.tenant().id
        });
        this.toast.success('Producto actualizado correctamente.');
      } else {
        await this.facade.createProduct({
          ...this.product,
          tenantId: this.facade.tenant().id,
          tags: []
        });
        this.toast.success('Producto creado correctamente.');
      }
      this.router.navigate(['/catalog/products']);
    } catch {
      this.error.set('Error al guardar el producto.');
      this.toast.error('Error al guardar el producto.');
    } finally {
      this.saving.set(false);
    }
  }
}
