import {
  afterNextRender,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { AccessControlStore } from '../../../application/access-control.store';

/**
 * State of the front desk RFID encoder, with the action to encode a new card.
 * It emits the card ID once the card is written.
 */
@Component({
  selector: 'app-rfid-encoder-panel',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MessageComponent,
  ],
  template: `
    <div class="flex flex-column gap-3">
      <div
        class="flex align-items-center gap-3 p-3 surface-card border-1 surface-border border-round-lg"
        aria-live="polite"
      >
        <span
          class="flex align-items-center justify-content-center w-2rem h-2rem flex-shrink-0 bg-primary-50 text-primary border-round-lg"
          aria-hidden="true"
          ><mat-icon>contactless</mat-icon></span
        >
        <span class="flex flex-column flex-1 min-w-0">
          <span class="font-semibold">{{
            i18n.t('access-control.rfid-encoder-panel.device')
          }}</span>
          <span class="text-sm text-color-secondary">{{
            i18n.t(
              'access-control.rfid-encoder-panel.states.' + store.encoderState()
            )
          }}</span>
        </span>
        <span class="flex align-items-center gap-2 text-sm font-medium">
          <span
            class="inline-block border-circle"
            [class]="stateAppearance()"
            style="width: 0.5rem; height: 0.5rem"
            aria-hidden="true"
          ></span>
          {{
            i18n.t(
              'access-control.rfid-encoder-panel.labels.' + store.encoderState()
            )
          }}
        </span>
      </div>
      @if (failed()) {
        <app-message severity="error">
          <div class="flex flex-column gap-1">
            <span class="font-semibold">{{
              i18n.t('access-control.rfid-encoder-panel.failed-title')
            }}</span>
            <span>{{
              i18n.t('access-control.rfid-encoder-panel.failed-text')
            }}</span>
          </div>
        </app-message>
      }
      @if (showAction()) {
        <button
          mat-flat-button
          type="button"
          class="w-full"
          [disabled]="disabled() || busy()"
          (click)="encode()"
        >
          @if (busy()) {
            <mat-spinner diameter="18" />
          } @else {
            <mat-icon>contactless</mat-icon>
          }
          {{
            actionLabel() || i18n.t('access-control.rfid-encoder-panel.encode')
          }}
        </button>
      }
    </div>
  `,
})
export class RfidEncoderPanelComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);

  /** Hides the encode button when another action, such as Replace, starts the encoding. */
  readonly showAction = input(true);
  /** Label of the encode button. */
  readonly actionLabel = input('');
  /** Whether the encode button is disabled. */
  readonly disabled = input(false);
  /** Emits the card ID of a newly encoded card. */
  readonly encoded = output<string>();

  protected readonly failed = computed(
    () => this.store.encoderState() === 'failed',
  );
  protected readonly busy = computed(() =>
    ['encoding', 'verifying'].includes(this.store.encoderState()),
  );
  protected readonly stateAppearance = computed(
    () =>
      ({
        ready: 'bg-green-500',
        encoding: 'bg-orange-500',
        verifying: 'bg-orange-500',
        encoded: 'bg-green-500',
        failed: 'bg-red-500',
      })[this.store.encoderState()],
  );

  constructor() {
    // A new panel starts with the encoder ready, as on mount in the Vue version.
    afterNextRender(() => this.store.resetEncoder());
  }

  /** Encodes a new card and emits its ID. */
  protected async encode(): Promise<void> {
    try {
      this.encoded.emit(await this.store.encodeKeyCard());
    } catch {
      // The encoder state shows the failure and the button allows a retry.
    }
  }
}
