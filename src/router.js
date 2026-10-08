import { createRouter, createWebHistory } from 'vue-router';
import Home from './shared/presentation/views/home.vue';
import inventoryRoutes from './inventory/presentation/inventory-routes.js';
import roomsRoutes from './rooms/presentation/rooms-routes.js';
import bookingsRoutes from './bookings/presentation/bookings-routes.js';
import accessControlRoutes from './access-control/presentation/access-control-routes.js';
import overviewRoutes from './overview/presentation/overview-routes.js';

const routes = [
  { path: '/home', name: 'home', component: Home, meta: { title: 'Home' } },
  { path: '/bookings', children: bookingsRoutes },
  { path: '/access-control', children: accessControlRoutes },
  {
    path: '/rooms',
    name: 'rooms',
    redirect: { name: 'rooms-availability' },
    children: roomsRoutes,
  },
  {
    path: '/inventory',
    name: 'inventory',
    redirect: { name: 'inventory-items' },
    children: inventoryRoutes,
  },
  { path: '/', children: overviewRoutes },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

/**
 * Global navigation guard that updates the document title.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @returns {boolean} - Returns true to allow navigation.
 */
router.beforeEach((to) => {
  // Set the page title
  let baseTitle = 'Hostera';
  document.title = to.meta['title']
    ? `${baseTitle} - ${to.meta['title']}`
    : baseTitle;
  return true;
});

export default router;
