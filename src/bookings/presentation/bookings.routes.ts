import { Routes } from '@angular/router';

/** Lazy-loaded routes of the Bookings workspace. */
export const bookingsRoutes: Routes = [
  {
    path: '',
    title: 'Bookings',
    loadComponent: () =>
      import('./views/booking-list/booking-list.component').then(
        (m) => m.BookingListComponent,
      ),
  },
];
