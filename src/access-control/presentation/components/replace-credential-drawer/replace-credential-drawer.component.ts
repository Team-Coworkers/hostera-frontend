import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { preventCloseWhile } from '../../../../shared/presentation/services/dialog-close-guard';
import { AccessControlStore } from '../../../application/access-control.store';
import { AccessControlError } from '../../../domain/model/access-control.error';
import { Credential } from '../../../domain/model/credential.entity';
import { RfidEncoderPanelComponent } from '../rfid-encoder-panel/rfid-encoder-panel.component';

/**
 * Side sheet that revokes a credential and encodes a replacement card with the same access;
 * it closes with the replacement.
 */
@Component({
  selector: 'app-replace-credential-drawer',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DrawerHeaderComponent,
    MessageComponent,
    RfidEncoderPanelComponent,
  ],
  template: `
    <app-drawer-header
      [title]="i18n.t('access-control.replace-credential-drawer.title')"
      [busy]="busy()"
      [closeLabel]="i18n.t('access-control.replace-credential-drawer.cancel')"
    >
      <span class="text-sm text-color-secondary font-normal"
        ><span class="font-mono">RFID {{ credential.cardId }}</span> ·
        {{ credential.holderName }}</span
      >
    </app-drawer-header>

    <mat-dialog-content>
      <ol class="list-none m-0 p-0 flex flex-column gap-4">
        <li class="flex gap-3">
          <span
            class="flex align-items-center justify-content-center flex-shrink-0 w-2rem h-2rem border-circle bg-primary font-semibold"
            aria-hidden="true"
            >1</span
          >
          <span class="flex flex-column gap-1">
            <span class="font-semibold">{{
              i18n.t('access-control.replace-credential-drawer.revoke-step')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              i18n.t('access-control.replace-credential-drawer.revoke-help', {
                card: credential.cardId,
              })
            }}</span>
          </span>
        </li>
        <li class="flex gap-3">
          <span
            class="flex align-items-center justify-content-center flex-shrink-0 w-2rem h-2rem border-circle surface-200 font-semibold"
            aria-hidden="true"
            >2</span
          >
          <span class="flex flex-column gap-2 flex-1">
            <span class="font-semibold">{{
              i18n.t('access-control.replace-credential-drawer.encode-step')
            }}</span>
            <span class="text-sm text-color-secondary">{{
              i18n.t('access-control.replace-credential-drawer.encode-help')
            }}</span>
            <app-rfid-encoder-panel [showAction]="false" />
          </span>
        </li>
      </ol>
      <app-message severity="secondary" class="mt-4">
        {{ i18n.t('access-control.replace-credential-drawer.copied') }}
      </app-message>
      @if (errorCode()) {
        <app-message severity="error" icon="cancel" class="mt-3">
          {{
            i18n.t('access-control.access-control-terms.errors.' + errorCode())
          }}
        </app-message>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        type="button"
        mat-dialog-close
        [disabled]="busy()"
      >
        {{ i18n.t('access-control.replace-credential-drawer.cancel') }}
      </button>
      <button
        mat-flat-button
        type="button"
        [disabled]="busy()"
        (click)="replace()"
      >
        @if (busy()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>sync</mat-icon>
        }
        {{ i18n.t('access-control.replace-credential-drawer.submit') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ReplaceCredentialDrawerComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  protected readonly credential = inject<Credential>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ReplaceCredentialDrawerComponent, Credential>,
  );

  protected readonly errorCode = signal('');
  protected readonly busy = computed(
    () =>
      this.store.saving() ||
      ['encoding', 'verifying'].includes(this.store.encoderState()),
  );

  constructor() {
    preventCloseWhile(this.busy);
  }

  /** Replaces the credential and closes the side sheet. */
  protected async replace(): Promise<void> {
    this.errorCode.set('');
    try {
      this.dialogRef.close(
        await this.store.replaceCredential(this.credential.id!),
      );
    } catch (error) {
      this.errorCode.set(
        error instanceof AccessControlError ? error.code : 'connection',
      );
    }
  }
}
