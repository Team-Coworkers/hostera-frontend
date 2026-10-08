import {
  Component,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import { RoomsStore } from '../../../../rooms/application/rooms.store';
import { ContextLayoutComponent } from '../../../../shared/presentation/components/context-layout/context-layout.component';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { AccessControlStore } from '../../../application/access-control.store';

/**
 * Access Control workspace layout: header with an optional back button, the property
 * selector, and the view's actions, and the loading and error states of the access data.
 */
@Component({
  selector: 'app-access-control-layout',
  imports: [ContextLayoutComponent],
  template: `
    <app-context-layout
      [title]="title() || i18n.t('access-control.access-control-layout.title')"
      [backLink]="backLink()"
      [backLabel]="i18n.t('access-control.access-control-layout.back')"
      [properties]="roomsStore.properties()"
      [currentPropertyId]="roomsStore.currentPropertyId()"
      [propertyLabel]="i18n.t('access-control.access-control-layout.property')"
      [propertyDisabled]="store.saving()"
      [noProperties]="noProperties()"
      [noPropertiesMessage]="
        i18n.t('access-control.access-control-terms.errors.no-properties')
      "
      [failed]="loadErrors()"
      [connectionMessage]="
        i18n.t('access-control.access-control-terms.errors.connection')
      "
      [retryLabel]="i18n.t('access-control.access-control-layout.retry')"
      [loaded]="accessDataLoaded()"
      [loadingLabel]="i18n.t('access-control.access-control-layout.loading')"
      [body]="body()?.template"
      (propertyChange)="changeProperty($event)"
      (retry)="retry()"
    >
      <ng-container ngProjectAs="[layoutActions]"
        ><ng-content select="[layoutActions]"
      /></ng-container>
    </app-context-layout>
  `,
})
export class AccessControlLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(AccessControlStore);
  protected readonly roomsStore = inject(RoomsStore);
  private readonly router = inject(Router);
  protected readonly body = contentChild(LayoutBodyDirective);

  /** Workspace title; the access control title by default. */
  readonly title = input('');
  /** Route of the back button, if any. */
  readonly backLink = input<string | null>(null);

  protected readonly noProperties = computed(
    () =>
      this.roomsStore.propertiesLoaded() &&
      !this.roomsStore.properties().length,
  );
  /** Credentials show room numbers, so the property's rooms must be loaded too. */
  protected readonly accessDataLoaded = computed(
    () =>
      this.store.credentialsLoaded() &&
      this.store.staffMembersLoaded() &&
      this.store.accessEventsLoaded() &&
      this.roomsStore.roomsLoaded(),
  );
  protected readonly loadErrors = computed(
    () => !!(this.store.errors().length || this.roomsStore.errors().length),
  );

  constructor() {
    if (!this.roomsStore.propertiesLoaded()) this.roomsStore.fetchProperties();
  }

  /**
   * Returns to the credential list and loads the selected property's access.
   * @param propertyId - The ID of the selected property.
   */
  protected async changeProperty(propertyId: number): Promise<void> {
    await this.router.navigateByUrl('/access-control');
    this.roomsStore.selectProperty(propertyId);
  }

  /** Retries loading the properties or the current property's access. */
  protected retry(): void {
    if (!this.roomsStore.propertiesLoaded()) {
      this.roomsStore.fetchProperties();
      return;
    }
    this.roomsStore.selectProperty(this.roomsStore.currentPropertyId());
    this.store.fetchAccessControl();
  }
}
