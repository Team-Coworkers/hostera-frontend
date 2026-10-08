import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { StatusTagComponent } from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ConfirmService } from '../../../../shared/presentation/services/confirm.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryItem } from '../../../domain/model/inventory-item.entity';
import { InventoryError } from '../../../domain/model/inventory.error';
import { StorageLocation } from '../../../domain/model/storage-location.entity';
import { InventoryItemAvatarComponent } from '../../components/inventory-item-avatar/inventory-item-avatar.component';
import { InventoryLayoutComponent } from '../../components/inventory-layout/inventory-layout.component';
import { StockAdjustmentFormComponent } from '../../components/stock-adjustment-form/stock-adjustment-form.component';
import { StockConditionTagComponent } from '../../components/stock-condition-tag/stock-condition-tag.component';
import { StorageLocationAvatarComponent } from '../../components/storage-location-avatar/storage-location-avatar.component';
import { StorageLocationFormComponent } from '../../components/storage-location-form/storage-location-form.component';

/**
 * Storage location detail: the items kept there with their quantity, and the location's details.
 */
@Component({
  selector: 'app-storage-location-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    InventoryLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    StatusTagComponent,
    InventoryItemAvatarComponent,
    StockConditionTagComponent,
    StorageLocationAvatarComponent,
  ],
  templateUrl: './storage-location-detail.component.html',
})
export class StorageLocationDetailComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** Storage location identifier from the route. */
  readonly id = input.required<string>();

  protected readonly itemColumns = ['name', 'quantity', 'condition', 'actions'];
  protected readonly storageLocation = computed(() =>
    this.store.getStorageLocationById(this.id()),
  );
  protected readonly assignedInventoryItems = computed(() =>
    this.store
      .inventoryItems()
      .filter((item) =>
        item.stocks.some(
          (stock) => stock.locationId === this.storageLocation()?.id,
        ),
      ),
  );
  protected readonly stockAlertsCount = computed(
    () =>
      this.assignedInventoryItems().filter(
        (item) => item.stockCondition !== 'in-stock',
      ).length,
  );
  protected readonly locationFacts = computed(() => {
    const location = this.storageLocation();
    if (!location) return [];
    return [
      {
        label: this.i18n.t('inventory.storage-location-detail.type'),
        value: this.i18n.t(
          `inventory.inventory-terms.location-types.${location.type}`,
        ),
      },
      {
        label: this.i18n.t('inventory.storage-location-detail.area'),
        value: location.area,
      },
      {
        label: this.i18n.t('inventory.storage-location-detail.team'),
        value: location.responsibleTeam,
      },
      {
        label: this.i18n.t('inventory.storage-location-detail.property'),
        value: this.store.currentProperty()?.name,
      },
    ];
  });

  /** @param value - Number to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** Opens the form to edit the location. */
  protected editLocation(): void {
    this.dialog
      .open<
        StorageLocationFormComponent,
        StorageLocation | null,
        StorageLocation
      >(
        StorageLocationFormComponent,
        drawerConfig(this.storageLocation() ?? null),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** @param inventoryItem - Item whose stock changes. */
  protected openStockAdjustmentForm(inventoryItem: InventoryItem): void {
    this.dialog
      .open<StockAdjustmentFormComponent, InventoryItem, InventoryItem>(
        StockAdjustmentFormComponent,
        drawerConfig(inventoryItem),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Removes the location after confirmation and returns to the list. */
  protected async confirmDelete(): Promise<void> {
    const storageLocation = this.storageLocation()!;
    const accepted = await this.confirm.require({
      message: this.i18n.t('inventory.storage-location-detail.confirm-delete', {
        name: storageLocation.name,
      }),
      header: this.i18n.t('inventory.storage-location-detail.delete-header'),
      acceptLabel: this.i18n.t('inventory.storage-location-detail.confirm'),
      rejectLabel: this.i18n.t('inventory.storage-location-detail.cancel'),
      danger: true,
    });
    if (!accepted) return;
    try {
      await this.store.deleteStorageLocation(storageLocation);
      this.toast.add({
        severity: 'success',
        summary: this.i18n.t('inventory.storage-location-detail.removed'),
      });
      await this.router.navigateByUrl('/inventory/storage-locations');
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

  /** Confirms that changes were saved. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('inventory.storage-location-detail.saved'),
    });
  }
}
