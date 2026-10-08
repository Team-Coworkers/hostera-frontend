// Lazy-loaded components
const inventoryItemList = () => import('./views/inventory-item-list.vue');
const inventoryItemDetail = () => import('./views/inventory-item-detail.vue');
const storageLocationList = () => import('./views/storage-location-list.vue');
const storageLocationDetail = () =>
  import('./views/storage-location-detail.vue');

const inventoryRoutes = [
  {
    path: 'items',
    name: 'inventory-items',
    component: inventoryItemList,
    meta: { title: 'Inventory Items' },
  },
  {
    path: 'items/:id',
    name: 'inventory-item-detail',
    component: inventoryItemDetail,
    meta: { title: 'Inventory Item' },
  },
  {
    path: 'storage-locations',
    name: 'inventory-storage-locations',
    component: storageLocationList,
    meta: { title: 'Storage Locations' },
  },
  {
    path: 'storage-locations/:id',
    name: 'inventory-storage-location-detail',
    component: storageLocationDetail,
    meta: { title: 'Storage Location' },
  },
];

export default inventoryRoutes;
