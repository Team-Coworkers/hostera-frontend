import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
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
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { RoomsStore } from '../../../application/rooms.store';
import {
  IncludedServices,
  RatePlan,
} from '../../../domain/model/rate-plan.entity';
import { RoomsError } from '../../../domain/model/rooms.error';

/**
 * Side sheet that creates or edits a rate plan, including its activation;
 * it closes with the saved rate plan. Its data is the rate plan to edit, or null.
 */
@Component({
  selector: 'app-rate-plan-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
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
  templateUrl: './rate-plan-form.component.html',
})
export class RatePlanFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(RoomsStore);
  protected readonly ratePlan = inject<RatePlan | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RatePlanFormComponent, RatePlan>,
  );
  protected readonly includedServicesOptions = RatePlan.includedServicesOptions;

  protected readonly name = signal(this.ratePlan?.name ?? '');
  protected readonly roomTypeIds = signal<number[]>([
    ...(this.ratePlan?.roomTypeIds ?? []),
  ]);
  protected readonly includedServices = signal<IncludedServices>(
    this.ratePlan?.includedServices ?? 'room-only',
  );
  protected readonly refundable = signal(this.ratePlan?.refundable ?? true);
  protected readonly cancellationPolicy = signal(
    this.ratePlan?.cancellationPolicy ?? '',
  );
  protected readonly active = signal(
    this.ratePlan ? this.ratePlan.isActive : true,
  );
  protected readonly errorCode = signal('');
  protected readonly isEdit = !!this.ratePlan;
  /** Inactive room types stay selectable only for the plan that already includes them. */
  protected readonly roomTypeOptions = computed(() =>
    this.store
      .roomTypes()
      .filter(
        (roomType) =>
          roomType.isActive ||
          (roomType.id !== null &&
            this.ratePlan?.roomTypeIds.includes(roomType.id)),
      ),
  );

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** @param id - Room type whose name is shown in its chip. */
  protected roomTypeName(id: number): string {
    return this.store.getRoomTypeById(id)?.name ?? '';
  }

  /** @param id - Room type removed from the plan. */
  protected removeRoomType(id: number): void {
    this.roomTypeIds.update((ids) => ids.filter((entry) => entry !== id));
  }

  /** Saves the rate plan and closes the side sheet. */
  protected async saveRatePlan(): Promise<void> {
    this.errorCode.set('');
    const ratePlan = new RatePlan({
      id: this.ratePlan?.id ?? null,
      propertyId: this.ratePlan?.propertyId ?? this.store.currentPropertyId(),
      name: this.name(),
      roomTypeIds: this.roomTypeIds(),
      includedServices: this.includedServices(),
      refundable: this.refundable(),
      cancellationPolicy: this.cancellationPolicy(),
      status: this.active() ? 'active' : 'inactive',
    });
    try {
      const savedRatePlan = this.isEdit
        ? await this.store.updateRatePlan(ratePlan)
        : await this.store.addRatePlan(ratePlan);
      this.dialogRef.close(savedRatePlan);
    } catch (error) {
      this.errorCode.set(
        error instanceof RoomsError ? error.code : 'connection',
      );
    }
  }
}
