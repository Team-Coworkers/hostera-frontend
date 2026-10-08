// Lazy-loaded components
const bookingList = () => import('./views/booking-list.vue');
const bookingDetail = () => import('./views/booking-detail.vue');
const bookingForm = () => import('./views/booking-form.vue');
const bookingCheckIn = () => import('./views/booking-check-in.vue');
const bookingCheckOut = () => import('./views/booking-check-out.vue');

const bookingsRoutes = [
  {
    path: '',
    name: 'bookings-list',
    component: bookingList,
    meta: { title: 'Bookings' },
  },
  {
    path: 'new',
    name: 'bookings-booking-new',
    component: bookingForm,
    meta: { title: 'New Booking' },
  },
  {
    path: ':id(\\d+)',
    name: 'bookings-booking-detail',
    component: bookingDetail,
    meta: { title: 'Booking' },
  },
  {
    path: ':id(\\d+)/edit',
    name: 'bookings-booking-edit',
    component: bookingForm,
    meta: { title: 'Edit Booking' },
  },
  {
    path: ':id(\\d+)/check-in',
    name: 'bookings-booking-check-in',
    component: bookingCheckIn,
    meta: { title: 'Check-in' },
  },
  {
    path: ':id(\\d+)/check-out',
    name: 'bookings-booking-check-out',
    component: bookingCheckOut,
    meta: { title: 'Check-out' },
  },
];

export default bookingsRoutes;
