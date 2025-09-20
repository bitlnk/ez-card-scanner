import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: 'home',
  //   loadComponent: () => import('./card-scanner/card-scanner.component').then((m) => m.CardScannerComponent),
  // },
  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full',
  // },
  { path: '', redirectTo: 'scanner', pathMatch: 'full' },
  { path: 'scanner', loadComponent: () => import('./pages/scanner/scanner.page').then(m => m.ScannerPage) },
  { path: 'cards', loadComponent: () => import('./pages/cards-list/cards-list.page').then(m => m.CardsListPage) },
];
