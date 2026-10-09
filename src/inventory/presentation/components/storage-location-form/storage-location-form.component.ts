import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { InventoryError } from '../../../domain/model/inventory.error';
import {
  StorageLocation,
  StorageLocationType,
} from '../../../domain/model/storage-location.entity';

/**
 * Side sheet that creates or edits a storage location; its code is fixed once created.
 * It closes with the saved location. Its data is the location to edit, or null.
 */
@Component({
  selector: 'app-storage-location-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  templateUrl: './storage-location-form.component.html',
})
export class StorageLocationFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  protected readonly storageLocation = inject<StorageLocation | null>(
    MAT_DIALOG_DATA,
  );
  private readonly dialogRef = inject(
    MatDialogRef<StorageLocationFormComponent, StorageLocation>,
  );
  protected readonly types = StorageLocation.types;

  protected readonly name = signal(this.storageLocation?.name ?? '');
  protected readonly code = signal(this.storageLocation?.code ?? '');
  protected readonly type = signal<StorageLocationType>(
    this.storageLocation?.type ?? 'warehouse',
  );
  protected readonly area = signal(this.storageLocation?.area ?? '');
  protected readonly responsibleTeam = signal(
    this.storageLocation?.responsibleTeam ?? '',
  );
  protected readonly description = signal(
    this.storageLocation?.description ?? '',
  );
  protected readonly errorCode = signal('');
  protected readonly isEdit = !!this.storageLocation;

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** Saves the storage location and closes the side sheet. */
  protected async saveStorageLocation(): Promise<void> {
    this.errorCode.set('');
    const storageLocation = new StorageLocation({
      id: this.storageLocation?.id ?? null,
      propertyId:
        this.storageLocation?.propertyId ?? this.store.currentPropertyId(),
      name: this.name(),
      code: this.code(),
      type: this.type(),
      area: this.area(),
      responsibleTeam: this.responsibleTeam(),
      description: this.description(),
    });
    try {
      const savedStorageLocation = this.isEdit
        ? await this.store.updateStorageLocation(storageLocation)
        : await this.store.addStorageLocation(storageLocation);
      this.dialogRef.close(savedStorageLocation);
    } catch (error) {
      this.errorCode.set(
        error instanceof InventoryError ? error.code : 'connection',
      );
    }
  }
}
