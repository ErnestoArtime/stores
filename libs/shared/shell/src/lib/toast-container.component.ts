import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@stores/data-access';

@Component({
  selector: 'stores-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="toast-container"
      *ngIf="toast.messages().length > 0"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        *ngFor="let message of toast.messages()"
        class="toast"
        [class]="message.type"
        (click)="toast.dismiss(message.id)"
      >
        {{ message.message }}
        <button type="button" class="close" (click)="toast.dismiss(message.id); $event.stopPropagation()" aria-label="Cerrar notificación">
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: grid;
      gap: 8px;
      max-width: 320px;
    }
    .toast {
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.2s ease-out;
    }
    .toast.success { background: #0f766e; }
    .toast.error { background: #b91c1c; }
    .toast.info { background: #1d4ed8; }
    .toast.warning { background: #b45309; }
    .toast .close {
      margin-left: 12px;
      padding: 0 4px;
      background: transparent;
      border: none;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.8;
    }
    .toast .close:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  readonly toast = inject(ToastService);
}
