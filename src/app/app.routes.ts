import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'today'},
  {
    path: 'today',
    loadComponent: () => import('./pages/today/today.page').then(m => m.TodayPage),
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add/add.page').then(m => m.AddPage),
  },
  {
    path: 'templates',
    loadComponent: () => import('./pages/templates/templates.page').then(m => m.TemplatesPage),
  },
  {
    path: 'templates/:id/edit',
    loadComponent: () => import('./pages/templates/template-edit.page').then(m => m.TemplateEditPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage),
  },
];
