import { Component, computed, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BookingsStore } from '../../../../bookings/application/bookings.store';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { ContextLayoutComponent } from '../../../../shared/presentation/components/context-layout/context-layout.component';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { OverviewStore } from '../../../application/overview.store';
import { BookingSearchComponent } from '../../components/booking-search/booking-search.component';
import { PropertyOverviewCardComponent } from '../../components/property-overview-card/property-overview-card.component';
import { RevenueOccupancyCardComponent } from '../../components/revenue-occupancy-card/revenue-occupancy-card.component';
import { RoomStatusCardComponent } from '../../components/room-status-card/room-status-card.component';
import { TodaysArrivalsCardComponent } from '../../components/todays-arrivals-card/todays-arrivals-card.component';

/**
 * Overview of the active property: revenue and occupancy, every property's status tonight,
 * today's arrivals, and today's room statuses. Each card loads and fails on its own.
 */
@Component({
  selector: 'app-overview',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ContextLayoutComponent,
    LayoutBodyDirective,
    BookingSearchComponent,
    PropertyOverviewCardComponent,
    RevenueOccupancyCardComponent,
    RoomStatusCardComponent,
    TodaysArrivalsCardComponent,
  ],
  template: `
    <app-context-layout
      [title]="i18n.t('overview.overview-view.title')"
      [properties]="roomsStore.properties()"
      [currentPropertyId]="roomsStore.currentPropertyId()"
      [propertyLabel]="i18n.t('overview.overview-view.property')"
      [noProperties]="noProperties()"
      [noPropertiesMessage]="i18n.t('overview.overview-view.no-properties')"
      [failed]="propertiesFailed()"
      [connectionMessage]="i18n.t('overview.overview-view.connection')"
      [retryLabel]="i18n.t('overview.overview-panel.retry')"
      [loaded]="!propertiesFailed()"
      [body]="body()?.template"
      (propertyChange)="roomsStore.selectProperty($event)"
      (retry)="roomsStore.fetchProperties()"
    >
      <ng-container ngProjectAs="[layoutActions]">
        @if (roomsStore.propertiesLoaded()) {
          <app-booking-search
            class="flex-order-2 md:flex-order-0 w-full md:w-18rem"
          />
        }
        <a
          mat-flat-button
          routerLink="/bookings/new"
          [disabled]="!roomsStore.currentPropertyId()"
        >
          <mat-icon>add</mat-icon>
          {{ i18n.t('overview.overview-view.new-booking') }}
        </a>
      </ng-container>
      <ng-template layoutBody>
        <div class="grid">
          <div class="col-12 xl:col-8">
            <app-revenue-occupancy-card />
          </div>
          <div class="col-12 xl:col-4">
            <app-property-overview-card />
          </div>
          <div class="col-12 xl:col-8">
            <app-todays-arrivals-card />
          </div>
          <div class="col-12 xl:col-4">
            <app-room-status-card />
          </div>
        </div>
      </ng-template>
    </app-context-layout>
  `,
})
export class OverviewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly roomsStore = inject(RoomsStore);
  protected readonly body = viewChild(LayoutBodyDirective);

  protected readonly noProperties = computed(
    () =>
      this.roomsStore.propertiesLoaded() &&
      !this.roomsStore.properties().length,
  );
  protected readonly propertiesFailed = computed(
    () =>
      !this.roomsStore.propertiesLoaded() &&
      this.roomsStore.errors().length > 0,
  );

  constructor() {
    // Loading the Bookings and Overview stores starts their data requests for the current property.
    inject(BookingsStore);
    inject(OverviewStore);
    if (!this.roomsStore.propertiesLoaded()) this.roomsStore.fetchProperties();
  }
}
