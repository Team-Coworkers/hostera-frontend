import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { StatusTagComponent } from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ConfirmService } from '../../../../shared/presentation/services/confirm.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryError } from '../../../domain/model/inventory.error';
import {
  StorageLocation,
  StorageLocationType,
} from '../../../domain/model/storage-location.entity';
import { InventoryLayoutComponent } from '../../components/inventory-layout/inventory-layout.component';
import { StorageLocationAvatarComponent } from '../../components/storage-location-avatar/storage-location-avatar.component';
import { StorageLocationFormComponent } from '../../components/storage-location-form/storage-location-form.component';

/**
 * Storage locations of the property, filterable by type, with their items and stock alerts.
 */
@Component({
  selector: 'app-storage-location-list',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    InventoryLayoutComponent,
    LayoutBodyDirective,
    StatusTagComponent,
    StorageLocationAvatarComponent,
  ],
  templateUrl: './storage-location-list.component.html',
  styles: `
    .type-filter {
      --mat-standard-button-toggle-height: 2.25rem;
    }
  `,
})
export class StorageLocationListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly displayedColumns = [
    'name',
    'type',
    'assignedItems',
    'alerts',
    'area',
    'team',
    'actions',
  ];
  protected readonly search = signal('');
  protected readonly typeFilter = signal<'all' | StorageLocationType>('all');

  protected readonly typeOptions = computed(() => [
    {
      value: 'all' as const,
      label: this.i18n.t('inventory.storage-location-list.all'),
      count: this.store.storageLocationsCount(),
    },
    ...StorageLocation.types.map((value) => ({
      value,
      label: this.i18n.t(`inventory.inventory-terms.location-types.${value}`),
      count: this.store
        .storageLocations()
        .filter((storageLocation) => storageLocation.type === value).length,
    })),
  ]);
  protected readonly filteredStorageLocations = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.store
      .storageLocations()
      .filter(
        (storageLocation) =>
          `${storageLocation.name} ${storageLocation.code}`
            .toLowerCase()
            .includes(query) &&
          (this.typeFilter() === 'all' ||
            storageLocation.type === this.typeFilter()),
      );
  });

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredStorageLocations,
    this.sort,
    this.paginator,
    { name: (location) => location.name },
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.resetFilters());
    });
  }

  /** @param value - Number to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param id - Storage location whose assigned items are counted. */
  protected assignedItemsCount(id: number | null): number {
    return this.store
      .inventoryItems()
      .filter((item) => item.stocks.some((stock) => stock.locationId === id))
      .length;
  }

  /** @param id - Storage location whose items with low or no stock are counted. */
  protected stockAlertsCount(id: number | null): number {
    return this.store
      .inventoryItems()
      .filter(
        (item) =>
          item.stocks.some((stock) => stock.locationId === id) &&
          item.stockCondition !== 'in-stock',
      ).length;
  }

  /** Clears the search text and the type filter. */
  protected resetFilters(): void {
    this.search.set('');
    this.typeFilter.set('all');
  }

  /** @param id - Storage location to open. */
  protected navigateToDetail(id: number | null): void {
    this.router.navigate(['/inventory/storage-locations', id]);
  }

  /** @param storageLocation - Location to edit; none to add one. */
  protected openStorageLocationForm(
    storageLocation: StorageLocation | null = null,
  ): void {
    this.dialog
      .open<
        StorageLocationFormComponent,
        StorageLocation | null,
        StorageLocation
      >(StorageLocationFormComponent, drawerConfig(storageLocation))
      .afterClosed()
      .subscribe(
        (saved) =>
          saved &&
          this.toast.add({
            severity: 'success',
            summary: this.i18n.t('inventory.storage-location-list.saved'),
          }),
      );
  }

  /** @param storageLocation - Location removed after confirmation. */
  protected async confirmDelete(
    storageLocation: StorageLocation,
  ): Promise<void> {
    const accepted = await this.confirm.require({
      message: this.i18n.t('inventory.storage-location-list.confirm-delete', {
        name: storageLocation.name,
      }),
      header: this.i18n.t('inventory.storage-location-list.delete-header'),
      acceptLabel: this.i18n.t('inventory.storage-location-list.confirm'),
      rejectLabel: this.i18n.t('inventory.storage-location-list.cancel'),
      danger: true,
    });
    if (!accepted) return;
    try {
      await this.store.deleteStorageLocation(storageLocation);
      this.toast.add({
        severity: 'success',
        summary: this.i18n.t('inventory.storage-location-list.removed'),
      });
    } catch (error) {
      const errorCode =
        error instanceof InventoryError ? error.code : 'connection';
      this.toast.add({
        severity: 'error',
        summary: this.i18n.t(`inventory.inventory-terms.errors.${errorCode}`),
        life: 6000,
      });
    }
  }
}
