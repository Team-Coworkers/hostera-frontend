import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { AccessControlStore } from '../../../application/access-control.store';
import { IssueStaffCredentialCommand } from '../../../domain/issue-staff-credential.command';
import { AccessControlError } from '../../../domain/model/access-control.error';
import {
  Credential,
  StaffScope,
} from '../../../domain/model/credential.entity';
import { RfidEncoderPanelComponent } from '../rfid-encoder-panel/rfid-encoder-panel.component';

/**
 * Side sheet that issues a staff credential on a new key card; it closes with the credential.
 */
@Component({
  selector: 'app-staff-credential-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTimepickerModule,
    DrawerHeaderComponent,
    MessageComponent,
    RfidEncoderPanelComponent,
  ],
  templateUrl: './staff-credential-form.component.html',
})
export class StaffCredentialFormComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  private readonly dialogRef = inject(
    MatDialogRef<StaffCredentialFormComponent, Credential>,
  );
  protected readonly durations = ['permanent', 'temporary'] as const;
  protected readonly scopes = Credential.staffScopes;
  protected readonly minDate = new Date();

  protected readonly duration = signal<'permanent' | 'temporary'>('permanent');
  protected readonly staffMemberId = signal<number | null>(null);
  protected readonly scope = signal<StaffScope>('service-areas');
  protected readonly validUntil = signal<Date | null>(null);
  protected readonly errorCode = signal('');

  protected readonly encoding = computed(() =>
    ['encoding', 'verifying'].includes(this.store.encoderState()),
  );
  protected readonly busy = computed(
    () => this.store.saving() || this.encoding(),
  );
  /** Staff members who already hold a usable credential must have it revoked first. */
  protected readonly staffOptions = computed(() => {
    const now = new Date().toISOString();
    return this.store.staffMembers().map((member) => ({
      member,
      holdsCredential: this.store
        .credentials()
        .some(
          (credential) =>
            credential.staffMemberId === member.id &&
            credential.isUsableAt(now),
        ),
    }));
  });

  constructor() {
    preventCloseWhile(this.busy);
  }

  /** Issues the credential on a new card and closes the side sheet. */
  protected async issue(): Promise<void> {
    this.errorCode.set('');
    const temporary = this.duration() === 'temporary';
    if (temporary && !this.validUntil()) {
      this.errorCode.set('invalid-access-period');
      return;
    }
    try {
      const credential = await this.store.issueStaffCredential(
        new IssueStaffCredentialCommand({
          staffMemberId: this.staffMemberId(),
          scope: this.scope(),
          validUntil: temporary
            ? (this.validUntil()?.toISOString() ?? '')
            : null,
        }),
      );
      this.dialogRef.close(credential);
    } catch (error) {
      this.errorCode.set(
        error instanceof AccessControlError ? error.code : 'connection',
      );
    }
  }
}
