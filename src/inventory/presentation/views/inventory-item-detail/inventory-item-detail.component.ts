import { Component, computed, inject, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { signal } from '@angular/core';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryItem } from '../../../domain/model/inventory-item.entity';
import { InventoryError } from '../../../domain/model/inventory.error';
import { InventoryItemAvatarComponent } from '../../components/inventory-item-avatar/inventory-item-avatar.component';
import { InventoryItemFormComponent } from '../../components/inventory-item-form/inventory-item-form.component';
import { InventoryLayoutComponent } from '../../components/inventory-layout/inventory-layout.component';
import { StockAdjustmentFormComponent } from '../../components/stock-adjustment-form/stock-adjustment-form.component';
import { StockConditionTagComponent } from '../../components/stock-condition-tag/stock-condition-tag.component';

/**
 * Inventory item detail: movement history, details, and stock by storage location.
 */
@Component({
  selector: 'app-inventory-item-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    InventoryLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    InventoryItemAvatarComponent,
    StockConditionTagComponent,
  ],
  templateUrl: './inventory-item-detail.component.html',
})
export class InventoryItemDetailComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Inventory item identifier from the route. */
  readonly id = input.required<string>();

  protected readonly historyColumns = [
    'recordedAt',
    'operation',
    'change',
    'storage',
    'reason',
    'operator',
  ];
  protected readonly inventoryItem = computed(() =>
    this.store.getInventoryItemById(this.id()),
  );
  /** Newest movements first. */
  protected readonly stockHistory = computed(() =>
    [...(this.inventoryItem()?.adjustments ?? [])].reverse(),
  );
  protected readonly itemFacts = computed(() => {
    const item = this.inventoryItem();
    if (!item) return [];
    return [
      {
        label: this.i18n.t('inventory.inventory-item-detail.category'),
        value: this.i18n.t(
          `inventory.inventory-terms.categories.${item.category}`,
        ),
      },
      {
        label: this.i18n.t('inventory.inventory-item-detail.unit'),
        value: this.i18n.t(`inventory.inventory-terms.units.${item.unit}`),
      },
      {
        label: this.i18n.t('inventory.inventory-item-detail.threshold'),
        value: this.number(item.lowStockThreshold),
      },
      {
        label: this.i18n.t('inventory.inventory-item-detail.primary-storage'),
        value: this.storageLocationName(item.primaryLocationId),
      },
      {
        label: this.i18n.t('inventory.inventory-item-detail.property'),
        value: this.store.currentProperty()?.name,
      },
    ];
  });

  private readonly paginator = viewChild(MatPaginator);
  protected readonly historySource = signalTableDataSource(
    this.stockHistory,
    signal(undefined),
    this.paginator,
    {},
  );

  /** @param value - Number to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param id - Storage location whose name is shown. */
  protected storageLocationName(id: number | null): string {
    return this.store.getStorageLocationById(id)?.name ?? '—';
  }

  /** @param value - ISO date-time of a movement. */
  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  /** @param operator - Recorded operator, shown by its display name. */
  protected operatorName(operator: string): string {
    return operator === 'Demo operator'
      ? this.i18n.t('inventory.inventory-terms.demo-operator')
      : operator;
  }

  /** Opens the form to edit the item. */
  protected editItem(): void {
    this.dialog
      .open<InventoryItemFormComponent, InventoryItem | null, InventoryItem>(
        InventoryItemFormComponent,
        drawerConfig(this.inventoryItem() ?? null),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Opens the form to adjust the item's stock. */
  protected adjustStock(): void {
    this.dialog
      .open<StockAdjustmentFormComponent, InventoryItem, InventoryItem>(
        StockAdjustmentFormComponent,
        drawerConfig(this.inventoryItem()!),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** @param storageLocationId - Empty, non-primary location removed from the item. */
  protected async removeAssignment(storageLocationId: number): Promise<void> {
    try {
      await this.store.unassignStorageLocation(
        this.inventoryItem()!,
        storageLocationId,
      );
      this.notifySaved();
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
      summary: this.i18n.t('inventory.inventory-item-detail.saved'),
    });
  }
}
