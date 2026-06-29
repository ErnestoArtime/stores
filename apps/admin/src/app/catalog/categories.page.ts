import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '@stores/data-access';

@Component({
  selector: 'admin-categories',
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
          <a routerLink="/catalog/categories" class="active">Categorias</a>
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
            <p>Catalogo</p>
            <h1>Categorias</h1>
          </div>
          <div class="actions">
            <button type="button" class="primary" (click)="showForm.set(!showForm())">
              {{ showForm() ? 'Cancelar' : 'Nueva categoria' }}
            </button>
          </div>
        </header>

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
    .actions { display: flex; gap: 10px; }
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
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } }
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
