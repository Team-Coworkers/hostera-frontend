import { Routes } from '@angular/router';

/** Lazy-loaded routes of the Access Control workspace. */
export const accessControlRoutes: Routes = [
  {
    path: '',
    title: 'Access Control',
    loadComponent: () =>
      import('./views/credential-list/credential-list.component').then(
        (m) => m.CredentialListComponent,
      ),
  },
];
