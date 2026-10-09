import { DestroyRef, inject, Signal, signal } from '@angular/core';

/**
 * Tracks a CSS media query as a signal; call it in an injection context.
 * @param query - Media query, such as `(max-width: 767px)`.
 * @returns Whether the query matches.
 */
export function mediaQuerySignal(query: string): Signal<boolean> {
  const mediaQuery = window.matchMedia(query);
  const matches = signal(mediaQuery.matches);
  const update = (event: MediaQueryListEvent) => matches.set(event.matches);
  mediaQuery.addEventListener('change', update);
  inject(DestroyRef).onDestroy(() =>
    mediaQuery.removeEventListener('change', update),
  );
  return matches.asReadonly();
}
