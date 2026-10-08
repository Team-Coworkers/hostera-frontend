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
import { MatSelectModule } from '@angular/material/select';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { RoomsStore } from '../../../application/rooms.store';
import { RoomType } from '../../../domain/model/room-type.entity';
import { Room } from '../../../domain/model/room.entity';
import { RoomsError } from '../../../domain/model/rooms.error';

/**
 * Side sheet that creates a room or edits one; it closes with the saved room.
 * Its data is the room to edit, or null for a new room.
 */
@Component({
  selector: 'app-room-form',
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
  templateUrl: './room-form.component.html',
})
export class RoomFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly room = inject<Room | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RoomFormComponent, Room>);

  protected readonly number = signal(this.room?.number ?? '');
  protected readonly roomTypeId = signal<number | null>(
    this.room?.roomTypeId ??
      this.store.roomTypes().find((roomType) => roomType.isActive)?.id ??
      null,
  );
  protected readonly floor = signal<number | null>(this.room?.floor ?? null);
  protected readonly errorCode = signal('');
  protected readonly isEdit = !!this.room;
  /** Inactive room types stay selectable only for the room that already uses them. */
  protected readonly roomTypeOptions = computed(() =>
    this.store
      .roomTypes()
      .filter(
        (roomType) =>
          roomType.isActive || roomType.id === this.room?.roomTypeId,
      ),
  );
  protected readonly selectedRoomType = computed(() =>
    this.store.getRoomTypeById(this.roomTypeId()),
  );

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** @param roomType - Room type whose capacity and beds are summarized. */
  protected summary(roomType: RoomType, key: string): string {
    return this.i18n.t(key, {
      capacity: this.i18n.t('rooms.rooms-terms.guests', {
        count: roomType.capacity,
      }),
      beds: roomType.bedConfiguration,
    });
  }

  /** Saves the room and closes the side sheet. */
  protected async saveRoom(): Promise<void> {
    this.errorCode.set('');
    const floor = this.floor();
    const room = new Room({
      id: this.room?.id ?? null,
      propertyId: this.room?.propertyId ?? this.store.currentPropertyId(),
      number: this.number(),
      roomTypeId: this.roomTypeId(),
      floor: floor === null || (floor as unknown) === '' ? null : Number(floor),
    });
    try {
      const savedRoom = this.isEdit
        ? await this.store.updateRoom(room)
        : await this.store.addRoom(room);
      this.dialogRef.close(savedRoom);
    } catch (error) {
      this.errorCode.set(
        error instanceof RoomsError ? error.code : 'connection',
      );
    }
  }
}
