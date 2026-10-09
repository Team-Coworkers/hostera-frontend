import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { AccessControlStore } from '../../../application/access-control.store';
import { AccessControlError } from '../../../domain/model/access-control.error';
import {
  Credential,
  RevocationReason,
} from '../../../domain/model/credential.entity';
import { RevokeCredentialCommand } from '../../../domain/revoke-credential.command';

/** Data of the revoke dialog: the credential and a description of its access. */
export interface RevokeCredentialDialogData {
  credential: Credential;
  access: string;
}

/**
 * Dialog that revokes a credential immediately with a reason; it closes with the revoked credential.
 */
@Component({
  selector: 'app-revoke-credential-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MessageComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      {{
        i18n.t('access-control.revoke-credential-dialog.title', {
          card: data.credential.cardId,
        })
      }}
    </h2>
    <mat-dialog-content>
      <form
        id="revoke-credential-form"
        class="flex flex-column gap-3 pt-1"
        (ngSubmit)="revoke()"
      >
        <p class="m-0 text-color-secondary line-height-3">
          {{
            i18n.t('access-control.revoke-credential-dialog.summary', {
              name: data.credential.holderName,
              access: data.access,
            })
          }}
        </p>
        <mat-form-field class="w-full">
          <mat-label>{{
            i18n.t('access-control.revoke-credential-dialog.reason')
          }}</mat-label>
          <mat-select name="reason" [(ngModel)]="reason">
            @for (value of reasons; track value) {
              <mat-option [value]="value">{{
                i18n.t(
                  'access-control.access-control-terms.revocation-reasons.' +
                    value
                )
              }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (noteRequired()) {
          <mat-form-field class="w-full">
            <mat-label>{{
              i18n.t('access-control.revoke-credential-dialog.note')
            }}</mat-label>
            <textarea
              matInput
              name="note"
              rows="2"
              maxlength="200"
              required
              cdkTextareaAutosize
              [(ngModel)]="note"
            ></textarea>
          </mat-form-field>
        }
        <app-message severity="warn" icon="warning">
          {{ i18n.t('access-control.revoke-credential-dialog.immediate') }}
        </app-message>
        @if (errorCode()) {
          <app-message severity="error" icon="cancel">
            {{
              i18n.t(
                'access-control.access-control-terms.errors.' + errorCode()
              )
            }}
          </app-message>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        type="button"
        mat-dialog-close
        [disabled]="store.saving()"
      >
        {{ i18n.t('access-control.revoke-credential-dialog.cancel') }}
      </button>
      <button
        mat-flat-button
        class="danger-button"
        type="submit"
        form="revoke-credential-form"
        [disabled]="store.saving()"
      >
        @if (store.saving()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>block</mat-icon>
        }
        {{ i18n.t('access-control.revoke-credential-dialog.submit') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class RevokeCredentialDialogComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  protected readonly data = inject<RevokeCredentialDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<RevokeCredentialDialogComponent, Credential>,
  );
  /** Replacement revokes cards through its own action. */
  protected readonly reasons = Credential.revocationReasons.filter(
    (value) => value !== 'replaced',
  );

  protected readonly reason = signal<RevocationReason>(
    this.data.credential.isGuestKeyCard ? 'lost-card' : 'staff-left',
  );
  protected readonly note = signal('');
  protected readonly errorCode = signal('');
  protected readonly noteRequired = computed(() => this.reason() === 'other');

  constructor() {
    preventCloseWhile(this.store.saving);
  }

  /** Revokes the credential and closes the dialog. */
  protected async revoke(): Promise<void> {
    this.errorCode.set('');
    try {
      const revoked = await this.store.revokeCredential(
        new RevokeCredentialCommand({
          credentialId: this.data.credential.id!,
          reason: this.reason(),
          note: this.note(),
        }),
      );
      this.dialogRef.close(revoked);
    } catch (error) {
      this.errorCode.set(
        error instanceof AccessControlError ? error.code : 'connection',
      );
    }
  }
}
