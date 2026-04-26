import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
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
  ],
};
