import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppFooterComponent } from '../../../../shared/presentation/components/app-footer/app-footer.component';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../../../../shared/presentation/components/language-switcher/language-switcher.component';

/**
 * Public page of the IAM context, outside the workspace shell: the brand and the
 * language switcher, a centered card with the view, and the site footer.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [
    RouterLink,
    AppFooterComponent,
    BrandLogoComponent,
    LanguageSwitcherComponent,
  ],
  template: `
    <div class="auth-page flex flex-column min-h-screen">
      <header
        class="flex align-items-center justify-content-between gap-3 px-4 py-3"
      >
        <a routerLink="/sign-in" class="flex align-items-center gap-2 brand">
          <app-brand-logo />
          <span class="text-xl font-semibold">Hostera</span>
        </a>
        <div class="w-8rem">
          <app-language-switcher />
        </div>
      </header>
      <main
        class="flex-1 flex align-items-start justify-content-center px-3 py-5"
      >
        <section
          class="auth-card w-full p-4 md:p-5"
          [class.wide]="wide()"
          [attr.aria-labelledby]="headingId()"
        >
          <ng-content />
        </section>
      </main>
      <app-footer />
    </div>
  `,
  styles: `
    .auth-page {
      background: var(--p-surface-50);
    }

    .brand {
      color: var(--p-text-color);
      text-decoration: none;
    }

    .auth-card {
      max-width: 28rem;
      background: var(--p-surface-0);
      border: 1px solid var(--p-surface-200);
      border-radius: 1rem;
    }

    .auth-card.wide {
      max-width: 52rem;
    }
  `,
})
export class AuthLayoutComponent {
  /** Id of the view's heading, which names the card for assistive technology. */
  readonly headingId = input.required<string>();
  /** Whether the card uses the wide layout, as the sign-up form does. */
  readonly wide = input(false);
}
