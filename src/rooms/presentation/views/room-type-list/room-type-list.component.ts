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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { formatMoney } from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { StatusTagComponent } from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ConfirmService } from '../../../../shared/presentation/services/confirm.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { RoomsStore } from '../../../application/rooms.store';
import { RoomType } from '../../../domain/model/room-type.entity';
import { RoomsError } from '../../../domain/model/rooms.error';
import { RoomAvatarComponent } from '../../components/room-avatar/room-avatar.component';
import { RoomTypeFormComponent } from '../../components/room-type-form/room-type-form.component';
import { RoomsLayoutComponent } from '../../components/rooms-layout/rooms-layout.component';

/** Row of the room types table. */
interface RoomTypeRow {
  id: number | null;
  roomType: RoomType;
  roomsCount: number;
}

/**
 * Room types of the property, with their capacity, beds, rooms, and base rate.
 * Room types that no room uses can be removed.
 */
@Component({
  selector: 'app-room-type-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RoomsLayoutComponent,
    LayoutBodyDirective,
    RoomAvatarComponent,
    StatusTagComponent,
  ],
  templateUrl: './room-type-list.component.html',
})
export class RoomTypeListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly displayedColumns = [
    'name',
    'capacity',
    'beds',
    'rooms',
    'baseRate',
    'status',
    'actions',
  ];
  protected readonly search = signal('');
  protected readonly filteredRoomTypes = computed<RoomTypeRow[]>(() => {
    const query = this.search().trim().toLowerCase();
    return this.store
      .roomTypes()
      .filter((roomType) =>
        `${roomType.name} ${roomType.bedConfiguration}`
          .toLowerCase()
          .includes(query),
      )
      .map((roomType) => ({
        roomType,
        id: roomType.id,
        roomsCount: this.store.getRoomsByRoomType(roomType.id).length,
      }));
  });

  private readonly sort = viewChild(MatSort);
  protected readonly dataSource = signalTableDataSource(
    this.filteredRoomTypes,
    this.sort,
    signal(undefined),
    {
      name: (row) => row.roomType.name,
      capacity: (row) => row.roomType.capacity,
      rooms: (row) => row.roomsCount,
      baseRate: (row) => row.roomType.baseNightlyRate,
    },
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.search.set(''));
    });
  }

  /** @param value - Count to format for the active locale. */
  protected count(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param amount - Amount in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(
      amount,
      this.store.currentProperty()?.currency ?? 'PEN',
      this.i18n.locale(),
    );
  }

  /**
   * Opens the room type form to add or edit a room type.
   * @param roomType - Room type to edit; none to add one.
   */
  protected openRoomTypeForm(roomType: RoomType | null = null): void {
    this.dialog
      .open<RoomTypeFormComponent, RoomType | null, RoomType>(
        RoomTypeFormComponent,
        drawerConfig(roomType),
      )
      .afterClosed()
      .subscribe(
        (saved) =>
          saved &&
          this.toast.add({
            severity: 'success',
            summary: this.i18n.t('rooms.room-type-list.saved'),
          }),
      );
  }

  /**
   * Asks for confirmation and removes a room type that no room uses.
   * @param roomType - Room type to remove.
   */
  protected async confirmDelete(roomType: RoomType): Promise<void> {
    const accepted = await this.confirm.require({
      message: this.i18n.t('rooms.room-type-list.confirm-delete', {
        name: roomType.name,
      }),
      header: this.i18n.t('rooms.room-type-list.delete-header'),
      acceptLabel: this.i18n.t('rooms.room-type-list.confirm'),
      rejectLabel: this.i18n.t('rooms.room-type-list.cancel'),
      danger: true,
    });
    if (!accepted) return;
    try {
      await this.store.deleteRoomType(roomType);
      this.toast.add({
        severity: 'success',
        summary: this.i18n.t('rooms.room-type-list.removed'),
      });
    } catch (error) {
      const errorCode = error instanceof RoomsError ? error.code : 'connection';
      this.toast.add({
        severity: 'error',
        summary: this.i18n.t(`rooms.rooms-terms.errors.${errorCode}`),
        life: 6000,
      });
    }
  }
}
