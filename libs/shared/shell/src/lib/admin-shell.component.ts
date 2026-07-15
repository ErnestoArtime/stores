import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tenant } from '@stores/domain';
import { NavItem } from './nav-item.model';
import { ToastContainerComponent } from './toast-container.component';

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Panel', path: '/dashboard' },
  { label: 'Productos', path: '/catalog/products' },
  { label: 'Categorias', path: '/catalog/categories' },
  { label: 'Sucursales', path: '/stores' },
  { label: 'Inventario', path: '/inventory' },
  { label: 'Delivery', path: '/dispatch', features: ['dispatch'] },
  { label: 'Clientes', path: '/customers', features: ['promotions', 'loyalty'] },
  { label: 'Configuracion', path: '/settings' }
];

@Component({
  selector: 'stores-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>{{ tenant?.name?.[0] || 'S' }}</span>
          <div>
            <strong>{{ tenant?.name || 'Stores' }}</strong>
            <small>Operacion comercial</small>
          </div>
        </div>
        <nav>
          <ng-container *ngFor="let item of items">
            <a
              *ngIf="hasAccess(item)"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
            >
              {{ item.label }}
            </a>
          </ng-container>
        </nav>
      </aside>
      <main>
        <ng-content></ng-content>
      </main>
    </div>
    <stores-toast-container></stores-toast-container>
  `,
  styles: [`
    .layout {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 22px;
      color: white;
      background: #111827;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .brand span {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 8px;
      background: #f59e0b;
      color: #111827;
      font-weight: 900;
    }

    .brand strong,
    .brand small {
      display: block;
    }

    .brand small,
    nav a {
      color: #9ca3af;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    nav a {
      padding: 11px 12px;
      border-radius: 8px;
      text-decoration: none;
    }

    nav a.active {
      color: white;
      background: rgba(255, 255, 255, 0.12);
    }

    main {
      display: grid;
      gap: 22px;
      padding: 24px;
    }

    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: static;
        height: auto;
      }
      nav {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }
    }
  `]
})
export class AdminShellComponent {
  @Input() tenant: Tenant | null = null;
  @Input() items: NavItem[] = DEFAULT_NAV_ITEMS;

  hasAccess(item: NavItem): boolean {
    if (!item.features?.length) return true;
    return item.features.some((f) => this.tenant?.features?.[f]);
  }
}
