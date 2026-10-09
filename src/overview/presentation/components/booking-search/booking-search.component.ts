import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { BookingStatusTagComponent } from '../../../../bookings/presentation/components/booking-status-tag/booking-status-tag.component';
import { Booking } from '../../../../bookings/domain/model/booking.entity';
import { formatDayRange } from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { OverviewStore } from '../../../application/overview.store';

/** Search of the current property's bookings by guest or code, focused with Ctrl+K or ⌘K. */
@Component({
  selector: 'app-booking-search',
  imports: [
    MatAutocompleteModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    BookingStatusTagComponent,
  ],
  host: { '(window:keydown)': 'focusSearch($event)' },
  template: `
    <mat-form-field class="w-full" subscriptSizing="dynamic">
      <mat-icon matPrefix aria-hidden="true">search</mat-icon>
      <input
        #input
        matInput
        type="search"
        [value]="query()"
        [placeholder]="
          i18n.t('overview.booking-search.placeholder', { shortcut })
        "
        [attr.aria-label]="i18n.t('overview.booking-search.label')"
        [matAutocomplete]="auto"
        (input)="complete(input.value)"
      />
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayNothing"
        panelWidth="24rem"
        (optionSelected)="openBooking($event)"
      >
        @for (booking of suggestions(); track booking.id) {
          <mat-option [value]="booking">
            <span
              class="flex align-items-center justify-content-between gap-3 w-full py-1"
            >
              <span class="flex flex-column min-w-0">
                <span class="font-semibold">{{ booking.guestName }}</span>
                <span class="text-sm text-color-secondary"
                  ><span class="font-mono">{{ booking.code }}</span> ·
                  {{ stay(booking) }}</span
                >
              </span>
              <app-booking-status-tag [status]="booking.status" />
            </span>
          </mat-option>
        } @empty {
          @if (query().trim()) {
            <mat-option disabled>{{
              i18n.t('overview.booking-search.empty')
            }}</mat-option>
          }
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BookingSearchComponent {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(OverviewStore);
  private readonly router = inject(Router);
  private readonly input =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  protected readonly suggestions = signal<Booking[]>([]);
  /** Keeps the input empty once a booking is chosen. */
  protected readonly displayNothing = () => '';
  protected readonly shortcut = /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘K'
    : 'Ctrl+K';

  /**
   * Updates the suggestions for the typed text.
   * @param text - Typed text.
   */
  protected complete(text: string): void {
    this.query.set(text);
    this.suggestions.set(this.store.searchBookings(text));
  }

  /**
   * Opens the chosen booking and clears the search.
   * @param event - Autocomplete selection event.
   */
  protected openBooking(event: MatAutocompleteSelectedEvent): void {
    const booking = event.option.value as Booking;
    this.query.set('');
    this.suggestions.set([]);
    this.input().nativeElement.value = '';
    this.input().nativeElement.blur();
    this.router.navigate(['/bookings', booking.id]);
  }

  /**
   * Focuses the search with Ctrl+K or ⌘K.
   * @param event - Key event.
   */
  protected focusSearch(event: KeyboardEvent): void {
    if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.input().nativeElement.focus();
    }
  }

  /** @returns Stay dates of a booking in the active locale. */
  protected stay(booking: Booking): string {
    return formatDayRange(
      booking.checkInDate,
      booking.checkOutDate,
      this.i18n.locale(),
    );
  }
}
