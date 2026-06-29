import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  bagHandleOutline,
  bicycleOutline,
  chevronForwardOutline,
  heartOutline,
  homeOutline,
  locationOutline,
  menuOutline,
  phonePortraitOutline,
  searchOutline,
  sparklesOutline,
  star,
  timeOutline
} from 'ionicons/icons';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

addIcons({
  bagHandleOutline,
  bicycleOutline,
  chevronForwardOutline,
  heartOutline,
  homeOutline,
  locationOutline,
  menuOutline,
  phonePortraitOutline,
  searchOutline,
  sparklesOutline,
  star,
  timeOutline
});

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
