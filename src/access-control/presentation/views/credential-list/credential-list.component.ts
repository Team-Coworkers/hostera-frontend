import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { formatDateTime } from '../../../../shared/presentation/calendar-format';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { mediaQuerySignal } from '../../../../shared/presentation/media-query';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { AccessControlStore } from '../../../application/access-control.store';
import {
  Credential,
  CredentialStatus,
  CredentialType,
} from '../../../domain/model/credential.entity';
import { AccessControlLayoutComponent } from '../../components/access-control-layout/access-control-layout.component';
import { CredentialStatusTagComponent } from '../../components/credential-status-tag/credential-status-tag.component';
import { StaffCredentialFormComponent } from '../../components/staff-credential-form/staff-credential-form.component';

/** Row of the credentials table. */
interface CredentialRow {
  id: number | null;
  credential: Credential;
  status: CredentialStatus;
  access: string;
}

/** Avatar colors follow the credential status. */
const avatarClasses: Record<string, string> = {
  active: 'bg-primary-50 text-primary',
  scheduled: 'bg-orange-50 text-orange-600',
  expired: 'surface-200 text-color-secondary',
  revoked: 'bg-red-50 text-red-600',
};

/**
 * Credentials of the property with their status counts, searchable and filterable by
 * status and holder. Below 768px the table becomes a list.
 */
@Component({
  selector: 'app-credential-list',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    AccessControlLayoutComponent,
    LayoutBodyDirective,
    CredentialStatusTagComponent,
  ],
  templateUrl: './credential-list.component.html',
})
export class CredentialListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  private readonly roomsStore = inject(RoomsStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  /** Below PrimeFlex's md breakpoint the table becomes a list of credentials. */
  protected readonly compact = mediaQuerySignal('(max-width: 767px)');
  protected readonly avatarClasses = avatarClasses;
  protected readonly displayedColumns = [
    'credential',
    'holder',
    'access',
    'validAccess',
    'status',
    'open',
  ];
  protected readonly statuses: CredentialStatus[] = [
    'active',
    'scheduled',
    'expired',
    'revoked',
  ];
  protected readonly countedStatuses = [
    'active',
    'scheduled',
    'revoked',
  ] as const;
  protected readonly holders: CredentialType[] = [
    'guest-key-card',
    'staff-credential',
  ];

  protected readonly search = signal('');
  protected readonly statusFilter = signal<CredentialStatus | null>(null);
  protected readonly holderFilter = signal<CredentialType | null>(null);

  private readonly credentialRows = computed<CredentialRow[]>(() =>
    this.store
      .credentials()
      .map((credential) => ({
        id: credential.id,
        credential,
        status: this.store.getCredentialStatus(credential),
        access: credential.isGuestKeyCard
          ? (this.roomsStore.getRoomById(credential.roomId)?.number ?? '—')
          : this.i18n.t(
              `access-control.access-control-terms.scopes.${credential.scope}`,
            ),
      }))
      .toSorted((a, b) =>
        b.credential.issuedAt.localeCompare(a.credential.issuedAt),
      ),
  );
  protected readonly counts = computed(() => {
    const rows = this.credentialRows();
    const count = (status: CredentialStatus) =>
      rows.filter((row) => row.status === status).length;
    return {
      total: rows.length,
      active: count('active'),
      scheduled: count('scheduled'),
      revoked: count('revoked'),
    };
  });
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.credentialRows().filter(
      (row) =>
        (!this.statusFilter() || row.status === this.statusFilter()) &&
        (!this.holderFilter() || row.credential.type === this.holderFilter()) &&
        `${row.credential.cardId} ${row.credential.holderName} ${row.access}`
          .toLowerCase()
          .includes(query),
    );
  });
  protected readonly filtersActive = computed(
    () => !!this.search() || !!this.statusFilter() || !!this.holderFilter(),
  );

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredRows,
    this.sort,
    this.paginator,
    {
      credential: (row) => row.credential.cardId,
      holder: (row) => row.credential.holderName,
      access: (row) => row.access,
      validAccess: (row) => row.credential.validFrom,
      status: (row) => row.status,
    },
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.resetFilters());
    });
  }

  /** @param value - Count to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** Clears the search text and the status and holder filters. */
  protected resetFilters(): void {
    this.search.set('');
    this.statusFilter.set(null);
    this.holderFilter.set(null);
  }

  /**
   * Formats the access period of a credential.
   * @param credential - Credential whose period is shown.
   */
  protected period(credential: Credential): { start: string; end: string } {
    return {
      start: formatDateTime(credential.validFrom, this.i18n.locale()),
      end: credential.validUntil
        ? formatDateTime(credential.validUntil, this.i18n.locale())
        : this.i18n.t('access-control.credential-list.no-end-date'),
    };
  }

  /** @param credential - Credential to open. */
  protected openCredential(credential: Credential): void {
    this.router.navigate(['/access-control/credentials', credential.id]);
  }

  /** Opens the form to issue a staff credential, then shows the new credential. */
  protected issueStaffCredential(): void {
    this.dialog
      .open<StaffCredentialFormComponent, null, Credential>(
        StaffCredentialFormComponent,
        drawerConfig(null),
      )
      .afterClosed()
      .subscribe((credential) => {
        if (!credential) return;
        this.toast.add({
          severity: 'success',
          summary: this.i18n.t('access-control.credential-list.issued', {
            card: credential.cardId,
          }),
        });
        this.openCredential(credential);
      });
  }
}
