import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  {
    path: 'today',
    loadComponent: () => import('./pages/today/today.page').then(m => m.TodayPage),
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add/add.page').then(m => m.AddPage),
  },
];
