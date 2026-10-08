import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { InventoryStore } from '../../../application/inventory.store';
import { AdjustStockCommand } from '../../../domain/adjust-stock.command';
import { InventoryItem } from '../../../domain/model/inventory-item.entity';
import { InventoryError } from '../../../domain/model/inventory.error';
import {
  StockAdjustment,
  StockOperation,
} from '../../../domain/model/stock-adjustment.entity';

const operationIcons: Record<StockOperation, string> = {
  in: 'add_circle',
  out: 'remove_circle',
  transfer: 'swap_horiz',
};

/**
 * Side sheet that receives, issues, or transfers stock of an inventory item;
 * it closes with the adjusted item.
 */
@Component({
  selector: 'app-stock-adjustment-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  templateUrl: './stock-adjustment-form.component.html',
})
export class StockAdjustmentFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  protected readonly inventoryItem = inject<InventoryItem>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<StockAdjustmentFormComponent, InventoryItem>,
  );
  protected readonly operations = AdjustStockCommand.operations;
  protected readonly operationIcons = operationIcons;

  protected readonly operation = signal<StockOperation>('in');
  protected readonly quantity = signal<number | null>(null);
  protected readonly locationId = signal<number | null>(
    this.inventoryItem.primaryLocationId,
  );
  protected readonly destinationLocationId = signal<number | null>(null);
  protected readonly reason = signal('supplier-delivery');
  protected readonly note = signal('');
  protected readonly errorCode = signal('');

  protected readonly unitLabel = computed(() =>
    this.i18n.t(`inventory.inventory-terms.units.${this.inventoryItem.unit}`),
  );
  protected readonly reasons = computed(() =>
    StockAdjustment.reasons[this.operation()].filter(
      (reason) => reason !== 'opening-stock',
    ),
  );
  protected readonly destinationLocations = computed(() =>
    this.store
      .storageLocations()
      .filter((storageLocation) => storageLocation.id !== this.locationId()),
  );
  protected readonly currentQuantity = computed(() =>
    this.inventoryItem.quantityAt(this.locationId()),
  );
  protected readonly resultingQuantity = computed(
    () =>
      this.currentQuantity() +
      (this.operation() === 'in' ? 1 : -1) * Number(this.quantity() ?? 0),
  );

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** @param value - Quantity to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param operation - Selected operation; its first reason becomes the default. */
  protected changeOperation(operation: StockOperation): void {
    this.operation.set(operation);
    this.reason.set(this.reasons()[0] ?? '');
    this.errorCode.set('');
  }

  /** @param locationId - Selected origin; a destination equal to it is cleared. */
  protected changeLocation(locationId: number | null): void {
    this.locationId.set(locationId);
    if (this.destinationLocationId() === locationId)
      this.destinationLocationId.set(null);
  }

  /** Applies the stock change and closes the side sheet. */
  protected async performStockAdjustment(): Promise<void> {
    this.errorCode.set('');
    const command = new AdjustStockCommand({
      inventoryItemId: this.inventoryItem.id!,
      operation: this.operation(),
      quantity: this.quantity() === null ? NaN : Number(this.quantity()),
      locationId: this.locationId(),
      destinationLocationId: this.destinationLocationId(),
      reason: this.reason(),
      note: this.note(),
    });
    try {
      this.dialogRef.close(await this.store.adjustStock(command));
    } catch (error) {
      this.errorCode.set(
        error instanceof InventoryError ? error.code : 'connection',
      );
    }
  }
}
