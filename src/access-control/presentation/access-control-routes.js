// Lazy-loaded components
const credentialList = () => import('./views/credential-list.vue');
const credentialDetail = () => import('./views/credential-detail.vue');
const accessEventList = () => import('./views/access-event-list.vue');

const accessControlRoutes = [
  {
    path: '',
    name: 'access-control-credentials',
    component: credentialList,
    meta: { title: 'Access Control' },
  },
  {
    path: 'credentials/:id(\\d+)',
    name: 'access-control-credential-detail',
    component: credentialDetail,
    meta: { title: 'Credential' },
  },
  {
    path: 'events',
    name: 'access-control-events',
    component: accessEventList,
    meta: { title: 'Access Events' },
  },
];

export default accessControlRoutes;
