import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { AuthService } from '@stores/data-access';

@Component({
  selector: 'stores-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonTitle,
    IonToolbar
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="brand">
          <h1>Mercado Caribe</h1>
          <p>Accede para realizar pedidos y seguimiento de entregas.</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <ion-item>
            <ion-label position="stacked">Correo electronico</ion-label>
            <ion-input
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="correo@ejemplo.cu"
              required
              autocomplete="email"
            ></ion-input>
          </ion-item>

          <ion-item *ngIf="mode() === 'password'">
            <ion-label position="stacked">Contrasena</ion-label>
            <ion-input
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Contrasena"
              [required]="mode() === 'password'"
              autocomplete="current-password"
            ></ion-input>
          </ion-item>

          <ion-text color="success" *ngIf="message()">
            <p class="message-text">{{ message() }}</p>
          </ion-text>

          <ion-text color="danger" *ngIf="error()">
            <p class="error-text">{{ error() }}</p>
          </ion-text>

          <ion-button
            expand="block"
            type="submit"
            [disabled]="submitting()"
            class="ion-margin-top"
          >
            {{ submitting() ? 'Procesando...' : buttonLabel() }}
          </ion-button>
        </form>

        <ion-button
          expand="block"
          fill="clear"
          (click)="toggleMode()"
          class="ion-margin-top"
        >
          {{ mode() === 'password' ? 'Usar enlace magico (OTP)' : 'Usar contrasena' }}
        </ion-button>

        <ion-button
          expand="block"
          fill="clear"
          routerLink="/"
          class="ion-margin-top"
        >
          Continuar sin cuenta
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 0 auto;
      padding-top: 32px;
    }

    .brand {
      text-align: center;
      margin-bottom: 32px;
    }

    .brand h1 {
      margin: 0;
      color: #0f766e;
      font-size: 1.8rem;
    }

    .brand p {
      margin: 8px 0 0;
      color: #6b7280;
    }

    .error-text {
      padding: 8px 0;
      font-size: 0.84rem;
    }

    .message-text {
      padding: 8px 0;
      font-size: 0.84rem;
    }
  `]
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly mode = signal<'password' | 'otp'>('password');
  readonly error = signal('');
  readonly message = signal('');
  readonly submitting = signal(false);

  buttonLabel(): string {
    return this.mode() === 'password' ? 'Iniciar sesion' : 'Enviar enlace magico';
  }

  toggleMode(): void {
    this.mode.set(this.mode() === 'password' ? 'otp' : 'password');
    this.error.set('');
    this.message.set('');
  }

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.message.set('');
    this.submitting.set(true);

    try {
      if (this.mode() === 'otp') {
        const result = await this.auth.signInWithOtp(this.email);
        this.submitting.set(false);
        if (result.error) {
          this.error.set(result.error);
          return;
        }
        this.message.set('Revisa tu correo para el enlace magico.');
      } else {
        const result = await this.auth.signInWithEmail(this.email, this.password);
        this.submitting.set(false);
        if (result.error) {
          this.error.set(result.error);
          return;
        }
        this.router.navigate(['/']);
      }
    } catch {
      this.submitting.set(false);
      this.error.set('Error al iniciar sesion. Intenta de nuevo.');
    }
  }
}
