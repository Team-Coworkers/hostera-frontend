import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Sidebar state shared by the application layout and the toggles in each workspace header.
 *
 * On desktop the sidebar rests as icons and expands over the content on hover or toggle;
 * below PrimeFlex's lg breakpoint (992px) it becomes an off-canvas overlay.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly compactQuery = window.matchMedia('(max-width: 991px)');

  /** Whether the viewport uses the off-canvas sidebar. */
  readonly compact = signal(this.compactQuery.matches);
  /** Whether the sidebar is expanded (desktop) or shown (compact). */
  readonly sidebarOpen = signal(false);

  constructor() {
    const updateCompact = (event: MediaQueryListEvent) => {
      this.compact.set(event.matches);
      this.sidebarOpen.set(false);
    };
    this.compactQuery.addEventListener('change', updateCompact);
    inject(DestroyRef).onDestroy(() =>
      this.compactQuery.removeEventListener('change', updateCompact),
    );
    inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.compact()) this.sidebarOpen.set(false);
      });
  }

  /** Expands or collapses the sidebar. */
  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}
