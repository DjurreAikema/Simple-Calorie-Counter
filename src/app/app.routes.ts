import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {path: '', pathMatch: 'full', redirectTo: 'today'},
      {
        path: 'today',
        loadComponent: () => import('./pages/today/today.page').then(m => m.TodayPage),
      },
      {
        path: 'week',
        loadComponent: () => import('./pages/week/week.page').then(m => m.WeekPage),
      },
    ],
  },
  {
    path: 'add',
    loadComponent: () => import('./pages/add/add.page').then(m => m.AddPage),
  },
  {
    path: 'entries/:id/edit',
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
