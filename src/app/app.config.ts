import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideServiceWorker} from '@angular/service-worker';
import {provideCharts} from 'ng2-charts';
import {BarController, BarElement, CategoryScale, LinearScale, Tooltip} from 'chart.js';

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideCharts({
      registerables: [BarController, BarElement, CategoryScale, LinearScale, Tooltip],
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
