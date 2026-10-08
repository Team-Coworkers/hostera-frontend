import { Component, computed, contentChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContextLayoutComponent } from '../../../../shared/presentation/components/context-layout/context-layout.component';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { InventoryStore } from '../../../application/inventory.store';

/**
 * Inventory workspace layout: header with the property selector, tabs for inventory items
 * and storage locations, and the loading and error states of the inventory data.
 */
@Component({
  selector: 'app-inventory-layout',
  imports: [
    ContextLayoutComponent,
    MatIconModule,
    MatTabsModule,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <app-context-layout
      [title]="i18n.t('inventory.inventory-layout.title')"
      [properties]="store.properties()"
      [currentPropertyId]="store.currentPropertyId()"
      [propertyLabel]="i18n.t('inventory.inventory-layout.property')"
      [propertyDisabled]="store.saving()"
      [noProperties]="noProperties()"
      [noPropertiesMessage]="
        i18n.t('inventory.inventory-terms.errors.no-properties')
      "
      [failed]="store.errors().length > 0"
      [connectionMessage]="
        i18n.t('inventory.inventory-terms.errors.connection')
      "
      [retryLabel]="i18n.t('inventory.inventory-layout.retry')"
      [loaded]="inventoryLoaded()"
      [loadingLabel]="i18n.t('inventory.inventory-layout.loading')"
      [body]="body()?.template"
      (propertyChange)="changeProperty($event)"
      (retry)="retry()"
    >
      <ng-container ngProjectAs="[layoutActions]"
        ><ng-content select="[layoutActions]"
      /></ng-container>
      <nav
        layoutTabs
        mat-tab-nav-bar
        mat-stretch-tabs="false"
        [tabPanel]="tabPanel"
      >
        @for (tab of tabs; track tab.link) {
          <a
            mat-tab-link
            [routerLink]="tab.link"
            routerLinkActive
            #active="routerLinkActive"
            [active]="active.isActive"
          >
            <mat-icon class="mr-2" aria-hidden="true">{{ tab.icon }}</mat-icon>
            {{ i18n.t(tab.label) }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel class="hidden" />
    </app-context-layout>
  `,
})
export class InventoryLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  private readonly router = inject(Router);
  protected readonly body = contentChild(LayoutBodyDirective);

  protected readonly tabs = [
    {
      link: '/inventory/items',
      label: 'inventory.inventory-layout.inventory-items',
      icon: 'inventory_2',
    },
    {
      link: '/inventory/storage-locations',
      label: 'inventory.inventory-layout.storage-locations',
      icon: 'apartment',
    },
  ];

  protected readonly noProperties = computed(
    () => this.store.propertiesLoaded() && !this.store.properties().length,
  );
  protected readonly inventoryLoaded = computed(
    () =>
      this.store.inventoryItemsLoaded() && this.store.storageLocationsLoaded(),
  );

  constructor() {
    if (!this.store.propertiesLoaded()) this.store.fetchProperties();
  }

  /**
   * Navigates to the active tab and loads the selected property's inventory.
   * @param propertyId - The ID of the selected property.
   */
  protected async changeProperty(propertyId: number): Promise<void> {
    const activeTab = this.router.url.startsWith('/inventory/storage-location')
      ? '/inventory/storage-locations'
      : '/inventory/items';
    await this.router.navigateByUrl(activeTab);
    this.store.selectProperty(propertyId);
  }

  /** Retries loading the properties or the current property's inventory. */
  protected retry(): void {
    if (this.store.propertiesLoaded())
      this.store.selectProperty(this.store.currentPropertyId());
    else this.store.fetchProperties();
  }
}
