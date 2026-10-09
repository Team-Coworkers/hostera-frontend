import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  CalendarDate,
  formatDayRange,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { BookingsStore } from '../../../application/bookings.store';
import {
  Booking,
  PreferredLanguage,
} from '../../../domain/model/booking.entity';
import { BookingsError } from '../../../domain/model/bookings.error';
import { BookingStatusTagComponent } from '../../components/booking-status-tag/booking-status-tag.component';
import { BookingsLayoutComponent } from '../../components/bookings-layout/bookings-layout.component';

/** Values of the booking form. */
interface BookingFormValues {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredLanguage: PreferredLanguage;
  checkIn: Date | null;
  checkOut: Date | null;
  guestRequest: string;
  guests: number | null;
  roomTypeId: number | null;
  roomId: number | null;
  ratePlanId: number | null;
}

/**
 * Form that creates a booking, copies one into a new booking, or edits a pending or
 * confirmed booking, quoting its total and checking room availability as it is filled.
 */
@Component({
  selector: 'app-booking-form',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    BookingsLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    BookingStatusTagComponent,
  ],
  templateUrl: './booking-form.component.html',
})
export class BookingFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  protected readonly roomsStore = inject(RoomsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Booking identifier from the route, when editing. */
  readonly id = input<string | undefined>(undefined);
  /** Booking to duplicate, from the `from` query parameter. */
  readonly from = input<string | undefined>(undefined);

  protected readonly today = CalendarDate.today();
  protected readonly minCheckIn = CalendarDate.toDate(this.today);
  protected readonly languages = Booking.preferredLanguages;

  protected readonly guestName = signal('');
  protected readonly guestEmail = signal('');
  protected readonly guestPhone = signal('');
  protected readonly preferredLanguage = signal<PreferredLanguage>('es');
  protected readonly checkIn = signal<Date | null>(null);
  protected readonly checkOut = signal<Date | null>(null);
  protected readonly guestRequest = signal('');
  protected readonly guests = signal<number | null>(2);
  protected readonly roomTypeId = signal<number | null>(null);
  protected readonly roomId = signal<number | null>(null);
  protected readonly ratePlanId = signal<number | null>(null);
  protected readonly errorCode = signal('');

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly currentBooking = computed(() => {
    const id = this.id();
    return id ? this.store.getBookingById(id) : undefined;
  });
  /** A duplicated booking is the source of a new booking's guest, guests, room type, and rate plan. */
  protected readonly sourceBooking = computed(() => {
    const from = this.from();
    return !this.isEdit() && from ? this.store.getBookingById(from) : undefined;
  });

  protected readonly datesSelected = computed(() => {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    return !!checkIn && !!checkOut && checkOut > checkIn;
  });
  /** The booking as currently entered, used to quote its price and check room availability. */
  protected readonly draft = computed(() => {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    return new Booking({
      guestName: this.guestName(),
      guestEmail: this.guestEmail(),
      guestPhone: this.guestPhone(),
      preferredLanguage: this.preferredLanguage(),
      guestRequest: this.guestRequest(),
      guests: Number(this.guests()),
      roomTypeId: this.roomTypeId(),
      roomId: this.roomId(),
      ratePlanId: this.ratePlanId(),
      id: this.currentBooking()?.id ?? null,
      checkInDate: checkIn ? CalendarDate.fromDate(checkIn) : '',
      checkOutDate: checkOut ? CalendarDate.fromDate(checkOut) : '',
    });
  });
  protected readonly minCheckOut = computed(() => {
    const checkIn = this.checkIn();
    return CalendarDate.toDate(
      CalendarDate.addDays(
        checkIn ? CalendarDate.fromDate(checkIn) : this.today,
        1,
      ),
    );
  });
  /** Inactive room types stay selectable only for the booking that already uses them. */
  protected readonly roomTypeOptions = computed(() =>
    this.roomsStore
      .roomTypes()
      .filter(
        (roomType) =>
          roomType.isActive ||
          roomType.id === this.currentBooking()?.roomTypeId,
      )
      .map((roomType) => ({
        roomType,
        tooSmall: roomType.capacity < Number(this.guests()),
      })),
  );
  protected readonly selectedRoomType = computed(() =>
    this.roomsStore.getRoomTypeById(this.roomTypeId()),
  );
  protected readonly roomOptions = computed(() =>
    [...this.roomsStore.getRoomsByRoomType(this.roomTypeId())]
      .sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      )
      .map((room) => ({
        id: room.id,
        number: room.number,
        unavailable:
          this.datesSelected() &&
          !this.store.isRoomAvailable(room.id, this.draft()),
      })),
  );
  /** Inactive rate plans stay selectable only for the booking that already uses them. */
  protected readonly ratePlanOptions = computed(() =>
    this.roomsStore
      .ratePlans()
      .filter(
        (ratePlan) =>
          (ratePlan.isActive ||
            ratePlan.id === this.currentBooking()?.ratePlanId) &&
          ratePlan.appliesTo(this.roomTypeId()),
      ),
  );
  protected readonly selectedRatePlan = computed(() =>
    this.roomsStore.getRatePlanById(this.ratePlanId()),
  );
  protected readonly selectedRoomOption = computed(() =>
    this.roomOptions().find((option) => option.id === this.roomId()),
  );
  protected readonly selectedRoomUnavailable = computed(
    () => this.selectedRoomOption()?.unavailable ?? false,
  );
  protected readonly estimatedTotal = computed(() => {
    if (
      !this.datesSelected() ||
      !this.selectedRoomType() ||
      !this.selectedRatePlan()
    )
      return null;
    const currentBooking = this.currentBooking();
    return currentBooking && this.draft().hasSamePricingAs(currentBooking)
      ? currentBooking.totalAmount
      : this.store.quoteTotal(this.draft());
  });
  protected readonly currency = computed(
    () => this.roomsStore.currentProperty()?.currency ?? 'PEN',
  );

  constructor() {
    // Direct visits load the bookings after the form opens; fill the form once the booking arrives.
    let formSourceId: number | null | undefined;
    effect(() => {
      const loaded = this.currentBooking() ?? this.sourceBooking();
      const loadedId = loaded?.id ?? null;
      if (formSourceId !== undefined && loadedId === formSourceId) return;
      formSourceId = loadedId;
      untracked(() => this.applyForm(this.initialForm()));
    });
    // Keep the room type, room, and rate plan consistent with each other and with the guests.
    effect(() => {
      const options = this.roomTypeOptions();
      untracked(() => {
        if (!this.roomTypeId())
          this.roomTypeId.set(
            options.find((option) => !option.tooSmall)?.roomType.id ?? null,
          );
      });
    });
    effect(() => {
      this.roomTypeId();
      untracked(() => {
        if (!this.roomOptions().some((option) => option.id === this.roomId()))
          this.roomId.set(null);
      });
    });
    effect(() => {
      const options = this.ratePlanOptions();
      untracked(() => {
        if (!options.some((plan) => plan.id === this.ratePlanId()))
          this.ratePlanId.set(options[0]?.id ?? null);
      });
    });
    effect(() => {
      const checkIn = this.checkIn();
      untracked(() => {
        const checkOut = this.checkOut();
        if (checkIn && checkOut && checkOut <= checkIn)
          this.checkOut.set(this.minCheckOut());
      });
    });
  }

  /**
   * Builds the form values of a booking, or of a new booking.
   * @param booking - Booking whose values fill the form.
   */
  private formFrom(booking?: Booking): BookingFormValues {
    return {
      guestName: booking?.guestName ?? '',
      guestEmail: booking?.guestEmail ?? '',
      guestPhone: booking?.guestPhone ?? '',
      preferredLanguage: booking?.preferredLanguage ?? 'es',
      checkIn: booking ? CalendarDate.toDate(booking.checkInDate) : null,
      checkOut: booking ? CalendarDate.toDate(booking.checkOutDate) : null,
      guestRequest: booking?.guestRequest ?? '',
      guests: booking?.guests ?? 2,
      roomTypeId:
        booking?.roomTypeId ??
        this.roomsStore.roomTypes().find((roomType) => roomType.isActive)?.id ??
        null,
      roomId: booking?.roomId ?? null,
      ratePlanId: booking?.ratePlanId ?? null,
    };
  }

  /** Form values of the booking being edited, copied, or created. */
  private initialForm(): BookingFormValues {
    const source = this.sourceBooking();
    return source
      ? {
          ...this.formFrom(source),
          checkIn: null,
          checkOut: null,
          roomId: null,
        }
      : this.formFrom(this.currentBooking());
  }

  /** @param values - Values written into the form. */
  private applyForm(values: BookingFormValues): void {
    this.guestName.set(values.guestName);
    this.guestEmail.set(values.guestEmail);
    this.guestPhone.set(values.guestPhone);
    this.preferredLanguage.set(values.preferredLanguage);
    this.checkIn.set(values.checkIn);
    this.checkOut.set(values.checkOut);
    this.guestRequest.set(values.guestRequest);
    this.guests.set(values.guests);
    this.roomTypeId.set(values.roomTypeId);
    this.roomId.set(values.roomId);
    this.ratePlanId.set(values.ratePlanId);
  }

  /** @param amount - Amount in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** Stay of the draft, formatted as a range of days. */
  protected stay(): string {
    const draft = this.draft();
    return formatDayRange(
      draft.checkInDate,
      draft.checkOutDate,
      this.i18n.locale(),
    );
  }

  /** Saves the booking and opens its detail. */
  protected async saveBooking(): Promise<void> {
    this.errorCode.set('');
    if (!this.datesSelected()) {
      this.errorCode.set('invalid-stay-dates');
      return;
    }
    try {
      const savedBooking = this.isEdit()
        ? await this.store.updateBooking(this.draft())
        : await this.store.addBooking(this.draft());
      this.toast.add({
        severity: 'success',
        summary: this.isEdit()
          ? this.i18n.t('bookings.booking-form.saved')
          : this.i18n.t('bookings.booking-form.created', {
              code: savedBooking.code,
            }),
      });
      this.router.navigate(['/bookings', savedBooking.id]);
    } catch (error) {
      this.errorCode.set(
        error instanceof BookingsError ? error.code : 'connection',
      );
    }
  }

  /** Leaves the form without saving. */
  protected cancel(): void {
    this.router.navigate(
      this.isEdit() ? ['/bookings', this.id()] : ['/bookings'],
    );
  }
}
