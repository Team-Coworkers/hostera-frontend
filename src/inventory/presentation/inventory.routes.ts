import { Routes } from '@angular/router';

/** Lazy-loaded routes of the Inventory workspace. */
export const inventoryRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  {
    path: 'items',
    title: 'Inventory Items',
    loadComponent: () =>
      import('./views/inventory-item-list/inventory-item-list.component').then(
        (m) => m.InventoryItemListComponent,
      ),
  },
  {
    path: 'items/:id',
    title: 'Inventory Item',
    loadComponent: () =>
      import('./views/inventory-item-detail/inventory-item-detail.component').then(
        (m) => m.InventoryItemDetailComponent,
      ),
  },
];
