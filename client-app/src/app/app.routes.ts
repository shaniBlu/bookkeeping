import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./component/mainpage.component/mainpage.component').then(m => m.MainpageComponent) },
  { path: 'income', loadComponent: () => import('./component/income.component/income.component').then(m => m.IncomeComponent) },
  { path: 'statistics', loadComponent: () => import('./component/statistics.component/statistics.component').then(m => m.StatisticsComponent) },
  { path: '**', redirectTo: '' }
];


