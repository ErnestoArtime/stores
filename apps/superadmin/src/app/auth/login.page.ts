import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@stores/data-access';

@Component({
  selector: 'superadmin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login">
      <div class="card">
        <h1>Superadmin</h1>
        <p>Acceso para administradores de la plataforma.</p>

        <div class="field">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="admin@stores.cu" />
        </div>

        <div class="field">
          <label>Contrasena</label>
          <input type="password" [(ngModel)]="password" />
        </div>

        <div class="error" *ngIf="error()">{{ error() }}</div>

        <button type="button" class="primary" (click)="login()" [disabled]="submitting()">
          {{ submitting() ? 'Entrando...' : 'Entrar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #111827; }
    .login { display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .card { width: 100%; max-width: 400px; padding: 32px; border-radius: 12px; background: white; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 24px; color: #6b7280; }
    .field { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-size: 0.84rem; font-weight: 600; }
    input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
    .error { margin-bottom: 14px; padding: 10px; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.84rem; }
    button { width: 100%; min-height: 44px; border: none; border-radius: 8px; background: #0f766e; color: white; font-weight: 800; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly error = signal('');

  async login(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);

    const result = await this.auth.signInWithEmail(this.email, this.password);
    if (result.error) {
      this.error.set(result.error);
      this.submitting.set(false);
      return;
    }

    await this.auth.loadProfile();
    if (!this.auth.isSuperadmin()) {
      this.error.set('No tienes permisos de superadmin.');
      await this.auth.signOut();
      this.submitting.set(false);
      return;
    }

    this.router.navigate(['/']);
    this.submitting.set(false);
  }
}
