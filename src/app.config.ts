import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  DateAdapter,
  MAT_NATIVE_DATE_FORMATS,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import {
  provideTranslateService,
  TranslateLoader,
  TranslateParser,
} from '@ngx-translate/core';
import { routes } from './app.routes';
import { HosteraDateAdapter } from './shared/presentation/hostera-date-adapter';
import { HosteraTitleStrategy } from './shared/presentation/hostera-title-strategy';
import { demoApiInterceptor } from './shared/infrastructure/demo-api.interceptor';
import { LocaleLoader } from './shared/infrastructure/locale-loader';
import { VueI18nMessageParser } from './shared/infrastructure/vue-i18n-message-parser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([demoApiInterceptor])),
    provideAnimationsAsync(),
    // Dates read as "Oct 8, 2026", as the PrimeVue date format of the Vue version.
    provideNativeDateAdapter({
      ...MAT_NATIVE_DATE_FORMATS,
      display: {
        ...MAT_NATIVE_DATE_FORMATS.display,
        dateInput: { year: 'numeric', month: 'short', day: 'numeric' },
      },
    }),
    { provide: DateAdapter, useClass: HosteraDateAdapter },
    { provide: TitleStrategy, useClass: HosteraTitleStrategy },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
    },
    provideTranslateService({
      defaultLanguage: 'en',
      loader: { provide: TranslateLoader, useClass: LocaleLoader },
      parser: { provide: TranslateParser, useClass: VueI18nMessageParser },
    }),
  ],
};
