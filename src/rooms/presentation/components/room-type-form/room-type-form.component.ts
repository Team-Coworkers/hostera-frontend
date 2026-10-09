import { Component, computed, inject, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { currencySymbol } from '../../../../shared/presentation/calendar-format';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { RoomsStore } from '../../../application/rooms.store';
import { RoomType } from '../../../domain/model/room-type.entity';
import { RoomsError } from '../../../domain/model/rooms.error';

/**
 * Side sheet that creates or edits a room type, including its activation;
 * it closes with the saved room type. Its data is the room type to edit, or null.
 */
@Component({
  selector: 'app-room-type-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  templateUrl: './room-type-form.component.html',
})
export class RoomTypeFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly roomType = inject<RoomType | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RoomTypeFormComponent, RoomType>,
  );
  protected readonly maxCapacity = RoomType.maxCapacity;

  protected readonly name = signal(this.roomType?.name ?? '');
  protected readonly capacity = signal<number | null>(
    this.roomType?.capacity ?? 2,
  );
  protected readonly bedConfiguration = signal(
    this.roomType?.bedConfiguration ?? '',
  );
  protected readonly baseNightlyRate = signal<number | null>(
    this.roomType?.baseNightlyRate ?? null,
  );
  protected readonly active = signal(
    this.roomType ? this.roomType.isActive : true,
  );
  protected readonly errorCode = signal('');
  protected readonly isEdit = !!this.roomType;
  protected readonly roomsCount = this.roomType
    ? this.store.getRoomsByRoomType(this.roomType.id).length
    : 0;
  protected readonly currencySymbol = computed(() =>
    currencySymbol(
      this.store.currentProperty()?.currency ?? 'PEN',
      this.i18n.locale(),
    ),
  );

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** Saves the room type and closes the side sheet. */
  protected async saveRoomType(): Promise<void> {
    this.errorCode.set('');
    const roomType = new RoomType({
      id: this.roomType?.id ?? null,
      propertyId: this.roomType?.propertyId ?? this.store.currentPropertyId(),
      name: this.name(),
      capacity: Number(this.capacity()),
      bedConfiguration: this.bedConfiguration(),
      baseNightlyRate: Number(this.baseNightlyRate() ?? 0),
      status: this.active() ? 'active' : 'inactive',
    });
    try {
      const savedRoomType = this.isEdit
        ? await this.store.updateRoomType(roomType)
        : await this.store.addRoomType(roomType);
      this.dialogRef.close(savedRoomType);
    } catch (error) {
      this.errorCode.set(
        error instanceof RoomsError ? error.code : 'connection',
      );
    }
  }
}
