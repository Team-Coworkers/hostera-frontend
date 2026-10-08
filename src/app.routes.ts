import { Routes } from '@angular/router';

/**
 * Application routes. Each bounded context lazy-loads its own routes, and each view
 * is a lazy standalone component; `title` replaces the `meta.title` of the Vue router.
 */
export const routes: Routes = [
  {
    path: 'inventory',
    loadChildren: () =>
      import('./inventory/presentation/inventory.routes').then(
        (m) => m.inventoryRoutes,
      ),
  },
  {
    path: 'home',
    title: 'Home',
    loadComponent: () =>
      import('./shared/presentation/views/home/home.component').then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Home',
    loadComponent: () =>
      import('./shared/presentation/views/home/home.component').then(
        (m) => m.HomeComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
