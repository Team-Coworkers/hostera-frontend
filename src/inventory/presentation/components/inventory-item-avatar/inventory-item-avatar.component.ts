import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const categoryIcons: Record<string, string> = {
  linen: 'bed',
  'guest-amenities': 'redeem',
  'cleaning-supplies': 'cleaning_services',
  'access-supplies': 'key',
};

/** Square avatar with the icon of an inventory item's category. */
@Component({
  selector: 'app-inventory-item-avatar',
  imports: [MatIconModule],
  template: `<span
    class="flex align-items-center justify-content-center flex-shrink-0 bg-primary-50 text-primary border-round-lg"
    [class]="size() === 'large' ? 'w-3rem h-3rem' : 'w-2rem h-2rem'"
    aria-hidden="true"
    ><mat-icon>{{ icon() }}</mat-icon></span
  >`,
})
export class InventoryItemAvatarComponent {
  readonly category = input('');
  readonly size = input<'normal' | 'large'>('normal');
  protected readonly icon = computed(
    () => categoryIcons[this.category()] ?? 'inventory_2',
  );
}
