import { Routes } from '@angular/router';
import { numericIdMatcher } from '../../shared/presentation/route-matchers';

/** Lazy-loaded routes of the Rooms workspace. */
export const roomsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'availability' },
  {
    path: 'availability',
    title: 'Room Availability',
    loadComponent: () =>
      import('./views/room-availability/room-availability.component').then(
        (m) => m.RoomAvailabilityComponent,
      ),
  },
  {
    path: 'room-types',
    title: 'Room Types',
    loadComponent: () =>
      import('./views/room-type-list/room-type-list.component').then(
        (m) => m.RoomTypeListComponent,
      ),
  },
  {
    matcher: numericIdMatcher(),
    title: 'Room',
    loadComponent: () =>
      import('./views/room-detail/room-detail.component').then(
        (m) => m.RoomDetailComponent,
      ),
  },
];
