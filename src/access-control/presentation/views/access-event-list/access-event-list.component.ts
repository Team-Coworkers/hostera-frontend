import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import {
  CalendarDate,
  formatDay,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { AccessControlStore } from '../../../application/access-control.store';
import {
  AccessEvent,
  AccessPoint,
} from '../../../domain/model/access-event.entity';
import { AccessControlLayoutComponent } from '../../components/access-control-layout/access-control-layout.component';
import { AccessEventDrawerComponent } from '../../components/access-event-drawer/access-event-drawer.component';

/** Row of the access events table. */
interface EventRow {
  id: number | null;
  accessEvent: AccessEvent;
  day: string;
  access: string;
}

/**
 * Access events of a day, with granted and denied counts, searchable and filterable
 * by result and access point.
 */
@Component({
  selector: 'app-access-event-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    AccessControlLayoutComponent,
    LayoutBodyDirective,
  ],
  templateUrl: './access-event-list.component.html',
})
export class AccessEventListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly dialog = inject(MatDialog);

  /** Initial search text, such as a card ID from the credential detail. */
  readonly searchQuery = input<string | undefined>(undefined, {
    alias: 'search',
  });

  protected readonly today = CalendarDate.today();
  protected readonly maxDate = CalendarDate.toDate(this.today);
  protected readonly displayedColumns = [
    'time',
    'credential',
    'person',
    'accessPoint',
    'result',
    'access',
    'open',
  ];
  protected readonly results = ['granted', 'denied'] as const;
  protected readonly accessPoints = AccessEvent.accessPoints;

  protected readonly search = signal('');
  protected readonly resultFilter = signal<'granted' | 'denied' | null>(null);
  protected readonly accessPointFilter = signal<AccessPoint | null>(null);
  protected readonly day = signal<Date | null>(CalendarDate.toDate(this.today));

  protected readonly selectedDay = computed(() => {
    const day = this.day();
    return day ? CalendarDate.fromDate(day) : null;
  });
  private readonly eventRows = computed<EventRow[]>(() =>
    this.store
      .accessEvents()
      .map((accessEvent) => {
        const credential = this.store.getCredentialById(
          accessEvent.credentialId,
        );
        return {
          id: accessEvent.id,
          accessEvent,
          day: CalendarDate.fromDate(new Date(accessEvent.occurredAt)),
          access: accessEvent.roomId
            ? (this.roomsStore.getRoomById(accessEvent.roomId)?.number ?? '—')
            : credential?.scope
              ? this.i18n.t(
                  `access-control.access-control-terms.scopes.${credential.scope}`,
                )
              : '—',
        };
      })
      .toSorted((a, b) =>
        b.accessEvent.occurredAt.localeCompare(a.accessEvent.occurredAt),
      ),
  );
  private readonly dayRows = computed(() =>
    this.eventRows().filter(
      (row) => !this.selectedDay() || row.day === this.selectedDay(),
    ),
  );
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.dayRows().filter(
      ({ accessEvent, access }) =>
        (!this.resultFilter() || accessEvent.result === this.resultFilter()) &&
        (!this.accessPointFilter() ||
          accessEvent.accessPoint === this.accessPointFilter()) &&
        `${accessEvent.holderName} ${accessEvent.cardId} ${access}`
          .toLowerCase()
          .includes(query),
    );
  });
  protected readonly counts = computed(() => ({
    total: this.dayRows().length,
    granted: this.dayRows().filter((row) => !row.accessEvent.isDenied).length,
    denied: this.dayRows().filter((row) => row.accessEvent.isDenied).length,
  }));
  protected readonly filtersActive = computed(
    () =>
      !!this.search() ||
      !!this.resultFilter() ||
      !!this.accessPointFilter() ||
      this.selectedDay() !== this.today,
  );

  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredRows,
    signal(undefined),
    this.paginator,
    {},
  );

  constructor() {
    effect(() => {
      const query = this.searchQuery();
      untracked(() => this.search.set(query ?? ''));
    });
    // Filters reset when another property is selected, not when the first one loads.
    let previousPropertyId: number | null = null;
    effect(() => {
      const propertyId = this.store.currentPropertyId();
      if (previousPropertyId !== null && propertyId !== previousPropertyId)
        untracked(() => this.resetFilters());
      previousPropertyId = propertyId;
    });
  }

  /** @param value - Count to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** Clears the filters and shows today's events. */
  protected resetFilters(): void {
    this.search.set('');
    this.resultFilter.set(null);
    this.accessPointFilter.set(null);
    this.day.set(CalendarDate.toDate(this.today));
  }

  /** @param value - ISO date-time whose time is shown. */
  protected time(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  /** @param day - ISO day shown as "Today" or as a short date. */
  protected dayLabel(day: string): string {
    return day === this.today
      ? this.i18n.t('access-control.access-event-list.today')
      : formatDay(day, this.i18n.locale(), { day: 'numeric', month: 'short' });
  }

  /** @param accessEvent - Event whose details are shown. */
  protected openEvent(accessEvent: AccessEvent): void {
    this.dialog.open(AccessEventDrawerComponent, drawerConfig(accessEvent));
  }
}
