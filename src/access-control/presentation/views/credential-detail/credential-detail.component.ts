import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { formatDateTime } from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import {
  dialogConfig,
  drawerConfig,
} from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { AccessControlStore } from '../../../application/access-control.store';
import { AccessEvent } from '../../../domain/model/access-event.entity';
import { Credential } from '../../../domain/model/credential.entity';
import { AccessControlLayoutComponent } from '../../components/access-control-layout/access-control-layout.component';
import { AccessEventDrawerComponent } from '../../components/access-event-drawer/access-event-drawer.component';
import { CredentialStatusTagComponent } from '../../components/credential-status-tag/credential-status-tag.component';
import { ReplaceCredentialDrawerComponent } from '../../components/replace-credential-drawer/replace-credential-drawer.component';
import {
  RevokeCredentialDialogComponent,
  RevokeCredentialDialogData,
} from '../../components/revoke-credential-dialog/revoke-credential-dialog.component';

/**
 * Credential detail: status, holder, access and period, recent access events,
 * revocation, and the actions to revoke or replace the card.
 */
@Component({
  selector: 'app-credential-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    AccessControlLayoutComponent,
    LayoutBodyDirective,
    MessageComponent,
    CredentialStatusTagComponent,
  ],
  templateUrl: './credential-detail.component.html',
})
export class CredentialDetailComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  protected readonly roomsStore = inject(RoomsStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Credential identifier from the route. */
  readonly id = input.required<string>();

  protected readonly credential = computed(() =>
    this.store.getCredentialById(this.id()),
  );
  protected readonly status = computed(() => {
    const credential = this.credential();
    return credential ? this.store.getCredentialStatus(credential) : 'active';
  });
  protected readonly usable = computed(() =>
    ['active', 'scheduled'].includes(this.status()),
  );
  protected readonly room = computed(() =>
    this.roomsStore.getRoomById(this.credential()?.roomId ?? null),
  );
  protected readonly staffMember = computed(() =>
    this.store.getStaffMemberById(this.credential()?.staffMemberId ?? null),
  );
  protected readonly access = computed(() => {
    const credential = this.credential();
    if (!credential) return '';
    return credential.isGuestKeyCard
      ? this.i18n.t('access-control.access-control-terms.room-number', {
          number: this.room()?.number ?? '—',
        })
      : this.i18n.t(
          `access-control.access-control-terms.scopes.${credential.scope}`,
        );
  });
  protected readonly recentEvents = computed(() =>
    this.store.getEventsOfCredential(this.credential()?.id ?? null).slice(0, 6),
  );
  protected readonly details = computed(() => {
    const credential = this.credential();
    if (!credential) return [];
    return [
      {
        label: this.i18n.t('access-control.credential-detail.type'),
        value: this.i18n.t(
          `access-control.access-control-terms.types.${credential.type}`,
        ),
      },
      {
        label: this.i18n.t('access-control.credential-detail.issued'),
        value: this.dateTime(credential.issuedAt),
      },
      {
        label: this.i18n.t('access-control.credential-detail.by'),
        value: this.operatorName(credential.issuedBy),
      },
    ];
  });
  protected readonly revocationFacts = computed(() => {
    const credential = this.credential();
    if (!credential) return [];
    return [
      {
        label: this.i18n.t('access-control.credential-detail.revoked-at'),
        value: this.dateTime(credential.revokedAt),
      },
      {
        label: this.i18n.t('access-control.credential-detail.by'),
        value: this.operatorName(credential.revokedBy),
      },
      {
        label: this.i18n.t('access-control.credential-detail.reason'),
        value: this.i18n.t(
          `access-control.access-control-terms.revocation-reasons.${credential.revocationReason}`,
        ),
      },
    ];
  });

  /** @param value - ISO date-time, when recorded. */
  protected dateTime(value: string | null): string {
    return value ? formatDateTime(value, this.i18n.locale()) : '—';
  }

  /** @param operator - Recorded operator, shown by its display name. */
  private operatorName(operator: string | null): string {
    return operator === 'Demo operator'
      ? this.i18n.t('access-control.access-control-terms.demo-operator')
      : (operator ?? '—');
  }

  /** Opens the revocation dialog. */
  protected revoke(): void {
    this.dialog
      .open<
        RevokeCredentialDialogComponent,
        RevokeCredentialDialogData,
        Credential
      >(
        RevokeCredentialDialogComponent,
        dialogConfig(
          { credential: this.credential()!, access: this.access() },
          '32rem',
        ),
      )
      .afterClosed()
      .subscribe(
        (revoked) =>
          revoked &&
          this.toast.add({
            severity: 'success',
            summary: this.i18n.t('access-control.credential-detail.revoked'),
          }),
      );
  }

  /** Opens the replacement side sheet, then shows the replacement. */
  protected replace(): void {
    this.dialog
      .open<ReplaceCredentialDrawerComponent, Credential, Credential>(
        ReplaceCredentialDrawerComponent,
        drawerConfig(this.credential()!),
      )
      .afterClosed()
      .subscribe((replacement) => {
        if (!replacement) return;
        this.toast.add({
          severity: 'success',
          summary: this.i18n.t('access-control.credential-detail.replaced', {
            card: replacement.cardId,
          }),
        });
        this.router.navigate(['/access-control/credentials', replacement.id]);
      });
  }

  /** @param accessEvent - Event whose details are shown. */
  protected openEvent(accessEvent: AccessEvent): void {
    this.dialog.open(AccessEventDrawerComponent, drawerConfig(accessEvent));
  }
}
