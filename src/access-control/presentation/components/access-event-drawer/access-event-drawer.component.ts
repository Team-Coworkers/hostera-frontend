import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { formatDateTime } from '../../../../shared/presentation/calendar-format';
import { DrawerHeaderComponent } from '../../../../shared/presentation/components/drawer-header/drawer-header.component';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { AccessControlStore } from '../../../application/access-control.store';
import { AccessEvent } from '../../../domain/model/access-event.entity';

/**
 * Side sheet with the details of an access event and, when denied, why the door denied it.
 */
@Component({
  selector: 'app-access-event-drawer',
  imports: [
    MatButtonModule,
    MatDialogModule,
    RouterLink,
    DrawerHeaderComponent,
    MessageComponent,
  ],
  template: `
    <app-drawer-header
      [title]="
        accessEvent.isDenied
          ? i18n.t('access-control.access-event-drawer.denied-title')
          : i18n.t('access-control.access-event-drawer.granted-title')
      "
      [closeLabel]="i18n.t('access-control.access-event-drawer.close')"
    >
      <span class="font-mono text-sm text-color-secondary font-normal">{{
        eventCode
      }}</span>
    </app-drawer-header>

    <mat-dialog-content>
      <div class="flex flex-column gap-4">
        <app-message
          [severity]="accessEvent.isDenied ? 'error' : 'success'"
          [icon]="accessEvent.isDenied ? 'block' : 'login'"
        >
          <div class="flex flex-column gap-1">
            <span class="font-semibold">{{
              accessEvent.isDenied
                ? i18n.t(
                    'access-control.access-control-terms.denial-reasons.' +
                      accessEvent.denialReason
                  )
                : i18n.t('access-control.access-control-terms.results.granted')
            }}</span>
            <span>{{
              accessEvent.isDenied
                ? i18n.t('access-control.access-event-drawer.denied-text')
                : i18n.t('access-control.access-event-drawer.granted-text')
            }}</span>
          </div>
        </app-message>
        <dl class="facts flex flex-column m-0">
          <div
            class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border"
          >
            <dt>
              {{ i18n.t('access-control.access-event-drawer.credential') }}
            </dt>
            <dd class="text-right">
              @if (credential(); as credential) {
                <a
                  class="font-mono font-semibold text-primary"
                  mat-dialog-close
                  [routerLink]="['/access-control/credentials', credential.id]"
                  >RFID {{ accessEvent.cardId }}</a
                >
              } @else {
                <span class="font-mono font-semibold"
                  >RFID {{ accessEvent.cardId }}</span
                >
              }
            </dd>
          </div>
          @for (fact of facts(); track fact.label) {
            <div
              class="flex justify-content-between gap-3 py-2 border-bottom-1 surface-border"
            >
              <dt>{{ fact.label }}</dt>
              <dd class="text-right font-medium">{{ fact.value }}</dd>
            </div>
          }
        </dl>
        @if (accessEvent.isDenied) {
          <app-message severity="warn">
            {{
              i18n.t(
                'access-control.access-event-drawer.denial-help.' +
                  accessEvent.denialReason
              )
            }}
          </app-message>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close>
        {{ i18n.t('access-control.access-event-drawer.close') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class AccessEventDrawerComponent {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(AccessControlStore);
  private readonly roomsStore = inject(RoomsStore);
  protected readonly accessEvent = inject<AccessEvent>(MAT_DIALOG_DATA);
  protected readonly eventCode = `EVT-${String(this.accessEvent.id).padStart(5, '0')}`;

  protected readonly credential = computed(() =>
    this.store.getCredentialById(this.accessEvent.credentialId),
  );
  protected readonly facts = computed(() => {
    const accessEvent = this.accessEvent;
    const t = (key: string, params?: Record<string, unknown>) =>
      this.i18n.t(key, params);
    const scope = this.credential()?.scope;
    return [
      {
        label: t('access-control.access-event-drawer.time'),
        value: formatDateTime(accessEvent.occurredAt, this.i18n.locale()),
      },
      {
        label: t('access-control.access-event-drawer.person'),
        value: `${accessEvent.holderName} · ${t(
          `access-control.access-control-terms.holder-types.${accessEvent.holderType}`,
        )}`,
      },
      {
        label: t('access-control.access-event-drawer.access-point'),
        value: t(
          `access-control.access-control-terms.access-points.${accessEvent.accessPoint}`,
        ),
      },
      {
        label: t('access-control.access-event-drawer.access'),
        value: accessEvent.roomId
          ? t('access-control.access-control-terms.room-number', {
              number:
                this.roomsStore.getRoomById(accessEvent.roomId)?.number ?? '—',
            })
          : scope
            ? t(`access-control.access-control-terms.scopes.${scope}`)
            : '—',
      },
    ];
  });
}
