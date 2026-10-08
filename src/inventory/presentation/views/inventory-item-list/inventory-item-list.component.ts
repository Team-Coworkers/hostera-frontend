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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { LayoutBodyDirective } from '../../../../shared/presentation/components/context-layout/layout-body.directive';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { drawerConfig } from '../../../../shared/presentation/services/drawer.config';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { signalTableDataSource } from '../../../../shared/presentation/table-data-source';
import { InventoryStore } from '../../../application/inventory.store';
import {
  InventoryItem,
  StockCondition,
} from '../../../domain/model/inventory-item.entity';
import { InventoryItemAvatarComponent } from '../../components/inventory-item-avatar/inventory-item-avatar.component';
import { InventoryItemFormComponent } from '../../components/inventory-item-form/inventory-item-form.component';
import { InventoryLayoutComponent } from '../../components/inventory-layout/inventory-layout.component';
import { StockAdjustmentFormComponent } from '../../components/stock-adjustment-form/stock-adjustment-form.component';
import { StockConditionTagComponent } from '../../components/stock-condition-tag/stock-condition-tag.component';

const conditionDots: Record<StockCondition, string> = {
  'in-stock': 'text-green-600',
  'low-stock': 'text-orange-500',
  'out-of-stock': 'text-red-500',
};

/**
 * Inventory items of the property, filterable by stock condition, storage location, and category.
 */
@Component({
  selector: 'app-inventory-item-list',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    InventoryLayoutComponent,
    LayoutBodyDirective,
    InventoryItemAvatarComponent,
    StockConditionTagComponent,
  ],
  templateUrl: './inventory-item-list.component.html',
  styles: `
    .condition-filter {
      --mat-standard-button-toggle-height: 2.25rem;
    }
    .dot {
      font-size: 0.6rem;
      width: 0.6rem;
      height: 0.6rem;
    }
  `,
})
export class InventoryItemListComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(InventoryStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  protected readonly displayedColumns = [
    'name',
    'category',
    'primaryStorage',
    'quantity',
    'condition',
    'actions',
  ];
  protected readonly search = signal('');
  protected readonly locationFilter = signal<number | null>(null);
  protected readonly categoryFilter = signal<string | null>(null);
  protected readonly conditionFilter = signal<'all' | StockCondition>('all');

  protected readonly categoryOptions = computed(() => [
    ...new Set(this.store.inventoryItems().map((item) => item.category)),
  ]);
  protected readonly conditionOptions = computed(() => [
    {
      value: 'all' as const,
      label: this.i18n.t('inventory.inventory-item-list.all'),
      count: this.store.inventoryItemsCount(),
      dot: '',
    },
    ...(['in-stock', 'low-stock', 'out-of-stock'] as StockCondition[]).map(
      (value) => ({
        value,
        label: this.i18n.t(`inventory.inventory-terms.conditions.${value}`),
        count: this.store
          .inventoryItems()
          .filter((item) => item.stockCondition === value).length,
        dot: conditionDots[value],
      }),
    ),
  ]);
  protected readonly filteredInventoryItems = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.store
      .inventoryItems()
      .filter(
        (item) =>
          (!query ||
            `${item.name} ${item.code}`.toLowerCase().includes(query)) &&
          (!this.categoryFilter() || item.category === this.categoryFilter()) &&
          (this.conditionFilter() === 'all' ||
            item.stockCondition === this.conditionFilter()) &&
          (!this.locationFilter() ||
            item.stocks.some(
              (stock) => stock.locationId === this.locationFilter(),
            )),
      );
  });
  protected readonly filtersApplied = computed(
    () =>
      !!this.search() ||
      !!this.locationFilter() ||
      !!this.categoryFilter() ||
      this.conditionFilter() !== 'all',
  );

  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  protected readonly dataSource = signalTableDataSource(
    this.filteredInventoryItems,
    this.sort,
    this.paginator,
    {
      name: (item) => item.name,
      quantity: (item) => item.totalQuantity,
    },
  );

  constructor() {
    effect(() => {
      this.store.currentPropertyId();
      untracked(() => this.resetFilters());
    });
  }

  /** @param value - Number to format for the active locale. */
  protected number(value: number): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value);
  }

  /** @param id - Storage location whose name is shown. */
  protected storageLocationName(id: number | null): string {
    return this.store.getStorageLocationById(id)?.name ?? '—';
  }

  /** Clears the search text and the location, category, and condition filters. */
  protected resetFilters(): void {
    this.search.set('');
    this.locationFilter.set(null);
    this.categoryFilter.set(null);
    this.conditionFilter.set('all');
  }

  /** @param id - Inventory item to open. */
  protected navigateToDetail(id: number | null): void {
    this.router.navigate(['/inventory/items', id]);
  }

  /** @param inventoryItem - Item to edit; none to add one. */
  protected openInventoryItemForm(
    inventoryItem: InventoryItem | null = null,
  ): void {
    this.dialog
      .open<InventoryItemFormComponent, InventoryItem | null, InventoryItem>(
        InventoryItemFormComponent,
        drawerConfig(inventoryItem),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** @param inventoryItem - Item whose stock changes. */
  protected openStockAdjustmentForm(inventoryItem: InventoryItem): void {
    this.dialog
      .open<StockAdjustmentFormComponent, InventoryItem, InventoryItem>(
        StockAdjustmentFormComponent,
        drawerConfig(inventoryItem),
      )
      .afterClosed()
      .subscribe((saved) => saved && this.notifySaved());
  }

  /** Confirms that changes were saved. */
  private notifySaved(): void {
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('inventory.inventory-item-list.saved'),
    });
  }
}
