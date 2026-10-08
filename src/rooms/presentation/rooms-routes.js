// Lazy-loaded components
const roomAvailability = () => import('./views/room-availability.vue');
const roomDetail = () => import('./views/room-detail.vue');
const roomTypeList = () => import('./views/room-type-list.vue');
const roomRates = () => import('./views/room-rates.vue');

const roomsRoutes = [
  {
    path: 'availability',
    name: 'rooms-availability',
    component: roomAvailability,
    meta: { title: 'Room Availability' },
  },
  {
    path: 'room-types',
    name: 'rooms-room-types',
    component: roomTypeList,
    meta: { title: 'Room Types' },
  },
  {
    path: 'rates',
    name: 'rooms-rates',
    component: roomRates,
    meta: { title: 'Rates' },
  },
  {
    path: ':id(\\d+)',
    name: 'rooms-room-detail',
    component: roomDetail,
    meta: { title: 'Room' },
  },
];

export default roomsRoutes;
