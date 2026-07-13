import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';

@Component({
  selector: 'admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Catalogo" title="Categorias" [hasActions]="true">
        <div actions>
          <button type="button" class="primary" (click)="showForm.set(!showForm())">
            {{ showForm() ? 'Cancelar' : 'Nueva categoria' }}
          </button>
        </div>
      </stores-page-header>

        <section class="panel" *ngIf="showForm()">
          <h3>{{ editingId() ? 'Editar categoria' : 'Nueva categoria' }}</h3>
          <div class="form-row">
            <div class="field">
              <label for="cat-name">Nombre</label>
              <input id="cat-name" [(ngModel)]="formName" placeholder="Nombre de la categoria" />
            </div>
            <div class="field">
              <label for="cat-icon">Icono (Ionicons)</label>
              <input id="cat-icon" [(ngModel)]="formIcon" placeholder="e.g. cart-outline" />
            </div>
            <button type="button" class="primary" (click)="saveCategory()">
              {{ editingId() ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
          <div class="error" *ngIf="error()">{{ error() }}</div>
        </section>

        <section class="panel">
          <table>
            <thead>
              <tr>
                <th>Icono</th>
                <th>Nombre</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of facade.categories()">
                <td><strong>{{ cat.icon }}</strong></td>
                <td><strong>{{ cat.name }}</strong></td>
                <td>{{ countProducts(cat.id) }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="link" (click)="editCategory(cat)">Editar</button>
                    <button type="button" class="link danger" (click)="deleteCategory(cat.id)">Eliminar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="facade.categories().length === 0">No hay categorias.</div>
        </section>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button.link { border: none; background: none; color: #0f766e; padding: 0; min-height: auto; font-weight: 600; }
    button.link.danger { color: #b91c1c; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    h3 { margin: 0 0 14px; }
    .form-row { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 0.78rem; font-weight: 600; color: #374151; }
    .field input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    .row-actions { display: flex; gap: 12px; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    .error { margin-top: 12px; padding: 10px; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.84rem; }
    a { text-decoration: none; color: inherit; }
  `]
})
export class CategoriesPage {
  readonly facade = inject(CatalogFacade);

  showForm = signal(false);
  editingId = signal('');
  error = signal('');
  formName = '';
  formIcon = '';

  countProducts(categoryId: string): number {
    return this.facade.products().filter((p) => p.categoryId === categoryId).length;
  }

  editCategory(cat: { id: string; name: string; icon: string }): void {
    this.editingId.set(cat.id);
    this.formName = cat.name;
    this.formIcon = cat.icon;
    this.showForm.set(true);
  }

  saveCategory(): void {
    this.error.set('');
    if (!this.formName.trim()) {
      this.error.set('El nombre es requerido.');
      return;
    }
    this.showForm.set(false);
    this.editingId.set('');
    this.formName = '';
    this.formIcon = '';
  }

  deleteCategory(_id: string): void {
    this.showForm.set(false);
    this.editingId.set('');
  }
}
