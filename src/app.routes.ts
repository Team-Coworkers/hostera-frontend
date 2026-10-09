import { Routes } from '@angular/router';
import { iamRoutes } from './iam/presentation/iam.routes';
import { AppLayoutComponent } from './shared/presentation/components/app-layout/app-layout.component';

/**
 * Workspace routes, shown inside the application shell. Each bounded context lazy-loads
 * its own routes, and each view is a lazy standalone component; `title` replaces the
 * `meta.title` of the Vue router.
 */
const workspaceRoutes: Routes = [
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
    path: 'rooms',
    loadChildren: () =>
      import('./rooms/presentation/rooms.routes').then((m) => m.roomsRoutes),
  },
  {
    path: 'access-control',
    loadChildren: () =>
      import('./access-control/presentation/access-control.routes').then(
        (m) => m.accessControlRoutes,
      ),
  },
  {
    path: 'bookings',
    loadChildren: () =>
      import('./bookings/presentation/bookings.routes').then(
        (m) => m.bookingsRoutes,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./overview/presentation/overview.routes').then(
        (m) => m.overviewRoutes,
      ),
  },
];

/**
 * Application routes: the public IAM views, opened from the landing page, and the
 * workspace inside the application shell.
 */
export const routes: Routes = [
  ...iamRoutes,
  { path: '', component: AppLayoutComponent, children: workspaceRoutes },
  { path: '**', redirectTo: '' },
];
