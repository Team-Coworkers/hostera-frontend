import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { forkJoin, map, Observable } from 'rxjs';

/**
 * Message files of each bounded context, as registered by `i18n.js` in the Vue version.
 * Each file is served from `src/locales/<lang>/<context>/<file>.json` unchanged and
 * nested under `<context>.<file>`, so keys such as `bookings.booking-list.title` keep working.
 */
export const localeNamespaces: Record<string, string[]> = {
  shared: [
    'home',
    'app-layout',
    'app-footer',
    'language-switcher',
    'sidebar-toggle',
    'primevue-locale',
  ],
  iam: ['plans', 'sign-in', 'sign-up'],
  inventory: [
    'inventory-terms',
    'inventory-layout',
    'inventory-item-list',
    'inventory-item-detail',
    'inventory-item-form',
    'storage-location-list',
    'storage-location-detail',
    'storage-location-form',
    'stock-adjustment-form',
  ],
  bookings: [
    'bookings-terms',
    'bookings-layout',
    'booking-list',
    'booking-detail',
    'booking-form',
    'booking-status-dialog',
    'booking-cancel-dialog',
    'booking-payment-summary',
    'payment-form',
    'booking-check-in',
    'booking-check-out',
  ],
  'access-control': [
    'access-control-terms',
    'access-control-layout',
    'credential-list',
    'credential-detail',
    'staff-credential-form',
    'rfid-encoder-panel',
    'revoke-credential-dialog',
    'replace-credential-drawer',
    'access-event-list',
    'access-event-drawer',
  ],
  overview: [
    'overview-view',
    'overview-panel',
    'revenue-occupancy-card',
    'property-overview-card',
    'todays-arrivals-card',
    'room-status-card',
    'booking-search',
  ],
  rooms: [
    'rooms-terms',
    'rooms-layout',
    'room-availability',
    'room-type-list',
    'room-type-form',
    'room-form',
    'room-status-form',
    'booking-controlled-dialog',
    'room-month-calendar',
    'room-detail',
    'room-rates',
    'rate-plan-form',
    'daily-rate-form',
  ],
};

/**
 * Loads the message files of a language from the `locales/` assets and nests them
 * by context and file, mirroring the message tree of the Vue version.
 */
@Injectable()
export class LocaleLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  /**
   * @param lang - Language code, such as `en` or `es-419`.
   * @returns Messages of the language.
   */
  getTranslation(lang: string): Observable<TranslationObject> {
    const requests = Object.entries(localeNamespaces).flatMap(
      ([context, files]) =>
        files.map((file) =>
          this.http
            .get<TranslationObject>(`locales/${lang}/${context}/${file}.json`)
            .pipe(map((messages) => ({ context, file, messages }))),
        ),
    );
    return forkJoin(requests).pipe(
      map((entries) => {
        const tree: Record<string, Record<string, TranslationObject>> = {};
        for (const { context, file, messages } of entries)
          (tree[context] ??= {})[file] = messages;
        return tree as TranslationObject;
      }),
    );
  }
}
