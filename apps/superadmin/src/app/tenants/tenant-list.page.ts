import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@stores/data-access';
import { SuperadminService } from '@stores/features/superadmin';

@Component({
  selector: 'superadmin-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>S</span>
          <div>
            <strong>Stores</strong>
            <small>Superadmin</small>
          </div>
        </div>
        <nav>
          <a routerLink="/">Dashboard</a>
          <a routerLink="/tenants" class="active">Tenants</a>
        </nav>
        <button type="button" (click)="auth.signOut()">Cerrar sesion</button>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Gestion</p>
            <h1>Tenants</h1>
          </div>
        </header>

        <section class="panel">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tenant of service.tenants()">
                <td><strong>{{ tenant.name }}</strong></td>
                <td>{{ tenant.slug }}</td>
                <td>{{ tenant.plan }}</td>
                <td>{{ tenant.billing.status }}</td>
                <td>
                  <a [routerLink]="['/tenants', tenant.id]" class="link">Editar</a>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="service.tenants().length === 0">No hay tenants.</div>
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
    nav { display: grid; gap: 8px; margin-bottom: 24px; }
    nav a { padding: 11px 12px; border-radius: 8px; text-decoration: none; }
    nav a.active { color: white; background: rgba(255, 255, 255, 0.12); }
    button { width: 100%; min-height: 40px; border: 1px solid #374151; border-radius: 8px; background: transparent; color: white; cursor: pointer; }
    main { display: grid; gap: 22px; padding: 24px; }
    .topbar p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .topbar h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.45rem); }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    .link { color: #0f766e; text-decoration: none; font-weight: 600; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } }
  `]
})
export class TenantListPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly service = inject(SuperadminService);

  ngOnInit(): void {
    this.service.loadTenants();
  }
}
