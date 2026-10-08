import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  CalendarDate,
  currencySymbol,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { RoomsStore } from '../../../application/rooms.store';
import { RoomType } from '../../../domain/model/room-type.entity';
import { RoomsError } from '../../../domain/model/rooms.error';
import { SetDailyRatesCommand } from '../../../domain/set-daily-rates.command';

/** Data of the daily rate form: the plan, room type, and nights preselected. */
export interface DailyRateFormData {
  ratePlanId: number;
  roomTypeId: number | null;
  startDate: string;
  endDate: string;
}

/**
 * Side sheet that prices a room type's nights under a rate plan, or returns them to the
 * base nightly rate; it closes with the identifier of the rate plan.
 */
@Component({
  selector: 'app-daily-rate-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  templateUrl: './daily-rate-form.component.html',
})
export class DailyRateFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly data = inject<DailyRateFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<DailyRateFormComponent, number>,
  );

  protected readonly currency = computed(
    () => this.store.currentProperty()?.currency ?? 'PEN',
  );
  protected readonly currencySymbol = computed(() =>
    currencySymbol(this.currency(), this.i18n.locale()),
  );

  private readonly initialRoomTypeId =
    this.data.roomTypeId ??
    this.roomTypesOf(this.data.ratePlanId)[0]?.id ??
    null;
  protected readonly ratePlanId = signal(this.data.ratePlanId);
  protected readonly roomTypeId = signal<number | null>(this.initialRoomTypeId);
  protected readonly startDate = signal<Date | null>(
    CalendarDate.toDate(this.data.startDate),
  );
  protected readonly endDate = signal<Date | null>(
    CalendarDate.toDate(this.data.endDate),
  );
  protected readonly useBaseRate = signal(false);
  protected readonly amount = signal<number | null>(
    this.store.getNightlyRate(
      this.initialRoomTypeId,
      this.data.ratePlanId,
      this.data.startDate,
    ) ?? null,
  );
  protected readonly errorCode = signal('');

  protected readonly roomTypeOptions = computed(() =>
    this.roomTypesOf(this.ratePlanId()),
  );
  protected readonly selectedRatePlan = computed(() =>
    this.store.getRatePlanById(this.ratePlanId()),
  );
  protected readonly selectedRoomType = computed(() =>
    this.store.getRoomTypeById(this.roomTypeId()),
  );
  protected readonly nightsCount = computed(() => {
    const start = this.startDate();
    if (!start) return 0;
    const end = this.endDate() ?? start;
    // Rounding absorbs daylight saving changes between local midnights.
    return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  });

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /**
   * Lists the active room types sold under a rate plan.
   * @param ratePlanId - Rate plan identifier.
   */
  private roomTypesOf(ratePlanId: number): RoomType[] {
    return this.store
      .roomTypes()
      .filter(
        (roomType) =>
          roomType.isActive &&
          !!this.store.getRatePlanById(ratePlanId)?.appliesTo(roomType.id),
      );
  }

  /**
   * Changes the rate plan, keeping the room type when the plan sells it.
   * @param ratePlanId - Selected rate plan.
   */
  protected changeRatePlan(ratePlanId: number): void {
    this.ratePlanId.set(ratePlanId);
    if (!this.store.getRatePlanById(ratePlanId)?.appliesTo(this.roomTypeId()))
      this.roomTypeId.set(this.roomTypesOf(ratePlanId)[0]?.id ?? null);
    this.resetAmount();
  }

  /** @param roomTypeId - Selected room type. */
  protected changeRoomType(roomTypeId: number | null): void {
    this.roomTypeId.set(roomTypeId);
    this.resetAmount();
  }

  /** A new plan or room type starts from its current price on the first night. */
  private resetAmount(): void {
    const start = this.startDate();
    this.amount.set(
      this.store.getNightlyRate(
        this.roomTypeId(),
        this.ratePlanId(),
        start ? CalendarDate.fromDate(start) : this.data.startDate,
      ) ?? null,
    );
  }

  /** @param amount - Amount in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** Saves the nightly rates and closes the side sheet. */
  protected async saveDailyRates(): Promise<void> {
    this.errorCode.set('');
    const start = this.startDate();
    if (!start) {
      this.errorCode.set('invalid-date-range');
      return;
    }
    const roomTypeId = this.roomTypeId();
    if (!roomTypeId) {
      this.errorCode.set('required-fields');
      return;
    }
    try {
      await this.store.setDailyRates(
        new SetDailyRatesCommand({
          ratePlanId: this.ratePlanId(),
          roomTypeId,
          startDate: CalendarDate.fromDate(start),
          endDate: CalendarDate.fromDate(this.endDate() ?? start),
          useBaseRate: this.useBaseRate(),
          amount: this.useBaseRate()
            ? null
            : this.amount() === null
              ? null
              : Number(this.amount()),
        }),
      );
      this.dialogRef.close(this.ratePlanId());
    } catch (error) {
      this.errorCode.set(
        error instanceof RoomsError ? error.code : 'connection',
      );
    }
  }
}
