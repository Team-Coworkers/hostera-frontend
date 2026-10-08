// Lazy-loaded components
const overviewView = () => import('./views/overview-view.vue');

const overviewRoutes = [
  {
    path: '',
    name: 'overview',
    component: overviewView,
    meta: { title: 'Overview' },
  },
];

export default overviewRoutes;
