import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
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
import {
  InventoryItem,
  InventoryUnit,
} from '../../../domain/model/inventory-item.entity';
import { InventoryError } from '../../../domain/model/inventory.error';

/**
 * Side sheet that creates an inventory item with its opening stock, or edits one;
 * it closes with the saved item. Its data is the item to edit, or null.
 */
@Component({
  selector: 'app-inventory-item-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  templateUrl: './inventory-item-form.component.html',
})
export class InventoryItemFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  protected readonly inventoryItem = inject<InventoryItem | null>(
    MAT_DIALOG_DATA,
  );
  private readonly dialogRef = inject(
    MatDialogRef<InventoryItemFormComponent, InventoryItem>,
  );
  protected readonly categories = InventoryItem.categories;
  protected readonly units = InventoryItem.units;

  protected readonly name = signal(this.inventoryItem?.name ?? '');
  protected readonly code = signal(this.inventoryItem?.code ?? '');
  protected readonly category = signal(this.inventoryItem?.category ?? 'linen');
  protected readonly unit = signal<InventoryUnit>(
    this.inventoryItem?.unit ?? 'units',
  );
  protected readonly primaryLocationId = signal<number | null>(
    this.inventoryItem?.primaryLocationId ??
      this.store.storageLocations()[0]?.id ??
      null,
  );
  protected readonly lowStockThreshold = signal<number | null>(
    this.inventoryItem?.lowStockThreshold ?? 10,
  );
  protected readonly openingQuantity = signal<number | null>(0);
  protected readonly errorCode = signal('');
  protected readonly isEdit = !!this.inventoryItem;
  protected readonly unitLocked = !!this.inventoryItem?.adjustments.length;

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** Saves the inventory item and closes the side sheet. */
  protected async saveInventoryItem(): Promise<void> {
    this.errorCode.set('');
    const inventoryItem = new InventoryItem({
      id: this.inventoryItem?.id ?? null,
      propertyId:
        this.inventoryItem?.propertyId ?? this.store.currentPropertyId(),
      name: this.name(),
      code: this.code(),
      category: this.category(),
      unit: this.unit(),
      primaryLocationId: this.primaryLocationId(),
      lowStockThreshold: Number(this.lowStockThreshold() ?? 0),
      stocks: this.inventoryItem?.stocks ?? [],
      adjustments: this.inventoryItem?.adjustments ?? [],
    });
    try {
      const savedInventoryItem = this.isEdit
        ? await this.store.updateInventoryItem(inventoryItem)
        : await this.store.addInventoryItem(
            inventoryItem,
            Number(this.openingQuantity() ?? 0),
          );
      this.dialogRef.close(savedInventoryItem);
    } catch (error) {
      this.errorCode.set(
        error instanceof InventoryError ? error.code : 'connection',
      );
    }
  }
}
