import {
  Component,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { AccessControlStore } from '../../../../access-control/application/access-control.store';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { ContextLayoutComponent } from '../../../../shared/presentation/components/context-layout/context-layout.component';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { BookingsStore } from '../../../application/bookings.store';

/**
 * Bookings workspace layout: header with the property selector and the view's actions,
 * and the loading, error, and empty states of the bookings data.
 *
 * Views project their actions with `layoutActions` and their body with `<ng-template layoutBody>`.
 */
@Component({
  selector: 'app-bookings-layout',
  imports: [ContextLayoutComponent],
  template: `
    <app-context-layout
      [title]="title() || i18n.t('bookings.bookings-layout.title')"
      [properties]="roomsStore.properties()"
      [currentPropertyId]="roomsStore.currentPropertyId()"
      [propertyLabel]="i18n.t('bookings.bookings-layout.property')"
      [propertyDisabled]="store.saving()"
      [noProperties]="noProperties()"
      [noPropertiesMessage]="
        i18n.t('bookings.bookings-terms.errors.no-properties')
      "
      [failed]="loadErrors()"
      [connectionMessage]="i18n.t('bookings.bookings-terms.errors.connection')"
      [retryLabel]="i18n.t('bookings.bookings-layout.retry')"
      [loaded]="bookingsDataLoaded()"
      [loadingLabel]="i18n.t('bookings.bookings-layout.loading')"
      [body]="body()?.template"
      (propertyChange)="changeProperty($event)"
      (retry)="retry()"
    >
      <ng-container ngProjectAs="[layoutActions]"
        ><ng-content select="[layoutActions]"
      /></ng-container>
    </app-context-layout>
  `,
})
export class BookingsLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(BookingsStore);
  protected readonly roomsStore = inject(RoomsStore);
  private readonly accessControlStore = inject(AccessControlStore);
  private readonly router = inject(Router);

  /** Workspace title; the bookings title by default. */
  readonly title = input('');
  protected readonly body = contentChild(LayoutBodyDirective);

  protected readonly noProperties = computed(
    () =>
      this.roomsStore.propertiesLoaded() &&
      !this.roomsStore.properties().length,
  );
  /** Bookings need the property's rooms, rates, and operational statuses to price and place stays. */
  protected readonly bookingsDataLoaded = computed(
    () =>
      this.store.bookingsLoaded() &&
      this.store.paymentsLoaded() &&
      this.accessControlStore.credentialsLoaded() &&
      this.roomsStore.roomTypesLoaded() &&
      this.roomsStore.roomsLoaded() &&
      this.roomsStore.statusPeriodsLoaded() &&
      this.roomsStore.ratePlansLoaded() &&
      this.roomsStore.dailyRatesLoaded(),
  );
  protected readonly loadErrors = computed(
    () => !!(this.store.errors().length || this.roomsStore.errors().length),
  );

  constructor() {
    if (!this.roomsStore.propertiesLoaded()) this.roomsStore.fetchProperties();
  }

  /**
   * Returns to the booking list and loads the selected property's bookings.
   * @param propertyId - The ID of the selected property.
   */
  protected async changeProperty(propertyId: number): Promise<void> {
    await this.router.navigate(['/bookings']);
    this.roomsStore.selectProperty(propertyId);
  }

  /** Retries loading the properties or the current property's bookings and rooms. */
  protected retry(): void {
    if (!this.roomsStore.propertiesLoaded()) {
      this.roomsStore.fetchProperties();
      return;
    }
    this.roomsStore.selectProperty(this.roomsStore.currentPropertyId());
    this.store.fetchBookings();
  }
}
