import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Square avatar with a room icon. */
@Component({
  selector: 'app-room-avatar',
  imports: [MatIconModule],
  template: `<span
    class="flex align-items-center justify-content-center flex-shrink-0 bg-primary-50 text-primary border-round-lg"
    [class]="size() === 'large' ? 'w-3rem h-3rem' : 'w-2rem h-2rem'"
    aria-hidden="true"
    ><mat-icon>{{ icon() }}</mat-icon></span
  >`,
})
export class RoomAvatarComponent {
  /** Material Symbols name. */
  readonly icon = input('key');
  /** Avatar size. */
  readonly size = input<'normal' | 'large'>('normal');
}
