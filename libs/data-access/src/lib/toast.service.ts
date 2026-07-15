import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _messages = signal<ToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  show(message: string, type: ToastMessage['type'] = 'info'): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this._messages.update((messages) => [...messages, { id, message, type }]);

    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: string): void {
    this._messages.update((messages) => messages.filter((m) => m.id !== id));
  }
}
