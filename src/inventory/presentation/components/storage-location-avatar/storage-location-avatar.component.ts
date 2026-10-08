import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const typeIcons: Record<string, string> = {
  warehouse: 'warehouse',
  closet: 'inbox',
  'front-desk': 'desktop_windows',
  'service-area': 'build',
};

/** Square avatar with the icon of a storage location's type. */
@Component({
  selector: 'app-storage-location-avatar',
  imports: [MatIconModule],
  template: `<span
    class="flex align-items-center justify-content-center flex-shrink-0 bg-primary-50 text-primary border-round-lg"
    [class]="size() === 'large' ? 'w-3rem h-3rem' : 'w-2rem h-2rem'"
    aria-hidden="true"
    ><mat-icon>{{ icon() }}</mat-icon></span
  >`,
})
export class StorageLocationAvatarComponent {
  readonly type = input('');
  readonly size = input<'normal' | 'large'>('normal');
  protected readonly icon = computed(
    () => typeIcons[this.type()] ?? 'apartment',
  );
}
