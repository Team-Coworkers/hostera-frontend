import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CalendarDate,
  formatDay,
  formatMoney,
} from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { StatusTagComponent } from '../../../../shared/presentation/components/status-tag/status-tag.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { mediaQuerySignal } from '../../../../shared/presentation/media-query';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { RoomsStore } from '../../../application/rooms.store';
import { RatePlan } from '../../../domain/model/rate-plan.entity';
import { RoomType } from '../../../domain/model/room-type.entity';
import {
  DailyRateFormComponent,
  DailyRateFormData,
} from '../../components/daily-rate-form/daily-rate-form.component';
import { RatePlanFormComponent } from '../../components/rate-plan-form/rate-plan-form.component';
import { RoomsLayoutComponent } from '../../components/rooms-layout/rooms-layout.component';
import { WeekNavigatorComponent } from '../../components/week-navigator/week-navigator.component';

/** Price of a night and whether a daily rate sets it. */
interface Night {
  amount: number;
  daily: boolean;
}

/** Row of the rates grid: a room type and its nightly rates. */
interface RoomTypeRow {
  id: number | null;
  roomType: RoomType;
  nights: Record<string, Night>;
}

/**
 * Nightly rates of each room type under a rate plan over a week, with the plan's conditions.
 * Below 768px the grid shows one day at a time.
 */
@Component({
  selector: 'app-room-rates',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    RoomsLayoutComponent,
    LayoutBodyDirective,
    StatusTagComponent,
    WeekNavigatorComponent,
  ],
  templateUrl: './room-rates.component.html',
  styleUrl: '../room-availability/room-availability.component.css',
})
export class RoomRatesComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Below PrimeFlex's md breakpoint the week grid shows one day at a time. */
  protected readonly compact = mediaQuerySignal('(max-width: 767px)');
  protected readonly today = CalendarDate.today();
  protected readonly startDate = signal(this.today);
  private readonly selectedRatePlanId = signal<number | null>(null);

  protected readonly currency = computed(
    () => this.store.currentProperty()?.currency ?? 'PEN',
  );
  /** The selected plan falls back to the first active plan, for example after changing property. */
  protected readonly ratePlan = computed<RatePlan | undefined>(
    () =>
      this.store.getRatePlanById(this.selectedRatePlanId()) ??
      this.store.ratePlans().find((entry) => entry.isActive) ??
      this.store.ratePlans()[0],
  );
  protected readonly ratePlanConditions = computed(() => {
    const ratePlan = this.ratePlan();
    if (!ratePlan) return [];
    return [
      this.i18n.t(
        `rooms.rooms-terms.included-services.${ratePlan.includedServices}`,
      ),
      ratePlan.refundable
        ? ratePlan.cancellationPolicy
        : this.i18n.t('rooms.room-rates.non-refundable'),
      ratePlan.appliesToAllRoomTypes
        ? this.i18n.t('rooms.room-rates.all-room-types')
        : this.i18n.t('rooms.room-rates.room-types-count', {
            count: ratePlan.roomTypeIds.length,
          }),
    ];
  });
  protected readonly visibleDays = computed(() =>
    CalendarDate.sequence(this.startDate(), this.compact() ? 1 : 7),
  );
  protected readonly displayedColumns = computed(() => [
    'roomType',
    ...this.visibleDays(),
  ]);
  protected readonly roomTypeRows = computed<RoomTypeRow[]>(() => {
    const ratePlan = this.ratePlan();
    if (!ratePlan) return [];
    return this.store
      .roomTypes()
      .filter(
        (roomType) => roomType.isActive && ratePlan.appliesTo(roomType.id),
      )
      .map((roomType) => ({
        id: roomType.id,
        roomType,
        nights: Object.fromEntries(
          this.visibleDays().map((date) => [
            date,
            {
              amount:
                this.store.getNightlyRate(roomType.id, ratePlan.id, date) ?? 0,
              daily: !!this.store.getDailyRate(roomType.id, ratePlan.id, date),
            },
          ]),
        ),
      }));
  });

  /** @param ratePlanId - Rate plan to show. */
  protected selectRatePlan(ratePlanId: number): void {
    this.selectedRatePlanId.set(ratePlanId);
  }

  /** @param amount - Amount in the property's currency. */
  protected money(amount: number): string {
    return formatMoney(amount, this.currency(), this.i18n.locale());
  }

  /** @param date - ISO day formatted with the given options. */
  protected day(date: string, options: Intl.DateTimeFormatOptions): string {
    return formatDay(date, this.i18n.locale(), options);
  }

  /**
   * Describes a night's rate for assistive technologies.
   * @param row - Room type row.
   * @param date - ISO calendar day.
   */
  protected nightLabel(row: RoomTypeRow, date: string): string {
    const night = row.nights[date]!;
    return [
      row.roomType.name,
      formatDay(date, this.i18n.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
      this.money(night.amount),
      night.daily
        ? this.i18n.t('rooms.room-rates.daily-rate')
        : this.i18n.t('rooms.room-rates.base-rate'),
    ].join(', ');
  }

  /**
   * Opens the rate plan form to add or edit a plan, then shows the saved plan.
   * @param plan - Rate plan to edit; none to add one.
   */
  protected openRatePlanForm(plan: RatePlan | null = null): void {
    this.dialog
      .open<RatePlanFormComponent, RatePlan | null, RatePlan>(
        RatePlanFormComponent,
        drawerConfig(plan),
      )
      .afterClosed()
      .subscribe((saved) => {
        if (!saved) return;
        this.selectedRatePlanId.set(saved.id);
        this.notifySaved();
      });
  }

  /**
   * Opens the daily rate form for a room type's night, or for the visible nights.
   * @param roomTypeId - Room type preselected, if any.
   * @param date - Night preselected, if any.
   */
  protected openDailyRateForm(
    roomTypeId: number | null = null,
    date: string | null = null,
  ): void {
    this.dialog
      .open<DailyRateFormComponent, DailyRateFormData, number>(
        DailyRateFormComponent,
        drawerConfig({
          ratePlanId: this.ratePlan()!.id!,
          roomTypeId,
          startDate: date ?? this.startDate(),
          endDate: date ?? this.visibleDays().at(-1)!,
        }),
      )
      .afterClosed()
      .subscribe((savedRatePlanId) => {
        if (savedRatePlanId === undefined) return;
        this.selectedRatePlanId.set(savedRatePlanId);
        this.notifySaved();
      });
  }

  /** Confirms that changes were saved. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('rooms.room-rates.saved'),
    });
  }
}
