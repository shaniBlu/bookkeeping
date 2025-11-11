import { Routes } from '@angular/router';
import { MainpageComponent } from './component/mainpage.component/mainpage.component';
import { IncomeComponent } from './component/income.component/income.component';

export const routes: Routes = [
  { path: '', component: MainpageComponent },
  { path: 'income', loadComponent: () => import('./component/income.component/income.component').then(m => m.IncomeComponent) },
  { path: '**', redirectTo: '' }

];

