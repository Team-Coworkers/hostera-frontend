import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { BookingsStore } from '../../../../bookings/application/bookings.store';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { formatDayRange } from '../../../../shared/presentation/calendar-format';
import {
  StatusTagComponent,
  TagSeverity,
} from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { Arrival, OverviewStore } from '../../../application/overview.store';
import { OverviewPanelComponent } from '../overview-panel/overview-panel.component';

/** Card with today's check-ins of the current property and where each stands. */
@Component({
  selector: 'app-todays-arrivals-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    StatusTagComponent,
    OverviewPanelComponent,
  ],
  template: `
    <app-overview-panel
      [title]="i18n.t('overview.todays-arrivals-card.title')"
      [subtitle]="subtitle()"
      [loading]="
        !bookingsStore.bookingsLoaded() || !bookingsStore.paymentsLoaded()
      "
      [failed]="
        !bookingsStore.bookingsLoaded() && bookingsStore.errors().length > 0
      "
      (retry)="bookingsStore.fetchBookings()"
    >
      <ng-container ngProjectAs="[panelActions]">
        @if (store.todaysArrivals().length) {
          <a
            routerLink="/bookings"
            class="text-sm font-medium white-space-nowrap"
            >{{ i18n.t('overview.todays-arrivals-card.view-all') }}</a
          >
        }
      </ng-container>
      @if (!store.todaysArrivals().length) {
        <div
          class="flex flex-column sm:flex-row align-items-center justify-content-center gap-3 flex-1 py-4"
        >
          <span class="empty-badge" aria-hidden="true"
            ><mat-icon>calendar_today</mat-icon></span
          >
          <span class="flex flex-column gap-1 text-center sm:text-left">
            <span class="font-semibold">{{
              i18n.t('overview.todays-arrivals-card.empty-title')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              i18n.t('overview.todays-arrivals-card.empty-text')
            }}</span>
          </span>
          <a mat-stroked-button routerLink="/bookings" class="sm:ml-4">{{
            i18n.t('overview.todays-arrivals-card.view-all')
          }}</a>
        </div>
      } @else {
        <ul class="list-none m-0 p-0 flex flex-column">
          @for (
            arrival of store.todaysArrivals();
            track arrival.booking.id;
            let first = $first
          ) {
            @let tag = arrivalTag(arrival);
            <li
              class="flex flex-wrap align-items-center gap-3 py-2"
              [class.border-top-1]="!first"
              [class.surface-border]="!first"
            >
              <a
                [routerLink]="['/bookings', arrival.booking.id]"
                class="flex flex-column text-color no-underline guest"
              >
                <span class="font-semibold">{{
                  arrival.booking.guestName
                }}</span>
                <span class="font-mono text-sm text-color-secondary">{{
                  arrival.booking.code
                }}</span>
              </a>
              <span class="flex flex-column room">
                <span class="text-sm text-color-secondary">{{
                  i18n.t('overview.todays-arrivals-card.room')
                }}</span>
                <span class="font-mono font-semibold">{{
                  roomsStore.getRoomById(arrival.booking.roomId)?.number ?? '—'
                }}</span>
              </span>
              <span class="flex flex-column stay">
                <span class="text-sm text-color-secondary">{{
                  i18n.t('overview.todays-arrivals-card.stay')
                }}</span>
                <span class="white-space-nowrap">{{
                  stay(
                    arrival.booking.checkInDate,
                    arrival.booking.checkOutDate
                  )
                }}</span>
              </span>
              <app-status-tag [value]="tag.label" [severity]="tag.severity" />
              <button
                mat-icon-button
                [matMenuTriggerFor]="actions"
                [matMenuTriggerData]="{ arrival }"
                [attr.aria-label]="
                  i18n.t('overview.todays-arrivals-card.actions', {
                    name: arrival.booking.guestName,
                  })
                "
              >
                <mat-icon>more_horiz</mat-icon>
              </button>
            </li>
          }
        </ul>
      }
    </app-overview-panel>
    <mat-menu #actions="matMenu" xPosition="before">
      <ng-template matMenuContent let-arrival="arrival">
        <a mat-menu-item [routerLink]="['/bookings', arrival.booking.id]">
          <mat-icon>arrow_forward</mat-icon>
          <span>{{ i18n.t('overview.todays-arrivals-card.open') }}</span>
        </a>
        <a
          mat-menu-item
          [routerLink]="['/bookings', arrival.booking.id, 'check-in']"
          [disabled]="arrival.booking.status !== 'confirmed'"
        >
          <mat-icon>login</mat-icon>
          <span>{{ i18n.t('overview.todays-arrivals-card.check-in') }}</span>
        </a>
      </ng-template>
    </mat-menu>
  `,
  styles: `
    .guest {
      flex: 1 1 12rem;
    }
    .room {
      min-width: 5rem;
    }
    .stay {
      min-width: 9rem;
    }
    .empty-badge {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.5rem;
      background: var(--p-surface-100);
      color: var(--p-primary-color);
    }
  `,
})
export class TodaysArrivalsCardComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(OverviewStore);
  protected readonly bookingsStore = inject(BookingsStore);
  protected readonly roomsStore = inject(RoomsStore);

  protected readonly subtitle = computed(() => {
    const arrivals = this.store.todaysArrivals();
    if (!arrivals.length) return '';
    return this.i18n.t('overview.todays-arrivals-card.subtitle', {
      arrived: arrivals.filter((arrival) => arrival.arrived).length,
      total: arrivals.length,
    });
  });

  /**
   * Describes where an arrival stands before or after check-in.
   * @param arrival - Arrival of today.
   */
  protected arrivalTag(arrival: Arrival): {
    label: string;
    severity: TagSeverity;
  } {
    const label = (status: string) =>
      this.i18n.t(`overview.todays-arrivals-card.statuses.${status}`);
    if (arrival.arrived)
      return { label: label('arrived'), severity: 'success' };
    if (arrival.booking.status === 'pending')
      return { label: label('pending'), severity: 'warn' };
    if (arrival.balanceDue > 0)
      return { label: label('payment-due'), severity: 'danger' };
    return { label: label('ready'), severity: 'info' };
  }

  /** @returns Stay dates in the active locale. */
  protected stay(checkInDate: string, checkOutDate: string): string {
    return formatDayRange(checkInDate, checkOutDate, this.i18n.locale());
  }
}
