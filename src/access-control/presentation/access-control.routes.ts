import { Routes } from '@angular/router';
import { numericIdMatcher } from '../../shared/presentation/route-matchers';

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
  {
    path: 'credentials',
    children: [
      {
        matcher: numericIdMatcher(),
        title: 'Credential',
        loadComponent: () =>
          import('./views/credential-detail/credential-detail.component').then(
            (m) => m.CredentialDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'events',
    title: 'Access Events',
    loadComponent: () =>
      import('./views/access-event-list/access-event-list.component').then(
        (m) => m.AccessEventListComponent,
      ),
  },
];
