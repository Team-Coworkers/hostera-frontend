import { Component, computed, contentChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContextLayoutComponent } from '../../../../shared/presentation/components/context-layout/context-layout.component';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { RoomsStore } from '../../../application/rooms.store';

/** Tab of the Rooms workspace. */
interface RoomsTab {
  link: string;
  label: string;
  icon: string;
}

/**
 * Rooms workspace layout: header with the property selector, tabs for availability,
 * room types, and rates, and the loading and error states of the rooms data.
 */
@Component({
  selector: 'app-rooms-layout',
  imports: [
    ContextLayoutComponent,
    MatIconModule,
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <app-context-layout
      [title]="i18n.t('rooms.rooms-layout.title')"
      [properties]="store.properties()"
      [currentPropertyId]="store.currentPropertyId()"
      [propertyLabel]="i18n.t('rooms.rooms-layout.property')"
      [propertyDisabled]="store.saving()"
      [noProperties]="noProperties()"
      [noPropertiesMessage]="i18n.t('rooms.rooms-terms.errors.no-properties')"
      [failed]="store.errors().length > 0"
      [connectionMessage]="i18n.t('rooms.rooms-terms.errors.connection')"
      [retryLabel]="i18n.t('rooms.rooms-layout.retry')"
      [loaded]="roomsDataLoaded()"
      [loadingLabel]="i18n.t('rooms.rooms-layout.loading')"
      [body]="body()?.template"
      (propertyChange)="changeProperty($event)"
      (retry)="retry()"
    >
      <ng-container ngProjectAs="[layoutActions]"
        ><ng-content select="[layoutActions]"
      /></ng-container>
      <nav
        layoutTabs
        mat-tab-nav-bar
        [tabPanel]="tabPanel"
        mat-stretch-tabs="false"
      >
        @for (tab of tabs; track tab.link; let first = $first) {
          <a
            mat-tab-link
            [routerLink]="tab.link"
            routerLinkActive
            #active="routerLinkActive"
            [active]="active.isActive || (first && onRoomDetail())"
          >
            <mat-icon class="mr-2" aria-hidden="true">{{ tab.icon }}</mat-icon>
            {{ i18n.t(tab.label) }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel class="hidden" />
    </app-context-layout>
  `,
})
export class RoomsLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  private readonly router = inject(Router);
  protected readonly body = contentChild(LayoutBodyDirective);

  protected readonly tabs: RoomsTab[] = [
    {
      link: '/rooms/availability',
      label: 'rooms.rooms-layout.availability',
      icon: 'calendar_month',
    },
    {
      link: '/rooms/room-types',
      label: 'rooms.rooms-layout.room-types',
      icon: 'grid_view',
    },
    { link: '/rooms/rates', label: 'rooms.rooms-layout.rates', icon: 'sell' },
  ];

  protected readonly noProperties = computed(
    () => this.store.propertiesLoaded() && !this.store.properties().length,
  );
  protected readonly roomsDataLoaded = computed(
    () =>
      this.store.roomTypesLoaded() &&
      this.store.roomsLoaded() &&
      this.store.statusPeriodsLoaded() &&
      this.store.roomAssignmentsLoaded() &&
      this.store.ratePlansLoaded() &&
      this.store.dailyRatesLoaded(),
  );

  constructor() {
    if (!this.store.propertiesLoaded()) this.store.fetchProperties();
  }

  /** Room details have no tab of their own and belong to Availability. */
  protected onRoomDetail(): boolean {
    return /^\/rooms\/\d+/.test(this.router.url);
  }

  /** Path of the active tab, or Availability on a room detail. */
  private activeTabLink(): string {
    return (
      this.tabs.find((tab) => this.router.url.startsWith(tab.link))?.link ??
      '/rooms/availability'
    );
  }

  /**
   * Navigates to the active tab and loads the selected property's rooms.
   * @param propertyId - The ID of the selected property.
   */
  protected async changeProperty(propertyId: number): Promise<void> {
    await this.router.navigateByUrl(this.activeTabLink());
    this.store.selectProperty(propertyId);
  }

  /** Retries loading the properties or the current property's rooms. */
  protected retry(): void {
    if (this.store.propertiesLoaded())
      this.store.selectProperty(this.store.currentPropertyId());
    else this.store.fetchProperties();
  }
}
