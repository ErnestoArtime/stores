import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@stores/data-access';

@Component({
  selector: 'admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <span>MC</span>
          <div>
            <strong>Mercado Caribe</strong>
            <small>Panel de administracion</small>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Correo electronico</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@mercado.cu"
              required
              autocomplete="email"
            />
          </div>

          <div class="field">
            <label for="password">Contrasena</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Contrasena"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="error" *ngIf="error()">
            {{ error() }}
          </div>

          <button type="submit" class="primary" [disabled]="submitting()">
            {{ submitting() ? 'Entrando...' : 'Iniciar sesion' }}
          </button>
        </form>

        <div class="demo-hint">
          <small>Modo demo: ingresa cualquier correo y contrasena para acceder.</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: grid;
      place-items: center;
      min-height: 100vh;
      background: #f3f4f6;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 16px 45px rgba(17, 24, 39, 0.08);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .brand span {
      display: grid;
      width: 48px;
      height: 48px;
      place-items: center;
      border-radius: 10px;
      background: #f59e0b;
      color: #111827;
      font-weight: 900;
      font-size: 1.1rem;
    }

    .brand strong {
      display: block;
      font-size: 1.1rem;
    }

    .brand small {
      display: block;
      color: #6b7280;
    }

    .field {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: #374151;
      font-size: 0.84rem;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }

    input:focus {
      border-color: #0f766e;
    }

    .error {
      padding: 10px 12px;
      margin-bottom: 16px;
      border-radius: 8px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.84rem;
    }

    button {
      width: 100%;
      min-height: 44px;
      border: none;
      border-radius: 8px;
      background: #e5e7eb;
      color: #9ca3af;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: not-allowed;
    }

    button.primary {
      background: #0f766e;
      color: white;
      cursor: pointer;
    }

    button.primary:hover {
      background: #0d6e66;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .demo-hint {
      margin-top: 18px;
      text-align: center;
    }

    .demo-hint small {
      color: #9ca3af;
      font-size: 0.78rem;
    }
  `]
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly submitting = signal(false);

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);

    const result = await this.auth.signInWithEmail(this.email, this.password);
    this.submitting.set(false);

    if (result.error) {
      this.error.set(result.error);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
