import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { InterpolationParameters, TranslateService } from '@ngx-translate/core';

/**
 * Languages offered by the language switcher: English, the default, and Latin American
 * Spanish (BCP 47 `es-419`). Their message files live in `src/locales/<locale>/`.
 */
export const availableLocales = ['en', 'es-419'] as const;
export type AppLocale = (typeof availableLocales)[number];

/** Short label of each language in the language switcher. */
export const localeLabels: Record<AppLocale, string> = {
  en: 'EN',
  'es-419': 'ES',
};

/**
 * Signal-friendly facade over ngx-translate, replacing `useI18n()` of the Vue version.
 *
 * `t()` reads the `locale` and `revision` signals, so `computed()` values that translate
 * recompute when the language changes or its messages finish loading. Changing the
 * language also localizes Angular Material, as `app.vue` did for PrimeVue's own texts.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly dateAdapter = inject(DateAdapter);
  private readonly paginatorIntl = inject(MatPaginatorIntl);
  private readonly document = inject(DOCUMENT);

  /** Active locale, used for messages and for `Intl` date and currency formats. */
  readonly locale = signal<AppLocale>('en');
  /** Changes whenever the active messages change. */
  private readonly revision = signal(0);

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.onLangChange.subscribe(() => {
      this.revision.update((value) => value + 1);
      this.localizeMaterial();
    });
    this.use('en');
  }

  /**
   * Switches the active language.
   * @param locale - Language to use.
   */
  use(locale: AppLocale): void {
    this.locale.set(locale);
    this.document.documentElement.lang = locale;
    this.dateAdapter.setLocale(locale);
    this.translate.use(locale);
  }

  /**
   * Translates a message key; `params.count` selects plural forms.
   * @param key - Message key, such as `bookings.booking-list.title`.
   * @param params - Named arguments of the message.
   * @returns Translated message, or the key while messages are loading.
   */
  t(key: string, params?: InterpolationParameters): string {
    this.locale();
    this.revision();
    const value = this.translate.instant(key, params);
    return typeof value === 'string' ? value : key;
  }

  /**
   * Translates a key that resolves to a message object or array, such as month names.
   * @param key - Message key.
   * @returns Raw messages, or undefined while they are loading.
   */
  raw<T>(key: string): T | undefined {
    this.revision();
    const value = this.translate.instant(key);
    return value === key ? undefined : (value as T);
  }

  /** Applies the paginator texts of the active language. */
  private localizeMaterial(): void {
    const aria = this.raw<Record<string, string>>(
      'shared.primevue-locale.aria',
    );
    if (!aria) return;
    this.paginatorIntl.firstPageLabel = aria['firstPageLabel'] ?? '';
    this.paginatorIntl.lastPageLabel = aria['lastPageLabel'] ?? '';
    this.paginatorIntl.nextPageLabel = aria['nextPageLabel'] ?? '';
    this.paginatorIntl.previousPageLabel = aria['prevPageLabel'] ?? '';
    this.paginatorIntl.itemsPerPageLabel = aria['rowsPerPageLabel'] ?? '';
    this.paginatorIntl.changes.next();
  }
}
