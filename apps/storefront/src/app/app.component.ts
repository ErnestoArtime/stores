import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ToastContainerComponent } from '@stores/shared/shell';

@Component({
  selector: 'stores-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, ToastContainerComponent],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <stores-toast-container></stores-toast-container>
    </ion-app>
  `
})
export class AppComponent {}
