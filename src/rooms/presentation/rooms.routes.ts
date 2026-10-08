import { Routes } from '@angular/router';

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
];
