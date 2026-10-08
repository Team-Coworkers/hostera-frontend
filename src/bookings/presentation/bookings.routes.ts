import { Routes } from '@angular/router';
import { numericIdMatcher } from '../../shared/presentation/route-matchers';

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
  {
    matcher: numericIdMatcher(),
    title: 'Booking',
    loadComponent: () =>
      import('./views/booking-detail/booking-detail.component').then(
        (m) => m.BookingDetailComponent,
      ),
  },
];
