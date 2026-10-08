import { Routes } from '@angular/router';

/** Routes of the Overview bounded context. */
export const overviewRoutes: Routes = [
  {
    path: '',
    title: 'Overview',
    loadComponent: () =>
      import('./views/overview/overview.component').then(
        (m) => m.OverviewComponent,
      ),
  },
];
