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
    path: 'new',
    title: 'New Booking',
    loadComponent: () =>
      import('./views/booking-form/booking-form.component').then(
        (m) => m.BookingFormComponent,
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
  {
    matcher: numericIdMatcher('edit'),
    title: 'Edit Booking',
    loadComponent: () =>
      import('./views/booking-form/booking-form.component').then(
        (m) => m.BookingFormComponent,
      ),
  },
  {
    matcher: numericIdMatcher('check-in'),
    title: 'Check-in',
    loadComponent: () =>
      import('./views/booking-check-in/booking-check-in.component').then(
        (m) => m.BookingCheckInComponent,
      ),
  },
];
